import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import logoSvg from './icons/logo.svg'
import styles from './index.module.scss'
import { downLoadFiles, exportAsHtml, formatCode, shareFiles } from '../../ReactPlayground/utils'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'
import DependencyManager from '../DependencyManager'
import CollaborationButton from '../CollaborationButton'
import { useLanguage } from '../../i18n/LanguageContext'

export default function Header() {
    const {
        files, setFiles, selectedFileName, isDarkMode, toggleTheme,
        undo, redo, isFullScreen, setIsFullScreen,
        editorFontSize, setEditorFontSize,
        showShortcuts, setShowShortcuts,
        clearStorage, lastSaved,
        showHistory, setShowHistory,
        showAI, setShowAI,
        showCSSEditor, setShowCSSEditor,
        showPropsEditor, setShowPropsEditor,
    } = useContext(PlaygroundContext);
    const { t, locale, setLocale } = useLanguage();
    const [showDeps, setShowDeps] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const downloadMenuRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
            setShowDownloadMenu(false);
        }
    }, []);

    useEffect(() => {
        if (showDownloadMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDownloadMenu, handleClickOutside]);

    return (
        <div className={`${styles.header} ${isDarkMode ? styles.dark : ''}`}>
            <div className={styles.logo}>
                <img src={logoSvg} alt="" />
                <span style={{fontSize: '26px'}}>React Playground</span>
            </div>

            <div className={styles.iconContainer}>
                <div className={styles.iconButton} onClick={undo}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#fff' : '#333'} strokeWidth="2">
                        <path d="M3 10h10a5 5 0 0 1 0 10H9"/>
                        <path d="M3 10l4-4"/>
                        <path d="M3 10l4 4"/>
                    </svg>
                    <div className={styles.tooltip}>{t('undo')} (Ctrl+Z)</div>
                </div>

                <div className={styles.iconButton} onClick={redo}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#fff' : '#333'} strokeWidth="2">
                        <path d="M21 10H11a5 5 0 0 0 0 10h4"/>
                        <path d="M21 10l-4-4"/>
                        <path d="M21 10l-4 4"/>
                    </svg>
                    <div className={styles.tooltip}>{t('redo')} (Ctrl+Shift+Z)</div>
                </div>

                <div className={styles.iconButton} onClick={async () => {
                    const file = files[selectedFileName];
                    if (!file) return;
                    const formatted = await formatCode(file.value, file.name);
                    if (formatted !== file.value) {
                        setFiles(prev => ({
                            ...prev,
                            [selectedFileName]: { ...prev[selectedFileName], value: formatted }
                        }));
                    }
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#fff' : '#333'} strokeWidth="2">
                        <path d="M17 10H3"/>
                        <path d="M21 6H3"/>
                        <path d="M21 14H3"/>
                        <path d="M17 18H3"/>
                    </svg>
                    <div className={styles.tooltip}>{t('format')} (Ctrl+M)</div>
                </div>

                <div className={styles.themeToggle} onClick={toggleTheme}>
                    <i className={`iconfont ${isDarkMode ? 'icon-yueliang' : 'icon-taiyang'}`}></i>
                </div>

                <div
                    className={styles.iconButton}
                    onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
                    title={locale === 'zh' ? 'Switch to English' : '切换到中文'}
                >
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                        {locale === 'zh' ? '中' : 'EN'}
                    </span>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        color: lastSaved ? '#98c379' : '#e06c75',
                        cursor: 'pointer',
                        backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5',
                    }}
                    onClick={clearStorage}
                    title="点击清除存储并恢复默认文件"
                >
                    <div style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: lastSaved ? '#98c379' : '#e06c75',
                    }} />
                    {lastSaved ? t('saved') : t('saved')}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <div
                        className={styles.iconButton}
                        onClick={() => setEditorFontSize(Math.max(12, editorFontSize - 1))}
                        style={{ width: 28, height: 28, fontSize: 16 }}
                    >
                        −
                    </div>
                    <span style={{ fontSize: 12, color: isDarkMode ? '#ccc' : '#333', minWidth: 36, textAlign: 'center' }}>
                        {editorFontSize}px
                    </span>
                    <div
                        className={styles.iconButton}
                        onClick={() => setEditorFontSize(Math.min(24, editorFontSize + 1))}
                        style={{ width: 28, height: 28, fontSize: 16 }}
                    >
                        +
                    </div>
                </div>

                <div className={styles.iconButton} onClick={() => setIsFullScreen(!isFullScreen)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#fff' : '#333'} strokeWidth="2">
                        {isFullScreen ? (
                            <>
                                <path d="M8 3v3a2 2 0 0 1-2 2H3"/>
                                <path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                                <path d="M3 16h3a2 2 0 0 1 2 2v3"/>
                                <path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                            </>
                        ) : (
                            <>
                                <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
                                <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                                <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
                                <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                            </>
                        )}
                    </svg>
                    <div className={styles.tooltip}>{isFullScreen ? t('exitFullscreen') : t('fullscreen')}</div>
                </div>

                <div className={styles.iconButton} onClick={() => setShowDeps(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#fff' : '#333'} strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                    </svg>
                    <div className={styles.tooltip}>{t('dependencies')}</div>
                </div>

                <div className={styles.iconButton} onClick={() => setShowAI(!showAI)}>
                    <i className="iconfont icon-wuguan" style={{ fontSize: 20, color: isDarkMode ? '#fff' : '#333', fontWeight: 'bold' }}></i>
                    <div className={styles.tooltip}>{t('aiAssistant')}</div>
                </div>

                <div className={styles.iconButton}>
                    <i className="iconfont icon-fenxiang" onClick={() => {
                        const url = shareFiles(files);
                        navigator.clipboard.writeText(url);
                        alert(t('shareCopied'));
                    }}></i>
                    <div className={styles.tooltip}>{t('share')}</div>
                </div>

                <div style={{ position: 'relative' }} ref={downloadMenuRef}>
                    <div className={styles.iconButton} onClick={() => setShowDownloadMenu(!showDownloadMenu)}>
                        <i className="iconfont icon-xiazai"></i>
                        <div className={styles.tooltip}>{t('download')}</div>
                    </div>
                    {showDownloadMenu && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: 4,
                            backgroundColor: isDarkMode ? '#2d2d2d' : '#fff',
                            border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                            borderRadius: 6, padding: '4px 0', zIndex: 1000,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: 160,
                        }}>
                            <div
                                onClick={() => { downLoadFiles(files); setShowDownloadMenu(false) }}
                                style={{
                                    padding: '8px 14px', cursor: 'pointer', fontSize: 13,
                                    color: isDarkMode ? '#ccc' : '#333', display: 'flex', alignItems: 'center', gap: 8,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = isDarkMode ? '#3c3c3c' : '#f0f0f0')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <span>📦</span> {t('exportZip')}
                            </div>
                            <div
                                onClick={() => { exportAsHtml(files); setShowDownloadMenu(false) }}
                                style={{
                                    padding: '8px 14px', cursor: 'pointer', fontSize: 13,
                                    color: isDarkMode ? '#ccc' : '#333', display: 'flex', alignItems: 'center', gap: 8,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = isDarkMode ? '#3c3c3c' : '#f0f0f0')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <span>📄</span> {t('exportHtml')}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.iconButton} onClick={() => setShowShortcuts(!showShortcuts)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#fff' : '#333'} strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="M6 8h.01"/>
                        <path d="M10 8h.01"/>
                        <path d="M14 8h.01"/>
                        <path d="M18 8h.01"/>
                        <path d="M6 12h.01"/>
                        <path d="M10 12h.01"/>
                        <path d="M14 12h.01"/>
                        <path d="M18 12h.01"/>
                        <path d="M8 16h8"/>
                    </svg>
                    <div className={styles.tooltip}>{t('shortcuts')} (Ctrl+Shift+?)</div>
                </div>

                <CollaborationButton />

                <div className={styles.iconButton} onClick={() => setShowHistory(!showHistory)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#fff' : '#333'} strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    <div className={styles.tooltip}>{t('versionHistory')}</div>
                </div>

                <div
                    className={styles.iconButton}
                    onClick={() => setShowCSSEditor(!showCSSEditor)}
                    style={{ opacity: showCSSEditor ? 1 : undefined }}
                >
                    <i className="iconfont icon-keshihuabianjiqi" style={{ fontSize: 20, color: isDarkMode ? '#fff' : '#333', fontWeight: 'bold' }}></i>
                    <div className={styles.tooltip}>{t('cssVisualEditor')}</div>
                </div>

                <div
                    className={styles.iconButton}
                    onClick={() => setShowPropsEditor(!showPropsEditor)}
                    style={{ opacity: showPropsEditor ? 1 : undefined }}
                >
                    <i className="iconfont icon-shezhi" style={{ fontSize: 20, color: isDarkMode ? '#fff' : '#333', fontWeight: 'bold' }}></i>
                    <div className={styles.tooltip}>{t('propsEditor')}</div>
                </div>

                <div className={styles.iconButton}>
                    <i className="iconfont icon-github" onClick={() => window.open('https://github.com/harvest0623/React-Playground', '_blank')}></i>
                    <div className={styles.tooltip}>{t('github')}</div>
                </div>
            </div>
            <DependencyManager open={showDeps} onClose={() => setShowDeps(false)} />
        </div>
    )
}
