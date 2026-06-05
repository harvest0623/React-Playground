import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react'
import type { Collaborator, CollaborationContextType, HistoryEntry } from './types.ts'
import { PlaygroundContext } from '../ReactPlayground/PlaygroundContext.tsx'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const RECONNECT_INTERVAL = 3000

// eslint-disable-next-line react-refresh/only-export-components
export const CollaborationContext = createContext<CollaborationContextType>(null as unknown as CollaborationContextType)

const COLORS = [
    '#e06c75', '#61afef', '#98c379', '#e5c07b', '#c678dd',
    '#56b6c2', '#be5046', '#d19a66', '#7ec8e3', '#c084fc',
]

function getColor(index: number): string {
    return COLORS[index % COLORS.length]
}

// eslint-disable-next-line react-refresh/only-export-components
export function formatRelativeTime(timestamp: number): string {
    const diff = Math.floor((Date.now() - timestamp) / 1000)
    if (diff < 60) return `${diff}秒前`
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    return `${Math.floor(diff / 86400)}天前`
}

export const CollaborationProvider = (props: PropsWithChildren) => {
    const { children } = props
    const playgroundCtx = useContext(PlaygroundContext)
    const { setFiles } = playgroundCtx

    const [connected, setConnected] = useState(false)
    const [roomId, setRoomId] = useState<string | null>(null)
    const [roomName, setRoomName] = useState('')
    const [isOwner, setIsOwner] = useState(false)
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])
    const [permissions, setPermissions] = useState<Record<string, 'edit' | 'view' | 'none'>>({})
    const [history, setHistory] = useState<HistoryEntry[]>([])
    const [myUserId, setMyUserId] = useState<string | null>(null)
    const [myUserName, setMyUserName] = useState('')
    const [myToken, setMyToken] = useState<string | null>(null)
    const [showPanel, setShowPanel] = useState(false)
    const [showNameDialog, setShowNameDialog] = useState(false)

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const roomIdRef = useRef<string | null>(null)
    const tokenRef = useRef<string | null>(null)

    const cleanup = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = null
        }
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }
        setConnected(false)
    }, [])

    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const msg = JSON.parse(event.data)
            switch (msg.type) {
                case 'file-change': {
                    const { fileName, value } = msg.payload
                    setFiles(prev => ({
                        ...prev,
                        [fileName]: { ...prev[fileName], value }
                    }))
                    break
                }
                case 'user-join': {
                    const { user } = msg.payload
                    setCollaborators(prev => {
                        if (prev.some(c => c.id === user.id)) return prev
                        return [...prev, { ...user, color: getColor(prev.length) }]
                    })
                    break
                }
                case 'user-left': {
                    const { userId } = msg.payload
                    setCollaborators(prev => prev.filter(c => c.id !== userId))
                    break
                }
                case 'permission-update': {
                    const { targetUserId, permission } = msg.payload
                    setPermissions(prev => ({ ...prev, [targetUserId]: permission }))
                    break
                }
                case 'cursor-move': {
                    const { userId, cursor } = msg.payload
                    setCollaborators(prev => prev.map(c =>
                        c.id === userId ? { ...c, cursor } : c
                    ))
                    break
                }
                case 'room-joined': {
                    const { roomId: rId, roomName: rName, isOwner: o, collaborators: cs, permissions: p, history: h, userId: uId, token } = msg.payload
                    setRoomId(rId)
                    roomIdRef.current = rId
                    setRoomName(rName)
                    setIsOwner(o)
                    setCollaborators(cs.map((c: Collaborator, i: number) => ({ ...c, color: getColor(i) })))
                    setPermissions(p)
                    setHistory(h || [])
                    setMyUserId(uId)
                    setMyToken(token)
                    tokenRef.current = token
                    break
                }
                case 'room-created': {
                    const { roomId: rId, roomName: rName, userId: uId, token } = msg.payload
                    setRoomId(rId)
                    roomIdRef.current = rId
                    setRoomName(rName)
                    setIsOwner(true)
                    setMyUserId(uId)
                    setMyToken(token)
                    tokenRef.current = token
                    break
                }
                case 'history-update': {
                    const { history: h } = msg.payload
                    setHistory(h)
                    break
                }
            }
        } catch {
            // ignore parse errors
        }
    }, [setFiles])

    const connectRef = useRef<((rId: string, token: string) => void) | null>(null)

    const connect = useCallback((rId: string, token: string) => {
        cleanup()
        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
            setConnected(true)
            ws.send(JSON.stringify({
                type: 'join-room',
                payload: { roomId: rId, token }
            }))
        }

        ws.onmessage = handleMessage

        ws.onclose = () => {
            setConnected(false)
            if (roomIdRef.current && tokenRef.current) {
                const rId = roomIdRef.current
                const tok = tokenRef.current
                reconnectTimerRef.current = setTimeout(() => {
                    connectRef.current?.(rId, tok)
                }, RECONNECT_INTERVAL)
            }
        }

        ws.onerror = () => {
            ws.close()
        }
    }, [cleanup, handleMessage])

    useEffect(() => { connectRef.current = connect })

    const createRoom = useCallback(async (name: string) => {
        try {
            const res = await fetch(`${API_URL}/api/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName: name })
            })
            const data = await res.json()
            if (data.roomId) {
                setRoomId(data.roomId)
                roomIdRef.current = data.roomId
                setRoomName(name)
                setIsOwner(true)
                setMyUserId(data.userId)
                setMyToken(data.token)
                tokenRef.current = data.token
                connect(data.roomId, data.token)
            }
        } catch (err) {
            console.error('创建房间失败:', err)
        }
    }, [connect])

    const joinRoom = useCallback(async (targetRoomId: string, userName: string) => {
        try {
            const res = await fetch(`${API_URL}/api/rooms/${targetRoomId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName })
            })
            const data = await res.json()
            if (data.roomId) {
                setRoomId(data.roomId)
                roomIdRef.current = data.roomId
                setRoomName(data.roomName || '')
                setIsOwner(false)
                setMyUserId(data.userId)
                setMyToken(data.token)
                tokenRef.current = data.token
                connect(data.roomId, data.token)
            }
        } catch (err) {
            console.error('加入房间失败:', err)
        }
    }, [connect])

    const leaveRoom = useCallback(() => {
        cleanup()
        setRoomId(null)
        roomIdRef.current = null
        setRoomName('')
        setIsOwner(false)
        setCollaborators([])
        setPermissions({})
        setHistory([])
        setMyUserId(null)
        setMyToken(null)
        tokenRef.current = null
        setShowPanel(false)
    }, [cleanup])

    const updateFile = useCallback((fileName: string, value: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'file-change',
                payload: { fileName, value }
            }))
        }
    }, [])

    const updatePermission = useCallback((targetUserId: string, permission: 'edit' | 'view' | 'none') => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'permission-update',
                payload: { targetUserId, permission }
            }))
            setPermissions(prev => ({ ...prev, [targetUserId]: permission }))
        }
    }, [])

    const inviteUser = useCallback((email: string, permission: 'edit' | 'view') => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'invite-user',
                payload: { email, permission }
            }))
        }
    }, [])

    const fetchHistory = useCallback(async () => {
        if (!roomId) return
        try {
            const res = await fetch(`${API_URL}/api/rooms/${roomId}/history`)
            const data = await res.json()
            if (data.history) {
                setHistory(data.history)
            }
        } catch (err) {
            console.error('获取历史记录失败:', err)
        }
    }, [roomId])

    useEffect(() => {
        return () => cleanup()
    }, [cleanup])

    const value: CollaborationContextType = {
        connected,
        roomId,
        roomName,
        isOwner,
        collaborators,
        permissions,
        history,
        myUserId,
        myUserName,
        myToken,
        createRoom,
        joinRoom,
        leaveRoom,
        updateFile,
        updatePermission,
        inviteUser,
        fetchHistory,
        showPanel,
        setShowPanel,
        showNameDialog,
        setShowNameDialog,
        setMyUserName,
    }

    return (
        <CollaborationContext.Provider value={value}>
            {children}
        </CollaborationContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCollaboration() {
    return useContext(CollaborationContext)
}
