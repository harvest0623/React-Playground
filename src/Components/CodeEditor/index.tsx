import React from 'react'
import FileNameList from './FileNameList'
import Editor from './Editor'

export default function CodeEditor() {
    const file = {
        name: 'Demo.tsx',
        value: `
            import './App.scss'
            import lodash from 'lodash'

            export default function App() {
                return (
                    <div>Hello World</div>
                )
            }
        `,
        language: 'typescript',
    }

    // 编辑器内容变化时的回调
    const onEditorChange = (value: string | undefined) => {
        console.log('编辑器内容变化', value);
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
            <FileNameList/>
            <Editor file={file} onChange={onEditorChange}/>
        </div>
    )
}