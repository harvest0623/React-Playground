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
