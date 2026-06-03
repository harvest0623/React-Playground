export interface UserInfo {
    id: string
    name: string
    color: string
    cursor?: { fileName: string; position: number }
}

export interface HistoryEntry {
    userId: string
    userName: string
    timestamp: number
    action: string
    fileName: string
}

export interface Room {
    id: string
    name: string
    owner: string
    files: Record<string, { name: string; value: string; language: string }>
    users: Map<string, UserInfo>
    permissions: Map<string, 'edit' | 'view' | 'none'>
    history: HistoryEntry[]
}

export interface AuthUser {
    id: string
    name: string
    email: string
    token: string
}

export interface Invite {
    id: string
    roomId: string
    email: string
    permission: 'edit' | 'view' | 'none'
    createdAt: number
    expiresAt: number
}

export type WSMessageType = 'join' | 'file-change' | 'cursor-move' | 'permission-update' | 'user-left' | 'user-join'

export interface WSMessage {
    type: WSMessageType
    payload: Record<string, unknown>
}

export const USER_COLORS = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
]
