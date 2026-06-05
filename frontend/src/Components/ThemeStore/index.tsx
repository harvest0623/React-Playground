import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'
import { themes } from '../../ReactPlayground/themes'
import { useLanguage, type TranslationKey } from '../../i18n/LanguageContext'

interface Props {
    isDarkMode: boolean
}

export default function ThemeStore({ isDarkMode }: Props) {
    const { editorTheme, setEditorTheme } = useContext(PlaygroundContext)
    const { t } = useLanguage()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const themeNameMap: Partial<Record<string, TranslationKey>> = {
        'default-dark': 'defaultDark',
        'default-light': 'defaultLight',
    }

    const currentTheme = themes.find(th => th.id === editorTheme) || themes[0]

    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
            setOpen(false)
        }
    }, [])

    useEffect(() => {
        if (open) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [open, handleClickOutside])

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <div
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    color: isDarkMode ? '#ccc' : '#555',
                    backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f0f0',
                    transition: 'background-color 0.15s',
                    userSelect: 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = isDarkMode ? '#3c3c3c' : '#e0e0e0')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = isDarkMode ? '#2d2d2d' : '#f0f0f0')}
            >
                <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    backgroundColor: currentTheme.colors.bg,
                    border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
                    flexShrink: 0,
                }} />
                <span>{t('editorThemes')}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 2 }}>
                    <path d="M2 3.5L5 6.5L8 3.5" stroke={isDarkMode ? '#888' : '#666'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            {open && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 6,
                    width: 260,
                    maxHeight: 420,
                    overflowY: 'auto',
                    backgroundColor: isDarkMode ? '#2d2d2d' : '#fff',
                    border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    padding: 6,
                }}>
                    {themes.map(theme => {
                        const isSelected = theme.id === editorTheme
                        return (
                            <div
                                key={theme.id}
                                onClick={() => {
                                    setEditorTheme(theme.id)
                                    setOpen(false)
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '8px 10px',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    backgroundColor: isSelected
                                        ? (isDarkMode ? 'rgba(100,150,255,0.15)' : 'rgba(0,100,255,0.08)')
                                        : 'transparent',
                                    transition: 'background-color 0.12s',
                                }}
                                onMouseEnter={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = isDarkMode ? '#3c3c3c' : '#f5f5f5'
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                    }
                                }}
                            >
                                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                                    <div style={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: 3,
                                        backgroundColor: theme.colors.bg,
                                        border: '1px solid rgba(128,128,128,0.3)',
                                    }} />
                                    <div style={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: 3,
                                        backgroundColor: theme.tokenColors.find(tc => tc.token === 'keyword')?.foreground || '#888',
                                    }} />
                                    <div style={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: 3,
                                        backgroundColor: theme.tokenColors.find(tc => tc.token === 'string')?.foreground || '#888',
                                    }} />
                                    <div style={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: 3,
                                        backgroundColor: theme.tokenColors.find(tc => tc.token === 'function')?.foreground || '#888',
                                    }} />
                                    <div style={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: 3,
                                        backgroundColor: theme.tokenColors.find(tc => tc.token === 'type')?.foreground || '#888',
                                    }} />
                                </div>
                                <span style={{
                                    flex: 1,
                                    fontSize: 13,
                                    color: isDarkMode ? '#ddd' : '#333',
                                    fontWeight: isSelected ? 600 : 400,
                                }}>
                                    {themeNameMap[theme.id] ? t(themeNameMap[theme.id]!) : theme.name}
                                </span>
                                {isSelected && (
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                                        <path d="M2.5 7L5.5 10L11.5 4" stroke={isDarkMode ? '#6ea8fe' : '#0066ff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
