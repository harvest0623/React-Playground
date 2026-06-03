import { useContext, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'
import { useCollaboration } from '../../Collaboration/CollaborationContext'
import NameDialog from '../CollaborationPanel/NameDialog'
import { useLanguage } from '../../i18n/LanguageContext'

export default function CollaborationButton() {
    const { isDarkMode } = useContext(PlaygroundContext)
    const { t } = useLanguage()
    const {
        roomId, connected,
        setShowPanel,
        showNameDialog, setShowNameDialog,
        createRoom, joinRoom,
        myUserName, setMyUserName,
        collaborators,
    } = useCollaboration()

    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showJoinDialog, setShowJoinDialog] = useState(false)
    const [roomNameInput, setRoomNameInput] = useState('')
    const [joinRoomIdInput, setJoinRoomIdInput] = useState('')

    const isCollaborating = !!roomId

    const handleCollabClick = () => {
        if (isCollaborating) {
            setShowPanel(true)
            return
        }
        if (!myUserName) {
            setShowNameDialog(true)
            return
        }
        setShowCreateDialog(true)
    }

    const handleNameConfirm = (name: string) => {
        setMyUserName(name)
        setShowNameDialog(false)
        setShowCreateDialog(true)
    }

    const handleCreateRoom = async () => {
        if (!roomNameInput.trim()) return
        await createRoom(roomNameInput.trim())
        setRoomNameInput('')
        setShowCreateDialog(false)
    }

    const handleJoinRoom = async () => {
        if (!joinRoomIdInput.trim()) return
        await joinRoom(joinRoomIdInput.trim(), myUserName)
        setJoinRoomIdInput('')
        setShowJoinDialog(false)
    }

    const overlayStyle: React.CSSProperties = {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    }

    const dialogStyle: React.CSSProperties = {
        backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
        borderRadius: 12,
        padding: 32,
        width: 400,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: `1px solid ${isDarkMode ? '#333' : '#e5e5e5'}`,
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 14px',
        fontSize: 14,
        borderRadius: 8,
        border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
        backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f8f8',
        color: isDarkMode ? '#fff' : '#000',
        outline: 'none',
        boxSizing: 'border-box' as const,
    }

    const btnPrimary: React.CSSProperties = {
        padding: '8px 18px',
        fontSize: 13,
        borderRadius: 8,
        border: 'none',
        backgroundColor: '#61afef',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: 500,
    }

    const btnSecondary: React.CSSProperties = {
        padding: '8px 18px',
        fontSize: 13,
        borderRadius: 8,
        border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
        backgroundColor: 'transparent',
        color: isDarkMode ? '#ccc' : '#555',
        cursor: 'pointer',
    }

    return (
        <>
            <div
                className="iconButton"
                onClick={handleCollabClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    color: isCollaborating
                        ? (connected ? '#98c379' : '#e5c07b')
                        : (isDarkMode ? '#fff' : '#333'),
                    fontWeight: isCollaborating ? 500 : 400,
                    position: 'relative',
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>{isCollaborating ? t('collaborating') : t('collaborate')}</span>
                {isCollaborating && (
                    <span style={{
                        fontSize: 11,
                        backgroundColor: '#61afef',
                        color: '#fff',
                        borderRadius: 10,
                        padding: '1px 6px',
                        marginLeft: 2,
                    }}>
                        {collaborators.length}
                    </span>
                )}
                <div style={{
                    position: 'absolute',
                    bottom: -30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 12,
                    color: isDarkMode ? '#ccc' : '#555',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                }}>
                    {isCollaborating ? t('openCollabPanel') : t('startCollab')}
                </div>
            </div>

            <NameDialog
                open={showNameDialog}
                onConfirm={handleNameConfirm}
                onCancel={() => setShowNameDialog(false)}
            />

            {showCreateDialog && (
                <div style={overlayStyle} onClick={() => setShowCreateDialog(false)}>
                    <div style={dialogStyle} onClick={e => e.stopPropagation()}>
                        <h3 style={{
                            margin: '0 0 8px',
                            fontSize: 18,
                            fontWeight: 600,
                            color: isDarkMode ? '#fff' : '#1a1a1a',
                        }}>
                            {t('createCollabRoom')}
                        </h3>
                        <p style={{
                            margin: '0 0 20px',
                            fontSize: 13,
                            color: isDarkMode ? '#888' : '#666',
                        }}>
                            {t('createRoomDesc')}
                        </p>
                        <input
                            type="text"
                            value={roomNameInput}
                            onChange={e => setRoomNameInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateRoom()}
                            placeholder={t('roomName')}
                            autoFocus
                            style={inputStyle}
                        />
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 16,
                        }}>
                            <span
                                onClick={() => { setShowCreateDialog(false); setShowJoinDialog(true) }}
                                style={{
                                    fontSize: 13,
                                    color: '#61afef',
                                    cursor: 'pointer',
                                }}
                            >
                                {t('joinExistingRoom')}
                            </span>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setShowCreateDialog(false)} style={btnSecondary}>
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleCreateRoom}
                                    disabled={!roomNameInput.trim()}
                                    style={{
                                        ...btnPrimary,
                                        backgroundColor: roomNameInput.trim() ? '#61afef' : '#555',
                                        cursor: roomNameInput.trim() ? 'pointer' : 'not-allowed',
                                    }}
                                >
                                    {t('create')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showJoinDialog && (
                <div style={overlayStyle} onClick={() => setShowJoinDialog(false)}>
                    <div style={dialogStyle} onClick={e => e.stopPropagation()}>
                        <h3 style={{
                            margin: '0 0 8px',
                            fontSize: 18,
                            fontWeight: 600,
                            color: isDarkMode ? '#fff' : '#1a1a1a',
                        }}>
                            {t('joinCollabRoom')}
                        </h3>
                        <p style={{
                            margin: '0 0 20px',
                            fontSize: 13,
                            color: isDarkMode ? '#888' : '#666',
                        }}>
                            {t('joinRoomDesc')}
                        </p>
                        <input
                            type="text"
                            value={joinRoomIdInput}
                            onChange={e => setJoinRoomIdInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
                            placeholder={t('roomId')}
                            autoFocus
                            style={inputStyle}
                        />
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 16,
                        }}>
                            <span
                                onClick={() => { setShowJoinDialog(false); setShowCreateDialog(true) }}
                                style={{
                                    fontSize: 13,
                                    color: '#61afef',
                                    cursor: 'pointer',
                                }}
                            >
                                {t('createNewRoom')}
                            </span>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setShowJoinDialog(false)} style={btnSecondary}>
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleJoinRoom}
                                    disabled={!joinRoomIdInput.trim()}
                                    style={{
                                        ...btnPrimary,
                                        backgroundColor: joinRoomIdInput.trim() ? '#61afef' : '#555',
                                        cursor: joinRoomIdInput.trim() ? 'pointer' : 'not-allowed',
                                    }}
                                >
                                    {t('joinRoom')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
