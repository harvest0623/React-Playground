import { useContext } from 'react'
import logoSvg from './icons/logo.svg'
import styles from './index.module.scss'
import { downLoadFiles } from '../../ReactPlayground/utils'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'

export default function Header() {
    const { files, isDarkMode, toggleTheme } = useContext(PlaygroundContext);
    
    return (
        <div className={`${styles.header} ${isDarkMode ? styles.dark : ''}`}>

            {/* React Playground logo */}
            <div className={styles.logo}>
                <img src={logoSvg} alt="" />
                <span>React Playground</span>
            </div>

            <div className={styles.iconContainer}>

                {/* Theme toggle 主题切换 */}
                <div className={styles.themeToggle} onClick={toggleTheme}>
                    <i className={`iconfont ${isDarkMode ? 'icon-yueliang' : 'icon-taiyang'}`}></i>
                </div>
                
                {/* Share 分享 */}
                <div className={styles.iconButton}>
                    <i className="iconfont icon-fenxiang" onClick={() => {}}></i>
                </div>
                
                {/* Download 下载 */}
                <div className={styles.iconButton}>
                    <i className="iconfont icon-xiazai" onClick={() => downLoadFiles(files)}></i>
                </div>

                {/* GitHub 代码 */}
                <div className={styles.iconButton}>
                    <i className="iconfont icon-github" onClick={() => window.open('https://github.com/harvest0623/React-Playground', '_blank')}></i>
                </div>

            </div>
        </div>
    )
}