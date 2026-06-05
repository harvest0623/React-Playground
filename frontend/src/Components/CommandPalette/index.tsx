import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'
import { useLanguage } from '../../i18n/LanguageContext'

interface PaletteItem {
    id: string
    icon: string
    label: string
    group: 'commands' | 'files' | 'settings'
    action: () => void
}

function fuzzyMatch(query: string, text: string): boolean {
    const q = query.toLowerCase()
    const t = text.toLowerCase()
    let qi = 0
    for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) qi++
    }
    return qi === q.length
}

export default function CommandPalette() {
    const {
        showCommandPalette, setShowCommandPalette,
        undo, redo, toggleTheme, isFullScreen, setIsFullScreen,
        clearConsoleLogs, files, setSelectedFileName,
        editorFontSize, setEditorFontSize, isDarkMode,
    } = useContext(PlaygroundContext)
    const { t, setLocale } = useLanguage()
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    const items = useMemo<PaletteItem[]>(() => {
        const result: PaletteItem[] = []

        result.push({
            id: 'undo', icon: '\u26A1', label: t('undoAction'),
            group: 'commands', action: () => { undo(); setShowCommandPalette(false) },
        })
        result.push({
            id: 'redo', icon: '\u26A1', label: t('redoAction'),
            group: 'commands', action: () => { redo(); setShowCommandPalette(false) },
        })
        result.push({
            id: 'format', icon: '\u26A1', label: t('formatCode'),
            group: 'commands', action: () => {
                undo();
                setShowCommandPalette(false)
            },
        })
        result.push({
            id: 'theme', icon: '\u26A1', label: t('toggleTheme'),
            group: 'commands', action: () => { toggleTheme(); setShowCommandPalette(false) },
        })
        result.push({
            id: 'fullscreen', icon: '\u26A1', label: t('toggleFullscreen'),
            group: 'commands', action: () => { setIsFullScreen(!isFullScreen); setShowCommandPalette(false) },
        })
        result.push({
            id: 'clearConsole', icon: '\u26A1', label: t('clearConsole'),
            group: 'commands', action: () => { clearConsoleLogs(); setShowCommandPalette(false) },
        })
        result.push({
            id: 'refresh', icon: '\u26A1', label: t('refreshPreview'),
            group: 'commands', action: () => { setShowCommandPalette(false); window.location.reload() },
        })

        Object.keys(files).forEach(name => {
            result.push({
                id: `file-${name}`, icon: '\uD83D\uDCC4', label: name,
                group: 'files', action: () => { setSelectedFileName(name); setShowCommandPalette(false) },
            })
        })

        result.push({
            id: 'fontSizeUp', icon: '\u2699\uFE0F', label: `${t('fontSize')} +`,
            group: 'settings', action: () => { setEditorFontSize(editorFontSize + 2); setShowCommandPalette(false) },
        })
        result.push({
            id: 'fontSizeDown', icon: '\u2699\uFE0F', label: `${t('fontSize')} -`,
            group: 'settings', action: () => { setEditorFontSize(Math.max(10, editorFontSize - 2)); setShowCommandPalette(false) },
        })
        result.push({
            id: 'langZh', icon: '\u2699\uFE0F', label: `${t('language')}: 中文`,
            group: 'settings', action: () => { setLocale('zh'); setShowCommandPalette(false) },
        })
        result.push({
            id: 'langEn', icon: '\u2699\uFE0F', label: `${t('language')}: English`,
            group: 'settings', action: () => { setLocale('en'); setShowCommandPalette(false) },
        })
        result.push({
            id: 'darkTheme', icon: '\u2699\uFE0F', label: t('darkTheme'),
            group: 'settings', action: () => { if (!isDarkMode) toggleTheme(); setShowCommandPalette(false) },
        })
        result.push({
            id: 'lightTheme', icon: '\u2699\uFE0F', label: t('lightTheme'),
            group: 'settings', action: () => { if (isDarkMode) toggleTheme(); setShowCommandPalette(false) },
        })

        return result
    }, [
        t, undo, redo, toggleTheme, isFullScreen, setIsFullScreen,
        clearConsoleLogs, files, setSelectedFileName,
        editorFontSize, setEditorFontSize, isDarkMode, setLocale,
        setShowCommandPalette,
    ])

    const filtered = useMemo(() => {
        if (!query) return items
        return items.filter(item => fuzzyMatch(query, item.label))
    }, [items, query])

    const grouped = useMemo(() => {
        const groups: { key: string; label: string; items: PaletteItem[] }[] = []
        const groupOrder = ['commands', 'files', 'settings'] as const
        const groupLabels: Record<string, string> = {
            commands: t('cmdCommands'),
            files: t('cmdFiles'),
            settings: t('cmdSettings'),
        }

        for (const g of groupOrder) {
            const groupItems = filtered.filter(item => item.group === g)
            if (groupItems.length > 0) {
                groups.push({ key: g, label: groupLabels[g], items: groupItems })
            }
        }
        return groups
    }, [filtered, t])

    const flatItems = useMemo(() => {
        return grouped.flatMap(g => g.items)
    }, [grouped])

    useEffect(() => {
        if (showCommandPalette) {
            setQuery('')
            setSelectedIndex(0)
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [showCommandPalette])

    useEffect(() => {
        setSelectedIndex(0)
    }, [query])

    useEffect(() => {
        const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined
        if (el) {
            el.scrollIntoView({ block: 'nearest' })
        }
    }, [selectedIndex])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowCommandPalette(false)
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => (prev + 1) % flatItems.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length)
        } else if (e.key === 'Enter') {
            e.preventDefault()
            flatItems[selectedIndex]?.action()
        }
    }, [flatItems, selectedIndex, setShowCommandPalette])

    if (!showCommandPalette) return null

    let flatIndex = -1

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                alignItems: 'flex-start', justifyContent: 'center',
                paddingTop: '15vh', zIndex: 10000,
            }}
            onClick={() => setShowCommandPalette(false)}
        >
            <div
                style={{
                    width: 600, maxHeight: 420,
                    backgroundColor: isDarkMode ? '#252526' : '#ffffff',
                    borderRadius: 8, overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    display: 'flex', flexDirection: 'column',
                    border: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`,
                }}
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <div style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${isDarkMode ? '#333' : '#eee'}`,
                }}>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={t('searchCommands')}
                        style={{
                            width: '100%', border: 'none', outline: 'none',
                            backgroundColor: 'transparent',
                            color: isDarkMode ? '#ccc' : '#333',
                            fontSize: 15, padding: '4px 0',
                        }}
                    />
                </div>
                <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
                    {grouped.map(group => (
                        <div key={group.key}>
                            <div style={{
                                padding: '6px 16px', fontSize: 11,
                                fontWeight: 'bold', textTransform: 'uppercase',
                                color: isDarkMode ? '#888' : '#999',
                                letterSpacing: 0.5,
                            }}>
                                {group.label}
                            </div>
                            {group.items.map(item => {
                                flatIndex++
                                const idx = flatIndex
                                const isSelected = idx === selectedIndex
                                return (
                                    <div
                                        key={item.id}
                                        onClick={item.action}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        style={{
                                            display: 'flex', alignItems: 'center',
                                            padding: '6px 16px', cursor: 'pointer',
                                            gap: 10, fontSize: 13,
                                            backgroundColor: isSelected
                                                ? (isDarkMode ? '#094771' : '#e0e0e0')
                                                : 'transparent',
                                            color: isDarkMode ? '#ccc' : '#333',
                                        }}
                                    >
                                        <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>
                                            {item.icon}
                                        </span>
                                        <span>{item.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                    {flatItems.length === 0 && (
                        <div style={{
                            padding: '20px 16px', textAlign: 'center',
                            color: isDarkMode ? '#666' : '#999', fontSize: 13,
                        }}>
                            {t('noFilesFound')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
