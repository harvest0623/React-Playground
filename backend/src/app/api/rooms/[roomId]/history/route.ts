import { NextRequest, NextResponse } from 'next/server'
import { getRoomHistory } from '@/lib/collaboration-server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params
    const history = getRoomHistory(roomId)
    if (history === null) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    return NextResponse.json({ history })
}
