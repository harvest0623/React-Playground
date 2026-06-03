import { createContext, useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react'
import type { editor } from 'monaco-editor'
import type { EditorFile } from '../Components/CodeEditor/Editor.tsx'
import { getFileNameLanguage, restoreFilesFromUrl } from './utils.ts'
import { initFiles } from './files.ts'
import { saveFiles, loadFiles, clearFiles } from './storage.ts'
import { getHistory, addHistoryEntry, clearHistory, type VersionEntry } from './history.ts'

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
    clearStorage: () => void,
    lastSaved: Date | null,
    versionHistory: VersionEntry[],
    saveVersion: (description: string) => void,
    restoreVersion: (id: number) => void,
    clearVersionHistory: () => void,
    showHistory: boolean,
    setShowHistory: (v: boolean) => void,
    showAI: boolean,
    setShowAI: (v: boolean) => void,
    showCSSEditor: boolean,
    setShowCSSEditor: (v: boolean) => void,
    showPropsEditor: boolean,
    setShowPropsEditor: (v: boolean) => void,
    showDiff: boolean,
    setShowDiff: (v: boolean) => void,
    diffData: { oldFiles: Files; newFiles: Files } | null,
    setDiffData: (v: { oldFiles: Files; newFiles: Files } | null) => void,
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
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [versionHistory, setVersionHistory] = useState<VersionEntry[]>(() => getHistory());
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [showAI, setShowAI] = useState<boolean>(false);
    const [showCSSEditor, setShowCSSEditor] = useState<boolean>(false);
    const [showPropsEditor, setShowPropsEditor] = useState<boolean>(false);
    const [showDiff, setShowDiff] = useState<boolean>(false);
    const [diffData, setDiffData] = useState<{ oldFiles: Files; newFiles: Files } | null>(null);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const filesRef = useRef<Files>(files);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const historyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const clearStorage = useCallback(async () => {
        try {
            await clearFiles();
            setLastSaved(null);
            setFiles(initFiles);
        } catch (e) {
            console.error('Failed to clear storage:', e);
        }
    }, []);

    const saveVersion = useCallback((description: string) => {
        const history = addHistoryEntry(filesRef.current, description);
        setVersionHistory(history);
    }, []);

    const restoreVersion = useCallback((id: number) => {
        const entry = versionHistory.find(e => e.id === id);
        if (entry) {
            setFiles(entry.files);
        }
    }, [versionHistory]);

    const clearVersionHistory = useCallback(() => {
        clearHistory();
        setVersionHistory([]);
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

    useEffect(() => {
        loadFiles().then(savedFiles => {
            if (savedFiles) {
                setFiles(savedFiles);
            }
        }).catch(e => {
            console.error('Failed to load files:', e);
        });
    }, []);

    useEffect(() => {
        filesRef.current = files;
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = setTimeout(() => {
            saveFiles(files).then(() => {
                setLastSaved(new Date());
            }).catch(e => {
                console.error('Failed to save files:', e);
            });
        }, 500);

        if (historyTimerRef.current) {
            clearTimeout(historyTimerRef.current);
        }
        historyTimerRef.current = setTimeout(() => {
            const history = addHistoryEntry(files, 'Auto-save');
            setVersionHistory(history);
        }, 2000);

        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
            if (historyTimerRef.current) {
                clearTimeout(historyTimerRef.current);
            }
        };
    }, [files]);

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
                clearStorage,
                lastSaved,
                versionHistory,
                saveVersion,
                restoreVersion,
                clearVersionHistory,
                showHistory,
                setShowHistory,
                showAI,
                setShowAI,
                showCSSEditor,
                setShowCSSEditor,
                showPropsEditor,
                setShowPropsEditor,
                showDiff,
                setShowDiff,
                diffData,
                setDiffData,
            }}
        >
            {children}
        </PlaygroundContext.Provider>
    )
}
