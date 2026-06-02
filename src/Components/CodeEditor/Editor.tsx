import { useContext } from 'react'
import MonacoEditor from '@monaco-editor/react'
import type { EditorProps, OnMount } from '@monaco-editor/react'
import { createATA } from './Editor/ata.ts'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'

export interface EditorFile {
    name: string
    value: string
    language: string
}

interface Props {
    file: EditorFile
    onChange?: EditorProps['onChange'],
    options?: EditorProps['options'],
    isDarkMode?: boolean
}

export default function Editor(props: Props) {
    const { file, onChange, options, isDarkMode } = props;
    const { editorRef } = useContext(PlaygroundContext);

    // const code = `
    //     import './App.scss'
    //     import lodash from 'lodash'

    //     export default function App() {
    //         return (
    //             <div>Hello World</div>
    //         )
    //     }
    // `

    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_M, () => {
            editor.getAction('editor.action.formatDocument')?.run();
        })

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            jsx: monaco.languages.typescript.JsxEmit.Preserve,
            esModuleInterop: true
        })

        const ata = createATA((code, path) => {
            monaco.languages.typescript.typescriptDefaults.addExtraLib(code, `file://${path}`);
        })

        editor.onDidChangeModelContent(() => {
            ata(editor.getValue());
        })
        ata(editor.getValue());
    }

    return (
        <MonacoEditor
            height="100%"
            theme={isDarkMode ? "vs-dark" : "vs"}
            language={file.language}
            path={file.name}
            value={file.value}
            onMount={handleEditorMount}
            onChange={onChange}
            options={{
                minimap: {
                    enabled: false,
                },
                fontSize: 14,
                scrollBeyondLastLine: false,
                scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                },
                ...options,
            }}
        />
    )
}
