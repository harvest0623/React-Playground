import { useCallback, useContext, useMemo } from 'react'
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
    const file = files[selectedFileName];

    const onEditorChange = useCallback((value: string | undefined) => {
        // console.log('编辑器内容变化', value);
        setFiles(prevFiles => ({
            ...prevFiles,
            [selectedFileName]: {
                ...prevFiles[selectedFileName],
                value: value || '',
            }
        }));
    }, [selectedFileName, setFiles]);

    const debouncedChange = useMemo(
        () => debounce(onEditorChange, 300),
        [onEditorChange]
    );

    return (
        <div style={{display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: isDarkMode ? '#000' : '#fff'}}>
            <FileNameList/>
            <Editor file={file} onChange={debouncedChange} isDarkMode={isDarkMode}/>
        </div>
    )
}
