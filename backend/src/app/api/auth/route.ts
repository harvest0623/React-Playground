import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

const JWT_SECRET = process.env.JWT_SECRET || 'collaboration-dev-secret-key'
const users = new Map<string, { id: string; name: string; email: string; token: string }>()

function generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

function verifyToken(token: string): { userId: string } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: string }
    } catch {
        return null
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { action, name, email } = body

        if (action === 'register') {
            if (!name || !email) {
                return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
            }

            for (const [, user] of users) {
                if (user.email === email) {
                    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
                }
            }

            const userId = uuidv4()
            const token = generateToken(userId)
            const user = { id: userId, name, email, token }
            users.set(userId, user)

            return NextResponse.json({ userId, token, name, email })
        }

        if (action === 'login') {
            if (!email) {
                return NextResponse.json({ error: 'Email is required' }, { status: 400 })
            }

            for (const [, user] of users) {
                if (user.email === email) {
                    const newToken = generateToken(user.id)
                    user.token = newToken
                    return NextResponse.json({ userId: user.id, token: newToken, name: user.name, email: user.email })
                }
            }

            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export { verifyToken, users }
