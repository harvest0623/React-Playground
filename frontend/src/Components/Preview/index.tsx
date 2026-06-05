import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { compile } from './compiler.ts'
import { PlaygroundContext, type Files } from '../../ReactPlayground/PlaygroundContext.tsx'
import iframeRaw from './iframe.html?raw'
import { IMPORT_MAP_FILE_NAME } from '../../ReactPlayground/files.ts'
import { useLanguage } from '../../i18n/LanguageContext'
import Skeleton from '../Skeleton'

export default function Preview() {
    const {
        files, isDarkMode, setCompileError, setErrorLine,
        setRuntimeError, addConsoleLog, clearConsoleLogs,
        setIsCompiling,
    } = useContext(PlaygroundContext);
    const { t } = useLanguage();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const refreshRef = useRef(0);
    const prevFilesRef = useRef<Files>(files);
    const [, forceUpdate] = useState(0);
    const loadingRef = useRef<HTMLDivElement>(null);
    const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'phone'>('desktop');
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        setIsCompiling(true);
        const timer = setTimeout(() => setIsCompiling(false), 100);
        return () => clearTimeout(timer);
    }, [files, setIsCompiling]);

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

    const getDeviceButtonStyle = (mode: 'desktop' | 'tablet' | 'phone'): React.CSSProperties => ({
        cursor: 'pointer',
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 4,
        color: deviceMode === mode ? '#fff' : (isDarkMode ? '#888' : '#999'),
        backgroundColor: deviceMode === mode ? (isDarkMode ? '#555' : '#999') : 'transparent',
        transition: 'all 0.15s',
        userSelect: 'none',
    });

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                padding: isMobile ? '2px 4px' : '2px 8px',
                gap: isMobile ? 4 : 8,
                backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
                borderBottom: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
                flexShrink: 0,
            }}>
                {!isMobile && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        marginRight: 'auto',
                    }}>
                        <span
                            onClick={() => setDeviceMode('desktop')}
                            style={getDeviceButtonStyle('desktop')}
                            title={t('desktop')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                <line x1="8" y1="21" x2="16" y2="21"/>
                                <line x1="12" y1="17" x2="12" y2="21"/>
                            </svg>
                        </span>
                        <span
                            onClick={() => setDeviceMode('tablet')}
                            style={getDeviceButtonStyle('tablet')}
                            title={t('tablet')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                                <line x1="12" y1="18" x2="12.01" y2="18"/>
                            </svg>
                        </span>
                        <span
                            onClick={() => setDeviceMode('phone')}
                            style={getDeviceButtonStyle('phone')}
                            title={t('phone')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                                <line x1="12" y1="18" x2="12.01" y2="18"/>
                            </svg>
                        </span>
                    </div>
                )}
                <span
                    onClick={handleRefresh}
                    style={{
                        cursor: 'pointer', fontSize: isMobile ? 0 : 11, color: isDarkMode ? '#888' : '#999',
                        padding: '2px 6px', borderRadius: 3,
                    }}
                    title={t('refresh')}
                >
                    {isMobile ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23,4 23,10 17,10"/>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                    ) : t('refresh')}
                </span>
                <span
                    onClick={handleToggleRecord}
                    style={{
                        cursor: 'pointer', fontSize: isMobile ? 0 : 11, borderRadius: 3, padding: '2px 6px',
                        color: recording ? '#ff4444' : (isDarkMode ? '#888' : '#999'),
                        fontWeight: recording ? 'bold' : 'normal',
                    }}
                    title={recording ? t('stop') : t('record')}
                >
                    {isMobile ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={recording ? '#ff4444' : 'currentColor'} strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            {recording && <circle cx="12" cy="12" r="4" fill="#ff4444"/>}
                        </svg>
                    ) : (recording ? t('stop') : t('record'))}
                </span>
                <span
                    onClick={handleOpenExternal}
                    style={{
                        cursor: iframeUrl ? 'pointer' : 'default',
                        fontSize: isMobile ? 0 : 11,
                        color: iframeUrl ? (isDarkMode ? '#888' : '#999') : '#ccc',
                        padding: '2px 6px', borderRadius: 3,
                    }}
                    title={t('external')}
                >
                    {isMobile ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15,3 21,3 21,9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                    ) : t('external')}
                </span>
            </div>
            <div style={{
                flex: 1,
                backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}>
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
                {deviceMode === 'desktop' && (
                    <iframe
                        ref={iframeRef}
                        src={iframeUrl}
                        style={{ height: '100%', width: '100%', border: 'none', padding: 0, transition: 'all 0.3s ease' }}
                    />
                )}
                {deviceMode === 'tablet' && (
                    <div style={{
                        width: 768,
                        height: '100%',
                        maxHeight: '100%',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                    }}>
                        <div style={{
                            width: 768,
                            height: 1024,
                            maxHeight: '100%',
                            borderRadius: 12,
                            border: `2px solid ${isDarkMode ? '#555' : '#ccc'}`,
                            overflow: 'hidden',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                            position: 'relative',
                            flexShrink: 0,
                        }}>
                            <iframe
                                ref={iframeRef}
                                src={iframeUrl}
                                style={{ height: '100%', width: '100%', border: 'none', padding: 0 }}
                            />
                        </div>
                    </div>
                )}
                {deviceMode === 'phone' && (
                    <div style={{
                        width: 375,
                        height: '100%',
                        maxHeight: '100%',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                    }}>
                        <div style={{
                            width: 375,
                            height: 667,
                            maxHeight: '100%',
                            borderRadius: 36,
                            border: `3px solid ${isDarkMode ? '#555' : '#ccc'}`,
                            overflow: 'hidden',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                            position: 'relative',
                            flexShrink: 0,
                            backgroundColor: isDarkMode ? '#000' : '#000',
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 120,
                                height: 28,
                                backgroundColor: '#000',
                                borderRadius: '0 0 16px 16px',
                                zIndex: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <div style={{
                                    width: 50,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: isDarkMode ? '#333' : '#555',
                                }} />
                            </div>
                            <iframe
                                ref={iframeRef}
                                src={iframeUrl}
                                style={{
                                    height: '100%',
                                    width: '100%',
                                    border: 'none',
                                    padding: 0,
                                    paddingTop: 28,
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: 8,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                border: `2px solid ${isDarkMode ? '#555' : '#888'}`,
                                zIndex: 10,
                            }} />
                        </div>
                    </div>
                )}
                {!iframeUrl && !compileResult.error && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    }}>
                        <Skeleton type="preview" />
                    </div>
                )}
            </div>
        </div>
    )
}
