import { useContext } from 'react'
import FileNameList from './FileNameList'
import Editor from './Editor'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext.tsx'
import { debounce } from 'lodash-es'

export default function CodeEditor() {
    // const file = {
    //     name: 'Demo.tsx',
    //     value: `
    //         import './App.scss'
    //         import lodash from 'lodash'

    //         export default function App() {
    //             return (
    //                 <div>Hello World</div>
    //             )
    //         }
    //     `,
    //     language: 'typescript',
    // }

    const { files, selectedFileName, setFiles, isDarkMode } = useContext(PlaygroundContext);
    const file = files[selectedFileName];  // App.tsx 的文件对象

    // 编辑器内容变化时的回调
    const onEditorChange = (value: string | undefined) => {
        console.log('编辑器内容变化', value);

        // 将 value 存在文件对象中
        files[file.name].value = value || '';
        setFiles({...files});
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: isDarkMode ? '#000' : '#fff'}}>
            <FileNameList/>
            <Editor file={file} onChange={debounce(onEditorChange, 300)} isDarkMode={isDarkMode}/>
        </div>
    )
}