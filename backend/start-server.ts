import { spawn } from 'child_process'
import { startCollaborationServer } from './src/lib/collaboration-server'

const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10)

const wsServer = startCollaborationServer(WS_PORT)

const nextProcess = spawn('npx', ['next', 'dev'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
})

nextProcess.on('error', (err) => {
    console.error('Failed to start Next.js:', err)
    process.exit(1)
})

process.on('SIGINT', () => {
    console.log('\nShutting down...')
    wsServer.close()
    nextProcess.kill()
    process.exit(0)
})

process.on('SIGTERM', () => {
    wsServer.close()
    nextProcess.kill()
    process.exit(0)
})

console.log(`Next.js dev server starting...`)
console.log(`WebSocket server running on ws://localhost:${WS_PORT}`)
