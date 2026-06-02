import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useContext } from 'react'
import Header from '../Components/Header'
import FileExplorer from '../Components/FileExplorer'
import CodeEditor from '../Components/CodeEditor'
import Preview from '../Components/Preview'
import ErrorOverlay from '../Components/ErrorOverlay'
import ConsolePanel from '../Components/ConsolePanel'
import { PlaygroundContext } from './PlaygroundContext'

export default function ReactPlayground() {
    const { isDarkMode, isFullScreen } = useContext(PlaygroundContext);

    if (isFullScreen) {
        return (
            <div style={{
                height: '100vh',
                backgroundColor: isDarkMode ? '#000' : '#fff',
                color: isDarkMode ? '#fff' : '#000'
            }}>
                <Preview />
            </div>
        );
    }

    return (
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
                <Allotment defaultSizes={[400, 400]}>
                    <Allotment.Pane minSize={200}>
                        <Allotment defaultSizes={[200, 500]}>
                            <Allotment.Pane minSize={100} maxSize={300}>
                                <FileExplorer/>
                            </Allotment.Pane>
                            <Allotment.Pane minSize={200}>
                                <CodeEditor/>
                            </Allotment.Pane>
                        </Allotment>
                    </Allotment.Pane>

                    <Allotment.Pane minSize={0}>
                        <div style={{height: '100%', display: 'flex', flexDirection: 'column', position: 'relative'}}>
                            <div style={{flex: 1, minHeight: 0, position: 'relative'}}>
                                <Preview/>
                                <ErrorOverlay/>
                            </div>
                            <div style={{height: 180, minHeight: 0, borderTop: `1px solid ${isDarkMode ? '#333' : '#eee'}`}}>
                                <ConsolePanel/>
                            </div>
                        </div>
                    </Allotment.Pane>
                </Allotment>
            </div>
        </div>
    )
}
