import { useContext, useEffect, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext.tsx'

export default function FileNameList() {
    const { files, selectedFileName, setSelectedFileName, addFile, removeFile, updateFileName } = useContext(PlaygroundContext);
    const [tabs, setTabs] = useState<string[]>([]);
    
    useEffect(() => {
        setTabs(Object.keys(files));
    }, [files]);

    return (
        <div>
            {tabs.map((tab) => (
                <div key={tab} onClick={() => setSelectedFileName(tab)}>{tab}</div>
            ))}
        </div>
    )
}