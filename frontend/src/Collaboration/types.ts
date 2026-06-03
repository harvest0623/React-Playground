export interface Collaborator {
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

export interface CollaborationState {
    connected: boolean
    roomId: string | null
    roomName: string
    isOwner: boolean
    collaborators: Collaborator[]
    permissions: Record<string, 'edit' | 'view' | 'none'>
    history: HistoryEntry[]
    myUserId: string | null
    myUserName: string
    myToken: string | null
}

export interface CollaborationContextType extends CollaborationState {
    createRoom: (name: string) => Promise<void>
    joinRoom: (roomId: string, userName: string) => Promise<void>
    leaveRoom: () => void
    updateFile: (fileName: string, value: string) => void
    updatePermission: (userId: string, permission: 'edit' | 'view' | 'none') => void
    inviteUser: (email: string, permission: 'edit' | 'view') => void
    fetchHistory: () => void
    showPanel: boolean
    setShowPanel: (v: boolean) => void
    showNameDialog: boolean
    setShowNameDialog: (v: boolean) => void
    setMyUserName: (name: string) => void
}
