import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'
import { useLanguage } from '../../i18n/LanguageContext'

const METHOD_COLORS: Record<string, string> = {
    log: '#ccc',
    info: '#4fc3f7',
    warn: '#ffd54f',
    error: '#ff6b6b',
};

const METHOD_LABELS: Record<string, string> = {
    log: 'LOG',
    info: 'INFO',
    warn: 'WARN',
    error: 'ERR',
};

type FilterType = 'all' | 'log' | 'info' | 'warn' | 'error';

export default function ConsolePanel() {
    const { consoleLogs, clearConsoleLogs, isDarkMode } = useContext(PlaygroundContext);
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const [filter, setFilter] = useState<FilterType>('all');
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [consoleLogs]);

    const filteredLogs = filter === 'all'
        ? consoleLogs
        : consoleLogs.filter(log => log.method === filter);

    const logCounts = consoleLogs.reduce((acc, log) => {
        acc[log.method] = (acc[log.method] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const handleCopyAll = useCallback(() => {
        const text = filteredLogs.map(log => {
            const time = log.id ? new Date(log.id).toLocaleTimeString() : '';
            return `[${time}] [${log.method.toUpperCase()}] ${log.args.join(' ')}`;
        }).join('\n');
        navigator.clipboard.writeText(text);
    }, [filteredLogs]);

    const formatTimestamp = (id: number) => {
        const date = new Date(id);
        return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
            color: isDarkMode ? '#ccc' : '#333',
            fontFamily: 'monospace',
            fontSize: '12px',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 12px',
                borderBottom: `1px solid ${isDarkMode ? '#333' : '#eee'}`,
                flexShrink: 0,
                gap: 8,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ cursor: 'pointer', fontSize: 10, color: isDarkMode ? '#888' : '#999' }}
                    >
                        {collapsed ? '\u25B6' : '\u25BC'}
                    </span>
                    <span>{t('console')}</span>
                    <span style={{ color: isDarkMode ? '#666' : '#aaa', fontSize: 11 }}>({consoleLogs.length})</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {(['all', 'log', 'info', 'warn', 'error'] as FilterType[]).map(type => {
                        const count = type === 'all' ? consoleLogs.length : (logCounts[type] || 0);
                        if (type !== 'all' && count === 0) return null;
                        return (
                            <span
                                key={type}
                                onClick={() => setFilter(type)}
                                style={{
                                    cursor: 'pointer',
                                    padding: '1px 6px',
                                    borderRadius: 3,
                                    fontSize: 10,
                                    fontWeight: filter === type ? 'bold' : 'normal',
                                    backgroundColor: filter === type
                                        ? (isDarkMode ? '#444' : '#e0e0e0')
                                        : 'transparent',
                                    color: type === 'all'
                                        ? (isDarkMode ? '#ccc' : '#333')
                                        : METHOD_COLORS[type],
                                }}
                            >
                                {type === 'all' ? 'ALL' : `${METHOD_LABELS[type]} ${count}`}
                            </span>
                        );
                    })}

                    <span
                        onClick={handleCopyAll}
                        style={{
                            cursor: 'pointer', marginLeft: 4, padding: '1px 6px',
                            borderRadius: 3, fontSize: 10, color: isDarkMode ? '#888' : '#999',
                        }}
                        title={t('copy')}
                    >
                        {t('copy')}
                    </span>

                    <span
                        onClick={clearConsoleLogs}
                        style={{
                            cursor: 'pointer', padding: '1px 6px',
                            borderRadius: 3, fontSize: 10, color: isDarkMode ? '#888' : '#999',
                        }}
                    >
                        {t('clear')}
                    </span>
                </div>
            </div>

            {!collapsed && (
                <div ref={containerRef} style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
                    {filteredLogs.length === 0 && (
                        <div style={{ padding: '8px 12px', color: isDarkMode ? '#555' : '#aaa' }}>
                            {consoleLogs.length === 0 ? t('noConsoleOutput') : t('noMatchingLogs')}
                        </div>
                    )}
                    {filteredLogs.map((log) => (
                        <div key={log.id} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            padding: '3px 12px',
                            borderBottom: `1px solid ${isDarkMode ? '#2a2a2a' : '#f5f5f5'}`,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                        }}>
                            <span style={{ color: isDarkMode ? '#555' : '#bbb', fontSize: 10, flexShrink: 0, minWidth: 60 }}>
                                {formatTimestamp(log.id)}
                            </span>
                            <span style={{
                                color: METHOD_COLORS[log.method] || (isDarkMode ? '#ccc' : '#333'),
                                fontSize: 10,
                                fontWeight: 'bold',
                                flexShrink: 0,
                                minWidth: 30,
                            }}>
                                {METHOD_LABELS[log.method] || log.method.toUpperCase()}
                            </span>
                            <span style={{
                                color: METHOD_COLORS[log.method] || (isDarkMode ? '#ccc' : '#333'),
                                flex: 1,
                            }}>
                                {log.args.join(' ')}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
