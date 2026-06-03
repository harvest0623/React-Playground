import { NextRequest, NextResponse } from 'next/server'
import { createInvite, getInvite, addInviteeToRoom } from '@/lib/collaboration-server'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params
        const body = await request.json()
        const { email, permission } = body

        if (!email || !permission) {
            return NextResponse.json({ error: 'email and permission are required' }, { status: 400 })
        }

        if (!['edit', 'view', 'none'].includes(permission)) {
            return NextResponse.json({ error: 'Invalid permission type' }, { status: 400 })
        }

        const invite = createInvite(roomId, email, permission)
        return NextResponse.json({
            inviteId: invite.inviteId,
            link: `/invite/${invite.inviteId}`,
            email,
            permission,
            expiresAt: invite.expiresAt,
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params
    const { searchParams } = new URL(request.url)
    const inviteId = searchParams.get('inviteId')

    if (!inviteId) {
        return NextResponse.json({ error: 'inviteId is required' }, { status: 400 })
    }

    const invite = getInvite(inviteId)
    if (!invite) {
        return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (invite.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
    }

    if (invite.roomId !== roomId) {
        return NextResponse.json({ error: 'Invite does not match room' }, { status: 400 })
    }

    const room = addInviteeToRoom(inviteId)

    return NextResponse.json({
        roomId: invite.roomId,
        email: invite.email,
        permission: invite.permission,
        roomName: room?.name || 'Unknown',
    })
}
