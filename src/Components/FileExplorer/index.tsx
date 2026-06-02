import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'

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

interface NewFileDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: (name: string) => void
    isDarkMode: boolean
}

function NewFileDialog({ open, onClose, onConfirm, isDarkMode }: NewFileDialogProps) {
    const [name, setName] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

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
                <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 12 }}>New File</div>
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
                    <button onClick={onClose} style={btnStyle}>Cancel</button>
                    <button
                        onClick={() => { if (name.trim()) { onConfirm(name.trim()); onClose() } }}
                        disabled={!name.trim()}
                        style={{ ...btnStyle, border: 'none', backgroundColor: name.trim() ? '#0078d4' : '#555', color: '#fff', cursor: name.trim() ? 'pointer' : 'default' }}
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function FileExplorer() {
    const { files, selectedFileName, setSelectedFileName, addFile, removeFile, isDarkMode } = useContext(PlaygroundContext)
    const [collapsed, setCollapsed] = useState(false)
    const [showNewFile, setShowNewFile] = useState(false)

    const fileNames = Object.keys(files)

    const handleFileClick = useCallback((name: string) => {
        setSelectedFileName(name)
    }, [setSelectedFileName])

    const handleNewFile = useCallback((name: string) => {
        addFile(name)
        setSelectedFileName(name)
    }, [addFile, setSelectedFileName])

    const handleDelete = useCallback((e: React.MouseEvent, name: string) => {
        e.stopPropagation()
        removeFile(name)
    }, [removeFile])

    if (collapsed) {
        return (
            <div style={{ width: 36, minWidth: 36, height: '100%', backgroundColor: isDarkMode ? '#252526' : '#f3f3f3', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8 }}>
                <span onClick={() => setCollapsed(false)} style={{ cursor: 'pointer', fontSize: 16, color: isDarkMode ? '#888' : '#666' }} title="Expand Explorer">
                    &#9654;
                </span>
            </div>
        )
    }

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: isDarkMode ? '#252526' : '#f3f3f3', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontSize: 13, color: isDarkMode ? '#cccccc' : '#333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', textTransform: 'uppercase', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, color: isDarkMode ? '#999' : '#666', borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0', flexShrink: 0 }}>
                <span>Explorer</span>
                <span onClick={() => setCollapsed(true)} style={{ cursor: 'pointer', fontSize: 14 }} title="Collapse">
                    &#9664;
                </span>
            </div>

            <div style={{ padding: '4px 8px', textTransform: 'uppercase', fontSize: 11, fontWeight: 'bold', color: isDarkMode ? '#999' : '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span>Files</span>
                <span onClick={() => setShowNewFile(true)} style={{ cursor: 'pointer', fontSize: 16, lineHeight: 1, color: isDarkMode ? '#999' : '#666', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3 }} title="New File">
                    +
                </span>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '2px 0' }}>
                {fileNames.map(name => {
                    const isActive = name === selectedFileName
                    const typeLabel = getFileTypeLabel(name)
                    const fileColor = getFileColor(name)
                    const bgColor = isActive ? (isDarkMode ? '#094771' : '#e0e0e0') : 'transparent'
                    const txtColor = isActive ? (isDarkMode ? '#fff' : '#000') : (isDarkMode ? '#ccc' : '#333')
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
                                {name}
                            </span>
                            <span
                                onClick={(e) => handleDelete(e, name)}
                                style={{ fontSize: 14, color: isDarkMode ? '#666' : '#999', cursor: 'pointer', flexShrink: 0, padding: '0 2px', opacity: 0.6 }}
                                title={'Delete ' + name}
                            >
                                x
                            </span>
                        </div>
                    )
                })}
            </div>

            {showNewFile && <NewFileDialog open={showNewFile} onClose={() => setShowNewFile(false)} onConfirm={handleNewFile} isDarkMode={isDarkMode} />}
        </div>
    )
}
