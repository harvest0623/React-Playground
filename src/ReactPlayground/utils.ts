import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import LZString from 'lz-string'
import * as prettier from 'prettier'
import * as prettierPluginBabel from 'prettier/plugins/babel'
import * as prettierPluginEstree from 'prettier/plugins/estree'
import * as prettierPluginTypescript from 'prettier/plugins/typescript'
import { transform } from '@babel/standalone'
import type { PluginObj } from '@babel/core'
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

function esModuleToCommonJsPlugin(): PluginObj {
    return {
        visitor: {
            ImportDeclaration(path) {
                const src = path.node.source.value;
                const specs = path.node.specifiers;

                if (specs.length === 0) {
                    path.replaceWith(`require(${JSON.stringify(src)});` as unknown as Parameters<typeof path.replaceWith>[0]);
                    return;
                }

                const decls: string[] = [];

                for (const spec of specs) {
                    if (spec.type === 'ImportDefaultSpecifier') {
                        decls.push(`const ${spec.local.name} = require(${JSON.stringify(src)}).default;`);
                    } else if (spec.type === 'ImportNamespaceSpecifier') {
                        decls.push(`const ${spec.local.name} = require(${JSON.stringify(src)});`);
                    } else if (spec.type === 'ImportSpecifier') {
                        const importedName = spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value;
                        const localName = spec.local.name;
                        if (importedName === localName) {
                            decls.push(`const { ${importedName} } = require(${JSON.stringify(src)});`);
                        } else {
                            decls.push(`const { ${importedName}: ${localName} } = require(${JSON.stringify(src)});`);
                        }
                    }
                }

                if (decls.length > 0) {
                    path.replaceWith(decls.join('\n') as unknown as Parameters<typeof path.replaceWith>[0]);
                }
            },

            ExportDefaultDeclaration(path) {
                const decl = path.node.declaration;
                let code: string;
                if (decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration') {
                    const name = decl.id ? decl.id.name : '_default';
                    code = `exports.default = ${name};`;
                } else if (decl.type === 'Identifier') {
                    code = `exports.default = ${decl.name};`;
                } else {
                    code = `var _default = undefined;\nexports.default = _default;`;
                }
                path.replaceWith(code as unknown as Parameters<typeof path.replaceWith>[0]);
            },

            ExportNamedDeclaration(path) {
                const { declaration, specifiers, source } = path.node;

                if (declaration) {
                    if (declaration.type === 'VariableDeclaration') {
                        const assigns: string[] = [];
                        for (const d of declaration.declarations) {
                            if (d.id.type === 'Identifier') {
                                assigns.push(`exports.${d.id.name} = ${d.id.name};`);
                            }
                        }
                        path.replaceWith(assigns.join('\n') as unknown as Parameters<typeof path.replaceWith>[0]);
                    } else if ((declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') && declaration.id) {
                        path.replaceWith(`exports.${declaration.id.name} = ${declaration.id.name};` as unknown as Parameters<typeof path.replaceWith>[0]);
                    }
                } else {
                    const stmts: string[] = [];
                    for (const spec of specifiers || []) {
                        if (spec.type !== 'ExportSpecifier') continue;
                        const exported = spec.exported.type === 'Identifier' ? spec.exported.name : spec.exported.value;
                        const local = spec.local.name;

                        if (source) {
                            stmts.push(`exports.${exported} = require(${JSON.stringify(source.value)}).${local};`);
                        } else {
                            stmts.push(`exports.${exported} = ${local};`);
                        }
                    }
                    path.replaceWith(stmts.join('\n') as unknown as Parameters<typeof path.replaceWith>[0]);
                }
            }
        }
    };
}

function resolveModulePath(from: string, modulePath: string, fileNames: string[]): string | undefined {
    const dir = from.includes('/') ? from.substring(0, from.lastIndexOf('/')) : '';

    const candidates: string[] = [];

    if (modulePath.startsWith('.')) {
        const resolved = dir ? `${dir}/${modulePath}` : modulePath;
        candidates.push(resolved);
        for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
            candidates.push(resolved + ext);
        }
    } else {
        candidates.push(modulePath);
        for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
            candidates.push(modulePath + ext);
        }
    }

    for (const c of candidates) {
        const normalized = c.replace(/^\.\//, '');
        if (fileNames.includes(normalized)) return normalized;
    }

    return undefined;
}

export function exportAsHtml(files: Files): void {
    const importMapStr = files['import-map.json']?.value || '{"imports":{"react":"https://esm.sh/react@18.2.0","react-dom/client":"https://esm.sh/react-dom@18.2.0"}}';
    const fileNames = Object.keys(files);

    const cssContent = Object.values(files)
        .filter(f => f.name.endsWith('.css'))
        .map(f => f.value)
        .join('\n');

    const jsFiles = Object.values(files).filter(f =>
        !f.name.endsWith('.css') && !f.name.endsWith('.json') && f.name !== 'import-map.json'
    );

    const compiledModules: Record<string, string> = {};

    for (const file of jsFiles) {
        try {
            const result = transform(file.value, {
                presets: ['react', 'typescript'],
                filename: file.name,
                plugins: [esModuleToCommonJsPlugin()],
            });
            compiledModules[file.name] = result.code!;
        } catch {
            compiledModules[file.name] = `console.error(${JSON.stringify('Failed to compile: ' + file.name)});`;
        }
    }

    const rewrittenModules: Record<string, string> = {};

    for (const [name, code] of Object.entries(compiledModules)) {
        let rewritten = code;

        rewritten = rewritten.replace(
            /require\((["'])(\.[^"']+)\1\)/g,
            (match, _quote: string, modulePath: string) => {
                const resolved = resolveModulePath(name, modulePath, fileNames);
                if (resolved && !resolved.endsWith('.css')) {
                    return `require(${JSON.stringify(resolved)})`;
                }
                if (resolved && resolved.endsWith('.css')) {
                    return '{}';
                }
                return match;
            }
        );

        rewrittenModules[name] = rewritten;
    }

    let bundleScript = '';

    bundleScript += `var __modules = {};\n`;
    bundleScript += `var __cache = {};\n`;

    for (const [name, code] of Object.entries(rewrittenModules)) {
        bundleScript += `__modules[${JSON.stringify(name)}] = function(module, exports) {\n${code}\n};\n`;
    }

    bundleScript += `function require(id) {\n`;
    bundleScript += `  if (__cache[id]) return __cache[id].exports;\n`;
    bundleScript += `  var mod = { exports: {} };\n`;
    bundleScript += `  __cache[id] = mod;\n`;
    bundleScript += `  if (__modules[id]) __modules[id](mod, mod.exports);\n`;
    bundleScript += `  return mod.exports;\n`;
    bundleScript += `}\n`;

    bundleScript += `require(${JSON.stringify('main.tsx')});\n`;

    const cssInjection = cssContent
        ? `(function(){var s=document.createElement('style');s.textContent=${JSON.stringify(cssContent)};document.head.appendChild(s);})();\n`
        : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script type="importmap">${importMapStr}</script>
</head>
<body>
<div id="root"></div>
<script>
${cssInjection}${bundleScript}</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `react-playground-export-${Date.now()}.html`);
}
