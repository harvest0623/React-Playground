import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'
import { useLanguage } from '../../i18n/LanguageContext'

function getFileTypeLabel(name: string): string {
    if (name.endsWith('.tsx') || name.endsWith('.jsx')) return 'TSX'
    if (name.endsWith('.ts')) return 'TS'
    if (name.endsWith('.css') || name.endsWith('.scss')) return 'CSS'
    if (name.endsWith('.json')) return 'JSON'
    if (name.endsWith('.html')) return 'HTML'
    return 'FILE'
}

function getFileColor(name: string): string {
    if (name.endsWith('.tsx') || name.endsWith('.jsx')) return '#3178c6'
    if (name.endsWith('.ts')) return '#3178c6'
    if (name.endsWith('.css') || name.endsWith('.scss')) return '#264de4'
    if (name.endsWith('.json')) return '#f5a623'
    if (name.endsWith('.html')) return '#e44d26'
    return '#999'
}

function fuzzyMatch(query: string, name: string): boolean {
    const q = query.toLowerCase()
    const n = name.toLowerCase()
    let qi = 0
    for (let i = 0; i < n.length && qi < q.length; i++) {
        if (n[i] === q[qi]) qi++
    }
    return qi === q.length
}

function highlightMatch(name: string, query: string): React.ReactNode {
    if (!query) return name
    const lower = name.toLowerCase()
    const q = query.toLowerCase()
    const parts: React.ReactNode[] = []
    let qi = 0
    let lastIdx = 0

    for (let i = 0; i < lower.length && qi < q.length; i++) {
        if (lower[i] === q[qi]) {
            if (lastIdx < i) parts.push(name.slice(lastIdx, i))
            parts.push(<strong key={i} style={{ color: '#4fc3f7', fontWeight: 'bold' }}>{name[i]}</strong>)
            lastIdx = i + 1
            qi++
        }
    }
    if (lastIdx < name.length) parts.push(name.slice(lastIdx))
    return parts
}

interface NewFileDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: (name: string) => void
    isDarkMode: boolean
}

function NewFileDialog({ open, onClose, onConfirm, isDarkMode }: NewFileDialogProps) {
    const [name, setName] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const { t } = useLanguage()

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus()
        }
    }, [open])

    if (!open) return null

    const btnStyle = {
        padding: '5px 12px',
        border: isDarkMode ? '1px solid #444' : '1px solid #ddd',
        borderRadius: 4,
        backgroundColor: 'transparent',
        color: isDarkMode ? '#ccc' : '#333',
        cursor: 'pointer' as const,
        fontSize: 12,
    }

    return (
        <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={onClose}
        >
            <div
                style={{ backgroundColor: isDarkMode ? '#252526' : '#fff', color: isDarkMode ? '#ccc' : '#333', borderRadius: 6, padding: 20, width: 360, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 12 }}>{t('newFile')}</div>
                <input
                    ref={inputRef}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && name.trim()) { onConfirm(name.trim()); onClose() }
                        if (e.key === 'Escape') onClose()
                    }}
                    placeholder="e.g. Component.tsx"
                    style={{ width: '100%', padding: '8px 10px', border: isDarkMode ? '1px solid #444' : '1px solid #ddd', borderRadius: 4, backgroundColor: isDarkMode ? '#3c3c3c' : '#fff', color: isDarkMode ? '#ccc' : '#333', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                    <button onClick={onClose} style={btnStyle}>{t('cancel')}</button>
                    <button
                        onClick={() => { if (name.trim()) { onConfirm(name.trim()); onClose() } }}
                        disabled={!name.trim()}
                        style={{ ...btnStyle, border: 'none', backgroundColor: name.trim() ? '#0078d4' : '#555', color: '#fff', cursor: name.trim() ? 'pointer' : 'default' }}
                    >
                        {t('create')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function FileExplorer() {
    const { files, selectedFileName, setSelectedFileName, addFile, removeFile, isDarkMode } = useContext(PlaygroundContext)
    const { t } = useLanguage()
    const [collapsed, setCollapsed] = useState(false)
    const [showNewFile, setShowNewFile] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [searchMode, setSearchMode] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const searchInputRef = useRef<HTMLInputElement>(null)
    const dragCounterRef = useRef(0)

    const fileNames = Object.keys(files)

    const filteredNames = searchMode && searchQuery
        ? fileNames.filter(name => fuzzyMatch(searchQuery, name))
        : fileNames

    useEffect(() => {
        if (searchMode && searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }, [searchMode])

    const handleFileClick = useCallback((name: string) => {
        setSelectedFileName(name)
        setSearchMode(false)
        setSearchQuery('')
    }, [setSelectedFileName])

    const handleNewFile = useCallback((name: string) => {
        addFile(name)
        setSelectedFileName(name)
    }, [addFile, setSelectedFileName])

    const handleDelete = useCallback((e: React.MouseEvent, name: string) => {
        e.stopPropagation()
        removeFile(name)
    }, [removeFile])

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounterRef.current++
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true)
        }
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounterRef.current--
        if (dragCounterRef.current === 0) {
            setIsDragging(false)
        }
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        dragCounterRef.current = 0

        const droppedFiles = Array.from(e.dataTransfer.files)
        if (droppedFiles.length === 0) return

        const textExtensions = ['.tsx', '.jsx', '.ts', '.js', '.css', '.json', '.html']
        const supportedFiles = droppedFiles.filter(f =>
            textExtensions.some(ext => f.name.endsWith(ext))
        )

        supportedFiles.forEach(file => {
            if (files[file.name]) return
            const reader = new FileReader()
            reader.onload = (ev) => {
                const content = ev.target?.result as string
                addFile(file.name, content)
            }
            reader.readAsText(file)
        })
    }, [files, addFile])

    if (collapsed) {
        return (
            <div style={{ width: 36, minWidth: 36, height: '100%', backgroundColor: isDarkMode ? '#252526' : '#f3f3f3', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 8 }}>
                <span onClick={() => setCollapsed(false)} style={{ cursor: 'pointer', fontSize: 16, color: isDarkMode ? '#888' : '#666' }} title={t('expand')}>
                    &#9654;
                </span>
                <span onClick={() => { setCollapsed(false); setSearchMode(true) }} style={{ cursor: 'pointer', fontSize: 14, color: isDarkMode ? '#888' : '#666' }} title={t('search')}>
                    &#128269;
                </span>
            </div>
        )
    }

    const iconBtnStyle = {
        cursor: 'pointer' as const,
        fontSize: 13,
        color: isDarkMode ? '#999' : '#666',
        width: 22,
        height: 22,
        display: 'flex' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderRadius: 3,
    }

    return (
        <div
            style={{ width: '100%', height: '100%', backgroundColor: isDarkMode ? '#252526' : '#f3f3f3', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontSize: 13, color: isDarkMode ? '#cccccc' : '#333', position: 'relative' }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', textTransform: 'uppercase', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, color: isDarkMode ? '#999' : '#666', borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0', flexShrink: 0 }}>
                <span>{searchMode ? t('search') : t('explorer')}</span>
                <span onClick={() => setCollapsed(true)} style={{ cursor: 'pointer', fontSize: 14 }} title={t('collapse')}>
                    &#9664;
                </span>
            </div>

            {searchMode ? (
                <div style={{ padding: '6px 8px', borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                            ref={searchInputRef}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Escape') { setSearchMode(false); setSearchQuery('') }
                            }}
                            placeholder={t('searchFiles')}
                            style={{ flex: 1, padding: '4px 8px', border: isDarkMode ? '1px solid #444' : '1px solid #ddd', borderRadius: 3, backgroundColor: isDarkMode ? '#3c3c3c' : '#fff', color: isDarkMode ? '#ccc' : '#333', fontSize: 12, outline: 'none' }}
                        />
                        <span
                            onClick={() => { setSearchMode(false); setSearchQuery('') }}
                            style={{ ...iconBtnStyle, fontSize: 15 }}
                            title={t('close')}
                        >
                            &#10005;
                        </span>
                    </div>
                    <div style={{ fontSize: 10, color: isDarkMode ? '#666' : '#999', marginTop: 4 }}>
                        {filteredNames.length} result{filteredNames.length !== 1 ? 's' : ''}
                    </div>
                </div>
            ) : (
                <div style={{ padding: '4px 8px', textTransform: 'uppercase', fontSize: 11, fontWeight: 'bold', color: isDarkMode ? '#999' : '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <span>{t('files')}</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                        <span onClick={() => setSearchMode(true)} style={iconBtnStyle} title={t('searchFiles')}>
                            &#128269;
                        </span>
                        <span onClick={() => setShowNewFile(true)} style={{ ...iconBtnStyle, fontSize: 16 }} title={t('newFile')}>
                            +
                        </span>
                    </div>
                </div>
            )}

            <div style={{ flex: 1, overflow: 'auto', padding: '2px 0' }}>
                {filteredNames.map(name => {
                    const isActive = name === selectedFileName
                    const typeLabel = getFileTypeLabel(name)
                    const fileColor = getFileColor(name)
                    const bgColor = isActive ? (isDarkMode ? '#094771' : '#e0e0e0') : 'transparent'
                    const txtColor = isActive ? (isDarkMode ? '#fff' : '#000') : (isDarkMode ? '#ccc' : '#333')
                    const displayName = searchMode && searchQuery ? highlightMatch(name, searchQuery) : name
                    return (
                        <div
                            key={name}
                            onClick={() => handleFileClick(name)}
                            style={{ display: 'flex', alignItems: 'center', padding: '3px 12px', cursor: 'pointer', backgroundColor: bgColor, color: txtColor, gap: 6, userSelect: 'none' }}
                        >
                            <span style={{ fontSize: 10, flexShrink: 0, fontWeight: 'bold', color: fileColor, padding: '1px 3px', border: '1px solid ' + fileColor, borderRadius: 2, lineHeight: 1.2 }}>
                                {typeLabel}
                            </span>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {displayName}
                            </span>
                            {!searchMode && (
                                <span
                                    onClick={(e) => handleDelete(e, name)}
                                    style={{ fontSize: 14, color: isDarkMode ? '#666' : '#999', cursor: 'pointer', flexShrink: 0, padding: '0 2px', opacity: 0.6 }}
                                    title={'Delete ' + name}
                                >
                                    x
                                </span>
                            )}
                        </div>
                    )
                })}
                {searchMode && filteredNames.length === 0 && searchQuery && (
                    <div style={{ padding: '12px', textAlign: 'center', color: isDarkMode ? '#666' : '#999', fontSize: 12 }}>
                        {t('noMatchingFiles')}
                    </div>
                )}
            </div>

            {showNewFile && <NewFileDialog open={showNewFile} onClose={() => setShowNewFile(false)} onConfirm={handleNewFile} isDarkMode={isDarkMode} />}

            {isDragging && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isDarkMode ? 'rgba(0,120,212,0.1)' : 'rgba(0,120,212,0.05)', border: '2px dashed #0078d4', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, pointerEvents: 'none' }}>
                    <span style={{ color: '#0078d4', fontSize: 14, fontWeight: 'bold' }}>{t('dropFilesHere')}</span>
                </div>
            )}
        </div>
    )
}
