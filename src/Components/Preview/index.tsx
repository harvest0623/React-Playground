import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { compile } from './compiler.ts'
import { PlaygroundContext, type Files } from '../../ReactPlayground/PlaygroundContext.tsx'
import iframeRaw from './iframe.html?raw'
import { IMPORT_MAP_FILE_NAME } from '../../ReactPlayground/files.ts'

export default function Preview() {
    const {
        files, isDarkMode, setCompileError, setErrorLine,
        setRuntimeError, addConsoleLog, clearConsoleLogs
    } = useContext(PlaygroundContext);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const refreshRef = useRef(0);
    const prevFilesRef = useRef<Files>(files);
    const [, forceUpdate] = useState(0);
    const loadingRef = useRef<HTMLDivElement>(null);

    const handleMessage = useCallback((e: MessageEvent) => {
        if (e.source !== iframeRef.current?.contentWindow) return;
        const data = e.data;
        if (data.type === 'console') {
            addConsoleLog({ method: data.method, args: data.args });
        } else if (data.type === 'runtime-error') {
            setRuntimeError(data.message);
        }
    }, [addConsoleLog, setRuntimeError]);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    const compileResult = useMemo(() => compile(files), [files]);

    useEffect(() => {
        const el = loadingRef.current;
        if (!el) return;
        el.style.display = 'flex';
        const timer = setTimeout(() => { el.style.display = 'none'; }, 150);
        return () => clearTimeout(timer);
    }, [compileResult]);

    useEffect(() => {
        const prev = prevFilesRef.current;
        if (prev === files) return;

        const cssChanges: { filename: string; content: string }[] = [];
        let hasNonCssChange = false;

        const allKeys = new Set([...Object.keys(prev), ...Object.keys(files)]);
        for (const key of allKeys) {
            if (prev[key]?.value !== files[key]?.value) {
                if (key.endsWith('.css')) {
                    cssChanges.push({ filename: key, content: files[key]?.value ?? '' });
                } else {
                    hasNonCssChange = true;
                }
            }
        }

        prevFilesRef.current = files;

        if (cssChanges.length > 0 && !hasNonCssChange && iframeRef.current?.contentWindow) {
            for (const change of cssChanges) {
                iframeRef.current.contentWindow.postMessage({
                    type: 'css-update',
                    filename: change.filename,
                    content: change.content,
                }, '*');
            }
        }
    }, [files]);

    useEffect(() => {
        setCompileError(compileResult.error);
        setErrorLine(compileResult.errorLine);
        clearConsoleLogs();
        setRuntimeError(null);
    }, [compileResult, setCompileError, setErrorLine, clearConsoleLogs, setRuntimeError]);

    const iframeUrl = useMemo(() => {
        if (compileResult.error) return '';
        const moduleScript = compileResult.code
            ? `import '${compileResult.code}';`
            : '';
        const bgColor = isDarkMode ? '#1e1e1e' : '#ffffff';
        const res = iframeRaw
            .replace('__BG_COLOR__', bgColor)
            .replace(
                '<script type="importmap"></script>',
                `<script type="importmap">${files[IMPORT_MAP_FILE_NAME].value}</script>`,
            ).replace(
                '<script type="module" id="appSrc"></script>',
                `<script type="module" id="appSrc">${moduleScript}</script>`,
            );
        return URL.createObjectURL(new Blob([res], { type: 'text/html' }));
    }, [compileResult, files, isDarkMode]);

    const recordingRef = useRef<{ recorder: MediaRecorder; chunks: Blob[] } | null>(null);
    const [recording, setRecording] = useState(false);

    const handleRefresh = useCallback(() => {
        refreshRef.current += 1;
        forceUpdate(n => n + 1);
    }, []);

    const handleOpenExternal = useCallback(() => {
        if (iframeUrl) {
            window.open(iframeUrl, '_blank');
        }
    }, [iframeUrl]);

    const handleToggleRecord = useCallback(async () => {
        if (recording) {
            const rec = recordingRef.current;
            if (rec && rec.recorder.state === 'recording') {
                rec.recorder.stop();
                rec.recorder.onstop = () => {
                    const blob = new Blob(rec.chunks, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `preview-recording-${Date.now()}.webm`;
                    a.click();
                    URL.revokeObjectURL(url);
                };
            }
            recordingRef.current = null;
            setRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            stream.getVideoTracks()[0].onended = () => {
                if (recorder.state === 'recording') recorder.stop();
                recordingRef.current = null;
                setRecording(false);
            };

            recorder.start();
            recordingRef.current = { recorder, chunks };
            setRecording(true);
        } catch {
            // user cancelled screen share
        }
    }, [recording]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                padding: '2px 8px',
                gap: 8,
                backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
                borderBottom: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
                flexShrink: 0,
            }}>
                <span
                    onClick={handleRefresh}
                    style={{
                        cursor: 'pointer', fontSize: 11, color: isDarkMode ? '#888' : '#999',
                        padding: '2px 6px', borderRadius: 3,
                    }}
                    title="Refresh Preview"
                >
                    Refresh
                </span>
                <span
                    onClick={handleToggleRecord}
                    style={{
                        cursor: 'pointer', fontSize: 11, borderRadius: 3, padding: '2px 6px',
                        color: recording ? '#ff4444' : (isDarkMode ? '#888' : '#999'),
                        fontWeight: recording ? 'bold' : 'normal',
                    }}
                    title={recording ? 'Stop Recording' : 'Record Preview'}
                >
                    {recording ? 'Stop' : 'Record'}
                </span>
                <span
                    onClick={handleOpenExternal}
                    style={{
                        cursor: iframeUrl ? 'pointer' : 'default',
                        fontSize: 11,
                        color: iframeUrl ? (isDarkMode ? '#888' : '#999') : '#ccc',
                        padding: '2px 6px', borderRadius: 3,
                    }}
                    title="Open in New Tab"
                >
                    External
                </span>
            </div>
            <div style={{ flex: 1, backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff', position: 'relative' }}>
                <div ref={loadingRef} style={{
                    display: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff', zIndex: 5,
                }}>
                    <div style={{
                        width: 24, height: 24,
                        border: `2px solid ${isDarkMode ? '#444' : '#ddd'}`,
                        borderTop: `2px solid ${isDarkMode ? '#fff' : '#333'}`,
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                </div>
                <iframe ref={iframeRef} src={iframeUrl} style={{ height: '100%', width: '100%', border: 'none', padding: 0 }} />
                {!iframeUrl && !compileResult.error && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: isDarkMode ? '#666' : '#999', fontSize: 14,
                    }}>
                        Compiling...
                    </div>
                )}
            </div>
        </div>
    )
}
