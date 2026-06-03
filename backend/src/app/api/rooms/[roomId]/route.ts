import { NextRequest, NextResponse } from 'next/server'
import { getRoomDetail, updateRoomFile, deleteRoomById } from '@/lib/collaboration-server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params
    const room = getRoomDetail(roomId)
    if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    return NextResponse.json(room)
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params
        const body = await request.json()
        const { fileName, value, userId } = body

        if (!fileName || value === undefined || !userId) {
            return NextResponse.json({ error: 'fileName, value, and userId are required' }, { status: 400 })
        }

        const result = updateRoomFile(roomId, fileName, value, userId)
        if (!result) {
            return NextResponse.json({ error: 'Room not found or no permission' }, { status: 404 })
        }

        return NextResponse.json(result)
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
        const { userId } = body as { userId?: string }

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 })
        }

        const success = deleteRoomById(roomId, userId)
        if (!success) {
            return NextResponse.json({ error: 'Room not found or not owner' }, { status: 403 })
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
