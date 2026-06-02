import { createContext, useCallback, useRef, useState, type PropsWithChildren } from 'react'
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
    addFile: (fileName: string) => void,
    isDarkMode: boolean,
    toggleTheme: () => void,
    compileError: string | null,
    setCompileError: (error: string | null) => void,
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
    const [runtimeError, setRuntimeError] = useState<string | null>(null);
    const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    const [logId, setLogId] = useState(0);
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

    const addFile = (name: string) => {
        setFiles((prevFiles) => ({
            ...prevFiles,
            [name]: {
                name,
                value: '',
                language: getFileNameLanguage(name)
            },
        }))
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
        setLogId(prev => prev + 1);
        setConsoleLogs(prev => {
            const newLog = { ...log, id: logId + 1 };
            const next = [...prev, newLog];
            return next.length > 200 ? next.slice(-200) : next;
        });
    }, [logId]);

    const clearConsoleLogs = useCallback(() => {
        setConsoleLogs([]);
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
            }}
        >
            {children}
        </PlaygroundContext.Provider>
    )
}
