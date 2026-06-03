import { NextRequest, NextResponse } from 'next/server'
import {
    getRoomPermissions,
    updateRoomPermission,
    removeRoomPermission,
} from '@/lib/collaboration-server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params
    const permissions = getRoomPermissions(roomId)
    if (permissions === null) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    return NextResponse.json({ permissions })
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params
        const body = await request.json()
        const { userId: targetUserId, permission } = body

        if (!targetUserId || !permission) {
            return NextResponse.json({ error: 'userId and permission are required' }, { status: 400 })
        }

        if (!['edit', 'view', 'none'].includes(permission)) {
            return NextResponse.json({ error: 'Invalid permission type' }, { status: 400 })
        }

        const success = updateRoomPermission(roomId, targetUserId, permission)
        if (!success) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, targetUserId, permission })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params
        const body = await request.json().catch(() => ({}))
        const { userId: targetUserId } = body as { userId?: string }

        if (!targetUserId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 })
        }

        const success = removeRoomPermission(roomId, targetUserId)
        if (!success) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
