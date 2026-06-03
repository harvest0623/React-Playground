import type { Files } from './PlaygroundContext'

export interface VersionEntry {
    id: number
    timestamp: number
    files: Files
    description: string
}

const HISTORY_KEY = 'react-playground-history'
const MAX_HISTORY = 50

export function getHistory(): VersionEntry[] {
    try {
        const data = localStorage.getItem(HISTORY_KEY)
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

export function addHistoryEntry(files: Files, description: string): VersionEntry[] {
    const history = getHistory()
    const entry: VersionEntry = {
        id: Date.now(),
        timestamp: Date.now(),
        files: JSON.parse(JSON.stringify(files)),
        description,
    }
    history.push(entry)
    if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY)
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    return history
}

export function clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY)
}
