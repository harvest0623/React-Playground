import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import LZString from 'lz-string'
import * as prettier from 'prettier'
import * as prettierPluginBabel from 'prettier/plugins/babel'
import * as prettierPluginEstree from 'prettier/plugins/estree'
import * as prettierPluginTypescript from 'prettier/plugins/typescript'
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

export function shareFiles(files: Files): string {
    const data = JSON.stringify(files);
    const compressed = LZString.compressToEncodedURIComponent(data);
    const url = `${window.location.origin}${window.location.pathname}#/${compressed}`;
    window.history.replaceState(null, '', `#/${compressed}`);
    return url;
}

export function restoreFilesFromUrl(): Files | null {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#/')) return null;
    try {
        const compressed = hash.slice(2);
        const data = LZString.decompressFromEncodedURIComponent(compressed);
        if (!data) return null;
        const files = JSON.parse(data) as Files;
        if (typeof files !== 'object' || files === null) return null;
        return files;
    } catch {
        return null;
    }
}

export async function formatCode(code: string, filename: string): Promise<string> {
    const parser = filename.endsWith('.json') ? 'json'
        : filename.endsWith('.css') ? 'css'
        : 'typescript';
    try {
        return await prettier.format(code, {
            parser,
            plugins: [prettierPluginBabel, prettierPluginEstree, prettierPluginTypescript],
            semi: true,
            singleQuote: true,
            tabWidth: 4,
            trailingComma: 'all',
            printWidth: 100,
        });
    } catch {
        return code;
    }
}