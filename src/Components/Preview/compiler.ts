import type { Files } from '../../ReactPlayground/PlaygroundContext.tsx'
import { ENTRY_FILE_NAME } from '../../ReactPlayground/files'
import { transform } from '@babel/standalone'
import type { PluginObj } from '@babel/core';
import type { EditorFile } from "../CodeEditor/Editor";

export interface CompileResult {
    code: string;
    error: string | null;
    errorLine: number | null;
}

const blobUrls = new Set<string>();

function revokeOldBlobUrls() {
    blobUrls.forEach(url => URL.revokeObjectURL(url));
    blobUrls.clear();
}

function createBlobUrl(code: string): string {
    const url = URL.createObjectURL(new Blob([code], { type: 'application/javascript' }));
    blobUrls.add(url);
    return url;
}

function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash;
}

interface CacheEntry {
    hash: number;
    blobUrl: string;
}

const compileCache = new Map<string, CacheEntry>();

function getCachedBlobUrl(filename: string, code: string): string | null {
    const hash = simpleHash(code);
    const cached = compileCache.get(filename);
    if (cached && cached.hash === hash) {
        return cached.blobUrl;
    }
    return null;
}

function setCache(filename: string, code: string, blobUrl: string) {
    const hash = simpleHash(code);
    compileCache.set(filename, { hash, blobUrl });
}

function clearCache() {
    compileCache.clear();
}

function ensureReactImport(filename: string, code: string): string {
    const regexReact = /import\s+React/g;
    if ((filename.endsWith('.tsx') || filename.endsWith('.jsx')) && !regexReact.test(code)) {
        return `import React from 'react';\n${code}`;
    }
    return code;
}

function customResolver(files: Files): PluginObj {
    return {
        visitor: {
            ImportDeclaration(path) {
                // path.node.source.value = '666';
                const modulepath = path.node.source.value;
                if(modulepath.startsWith('.')) {  // 都是我们自己写的模块
                    const file = getModuleFile(files, modulepath);
                    if(!file) {
                        return;
                    }
                    if(file.name.endsWith('.css')) {
                        path.node.source.value = CssToJS(file);
                    } else if (file.name.endsWith('.json')) {
                        path.node.source.value = JsonToJS(file);
                    } else {
                        const compiled = babelTransform(file.name, file.value, files);
                        path.node.source.value = compiled.code;
                    }
                }
            }
        }
    }
}

export const babelTransform = (filename: string, code: string, files: Files): CompileResult => {
    const cachedUrl = getCachedBlobUrl(filename, code);
    if (cachedUrl) {
        return { code: cachedUrl, error: null, errorLine: null };
    }

    const _code = ensureReactImport(filename, code);
    try {
        const result = transform(_code, {
            presets: ['react', 'typescript'],
            filename,
            plugins: [customResolver(files)],
            retainLines: true,
        });
        const blobUrl = createBlobUrl(result.code!);
        setCache(filename, code, blobUrl);
        return { code: blobUrl, error: null, errorLine: null };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const lineMatch = message.match(/(\d+):(\d+)/);
        return {
            code: '',
            error: message,
            errorLine: lineMatch ? parseInt(lineMatch[1]) : null,
        };
    }
}

export const compile = (files: Files): CompileResult => {
    revokeOldBlobUrls();
    clearCache();
    const main = files[ENTRY_FILE_NAME];
    if (!main) {
        return { code: '', error: `Entry file "${ENTRY_FILE_NAME}" not found`, errorLine: null };
    }
    return babelTransform(ENTRY_FILE_NAME, main.value, files);
}

function getModuleFile(files: Files, modulepath: string) {
    let moduleName = modulepath.split('./').pop() || '';
    if (moduleName.includes('.')) {
        const realModuleName = Object.keys(files).filter(key => {
            return key.endsWith('.ts') || key.endsWith('.tsx') || key.endsWith('.js') || key.endsWith('.jsx');
        }).find(key => {
            return key.split('.').includes(moduleName);
        })
        if (realModuleName) {
            moduleName = realModuleName;
        }
    }
    return files[moduleName];
}

const JsonToJS = (file: EditorFile) => {
    const js = `export default ${file.value}`;
    return createBlobUrl(js);
}

const CssToJS = (file: EditorFile) => {
    const safeId = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const js = `
    (() => {
        const id = 'style_${safeId}';
        const existing = document.getElementById(id);
        if (existing) existing.remove();
        const stylesheet = document.createElement('style');
        stylesheet.setAttribute('id', id);
        document.head.appendChild(stylesheet);
        const styles = document.createTextNode(\`${file.value}\`);
        stylesheet.appendChild(styles);
    })()
    `;
    return createBlobUrl(js);
}
