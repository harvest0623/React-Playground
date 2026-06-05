import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useContext, useEffect, useState } from 'react'
import Header from '../Components/Header'
import FileExplorer from '../Components/FileExplorer'
import CodeEditor from '../Components/CodeEditor'
import Preview from '../Components/Preview'
import ErrorOverlay from '../Components/ErrorOverlay'
import ConsolePanel from '../Components/ConsolePanel'
import ShortcutsPanel from '../Components/ShortcutsPanel'
import FileSearch from '../Components/FileSearch'
import CollaborationPanel from '../Components/CollaborationPanel'
import AIAssistant from '../Components/AIAssistant'
import CSSVisualEditor from '../Components/CSSVisualEditor'
import PropsEditor from '../Components/PropsEditor'
import DiffViewer from '../Components/DiffViewer'
import CommandPalette from '../Components/CommandPalette'
import { PlaygroundContext } from './PlaygroundContext'
import { CollaborationProvider } from '../Collaboration/CollaborationContext'

export default function ReactPlayground() {
    const { isDarkMode, isFullScreen, showFileSearch, setShowFileSearch, showDiff, setShowDiff } = useContext(PlaygroundContext);
    const [fileSearchKey, setFileSearchKey] = useState(0);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isFullScreen) {
        return (
            <CollaborationProvider>
                <div style={{
                    height: '100vh',
                    backgroundColor: isDarkMode ? '#000' : '#fff',
                    color: isDarkMode ? '#fff' : '#000'
                }}>
                    <Preview />
                </div>
                <CollaborationPanel />
                <AIAssistant />
                <CommandPalette />
            </CollaborationProvider>
        );
    }

    return (
        <CollaborationProvider>
            <div
                style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: isDarkMode ? '#000' : '#fff',
                    color: isDarkMode ? '#fff' : '#000'
                }}
            >
                <Header/>
                <div style={{flex: 1, minHeight: 0}}>
                    <Allotment defaultSizes={isMobile ? [600, 400] : [400, 400]} vertical={isMobile}>
                        <Allotment.Pane minSize={isMobile ? 150 : 200}>
                            <Allotment defaultSizes={[200, 500]}>
                                <Allotment.Pane minSize={100} maxSize={isMobile ? 0 : 300}>
                                    <FileExplorer/>
                                </Allotment.Pane>
                                <Allotment.Pane minSize={200}>
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ flex: 1, minHeight: 0 }}>
                                            <CodeEditor/>
                                        </div>
                                        <CSSVisualEditor />
                                        <PropsEditor />
                                    </div>
                                </Allotment.Pane>
                            </Allotment>
                        </Allotment.Pane>

                        <Allotment.Pane minSize={0}>
                            <div style={{height: '100%', display: 'flex', flexDirection: 'column', position: 'relative'}}>
                                <div style={{flex: 1, minHeight: 0, position: 'relative'}}>
                                    <Preview/>
                                    <ErrorOverlay/>
                                </div>
                                <div style={{height: isMobile ? 100 : 180, minHeight: 0, borderTop: `1px solid ${isDarkMode ? '#333' : '#eee'}`}}>
                                    <ConsolePanel/>
                                </div>
                            </div>
                        </Allotment.Pane>
                    </Allotment>
                </div>
                <ShortcutsPanel />
                <FileSearch key={fileSearchKey} open={showFileSearch} onClose={() => { setShowFileSearch(false); setFileSearchKey(k => k + 1); }} isDarkMode={isDarkMode} />
            </div>
            <CollaborationPanel />
            <AIAssistant />
            <DiffViewer open={showDiff} onClose={() => setShowDiff(false)} />
            <CommandPalette />
        </CollaborationProvider>
    )
}
