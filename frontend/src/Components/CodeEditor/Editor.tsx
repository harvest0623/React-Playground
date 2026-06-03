import { useContext, useEffect, useRef } from 'react'
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

const errorStyleId = 'editor-error-decorations';

function ensureErrorStyles() {
    if (document.getElementById(errorStyleId)) return;
    const style = document.createElement('style');
    style.id = errorStyleId;
    style.textContent = `
        .line-error-decoration {
            background-color: rgba(255, 0, 0, 0.08) !important;
            border-bottom: 2px wavy red;
        }
        .glyph-error {
            background: red;
            border-radius: 50%;
            width: 8px !important;
            height: 8px !important;
            margin: 4px 2px;
        }
    `;
    document.head.appendChild(style);
}

export default function Editor(props: Props) {
    const { file, onChange, options, isDarkMode } = props;
    const { editorRef, editorFontSize, compileError, errorLine } = useContext(PlaygroundContext);
    const monacoRef = useRef<typeof import('monaco-editor') | null>(null);

    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        ensureErrorStyles();

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

    useEffect(() => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (!editor || !monaco) return;

        if (compileError && errorLine) {
            const decorations = editor.createDecorationsCollection([
                {
                    range: new monaco.Range(errorLine, 1, errorLine, 1),
                    options: {
                        isWholeLine: true,
                        className: 'line-error-decoration',
                        glyphMarginClassName: 'glyph-error',
                    }
                }
            ]);
            return () => decorations.clear();
        }
    }, [compileError, errorLine, editorRef]);

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
                fontSize: editorFontSize,
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
