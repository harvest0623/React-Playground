import { useContext, useEffect, useState } from 'react'
import { compile } from './compiler.ts'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext.tsx'
import Editor from '../CodeEditor/Editor.tsx'

export default function Preview() {
    const { files } = useContext(PlaygroundContext);
    
    //  写法一
    //  const compiledCode = compile(files);

    //  写法二
    const [compiledCode, setCompiledCode] = useState<string>('');
    useEffect(() => {
        setCompiledCode(compile(files));
    }, [files]);
    return (
        <div style={{height: '100%'}}>
            <Editor 
                file={{
                    name: 'dist.js',
                    value: compiledCode,
                    language: 'typescript',
                }} 
            />
        </div>
    )
}