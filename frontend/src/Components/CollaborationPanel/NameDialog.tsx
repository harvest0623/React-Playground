import { useContext, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'

interface NameDialogProps {
    open: boolean
    onConfirm: (name: string) => void
    onCancel: () => void
}

export default function NameDialog({ open, onConfirm, onCancel }: NameDialogProps) {
    const { isDarkMode } = useContext(PlaygroundContext)
    const [name, setName] = useState('')

    if (!open) return null

    const handleConfirm = () => {
        const trimmed = name.trim()
        if (trimmed) {
            onConfirm(trimmed)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm()
        }
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}>
            <div style={{
                backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
                borderRadius: 12,
                padding: 32,
                width: 380,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                border: `1px solid ${isDarkMode ? '#333' : '#e5e5e5'}`,
            }}>
                <h3 style={{
                    margin: '0 0 8px',
                    fontSize: 18,
                    fontWeight: 600,
                    color: isDarkMode ? '#fff' : '#1a1a1a',
                }}>
                    输入你的用户名
                </h3>
                <p style={{
                    margin: '0 0 20px',
                    fontSize: 13,
                    color: isDarkMode ? '#888' : '#666',
                }}>
                    其他协作者将看到此名称
                </p>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="请输入用户名"
                    autoFocus
                    style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: 14,
                        borderRadius: 8,
                        border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                        backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f8f8',
                        color: isDarkMode ? '#fff' : '#000',
                        outline: 'none',
                        boxSizing: 'border-box',
                    }}
                />
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10,
                    marginTop: 20,
                }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '8px 18px',
                            fontSize: 13,
                            borderRadius: 8,
                            border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                            backgroundColor: 'transparent',
                            color: isDarkMode ? '#ccc' : '#555',
                            cursor: 'pointer',
                        }}
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!name.trim()}
                        style={{
                            padding: '8px 18px',
                            fontSize: 13,
                            borderRadius: 8,
                            border: 'none',
                            backgroundColor: name.trim() ? '#61afef' : '#555',
                            color: '#fff',
                            cursor: name.trim() ? 'pointer' : 'not-allowed',
                            fontWeight: 500,
                        }}
                    >
                        确认
                    </button>
                </div>
            </div>
        </div>
    )
}
