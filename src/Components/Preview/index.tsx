import { useContext, useEffect, useState } from 'react'
import { compile } from './compiler.ts'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext.tsx'
import Editor from '../CodeEditor/Editor.tsx'
import iframeRaw from './iframe.html?raw'
import { IMPORT_MAP_FILE_NAME } from '../../ReactPlayground/files.ts'

export default function Preview() {
    const { files, isDarkMode } = useContext(PlaygroundContext);
    const [iframeUrl, setIframeUrl] = useState<string>('');
    
    //  写法一
    //  const compiledCode = compile(files);

    //  写法二
    const [compiledCode, setCompiledCode] = useState<string>('');
    useEffect(() => {
        setCompiledCode(compile(files));
    }, [files]);

    const getIframeUrl = () => {
        const res = iframeRaw.replace (
            '<script type="importmap"></script>',
            `<script type="importmap">${files[IMPORT_MAP_FILE_NAME].value}</script>`,
        ).replace(
            '<script type="module" id="appSrc"></script>',
            `<script type="module" id="appSrc">${compiledCode}</script>`,
        )
        return URL.createObjectURL(new Blob([res], { type: 'text/html' }));
    }

    useEffect(() => {
        setIframeUrl(getIframeUrl());
    }, [files[IMPORT_MAP_FILE_NAME].value, compiledCode]);

    return (
        <div style={{height: '100%', backgroundColor: isDarkMode ? '#fff' : '#000'}}>
            <iframe src={iframeUrl} style={{height: '100%', width: '100%', border: 'none', padding: 0}} />
            {/* <Editor 
                file={{
                    name: 'dist.js',
                    value: compiledCode,
                    language: 'typescript',
                }} 
            /> */}
        </div>
    )
}