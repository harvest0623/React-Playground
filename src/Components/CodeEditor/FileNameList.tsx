import { useContext, useEffect, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext.tsx'
import FileNameItem from './FileNameItem.tsx'
import styles from './index.module.scss'
import { ENTRY_FILE_NAME, IMPORT_MAP_FILE_NAME } from '../../ReactPlayground/files.ts'

export default function FileNameList() {
    const { files, selectedFileName, setSelectedFileName, addFile, removeFile, updateFileName, isDarkMode } = useContext(PlaygroundContext);
    const [tabs, setTabs] = useState<string[]>([]);
    
    useEffect(() => {
        setTabs(Object.keys(files));
    }, [files]);

    const handleEditComplete = (oldFileName: string, newFileName: string) => {
        updateFileName(oldFileName, newFileName);
        setSelectedFileName(newFileName);
    }

    const addTab = () => {
        const newname = `Component${tabs.length + 1}.tsx`;
        addFile(newname);
        setSelectedFileName(newname);
    }

    // 不让删除的文件
    const readOnlyTabs = [ENTRY_FILE_NAME, IMPORT_MAP_FILE_NAME];

    return (
        <div className={`${styles['tabs-container']} ${isDarkMode ? styles['dark'] : ''}`}>
            <div className={styles['tabs']}>
                {tabs.map((tab, index, arr) => (
                    <FileNameItem
                        key={tab}
                        value={tab}
                        actived={tab === selectedFileName}
                        onClick={() => setSelectedFileName(tab)}
                        onEditComplete={(name: string) => handleEditComplete(tab, name)}
                        creating={index === arr.length - 1}
                        onRemove={(e: React.MouseEvent, name: string) => {
                            e.stopPropagation()
                            const idx = tabs.indexOf(name)
                            const next = tabs[idx + 1] || tabs[idx - 1] || tabs[0]
                            removeFile(name)
                            if (name === selectedFileName && next) {
                                setSelectedFileName(next)
                            }
                        }}
                        readOnly={readOnlyTabs.includes(tab)}
                        isDarkMode={isDarkMode}
                    />

                    // <div key={tab} onClick={() => setSelectedFileName(tab)}>{tab}</div>
                ))}
            </div>
            <div className={styles['tabs-actions']}>
                <div className={styles['add']} onClick={addTab}>+</div>
            </div>
        </div>
    )
}