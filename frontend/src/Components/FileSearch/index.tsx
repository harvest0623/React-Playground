import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'
import { useLanguage } from '../../i18n/LanguageContext'

interface Props {
    open: boolean
    onClose: () => void
    isDarkMode: boolean
}

function getFileTypeLabel(name: string): string {
    if (name.endsWith('.tsx') || name.endsWith('.jsx')) return 'TSX'
    if (name.endsWith('.ts')) return 'TS'
    if (name.endsWith('.css') || name.endsWith('.scss')) return 'CSS'
    if (name.endsWith('.json')) return 'JSON'
    return 'FILE'
}

function getFileColor(name: string): string {
    if (name.endsWith('.tsx') || name.endsWith('.jsx')) return '#3178c6'
    if (name.endsWith('.ts')) return '#3178c6'
    if (name.endsWith('.css') || name.endsWith('.scss')) return '#264de4'
    if (name.endsWith('.json')) return '#f5a623'
    return '#999'
}

function fuzzyMatch(query: string, fileName: string): { matched: boolean; indices: Set<number> } {
    const indices = new Set<number>()
    if (!query) return { matched: true, indices }

    const q = query.toLowerCase()
    const f = fileName.toLowerCase()
    let qi = 0

    for (let fi = 0; fi < f.length && qi < q.length; fi++) {
        if (f[fi] === q[qi]) {
            indices.add(fi)
            qi++
        }
    }

    return { matched: qi === q.length, indices }
}

function HighlightedName({ name, indices }: { name: string; indices: Set<number> }) {
    if (indices.size === 0) return <span>{name}</span>
    return (
        <span>
            {name.split('').map((char, i) =>
                indices.has(i)
                    ? <strong key={i} style={{ fontWeight: 'bold' }}>{char}</strong>
                    : <span key={i}>{char}</span>
            )}
        </span>
    )
}

export default function FileSearch({ open, onClose, isDarkMode }: Props) {
    const { files, selectedFileName, setSelectedFileName } = useContext(PlaygroundContext)
    const { t } = useLanguage()
    const [query, setQuery] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    const fileNames = useMemo(() => Object.keys(files), [files])

    const filteredFiles = useMemo(() => {
        if (!query) return fileNames.map(name => ({ name, indices: new Set<number>() }))
        return fileNames
            .map(name => {
                const { matched, indices } = fuzzyMatch(query, name)
                return matched ? { name, indices } : null
            })
            .filter((item): item is { name: string; indices: Set<number> } => item !== null)
    }, [fileNames, query])

    const clampedActiveIndex = Math.min(activeIndex, Math.max(filteredFiles.length - 1, 0))

    useEffect(() => {
        inputRef.current?.focus()
    }, [open, query])

    useEffect(() => {
        if (!listRef.current) return
        const activeEl = listRef.current.children[clampedActiveIndex] as HTMLElement
        if (activeEl) {
            activeEl.scrollIntoView({ block: 'nearest' })
        }
    }, [clampedActiveIndex])

    const selectFile = useCallback((name: string) => {
        setSelectedFileName(name)
        onClose()
    }, [setSelectedFileName, onClose])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose()
            return
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex(prev => Math.min(prev + 1, filteredFiles.length - 1))
            return
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex(prev => Math.max(prev - 1, 0))
            return
        }
        if (e.key === 'Enter') {
            e.preventDefault()
            if (filteredFiles[clampedActiveIndex]) {
                selectFile(filteredFiles[clampedActiveIndex].name)
            }
        }
    }, [filteredFiles, clampedActiveIndex, onClose, selectFile])

    if (!open) return null

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                paddingTop: '15vh',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: 520,
                    maxHeight: '60vh',
                    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
                    borderRadius: 8,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    padding: '10px 14px',
                    borderBottom: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
                }}>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value)
                            setActiveIndex(0)
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={t('searchFiles')}
                        style={{
                            width: '100%',
                            padding: '8px 10px',
                            fontSize: 14,
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                            color: isDarkMode ? '#fff' : '#333',
                        }}
                    />
                </div>
                <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
                    {filteredFiles.length === 0 && (
                        <div style={{
                            padding: '12px 14px',
                            color: isDarkMode ? '#666' : '#999',
                            fontSize: 13,
                        }}>
                            {t('noFilesFound')}
                        </div>
                    )}
                    {filteredFiles.map((item, index) => {
                        const isActive = index === clampedActiveIndex
                        const isSelected = item.name === selectedFileName
                        const bgColor = isActive
                            ? (isDarkMode ? '#094771' : '#e0e0e0')
                            : 'transparent'
                        const txtColor = isDarkMode ? '#ccc' : '#333'
                        return (
                            <div
                                key={item.name}
                                onClick={() => selectFile(item.name)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '5px 14px',
                                    cursor: 'pointer',
                                    backgroundColor: bgColor,
                                    color: txtColor,
                                    gap: 8,
                                    fontSize: 13,
                                    userSelect: 'none',
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = isDarkMode ? '#2a2d2e' : '#f0f0f0'
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                    }
                                }}
                            >
                                <span style={{
                                    fontSize: 10, flexShrink: 0, fontWeight: 'bold',
                                    color: getFileColor(item.name),
                                    padding: '1px 4px',
                                    border: `1px solid ${getFileColor(item.name)}`,
                                    borderRadius: 2, lineHeight: 1.2,
                                }}>
                                    {getFileTypeLabel(item.name)}
                                </span>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <HighlightedName name={item.name} indices={item.indices} />
                                </span>
                                {isSelected && (
                                    <span style={{ fontSize: 11, color: isDarkMode ? '#888' : '#999', flexShrink: 0 }}>
                                        active
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
