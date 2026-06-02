import { useContext, useState } from 'react'
import logoSvg from './icons/logo.svg'
import styles from './index.module.scss'
import { downLoadFiles, formatCode, shareFiles } from '../../ReactPlayground/utils'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'
import DependencyManager from '../DependencyManager'

export default function Header() {
    const {
        files, setFiles, selectedFileName, isDarkMode, toggleTheme,
        undo, redo, isFullScreen, setIsFullScreen
    } = useContext(PlaygroundContext);
    const [showDeps, setShowDeps] = useState(false);

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
                    <div className={styles.tooltip}>Undo (Ctrl+Z)</div>
                </div>

                <div className={styles.iconButton} onClick={redo}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#fff' : '#333'} strokeWidth="2">
                        <path d="M21 10H11a5 5 0 0 0 0 10h4"/>
                        <path d="M21 10l-4-4"/>
                        <path d="M21 10l-4 4"/>
                    </svg>
                    <div className={styles.tooltip}>Redo (Ctrl+Shift+Z)</div>
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
                    <div className={styles.tooltip}>Format (Ctrl+M)</div>
                </div>

                <div className={styles.themeToggle} onClick={toggleTheme}>
                    <i className={`iconfont ${isDarkMode ? 'icon-yueliang' : 'icon-taiyang'}`}></i>
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
                    <div className={styles.tooltip}>{isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}</div>
                </div>

                <div className={styles.iconButton} onClick={() => setShowDeps(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#fff' : '#333'} strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                    </svg>
                    <div className={styles.tooltip}>Dependencies</div>
                </div>

                <div className={styles.iconButton}>
                    <i className="iconfont icon-fenxiang" onClick={() => {
                        const url = shareFiles(files);
                        navigator.clipboard.writeText(url);
                        alert('Share link copied to clipboard!');
                    }}></i>
                    <div className={styles.tooltip}>Share</div>
                </div>

                <div className={styles.iconButton}>
                    <i className="iconfont icon-xiazai" onClick={() => downLoadFiles(files)}></i>
                    <div className={styles.tooltip}>Download</div>
                </div>

                <div className={styles.iconButton}>
                    <i className="iconfont icon-github" onClick={() => window.open('https://github.com/harvest0623/React-Playground', '_blank')}></i>
                    <div className={styles.tooltip}>GitHub</div>
                </div>
            </div>
            <DependencyManager open={showDeps} onClose={() => setShowDeps(false)} />
        </div>
    )
}
