import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import type { Files } from './PlaygroundContext'

interface LanguageMap {
    js: 'javascript',
    tsx: 'typescript',
    ts: 'typescript',
    jsx: 'javascript',
    css: 'css',
    json: 'json',
}

export const getFileNameLanguage = (fileName: string) => {
    // index.tsx    ['index', 'tsx']
    const suffix = fileName.split('.').pop() as string;

    const languageMap: LanguageMap = {
        js: 'javascript',
        tsx: 'typescript',
        ts: 'typescript',
        jsx: 'javascript',
        css: 'css',
        json: 'json',
    };
    return languageMap[suffix as keyof LanguageMap] || 'javascript';
}

export async function downLoadFiles(files: Files) {
    const zip = new JSZip();

    // 遍历 files 对象，将每个文件添加到 zip 中
    Object.keys(files).forEach(name => {
        zip.file(name, files[name].value);
    })

    // 生成 zip 文件，类型为 blob
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `react-playground-${Date.now()}.zip`);
}