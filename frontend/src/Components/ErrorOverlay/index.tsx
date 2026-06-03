import { useContext, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'

export default function ErrorOverlay() {
    const { compileError, runtimeError, isDarkMode } = useContext(PlaygroundContext);
    const [collapsed, setCollapsed] = useState(false);
    const error = compileError || runtimeError;

    if (!error) return null;

    const errorType = compileError ? 'Compile Error' : 'Runtime Error';
    const displayError = error.replace(/^Error:\s*/, '').replace(/^SyntaxError:\s*/, '');

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: collapsed ? '32px' : '40%',
                overflow: 'auto',
                backgroundColor: isDarkMode ? 'rgba(30,30,30,0.95)' : 'rgba(255,245,245,0.97)',
                color: '#ff6b6b',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.6',
                borderTop: '2px solid #ff6b6b',
                zIndex: 10,
                transition: 'max-height 0.2s ease',
            }}
        >
            <div
                onClick={() => setCollapsed(!collapsed)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    userSelect: 'none',
                    backgroundColor: isDarkMode ? 'rgba(50,20,20,0.8)' : 'rgba(255,230,230,0.9)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10 }}>{collapsed ? '\u25B6' : '\u25BC'}</span>
                    <span style={{ color: '#ff6b6b' }}>{errorType}</span>
                </div>
                <span
                    onClick={(e) => {
                        e.stopPropagation();
                        setCollapsed(true);
                    }}
                    style={{
                        fontSize: 16,
                        color: isDarkMode ? '#888' : '#999',
                        padding: '0 4px',
                        lineHeight: 1,
                    }}
                >
                    x
                </span>
            </div>
            {!collapsed && (
                <div style={{ padding: '8px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {displayError}
                </div>
            )}
        </div>
    )
}
