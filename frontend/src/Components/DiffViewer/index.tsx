import { useContext, useMemo, useCallback, useState } from 'react'
import { PlaygroundContext, type Files } from '../../ReactPlayground/PlaygroundContext'
import { useLanguage } from '../../i18n/LanguageContext'

interface DiffLine {
    type: 'same' | 'added' | 'removed'
    content: string
}

function computeLCS(a: string[], b: string[]): number[][] {
    const m = a.length
    const n = b.length
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
            }
        }
    }
    return dp
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const dp = computeLCS(oldLines, newLines)
    const result: DiffLine[] = []
    let i = oldLines.length
    let j = newLines.length
    const temp: DiffLine[] = []

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            temp.push({ type: 'same', content: oldLines[i - 1] })
            i--
            j--
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            temp.push({ type: 'added', content: newLines[j - 1] })
            j--
        } else {
            temp.push({ type: 'removed', content: oldLines[i - 1] })
            i--
        }
    }

    for (let k = temp.length - 1; k >= 0; k--) {
        result.push(temp[k])
    }
    return result
}

function computeFileDiff(oldFiles: Files, newFiles: Files): Record<string, DiffLine[]> {
    const diffs: Record<string, DiffLine[]> = {}
    const allKeys = new Set([...Object.keys(oldFiles), ...Object.keys(newFiles)])

    for (const key of allKeys) {
        const oldVal = oldFiles[key]?.value ?? ''
        const newVal = newFiles[key]?.value ?? ''
        if (oldVal !== newVal) {
            diffs[key] = computeDiff(oldVal, newVal)
        }
    }
    return diffs
}

interface Props {
    open: boolean
    onClose: () => void
    onRestore?: (files: Files) => void
}

export default function DiffViewer({ open, onClose, onRestore }: Props) {
    const { isDarkMode, diffData, setDiffData, setFiles } = useContext(PlaygroundContext)
    const { t } = useLanguage()
    const [selectedTab, setSelectedTab] = useState<string>('')

    const diffs = useMemo(() => {
        if (!diffData) return {}
        return computeFileDiff(diffData.oldFiles, diffData.newFiles)
    }, [diffData])

    const diffFiles = useMemo(() => Object.keys(diffs), [diffs])

    const activeTab = useMemo(() => {
        if (selectedTab && diffFiles.includes(selectedTab)) return selectedTab
        return diffFiles[0] || ''
    }, [selectedTab, diffFiles])

    const handleRestore = useCallback(() => {
        if (!diffData) return
        if (onRestore) {
            onRestore(diffData.oldFiles)
        } else {
            setFiles(diffData.oldFiles)
        }
        onClose()
    }, [diffData, onRestore, setFiles, onClose])

    const handleClose = useCallback(() => {
        setDiffData(null)
        setSelectedTab('')
        onClose()
    }, [setDiffData, onClose])

    if (!open || !diffData) return null

    const bg = isDarkMode ? '#1e1e1e' : '#fff'
    const border = isDarkMode ? '#333' : '#e5e5e5'
    const text = isDarkMode ? '#ccc' : '#333'
    const textSecondary = isDarkMode ? '#888' : '#666'

    return (
        <>
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 10000,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}
            />
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '85vw',
                height: '75vh',
                maxWidth: 1200,
                zIndex: 10001,
                backgroundColor: bg,
                border: `1px solid ${border}`,
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom: `1px solid ${border}`,
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: text }}>
                            {t('oldVersion')} ↔ {t('newVersion')}
                        </h3>
                        <span style={{
                            fontSize: 11,
                            color: textSecondary,
                            padding: '2px 8px',
                            borderRadius: 4,
                            backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f0f0',
                        }}>
                            {diffFiles.length} {diffFiles.length === 1 ? 'file' : 'files'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                            onClick={handleRestore}
                            style={{
                                padding: '6px 14px',
                                fontSize: 12,
                                borderRadius: 6,
                                border: 'none',
                                backgroundColor: '#1976d2',
                                color: '#fff',
                                cursor: 'pointer',
                                fontWeight: 500,
                            }}
                        >
                            {t('restore')}
                        </button>
                        <div
                            onClick={handleClose}
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
                </div>

                {diffFiles.length > 0 && (
                    <div style={{
                        display: 'flex',
                        borderBottom: `1px solid ${border}`,
                        flexShrink: 0,
                        overflowX: 'auto',
                    }}>
                        {diffFiles.map(file => (
                            <div
                                key={file}
                                onClick={() => setSelectedTab(file)}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: 12,
                                    fontWeight: activeTab === file ? 600 : 400,
                                    color: activeTab === file ? '#1976d2' : textSecondary,
                                    borderBottom: activeTab === file ? '2px solid #1976d2' : '2px solid transparent',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    fontFamily: 'monospace',
                                }}
                            >
                                {file}
                            </div>
                        ))}
                    </div>
                )}

                {diffFiles.length === 0 ? (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: textSecondary,
                        fontSize: 14,
                    }}>
                        {t('noChanges')}
                    </div>
                ) : (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            borderRight: `1px solid ${border}`,
                        }}>
                            <div style={{
                                padding: '6px 12px',
                                fontSize: 11,
                                fontWeight: 600,
                                color: textSecondary,
                                borderBottom: `1px solid ${border}`,
                                backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f8f8',
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                            }}>
                                {t('oldVersion')}
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                {activeTab && diffs[activeTab]?.map((line, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            minHeight: 20,
                                            backgroundColor: line.type === 'removed'
                                                ? 'rgba(230, 60, 60, 0.15)'
                                                : line.type === 'added'
                                                    ? 'transparent'
                                                    : isDarkMode ? '#1a1a1a' : '#f9f9f9',
                                        }}
                                    >
                                        <span style={{
                                            width: 24,
                                            flexShrink: 0,
                                            textAlign: 'right',
                                            padding: '0 6px',
                                            color: textSecondary,
                                            fontSize: 10,
                                            userSelect: 'none',
                                            lineHeight: '20px',
                                        }}>
                                            {line.type !== 'added' ? '' : ''}
                                        </span>
                                        <span style={{
                                            width: 16,
                                            flexShrink: 0,
                                            textAlign: 'center',
                                            color: line.type === 'removed' ? '#e63c3c' : 'transparent',
                                            lineHeight: '20px',
                                            fontSize: 11,
                                        }}>
                                            {line.type === 'removed' ? '−' : ' '}
                                        </span>
                                        <span style={{
                                            flex: 1,
                                            padding: '0 8px',
                                            whiteSpace: 'pre',
                                            color: text,
                                            lineHeight: '20px',
                                        }}>
                                            {line.type === 'added' ? '' : line.content}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                        }}>
                            <div style={{
                                padding: '6px 12px',
                                fontSize: 11,
                                fontWeight: 600,
                                color: textSecondary,
                                borderBottom: `1px solid ${border}`,
                                backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f8f8',
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                            }}>
                                {t('newVersion')}
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                {activeTab && diffs[activeTab]?.map((line, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            minHeight: 20,
                                            backgroundColor: line.type === 'added'
                                                ? 'rgba(60, 180, 60, 0.15)'
                                                : line.type === 'removed'
                                                    ? 'transparent'
                                                    : isDarkMode ? '#1a1a1a' : '#f9f9f9',
                                        }}
                                    >
                                        <span style={{
                                            width: 24,
                                            flexShrink: 0,
                                            textAlign: 'right',
                                            padding: '0 6px',
                                            color: textSecondary,
                                            fontSize: 10,
                                            userSelect: 'none',
                                            lineHeight: '20px',
                                        }}>
                                            {line.type !== 'removed' ? '' : ''}
                                        </span>
                                        <span style={{
                                            width: 16,
                                            flexShrink: 0,
                                            textAlign: 'center',
                                            color: line.type === 'added' ? '#3cb43c' : 'transparent',
                                            lineHeight: '20px',
                                            fontSize: 11,
                                        }}>
                                            {line.type === 'added' ? '+' : ' '}
                                        </span>
                                        <span style={{
                                            flex: 1,
                                            padding: '0 8px',
                                            whiteSpace: 'pre',
                                            color: text,
                                            lineHeight: '20px',
                                        }}>
                                            {line.type === 'removed' ? '' : line.content}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
