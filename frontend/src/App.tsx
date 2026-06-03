import { useState } from 'react'
import ReactPlayground from './ReactPlayground'
import './App.scss'
import { PlaygroundProvider, PlaygroundContext } from './ReactPlayground/PlaygroundContext.tsx'
import TemplateSelector from './Components/TemplateSelector'
import { useContext } from 'react'

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
        </>
    )
}

export default function App() {
    return (
        <PlaygroundProvider>
            <AppContent />
        </PlaygroundProvider>
    )
}
