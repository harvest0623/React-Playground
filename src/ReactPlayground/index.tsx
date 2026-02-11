import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useContext } from 'react'
import Header from '../Components/Header'
import CodeEditor from '../Components/CodeEditor'
import Preview from '../Components/Preview'
import { PlaygroundContext } from './PlaygroundContext'

export default function ReactPlayground() {
    const { isDarkMode } = useContext(PlaygroundContext);
    
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
                <Allotment 
                    defaultSizes={[100, 100]}
                >
                    <Allotment.Pane minSize={500}>
                        <CodeEditor/>
                    </Allotment.Pane>

                    <Allotment.Pane minSize={0}>
                        <Preview/>
                    </Allotment.Pane>
                </Allotment>
            </div>
        </div>
    )
}