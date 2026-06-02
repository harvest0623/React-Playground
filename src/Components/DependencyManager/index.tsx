import { useContext, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'
import { IMPORT_MAP_FILE_NAME } from '../../ReactPlayground/files'

interface Props {
    open: boolean;
    onClose: () => void;
}

const POPULAR_PACKAGES = [
    { name: 'lodash', desc: 'Utility library' },
    { name: 'axios', desc: 'HTTP client' },
    { name: 'dayjs', desc: 'Date library' },
    { name: 'classnames', desc: 'CSS class names' },
    { name: 'uuid', desc: 'UUID generator' },
    { name: 'zustand', desc: 'State management' },
    { name: 'jotai', desc: 'Atomic state' },
    { name: 'framer-motion', desc: 'Animation library' },
];

export default function DependencyManager({ open, onClose }: Props) {
    const { files, setFiles, isDarkMode } = useContext(PlaygroundContext);
    const [packageName, setPackageName] = useState('');
    const [version, setVersion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPopular, setShowPopular] = useState(true);

    if (!open) return null;

    const currentMap = (() => {
        try {
            return JSON.parse(files[IMPORT_MAP_FILE_NAME]?.value || '{"imports":{}}');
        } catch {
            return { imports: {} };
        }
    })();

    const dependencies = Object.entries(currentMap.imports || {}) as [string, string][];

    const updateImportMap = (newImports: Record<string, string>) => {
        const updatedMap = { imports: newImports };
        setFiles(prev => ({
            ...prev,
            [IMPORT_MAP_FILE_NAME]: {
                ...prev[IMPORT_MAP_FILE_NAME],
                value: JSON.stringify(updatedMap, null, 4),
            }
        }));
    };

    const handleAdd = async (name?: string, versionInput?: string) => {
        const pkgName = (name || packageName).trim();
        const pkgVersion = (versionInput || version).trim();
        if (!pkgName) return;

        setLoading(true);
        setError('');

        try {
            const url = pkgVersion
                ? `https://esm.sh/${pkgName}@${pkgVersion}`
                : `https://esm.sh/${pkgName}`;

            const res = await fetch(url, { method: 'HEAD' });
            if (!res.ok) throw new Error(`Package "${pkgName}" not found or version "${pkgVersion}" is invalid`);

            const newImports = { ...currentMap.imports };

            if (pkgVersion) {
                newImports[pkgName] = `https://esm.sh/${pkgName}@${pkgVersion}`;
            } else {
                newImports[pkgName] = `https://esm.sh/${pkgName}`;
                try {
                    const pkgRes = await fetch(`https://esm.sh/${pkgName}/package.json`);
                    if (pkgRes.ok) {
                        const pkg = await pkgRes.json();
                        if (pkg.version) {
                            newImports[pkgName] = `https://esm.sh/${pkgName}@${pkg.version}`;
                        }
                    }
                } catch { /* version resolution failed */ }
            }

            updateImportMap(newImports);
            setPackageName('');
            setVersion('');
            setShowPopular(false);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to add package');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = (name: string) => {
        const newImports = { ...currentMap.imports };
        delete newImports[name];
        updateImportMap(newImports);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAdd();
        if (e.key === 'Escape') onClose();
    };

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
                    color: isDarkMode ? '#ccc' : '#333',
                    borderRadius: 8, padding: 24, width: 460, maxHeight: '75vh',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>
                    Dependencies
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                        value={packageName}
                        onChange={e => { setPackageName(e.target.value); setError(''); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Package name (e.g. lodash)"
                        style={{
                            flex: 1, padding: '8px 12px', border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                            borderRadius: 4, backgroundColor: isDarkMode ? '#2d2d2d' : '#fff',
                            color: isDarkMode ? '#ccc' : '#333', fontSize: 14, outline: 'none',
                        }}
                    />
                    <input
                        value={version}
                        onChange={e => setVersion(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Version (optional)"
                        style={{
                            width: 100, padding: '8px 10px', border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                            borderRadius: 4, backgroundColor: isDarkMode ? '#2d2d2d' : '#fff',
                            color: isDarkMode ? '#ccc' : '#333', fontSize: 14, outline: 'none',
                        }}
                    />
                    <button
                        onClick={() => handleAdd()}
                        disabled={loading || !packageName.trim()}
                        style={{
                            padding: '8px 16px', border: 'none', borderRadius: 4,
                            backgroundColor: loading || !packageName.trim() ? '#666' : '#1677ff',
                            color: '#fff', cursor: loading ? 'wait' : 'pointer',
                            fontSize: 14, fontWeight: 'bold',
                        }}
                    >
                        {loading ? '...' : 'Add'}
                    </button>
                </div>

                {error && (
                    <div style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 8 }}>{error}</div>
                )}

                <div style={{ flex: 1, overflow: 'auto', borderTop: `1px solid ${isDarkMode ? '#333' : '#eee'}` }}>
                    {dependencies.length > 0 && (
                        <div style={{ padding: '8px 0' }}>
                            <div style={{ fontSize: 11, color: isDarkMode ? '#666' : '#999', padding: '0 0 4px', fontWeight: 'bold' }}>
                                INSTALLED ({dependencies.length})
                            </div>
                            {dependencies.map(([name, url]) => (
                                <div key={name} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '6px 0', borderBottom: `1px solid ${isDarkMode ? '#2a2a2a' : '#f5f5f5'}`,
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: 13 }}>{name}</div>
                                        <div style={{ fontSize: 11, color: isDarkMode ? '#666' : '#999' }}>{url}</div>
                                    </div>
                                    <span
                                        onClick={() => handleRemove(name)}
                                        style={{ cursor: 'pointer', color: '#ff6b6b', fontSize: 18, padding: '0 4px' }}
                                    >
                                        x
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {showPopular && (
                        <div style={{ padding: '8px 0' }}>
                            <div style={{ fontSize: 11, color: isDarkMode ? '#666' : '#999', padding: '0 0 4px', fontWeight: 'bold' }}>
                                POPULAR PACKAGES
                            </div>
                            {POPULAR_PACKAGES.filter(p => !currentMap.imports?.[p.name]).map(pkg => (
                                <div
                                    key={pkg.name}
                                    onClick={() => { setPackageName(pkg.name); setShowPopular(false); }}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '6px 8px', borderRadius: 4, cursor: 'pointer',
                                        border: `1px solid transparent`,
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLDivElement).style.borderColor = isDarkMode ? '#444' : '#ddd';
                                        (e.currentTarget as HTMLDivElement).style.backgroundColor = isDarkMode ? '#2a2a2a' : '#f9f9f9';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
                                        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 'bold' }}>{pkg.name}</div>
                                        <div style={{ fontSize: 11, color: isDarkMode ? '#666' : '#999' }}>{pkg.desc}</div>
                                    </div>
                                    <span style={{ fontSize: 11, color: isDarkMode ? '#888' : '#bbb' }}>+</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 16, textAlign: 'right' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '6px 16px', border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                            borderRadius: 4, backgroundColor: 'transparent',
                            color: isDarkMode ? '#ccc' : '#333', cursor: 'pointer', fontSize: 13,
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
