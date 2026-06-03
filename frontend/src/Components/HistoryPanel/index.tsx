import { useContext } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'
import { useLanguage } from '../../i18n/LanguageContext'

function formatRelativeTime(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
}

export default function HistoryPanel() {
    const {
        isDarkMode, showHistory, setShowHistory,
        versionHistory, restoreVersion, clearVersionHistory,
        files, setDiffData, setShowDiff,
    } = useContext(PlaygroundContext)
    const { t } = useLanguage()

    const bg = isDarkMode ? '#1e1e1e' : '#fff'
    const border = isDarkMode ? '#333' : '#e5e5e5'
    const text = isDarkMode ? '#fff' : '#1a1a1a'
    const textSecondary = isDarkMode ? '#888' : '#666'

    if (!showHistory) return null

    return (
        <>
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9998,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }}
                onClick={() => setShowHistory(false)}
            />
            <div style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 380,
                zIndex: 9999,
                backgroundColor: bg,
                borderLeft: `1px solid ${border}`,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.15)',
                transform: showHistory ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s ease',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: `1px solid ${border}`,
                }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: text }}>
                        Version History
                    </h3>
                    <div
                        onClick={() => setShowHistory(false)}
                        style={{
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 6,
                            color: textSecondary,
                            fontSize: 18,
                            lineHeight: 1,
                        }}
                    >
                        ✕
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                    {versionHistory.length === 0 ? (
                        <div style={{ fontSize: 13, color: textSecondary, textAlign: 'center', padding: '40px 0' }}>
                            暂无历史版本
                        </div>
                    ) : (
                        [...versionHistory].reverse().map((entry) => (
                            <div
                                key={entry.id}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: 10,
                                    border: `1px solid ${border}`,
                                    marginBottom: 12,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: text }}>
                                        {entry.description}
                                    </span>
                                    <span style={{ fontSize: 11, color: textSecondary }}>
                                        {formatRelativeTime(entry.timestamp)}
                                    </span>
                                </div>
                                <div style={{ fontSize: 12, color: textSecondary, marginBottom: 8 }}>
                                    {Object.keys(entry.files).length} 个文件
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => {
                                            restoreVersion(entry.id)
                                            setShowHistory(false)
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '8px 0',
                                            fontSize: 13,
                                            borderRadius: 8,
                                            border: `1px solid ${border}`,
                                            backgroundColor: 'transparent',
                                            color: text,
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {t('restore')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDiffData({ oldFiles: entry.files, newFiles: files })
                                            setShowDiff(true)
                                            setShowHistory(false)
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '8px 0',
                                            fontSize: 13,
                                            borderRadius: 8,
                                            border: `1px solid ${border}`,
                                            backgroundColor: 'transparent',
                                            color: '#1976d2',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {t('compare')}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{
                    padding: '16px 20px',
                    borderTop: `1px solid ${border}`,
                }}>
                    <button
                        onClick={clearVersionHistory}
                        disabled={versionHistory.length === 0}
                        style={{
                            width: '100%',
                            padding: '10px 0',
                            fontSize: 13,
                            borderRadius: 8,
                            border: 'none',
                            backgroundColor: versionHistory.length === 0 ? '#555' : '#e06c75',
                            color: '#fff',
                            cursor: versionHistory.length === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: 500,
                        }}
                    >
                        Clear History
                    </button>
                </div>
            </div>
        </>
    )
}
