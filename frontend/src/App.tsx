import React, { Suspense, useState, useContext } from 'react'
import ReactPlayground from './ReactPlayground'
import './App.scss'
import { PlaygroundProvider, PlaygroundContext } from './ReactPlayground/PlaygroundContext.tsx'
import { LanguageProvider } from './i18n/LanguageContext'

const TemplateSelector = React.lazy(() => import('./Components/TemplateSelector'))
const HistoryPanel = React.lazy(() => import('./Components/HistoryPanel'))
const SplashScreen = React.lazy(() => import('./Components/SplashScreen'))

function AppContent() {
    const { isDarkMode, setFiles } = useContext(PlaygroundContext)
    const [showTemplates, setShowTemplates] = useState(true)

    return (
        <>
            <Suspense fallback={null}>
                <TemplateSelector
                    open={showTemplates}
                    onClose={() => setShowTemplates(false)}
                    onSelect={(files) => {
                        setFiles(files)
                        setShowTemplates(false)
                    }}
                    isDarkMode={isDarkMode}
                />
            </Suspense>
            <ReactPlayground />
            <Suspense fallback={null}>
                <HistoryPanel />
            </Suspense>
        </>
    )
}

export default function App() {
    const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('splash-done'))

    return (
        <LanguageProvider>
            <PlaygroundProvider>
                {showSplash && (
                    <Suspense fallback={null}>
                        <SplashScreen onComplete={() => setShowSplash(false)} />
                    </Suspense>
                )}
                <AppContent />
            </PlaygroundProvider>
        </LanguageProvider>
    )
}
