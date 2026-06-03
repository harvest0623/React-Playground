import { useContext, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'
import { useCollaboration, formatRelativeTime } from '../../Collaboration/CollaborationContext'

export default function CollaborationPanel() {
    const { isDarkMode } = useContext(PlaygroundContext)
    const {
        showPanel, setShowPanel,
        connected, roomId, roomName, isOwner,
        collaborators, permissions, history,
        myUserId,
        leaveRoom, updatePermission, inviteUser,
        fetchHistory,
    } = useCollaboration()

    const [inviteEmail, setInviteEmail] = useState('')
    const [invitePermission, setInvitePermission] = useState<'edit' | 'view'>('edit')
    const [copied, setCopied] = useState(false)

    const bg = isDarkMode ? '#1e1e1e' : '#fff'
    const border = isDarkMode ? '#333' : '#e5e5e5'
    const text = isDarkMode ? '#fff' : '#1a1a1a'
    const textSecondary = isDarkMode ? '#888' : '#666'
    const inputBg = isDarkMode ? '#2d2d2d' : '#f8f8f8'

    const copyInviteLink = () => {
        if (!roomId) return
        const link = `${window.location.origin}?room=${roomId}`
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const handleInvite = () => {
        if (!inviteEmail.trim()) return
        inviteUser(inviteEmail.trim(), invitePermission)
        setInviteEmail('')
    }

    const getPermissionLabel = (userId: string) => {
        if (userId === myUserId && isOwner) return 'Owner'
        const p = permissions[userId]
        if (p === 'edit') return 'Edit'
        if (p === 'view') return 'View'
        return 'None'
    }

    const getPermissionBadgeColor = (userId: string) => {
        if (userId === myUserId && isOwner) return '#e5c07b'
        const p = permissions[userId]
        if (p === 'edit') return '#98c379'
        if (p === 'view') return '#61afef'
        return '#e06c75'
    }

    if (!showPanel) return null

    return (
        <>
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9998,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }}
                onClick={() => setShowPanel(false)}
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
                transform: showPanel ? 'translateX(0)' : 'translateX(100%)',
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
                        实时协作
                    </h3>
                    <div
                        onClick={() => setShowPanel(false)}
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
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: `1px solid ${border}`,
                        marginBottom: 20,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: textSecondary }}>房间</span>
                            <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: connected ? '#98c379' : '#e06c75',
                            }} />
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: text, marginBottom: 4 }}>
                            {roomName || '未命名房间'}
                        </div>
                        <div
                            onClick={() => {
                                if (roomId) {
                                    navigator.clipboard.writeText(roomId)
                                }
                            }}
                            style={{
                                fontSize: 12,
                                color: textSecondary,
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                userSelect: 'all',
                            }}
                        >
                            ID: {roomId || '-'}
                        </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 10 }}>
                            在线用户 ({collaborators.length})
                        </div>
                        {collaborators.map(user => (
                            <div key={user.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 12px',
                                borderRadius: 8,
                                marginBottom: 4,
                                backgroundColor: isDarkMode ? '#252525' : '#f5f5f5',
                            }}>
                                <div style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    backgroundColor: user.color,
                                    flexShrink: 0,
                                }} />
                                <span style={{
                                    fontSize: 13,
                                    color: text,
                                    fontWeight: user.id === myUserId ? 700 : 400,
                                    flex: 1,
                                }}>
                                    {user.name}
                                    {user.id === myUserId && ' (我)'}
                                </span>
                                <span style={{
                                    fontSize: 11,
                                    color: getPermissionBadgeColor(user.id),
                                    fontWeight: 500,
                                }}>
                                    {getPermissionLabel(user.id)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {isOwner && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 10 }}>
                                权限管理
                            </div>
                            {collaborators.filter(c => c.id !== myUserId).map(user => (
                                <div key={user.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '6px 12px',
                                    marginBottom: 4,
                                }}>
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: user.color,
                                        flexShrink: 0,
                                    }} />
                                    <span style={{ fontSize: 13, color: text, flex: 1 }}>
                                        {user.name}
                                    </span>
                                    <select
                                        value={permissions[user.id] || 'edit'}
                                        onChange={e => updatePermission(user.id, e.target.value as 'edit' | 'view' | 'none')}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: 12,
                                            borderRadius: 6,
                                            border: `1px solid ${border}`,
                                            backgroundColor: inputBg,
                                            color: text,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <option value="edit">可编辑</option>
                                        <option value="view">仅查看</option>
                                        <option value="none">禁止</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 10 }}>
                            邀请用户
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                placeholder="输入邮箱地址"
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    fontSize: 13,
                                    borderRadius: 8,
                                    border: `1px solid ${border}`,
                                    backgroundColor: inputBg,
                                    color: text,
                                    outline: 'none',
                                }}
                            />
                            <select
                                value={invitePermission}
                                onChange={e => setInvitePermission(e.target.value as 'edit' | 'view')}
                                style={{
                                    padding: '8px 8px',
                                    fontSize: 12,
                                    borderRadius: 8,
                                    border: `1px solid ${border}`,
                                    backgroundColor: inputBg,
                                    color: text,
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="edit">可编辑</option>
                                <option value="view">仅查看</option>
                            </select>
                        </div>
                        <button
                            onClick={handleInvite}
                            disabled={!inviteEmail.trim()}
                            style={{
                                width: '100%',
                                padding: '8px 0',
                                fontSize: 13,
                                borderRadius: 8,
                                border: 'none',
                                backgroundColor: inviteEmail.trim() ? '#61afef' : '#555',
                                color: '#fff',
                                cursor: inviteEmail.trim() ? 'pointer' : 'not-allowed',
                                fontWeight: 500,
                            }}
                        >
                            发送邀请
                        </button>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 10 }}>
                            编辑历史
                        </div>
                        <div
                            onClick={fetchHistory}
                            style={{
                                fontSize: 12,
                                color: '#61afef',
                                cursor: 'pointer',
                                marginBottom: 8,
                            }}
                        >
                            刷新
                        </div>
                        {history.length === 0 ? (
                            <div style={{ fontSize: 12, color: textSecondary, padding: '8px 0' }}>
                                暂无编辑记录
                            </div>
                        ) : (
                            [...history].reverse().map((entry, i) => (
                                <div key={i} style={{
                                    padding: '6px 0',
                                    borderBottom: `1px solid ${border}`,
                                    fontSize: 12,
                                    color: textSecondary,
                                }}>
                                    <span style={{ color: text, fontWeight: 500 }}>{entry.userName}</span>
                                    {' '}{entry.action}{' '}
                                    <span style={{ color: '#61afef' }}>{entry.fileName}</span>
                                    <div style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                                        {formatRelativeTime(entry.timestamp)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div style={{
                    padding: '16px 20px',
                    borderTop: `1px solid ${border}`,
                    display: 'flex',
                    gap: 10,
                }}>
                    <button
                        onClick={copyInviteLink}
                        style={{
                            flex: 1,
                            padding: '10px 0',
                            fontSize: 13,
                            borderRadius: 8,
                            border: `1px solid ${border}`,
                            backgroundColor: 'transparent',
                            color: text,
                            cursor: 'pointer',
                            fontWeight: 500,
                        }}
                    >
                        {copied ? '已复制 ✓' : '复制链接'}
                    </button>
                    <button
                        onClick={leaveRoom}
                        style={{
                            flex: 1,
                            padding: '10px 0',
                            fontSize: 13,
                            borderRadius: 8,
                            border: 'none',
                            backgroundColor: '#e06c75',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 500,
                        }}
                    >
                        退出协作
                    </button>
                </div>
            </div>
        </>
    )
}
