import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import type { Room, UserInfo, HistoryEntry } from './types'
import { USER_COLORS } from './types'

const rooms = new Map<string, Room>()
const clientRooms = new Map<WebSocket, string>()
const clientUsers = new Map<WebSocket, { roomId: string; userId: string }>()
const inviteStore = new Map<string, { roomId: string; email: string; permission: 'edit' | 'view' | 'none'; createdAt: number; expiresAt: number }>()

function getRoom(roomId: string): Room | undefined {
    return rooms.get(roomId)
}

function createRoom(id: string, name: string, owner: string): Room {
    const room: Room = {
        id,
        name,
        owner,
        files: {},
        users: new Map(),
        permissions: new Map(),
        history: [],
    }
    rooms.set(id, room)
    return room
}

function broadcast(room: Room, message: object, excludeWs?: WebSocket) {
    const data = JSON.stringify(message)
    room.users.forEach((_, userId) => {
        for (const [ws, info] of clientUsers.entries()) {
            if (info.roomId === room.id && info.userId === userId && ws !== excludeWs) {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(data)
                }
            }
        }
    })
}

function getColorForUser(room: Room): string {
    const usedColors = new Set<string>()
    room.users.forEach((user) => usedColors.add(user.color))
    const available = USER_COLORS.filter((c) => !usedColors.has(c))
    if (available.length > 0) return available[0]
    return USER_COLORS[room.users.size % USER_COLORS.length]
}

function getUserList(room: Room) {
    const list: Array<{ id: string; name: string; color: string; cursor?: { fileName: string; position: number } }> = []
    room.users.forEach((user) => list.push({ ...user }))
    return list
}

export function startCollaborationServer(port: number = 3001) {
    const wss = new WebSocketServer({ port })

    wss.on('connection', (ws) => {
        ws.on('message', (raw) => {
            try {
                const msg = JSON.parse(raw.toString())
                handleMessage(ws, msg)
            } catch {
                ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message format' } }))
            }
        })

        ws.on('close', () => {
            const info = clientUsers.get(ws)
            if (info) {
                const room = getRoom(info.roomId)
                if (room) {
                    room.users.delete(info.userId)
                    broadcast(room, {
                        type: 'user-left',
                        payload: { userId: info.userId, users: getUserList(room) },
                    })
                }
            }
            clientUsers.delete(ws)
            clientRooms.delete(ws)
        })
    })

    function handleMessage(ws: WebSocket, msg: { type: string; payload: Record<string, unknown> }) {
        const { type, payload } = msg

        switch (type) {
            case 'join':
                handleJoin(ws, payload)
                break
            case 'file-change':
                handleFileChange(ws, payload)
                break
            case 'cursor-move':
                handleCursorMove(ws, payload)
                break
            case 'permission-update':
                handlePermissionUpdate(ws, payload)
                break
            case 'user-left':
                handleUserLeft(ws)
                break
        }
    }

    function handleJoin(ws: WebSocket, payload: Record<string, unknown>) {
        const roomId = payload.roomId as string
        const userId = payload.userId as string
        const userName = payload.userName as string

        if (!roomId || !userId || !userName) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Missing required fields' } }))
            return
        }

        let room = getRoom(roomId)
        if (!room) {
            room = createRoom(roomId, roomId, userId)
        }

        const color = getColorForUser(room)
        const userInfo: UserInfo = { id: userId, name: userName, color }

        room.users.set(userId, userInfo)
        clientUsers.set(ws, { roomId, userId })
        clientRooms.set(ws, roomId)

        const files = room.files
        const permissions: Record<string, string> = {}
        room.permissions.forEach((val, key) => { permissions[key] = val })

        ws.send(JSON.stringify({
            type: 'join-success',
            payload: {
                roomId,
                files,
                users: getUserList(room),
                permissions,
                history: room.history.slice(-50),
            },
        }))

        broadcast(room, {
            type: 'user-join',
            payload: { user: userInfo, users: getUserList(room) },
        }, ws)
    }

    function handleFileChange(ws: WebSocket, payload: Record<string, unknown>) {
        const info = clientUsers.get(ws)
        if (!info) return

        const room = getRoom(info.roomId)
        if (!room) return

        const fileName = payload.fileName as string
        const value = payload.value as string
        const userId = info.userId

        const permission = room.permissions.get(userId) || (room.owner === userId ? 'edit' : undefined)
        if (permission !== 'edit' && room.owner !== userId) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'No edit permission' } }))
            return
        }

        if (room.files[fileName]) {
            room.files[fileName].value = value
        } else {
            room.files[fileName] = { name: fileName, value, language: 'typescript' }
        }

        const user = room.users.get(userId)
        const entry: HistoryEntry = {
            userId,
            userName: user?.name || 'Unknown',
            timestamp: Date.now(),
            action: 'edit',
            fileName,
        }
        room.history.push(entry)

        broadcast(room, {
            type: 'file-change',
            payload: { fileName, value, userId },
        }, ws)
    }

    function handleCursorMove(ws: WebSocket, payload: Record<string, unknown>) {
        const info = clientUsers.get(ws)
        if (!info) return

        const room = getRoom(info.roomId)
        if (!room) return

        const fileName = payload.fileName as string
        const position = payload.position as number

        const user = room.users.get(info.userId)
        if (user) {
            user.cursor = { fileName, position }
        }

        broadcast(room, {
            type: 'cursor-move',
            payload: { userId: info.userId, fileName, position },
        }, ws)
    }

    function handlePermissionUpdate(ws: WebSocket, payload: Record<string, unknown>) {
        const info = clientUsers.get(ws)
        if (!info) return

        const room = getRoom(info.roomId)
        if (!room) return

        if (room.owner !== info.userId) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Only owner can update permissions' } }))
            return
        }

        const targetUserId = payload.targetUserId as string
        const permission = payload.permission as 'edit' | 'view' | 'none'

        room.permissions.set(targetUserId, permission)

        broadcast(room, {
            type: 'permission-update',
            payload: { targetUserId, permission },
        })
    }

    function handleUserLeft(ws: WebSocket) {
        const info = clientUsers.get(ws)
        if (!info) return

        const room = getRoom(info.roomId)
        if (room) {
            room.users.delete(info.userId)
            broadcast(room, {
                type: 'user-left',
                payload: { userId: info.userId, users: getUserList(room) },
            })
        }
        clientUsers.delete(ws)
        clientRooms.delete(ws)
    }

    console.log(`Collaboration server running on ws://localhost:${port}`)
    return wss
}

export function getRooms() {
    const list: Array<{ id: string; name: string; owner: string; userCount: number }> = []
    rooms.forEach((room) => {
        list.push({ id: room.id, name: room.name, owner: room.owner, userCount: room.users.size })
    })
    return list
}

export function createNewRoom(id: string, name: string, owner: string) {
    return createRoom(id, name, owner)
}

export function getRoomDetail(roomId: string) {
    const room = getRoom(roomId)
    if (!room) return null
    const permissions: Record<string, string> = {}
    room.permissions.forEach((val, key) => { permissions[key] = val })
    return {
        id: room.id,
        name: room.name,
        owner: room.owner,
        files: room.files,
        permissions,
        history: room.history,
    }
}

export function updateRoomFile(roomId: string, fileName: string, value: string, userId: string) {
    const room = getRoom(roomId)
    if (!room) return null

    const permission = room.permissions.get(userId) || (room.owner === userId ? 'edit' : undefined)
    if (permission !== 'edit' && room.owner !== userId) return null

    if (room.files[fileName]) {
        room.files[fileName].value = value
    } else {
        room.files[fileName] = { name: fileName, value, language: 'typescript' }
    }

    const user = room.users.get(userId)
    room.history.push({
        userId,
        userName: user?.name || 'Unknown',
        timestamp: Date.now(),
        action: 'edit',
        fileName,
    })

    return room.files[fileName]
}

export function deleteRoomById(roomId: string, userId: string) {
    const room = getRoom(roomId)
    if (!room) return false
    if (room.owner !== userId) return false

    rooms.delete(roomId)
    return true
}

export function getRoomPermissions(roomId: string) {
    const room = getRoom(roomId)
    if (!room) return null
    const permissions: Record<string, string> = {}
    room.permissions.forEach((val, key) => { permissions[key] = val })
    return permissions
}

export function updateRoomPermission(roomId: string, targetUserId: string, permission: 'edit' | 'view' | 'none') {
    const room = getRoom(roomId)
    if (!room) return false
    room.permissions.set(targetUserId, permission)
    return true
}

export function removeRoomPermission(roomId: string, targetUserId: string) {
    const room = getRoom(roomId)
    if (!room) return false
    room.permissions.delete(targetUserId)
    return true
}

export function getRoomHistory(roomId: string) {
    const room = getRoom(roomId)
    if (!room) return null
    return room.history
}

export function createInvite(roomId: string, email: string, permission: 'edit' | 'view' | 'none') {
    const id = uuidv4().slice(0, 8)
    const invite = { roomId, email, permission, createdAt: Date.now(), expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 }
    inviteStore.set(id, invite)
    return { inviteId: id, ...invite }
}

export function getInvite(inviteId: string) {
    return inviteStore.get(inviteId) || null
}

export function addInviteeToRoom(inviteId: string) {
    const invite = inviteStore.get(inviteId)
    if (!invite) return null
    const room = getRoom(invite.roomId)
    if (!room) return null
    room.permissions.set(invite.email, invite.permission)
    return room
}

export const store = { rooms, clientUsers, inviteStore }
