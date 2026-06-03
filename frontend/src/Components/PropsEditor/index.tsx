import { useContext, useMemo, useCallback, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'
import { useLanguage } from '../../i18n/LanguageContext'

interface ParsedProp {
    name: string
    type: string
    required: boolean
    defaultValue?: string
}

function parsePropsDefinition(code: string): ParsedProp[] {
    const props: ParsedProp[] = []
    const interfaceMatch = code.match(/(?:interface\s+Props|type\s+Props\s*=)\s*\{([\s\S]*?)\}/)
    if (!interfaceMatch) return props
    const body = interfaceMatch[1]
    const fieldRegex = /(\w+)\s*(\?)?\s*:\s*([^;\n]+)/g
    let match
    while ((match = fieldRegex.exec(body)) !== null) {
        const name = match[1]
        const required = !match[2]
        const rawType = match[3].trim()
        props.push({
            name,
            type: rawType,
            required,
        })
    }
    return props
}

function getTypeKind(typeStr: string): 'boolean' | 'number' | 'stringArray' | 'string' {
    if (typeStr === 'boolean') return 'boolean'
    if (typeStr === 'number') return 'number'
    if (typeStr.includes('[]') && typeStr.replace('[]', '').trim() === 'string') return 'stringArray'
    return 'string'
}

function extractStringArray(value: string): string[] {
    return value.replace(/[[\]]/g, '').split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean)
}

export default function PropsEditor() {
    const { files, selectedFileName, isDarkMode, showPropsEditor } = useContext(PlaygroundContext)
    const { t } = useLanguage()
    const [propValues, setPropValues] = useState<Record<string, string>>({})

    const currentFile = files[selectedFileName]
    const isTSX = selectedFileName.endsWith('.tsx') || selectedFileName.endsWith('.jsx')

    const parsedProps = useMemo(() => {
        if (!isTSX || !currentFile) return []
        return parsePropsDefinition(currentFile.value)
    }, [currentFile, isTSX])

    const getPropValue = useCallback((prop: ParsedProp): string => {
        if (propValues[prop.name] !== undefined) return propValues[prop.name]
        if (prop.defaultValue) return prop.defaultValue
        const kind = getTypeKind(prop.type)
        if (kind === 'boolean') return 'true'
        if (kind === 'number') return '0'
        if (kind === 'stringArray') return '[]'
        return ''
    }, [propValues])

    const handleValueChange = useCallback((name: string, value: string) => {
        setPropValues(prev => ({ ...prev, [name]: value }))
    }, [])

    const toggleBoolean = useCallback((name: string, currentValue: string) => {
        const newVal = currentValue === 'true' ? 'false' : 'true'
        setPropValues(prev => ({ ...prev, [name]: newVal }))
    }, [])

    if (!showPropsEditor) return null

    const bg = isDarkMode ? '#1e1e1e' : '#fff'
    const border = isDarkMode ? '#333' : '#e5e5e5'
    const text = isDarkMode ? '#ccc' : '#333'
    const textSecondary = isDarkMode ? '#888' : '#666'
    const inputBg = isDarkMode ? '#2d2d2d' : '#f5f5f5'
    const accent = isDarkMode ? '#4fc3f7' : '#1976d2'

    return (
        <div style={{
            backgroundColor: bg,
            borderTop: `1px solid ${border}`,
            maxHeight: 280,
            overflowY: 'auto',
            flexShrink: 0,
        }}>
            <div style={{
                padding: '8px 12px',
                borderBottom: `1px solid ${border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                backgroundColor: bg,
                zIndex: 1,
            }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: text }}>
                    ⚙️ {t('propsEditor')}
                </span>
            </div>
            {!isTSX ? (
                <div style={{
                    padding: 24,
                    textAlign: 'center',
                    color: textSecondary,
                    fontSize: 13,
                }}>
                    {t('noPropsFound')}
                </div>
            ) : parsedProps.length === 0 ? (
                <div style={{
                    padding: 24,
                    textAlign: 'center',
                    color: textSecondary,
                    fontSize: 13,
                }}>
                    {t('noPropsFound')}
                </div>
            ) : (
                <div style={{ padding: '8px 12px' }}>
                    {parsedProps.map((prop) => {
                        const kind = getTypeKind(prop.type)
                        const value = getPropValue(prop)

                        return (
                            <div key={prop.name} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 6,
                                padding: '4px 0',
                            }}>
                                <div style={{ width: 120, flexShrink: 0 }}>
                                    <span style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: accent,
                                        fontFamily: 'monospace',
                                    }}>
                                        {prop.name}
                                    </span>
                                    <span style={{
                                        fontSize: 9,
                                        color: textSecondary,
                                        marginLeft: 4,
                                    }}>
                                        {prop.type}
                                    </span>
                                    {!prop.required && (
                                        <span style={{
                                            fontSize: 9,
                                            color: '#e06c75',
                                            marginLeft: 2,
                                        }}>
                                            ?
                                        </span>
                                    )}
                                </div>

                                {kind === 'boolean' && (
                                    <div
                                        onClick={() => toggleBoolean(prop.name, value)}
                                        style={{
                                            width: 40,
                                            height: 22,
                                            borderRadius: 11,
                                            backgroundColor: value === 'true' ? accent : (isDarkMode ? '#555' : '#ccc'),
                                            position: 'relative',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            backgroundColor: '#fff',
                                            position: 'absolute',
                                            top: 2,
                                            left: value === 'true' ? 20 : 2,
                                            transition: 'left 0.2s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                        }} />
                                    </div>
                                )}

                                {kind === 'number' && (
                                    <input
                                        type="number"
                                        value={value}
                                        onChange={e => handleValueChange(prop.name, e.target.value)}
                                        style={{
                                            flex: 1,
                                            fontSize: 12,
                                            padding: '3px 6px',
                                            border: `1px solid ${border}`,
                                            borderRadius: 4,
                                            backgroundColor: inputBg,
                                            color: text,
                                        }}
                                    />
                                )}

                                {kind === 'stringArray' && (
                                    <input
                                        type="text"
                                        value={extractStringArray(value).join(', ')}
                                        onChange={e => {
                                            const arr = e.target.value.split(',').map(s => `"${s.trim()}"`).filter(s => s !== '""')
                                            handleValueChange(prop.name, `[${arr.join(', ')}]`)
                                        }}
                                        placeholder="item1, item2, ..."
                                        style={{
                                            flex: 1,
                                            fontSize: 12,
                                            padding: '3px 6px',
                                            border: `1px solid ${border}`,
                                            borderRadius: 4,
                                            backgroundColor: inputBg,
                                            color: text,
                                        }}
                                    />
                                )}

                                {kind === 'string' && (
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={e => handleValueChange(prop.name, e.target.value)}
                                        style={{
                                            flex: 1,
                                            fontSize: 12,
                                            padding: '3px 6px',
                                            border: `1px solid ${border}`,
                                            borderRadius: 4,
                                            backgroundColor: inputBg,
                                            color: text,
                                        }}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
