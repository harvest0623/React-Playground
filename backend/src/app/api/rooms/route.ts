import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'collaboration-dev-secret-key'

const roomsStore = new Map<string, { id: string; name: string; owner: string; userCount: number }>()

export function GET() {
    const list: Array<{ id: string; name: string; owner: string; userCount: number }> = []
    roomsStore.forEach((room) => list.push({ ...room }))
    return NextResponse.json({ rooms: list })
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, owner } = body

        if (!name || !owner) {
            return NextResponse.json({ error: 'Name and owner are required' }, { status: 400 })
        }

        const roomId = uuidv4().slice(0, 8)
        const token = jwt.sign({ roomId, userId: owner }, JWT_SECRET, { expiresIn: '24h' })

        roomsStore.set(roomId, { id: roomId, name, owner, userCount: 0 })

        return NextResponse.json({ roomId, token, name, owner })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export { roomsStore }
