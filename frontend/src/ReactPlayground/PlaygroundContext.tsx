import { createContext, useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react'
import type { editor } from 'monaco-editor'
import type { EditorFile } from '../Components/CodeEditor/Editor.tsx'
import { getFileNameLanguage, restoreFilesFromUrl } from './utils.ts'
import { initFiles } from './files.ts'

export interface Files {
    [key: string]: EditorFile
}

export interface ConsoleLog {
    id: number;
    method: string;
    args: string[];
}

export interface PlaygroundContext {
    selectedFileName: string,
    files: Files,
    setSelectedFileName: (fileName: string) => void,
    setFiles: React.Dispatch<React.SetStateAction<Files>>,
    removeFile: (fileName: string) => void,
    updateFileName: (oldFileName: string, newFileName: string) => void,
    addFile: (fileName: string, value?: string) => void,
    isDarkMode: boolean,
    toggleTheme: () => void,
    compileError: string | null,
    setCompileError: (error: string | null) => void,
    errorLine: number | null,
    setErrorLine: (line: number | null) => void,
    runtimeError: string | null,
    setRuntimeError: (error: string | null) => void,
    consoleLogs: ConsoleLog[],
    addConsoleLog: (log: Omit<ConsoleLog, 'id'>) => void,
    clearConsoleLogs: () => void,
    isFullScreen: boolean,
    setIsFullScreen: (v: boolean) => void,
    editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>,
    undo: () => void,
    redo: () => void,
    previewTheme: 'light' | 'dark' | 'blue',
    setPreviewTheme: (theme: 'light' | 'dark' | 'blue') => void,
    editorFontSize: number,
    setEditorFontSize: (size: number) => void,
    showShortcuts: boolean,
    setShowShortcuts: (v: boolean) => void,
    showFileSearch: boolean,
    setShowFileSearch: (v: boolean) => void,
    collaborationMode: boolean,
    setCollaborationMode: (v: boolean) => void,
}

// files = {
//     'App.tsx': {
//         name: 'App.tsx',
//         value: '',
//         language: 'typescriptreact',
//     },
//     'index.tsx': {
//         name: 'index.tsx',
//         value: '',
//         language: 'typescriptreact',
//     },
// }

// eslint-disable-next-line react-refresh/only-export-components
export const PlaygroundContext = createContext<PlaygroundContext>(null as unknown as PlaygroundContext)

export const PlaygroundProvider = (props: PropsWithChildren) => {
    const { children } = props;
    const [files, setFiles] = useState<Files>(() => restoreFilesFromUrl() || initFiles);
    const [selectedFileName, setSelectedFileName] = useState<string>('App.tsx');
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [compileError, setCompileError] = useState<string | null>(null);
    const [errorLine, setErrorLine] = useState<number | null>(null);
    const [runtimeError, setRuntimeError] = useState<string | null>(null);
    const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    const [previewTheme, setPreviewTheme] = useState<'light' | 'dark' | 'blue'>('light');
    const [editorFontSize, setEditorFontSize] = useState<number>(14);
    const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
    const [showFileSearch, setShowFileSearch] = useState<boolean>(false);
    const [collaborationMode, setCollaborationMode] = useState<boolean>(false);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    const undo = useCallback(() => {
        editorRef.current?.trigger('keyboard', 'undo', null);
    }, []);

    const redo = useCallback(() => {
        editorRef.current?.trigger('keyboard', 'redo', null);
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    const addFile = (name: string, value: string = '') => {
        setFiles((prevFiles) => {
            if (prevFiles[name]) {
                alert(`File "${name}" already exists`);
                return prevFiles;
            }
            return {
                ...prevFiles,
                [name]: {
                    name,
                    value,
                    language: getFileNameLanguage(name)
                },
            };
        })
    }

    // const removeFile = (name: string) => {
    //   delete files[name]
    //   setFiles({...files})
    // }

    const removeFile = (name: string) => {
        if (confirm(`Do you really want to delete ${name}?`)) {
            setFiles((prevFiles) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { [name]: removed, ...restFiles } = prevFiles;
                return restFiles;
            })
        }
    }

    const updateFileName = (oldFileName: string, newFileName: string) => {
        if (!files[oldFileName] || !newFileName || oldFileName === newFileName) {
            return;
        }

        setFiles((prevFiles) => {
            const { [oldFileName]: oldFile, ...restFiles } = prevFiles;
            return {
                ...restFiles,
                [newFileName]: {
                    ...oldFile,
                    name: newFileName,
                    language: getFileNameLanguage(newFileName),
                },
            }
        })
    }

    const addConsoleLog = useCallback((log: Omit<ConsoleLog, 'id'>) => {
        setConsoleLogs(prev => {
            const newLog = { ...log, id: Date.now() };
            const next = [...prev, newLog];
            return next.length > 200 ? next.slice(-200) : next;
        });
    }, []);

    const clearConsoleLogs = useCallback(() => {
        setConsoleLogs([]);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === '?') {
                e.preventDefault();
                setShowShortcuts(prev => !prev);
            }
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                setShowFileSearch(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <PlaygroundContext.Provider
            value={{
                selectedFileName,
                files,
                setSelectedFileName,
                setFiles,
                addFile,
                removeFile,
                updateFileName,
                isDarkMode,
                toggleTheme,
                compileError,
                setCompileError,
                errorLine,
                setErrorLine,
                runtimeError,
                setRuntimeError,
                consoleLogs,
                addConsoleLog,
                clearConsoleLogs,
                isFullScreen,
                setIsFullScreen,
                editorRef,
                undo,
                redo,
                previewTheme,
                setPreviewTheme,
                editorFontSize,
                setEditorFontSize,
                showShortcuts,
                setShowShortcuts,
                showFileSearch,
                setShowFileSearch,
                collaborationMode,
                setCollaborationMode,
            }}
        >
            {children}
        </PlaygroundContext.Provider>
    )
}
