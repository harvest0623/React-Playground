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

    const handleRefresh = useCallback(() => {
        refreshRef.current += 1;
        forceUpdate(n => n + 1);
    }, []);

    const handleOpenExternal = useCallback(() => {
        if (iframeUrl) {
            window.open(iframeUrl, '_blank');
        }
    }, [iframeUrl]);

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
