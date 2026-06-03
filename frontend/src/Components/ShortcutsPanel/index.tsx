import { useContext, useEffect } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'

const shortcuts = [
    { keys: 'Ctrl+Z', action: 'Undo' },
    { keys: 'Ctrl+Shift+Z', action: 'Redo' },
    { keys: 'Ctrl+M', action: 'Format Code' },
    { keys: 'Ctrl+S', action: 'Save (prevented)' },
    { keys: 'Ctrl+P', action: 'Quick File Switch' },
    { keys: 'Escape', action: 'Close Panel' },
]

export default function ShortcutsPanel() {
    const { showShortcuts, setShowShortcuts, isDarkMode } = useContext(PlaygroundContext)

    useEffect(() => {
        if (!showShortcuts) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowShortcuts(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showShortcuts, setShowShortcuts])

    if (!showShortcuts) return null

    const bgColor = isDarkMode ? '#252526' : '#fff'
    const textColor = isDarkMode ? '#ccc' : '#333'
    const keyBg = isDarkMode ? '#3c3c3c' : '#f0f0f0'
    const keyBorder = isDarkMode ? '#555' : '#ccc'

    return (
        <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={() => setShowShortcuts(false)}
        >
            <div
                style={{ backgroundColor: bgColor, color: textColor, borderRadius: 8, padding: 24, width: 420, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 16, fontWeight: 'bold' }}>Keyboard Shortcuts</span>
                    <span
                        onClick={() => setShowShortcuts(false)}
                        style={{ cursor: 'pointer', fontSize: 20, color: isDarkMode ? '#888' : '#666', lineHeight: 1, padding: '0 4px' }}
                    >
                        x
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                    {shortcuts.map(s => (
                        <div key={s.keys} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 13, color: isDarkMode ? '#aaa' : '#555' }}>{s.action}</span>
                            <span style={{
                                fontSize: 12,
                                padding: '3px 8px',
                                borderRadius: 4,
                                backgroundColor: keyBg,
                                border: `1px solid ${keyBorder}`,
                                fontFamily: 'monospace',
                                whiteSpace: 'nowrap',
                                color: isDarkMode ? '#ddd' : '#333',
                            }}>
                                {s.keys}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
