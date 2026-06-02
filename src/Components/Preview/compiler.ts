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

function revokeStaleBlobUrls(activeUrls: Set<string>) {
    blobUrls.forEach(url => {
        if (!activeUrls.has(url)) {
            URL.revokeObjectURL(url);
        }
    });
    blobUrls.clear();
    activeUrls.forEach(url => blobUrls.add(url));
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

function cleanCacheForFile(filename: string) {
    compileCache.delete(filename);
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
        cleanCacheForFile(filename);
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
    const activeUrls = new Set<string>();

    const main = files[ENTRY_FILE_NAME];
    if (!main) {
        revokeStaleBlobUrls(activeUrls);
        return { code: '', error: `Entry file "${ENTRY_FILE_NAME}" not found`, errorLine: null };
    }

    const result = babelTransform(ENTRY_FILE_NAME, main.value, files);

    compileCache.forEach((entry) => {
        activeUrls.add(entry.blobUrl);
    });

    revokeStaleBlobUrls(activeUrls);

    return result;
}

function getModuleFile(files: Files, modulepath: string) {
    const candidates = Object.keys(files);

    for (const key of candidates) {
        const noExt = key.replace(/\.(tsx?|jsx?)$/, '');
        if (noExt === modulepath || key === modulepath) {
            return files[key];
        }
    }

    const lastSegment = modulepath.split('/').pop() || modulepath;

    if (lastSegment.includes('.')) {
        const found = candidates.find(key => key === lastSegment);
        if (found) return files[found];
    }

    const extensions = ['.tsx', '.ts', '.jsx', '.js'];
    for (const ext of extensions) {
        const withExt = lastSegment + ext;
        const found = candidates.find(key => key === withExt);
        if (found) return files[found];
    }

    const indexExtensions = ['/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
    for (const idx of indexExtensions) {
        const indexCandidate = lastSegment + idx;
        const found = candidates.find(key => key === indexCandidate);
        if (found) return files[found];
    }

    if (lastSegment.includes('.')) {
        const found = candidates.find(key => key.split('.').includes(lastSegment));
        if (found) return files[found];
    }

    return undefined;
}

const JsonToJS = (file: EditorFile) => {
    const js = `export default ${file.value}`;
    return createBlobUrl(js);
}

function escapeForTemplateLiteral(str: string): string {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');
}

const CssToJS = (file: EditorFile) => {
    const safeId = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const escapedCss = escapeForTemplateLiteral(file.value);
    const js = `
    (() => {
        const id = 'style_${safeId}';
        const existing = document.getElementById(id);
        if (existing) existing.remove();
        const stylesheet = document.createElement('style');
        stylesheet.setAttribute('id', id);
        document.head.appendChild(stylesheet);
        const styles = document.createTextNode(\`${escapedCss}\`);
        stylesheet.appendChild(styles);
    })()
    `;
    return createBlobUrl(js);
}
