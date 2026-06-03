import { useState } from 'react'
import ReactPlayground from './ReactPlayground'
import './App.scss'
import { PlaygroundProvider, PlaygroundContext } from './ReactPlayground/PlaygroundContext.tsx'
import TemplateSelector from './Components/TemplateSelector'
import HistoryPanel from './Components/HistoryPanel'
import { useContext } from 'react'
import { LanguageProvider } from './i18n/LanguageContext'

function AppContent() {
    const { isDarkMode, setFiles } = useContext(PlaygroundContext)
    const [showTemplates, setShowTemplates] = useState(true)

    return (
        <>
            <TemplateSelector
                open={showTemplates}
                onClose={() => setShowTemplates(false)}
                onSelect={(files) => {
                    setFiles(files)
                    setShowTemplates(false)
                }}
                isDarkMode={isDarkMode}
            />
            <ReactPlayground />
            <HistoryPanel />
        </>
    )
}

export default function App() {
    return (
        <LanguageProvider>
            <PlaygroundProvider>
                <AppContent />
            </PlaygroundProvider>
        </LanguageProvider>
    )
}
