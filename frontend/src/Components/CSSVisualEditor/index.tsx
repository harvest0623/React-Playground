import { useContext, useMemo, useCallback, useState } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'
import { useLanguage } from '../../i18n/LanguageContext'

interface CSSRule {
    selector: string
    properties: { property: string; value: string }[]
}

interface CSSPropertyControl {
    type: 'color' | 'range' | 'select' | 'text'
    options?: string[]
    min?: number
    max?: number
    step?: number
}

const PROPERTY_CONFIGS: Record<string, CSSPropertyControl> = {
    'color': { type: 'color' },
    'background-color': { type: 'color' },
    'border-color': { type: 'color' },
    'font-size': { type: 'range', min: 8, max: 72, step: 1 },
    'width': { type: 'range', min: 0, max: 1000, step: 1 },
    'height': { type: 'range', min: 0, max: 1000, step: 1 },
    'min-width': { type: 'range', min: 0, max: 1000, step: 1 },
    'min-height': { type: 'range', min: 0, max: 1000, step: 1 },
    'padding': { type: 'range', min: 0, max: 100, step: 1 },
    'margin': { type: 'range', min: -50, max: 100, step: 1 },
    'border-radius': { type: 'range', min: 0, max: 100, step: 1 },
    'opacity': { type: 'range', min: 0, max: 1, step: 0.05 },
    'display': { type: 'select', options: ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'] },
    'flex-direction': { type: 'select', options: ['row', 'row-reverse', 'column', 'column-reverse'] },
    'justify-content': { type: 'select', options: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] },
    'align-items': { type: 'select', options: ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'] },
    'text-align': { type: 'select', options: ['left', 'center', 'right', 'justify'] },
    'position': { type: 'select', options: ['static', 'relative', 'absolute', 'fixed', 'sticky'] },
    'font-weight': { type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
    'text-decoration': { type: 'select', options: ['none', 'underline', 'overline', 'line-through'] },
}

function parseCSS(cssText: string): CSSRule[] {
    const rules: CSSRule[] = []
    const ruleRegex = /([^{]+)\{([^}]*)\}/g
    let match
    while ((match = ruleRegex.exec(cssText)) !== null) {
        const selector = match[1].trim()
        const body = match[2].trim()
        if (!selector || !body) continue
        const properties: { property: string; value: string }[] = []
        const propRegex = /([^;:]+)\s*:\s*([^;]+)/g
        let propMatch
        while ((propMatch = propRegex.exec(body)) !== null) {
            properties.push({
                property: propMatch[1].trim(),
                value: propMatch[2].trim(),
            })
        }
        if (properties.length > 0) {
            rules.push({ selector, properties })
        }
    }
    return rules
}

function rebuildCSS(rules: CSSRule[]): string {
    return rules.map(rule =>
        `${rule.selector} {\n${rule.properties.map(p => `  ${p.property}: ${p.value};`).join('\n')}\n}`
    ).join('\n\n')
}

function extractNumericValue(value: string): number {
    const match = value.match(/(-?[\d.]+)/)
    return match ? parseFloat(match[1]) : 0
}

function extractUnit(value: string): string {
    const match = value.match(/(-?[\d.]+)(.*)/)
    return match && match[2] ? match[2] : 'px'
}

export default function CSSVisualEditor() {
    const { files, selectedFileName, setFiles, isDarkMode, showCSSEditor } = useContext(PlaygroundContext)
    const { t } = useLanguage()
    const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set())

    const currentFile = files[selectedFileName]
    const isCSS = selectedFileName.endsWith('.css')

    const parsedRules = useMemo(() => {
        if (!isCSS || !currentFile) return []
        return parseCSS(currentFile.value)
    }, [currentFile, isCSS])

    const handlePropertyChange = useCallback((ruleIndex: number, propIndex: number, newValue: string) => {
        setFiles(prev => {
            const file = prev[selectedFileName]
            if (!file) return prev
            const rules = parseCSS(file.value)
            if (!rules[ruleIndex] || !rules[ruleIndex].properties[propIndex]) return prev
            rules[ruleIndex].properties[propIndex].value = newValue
            return {
                ...prev,
                [selectedFileName]: { ...file, value: rebuildCSS(rules) },
            }
        })
    }, [selectedFileName, setFiles])

    const toggleSection = useCallback((index: number) => {
        setCollapsedSections(prev => {
            const next = new Set(prev)
            if (next.has(index)) {
                next.delete(index)
            } else {
                next.add(index)
            }
            return next
        })
    }, [])

    if (!showCSSEditor) return null

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
                    🎨 {t('cssVisualEditor')}
                </span>
                {!isCSS && (
                    <span style={{ fontSize: 11, color: textSecondary }}>
                        {t('selectCssFile')}
                    </span>
                )}
            </div>
            {!isCSS ? (
                <div style={{
                    padding: 24,
                    textAlign: 'center',
                    color: textSecondary,
                    fontSize: 13,
                }}>
                    {t('selectCssFile')}
                </div>
            ) : parsedRules.length === 0 ? (
                <div style={{
                    padding: 24,
                    textAlign: 'center',
                    color: textSecondary,
                    fontSize: 13,
                }}>
                    {t('noChanges')}
                </div>
            ) : (
                <div style={{ padding: '8px 12px' }}>
                    {parsedRules.map((rule, ruleIdx) => (
                        <div key={ruleIdx} style={{ marginBottom: 8 }}>
                            <div
                                onClick={() => toggleSection(ruleIdx)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 8px',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0',
                                    marginBottom: 4,
                                }}
                            >
                                <span style={{ fontSize: 10, color: textSecondary }}>
                                    {collapsedSections.has(ruleIdx) ? '▶' : '▼'}
                                </span>
                                <span style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: accent,
                                    fontFamily: 'monospace',
                                }}>
                                    {rule.selector}
                                </span>
                                <span style={{ fontSize: 10, color: textSecondary, marginLeft: 'auto' }}>
                                    {rule.properties.length}
                                </span>
                            </div>
                            {!collapsedSections.has(ruleIdx) && (
                                <div style={{ paddingLeft: 16, paddingTop: 4 }}>
                                    {rule.properties.map((prop, propIdx) => {
                                        const config = PROPERTY_CONFIGS[prop.property]
                                        const controlType = config?.type || 'text'

                                        if (controlType === 'color') {
                                            return (
                                                <div key={propIdx} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    marginBottom: 4,
                                                    padding: '3px 0',
                                                }}>
                                                    <span style={{
                                                        fontSize: 11,
                                                        color: textSecondary,
                                                        width: 120,
                                                        flexShrink: 0,
                                                        fontFamily: 'monospace',
                                                    }}>
                                                        {prop.property}
                                                    </span>
                                                    <input
                                                        type="color"
                                                        value={prop.value.startsWith('#') ? prop.value : '#000000'}
                                                        onChange={e => handlePropertyChange(ruleIdx, propIdx, e.target.value)}
                                                        style={{
                                                            width: 28,
                                                            height: 22,
                                                            padding: 0,
                                                            border: `1px solid ${border}`,
                                                            borderRadius: 4,
                                                            cursor: 'pointer',
                                                            backgroundColor: 'transparent',
                                                        }}
                                                    />
                                                    <span style={{ fontSize: 10, color: textSecondary, fontFamily: 'monospace' }}>
                                                        {prop.value}
                                                    </span>
                                                </div>
                                            )
                                        }

                                        if (controlType === 'range') {
                                            const numVal = extractNumericValue(prop.value)
                                            const unit = extractUnit(prop.value)
                                            return (
                                                <div key={propIdx} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    marginBottom: 4,
                                                    padding: '3px 0',
                                                }}>
                                                    <span style={{
                                                        fontSize: 11,
                                                        color: textSecondary,
                                                        width: 120,
                                                        flexShrink: 0,
                                                        fontFamily: 'monospace',
                                                    }}>
                                                        {prop.property}
                                                    </span>
                                                    <input
                                                        type="range"
                                                        min={config?.min ?? 0}
                                                        max={config?.max ?? 100}
                                                        step={config?.step ?? 1}
                                                        value={numVal}
                                                        onChange={e => handlePropertyChange(ruleIdx, propIdx, `${e.target.value}${unit}`)}
                                                        style={{
                                                            flex: 1,
                                                            height: 4,
                                                            accentColor: accent,
                                                        }}
                                                    />
                                                    <input
                                                        type="number"
                                                        value={numVal}
                                                        onChange={e => handlePropertyChange(ruleIdx, propIdx, `${e.target.value}${unit}`)}
                                                        style={{
                                                            width: 50,
                                                            fontSize: 11,
                                                            padding: '2px 4px',
                                                            border: `1px solid ${border}`,
                                                            borderRadius: 4,
                                                            backgroundColor: inputBg,
                                                            color: text,
                                                            textAlign: 'right',
                                                        }}
                                                    />
                                                    <span style={{ fontSize: 10, color: textSecondary }}>{unit}</span>
                                                </div>
                                            )
                                        }

                                        if (controlType === 'select') {
                                            return (
                                                <div key={propIdx} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    marginBottom: 4,
                                                    padding: '3px 0',
                                                }}>
                                                    <span style={{
                                                        fontSize: 11,
                                                        color: textSecondary,
                                                        width: 120,
                                                        flexShrink: 0,
                                                        fontFamily: 'monospace',
                                                    }}>
                                                        {prop.property}
                                                    </span>
                                                    <select
                                                        value={prop.value}
                                                        onChange={e => handlePropertyChange(ruleIdx, propIdx, e.target.value)}
                                                        style={{
                                                            flex: 1,
                                                            fontSize: 11,
                                                            padding: '3px 6px',
                                                            border: `1px solid ${border}`,
                                                            borderRadius: 4,
                                                            backgroundColor: inputBg,
                                                            color: text,
                                                        }}
                                                    >
                                                        {config?.options?.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )
                                        }

                                        return (
                                            <div key={propIdx} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                marginBottom: 4,
                                                padding: '3px 0',
                                            }}>
                                                <span style={{
                                                    fontSize: 11,
                                                    color: textSecondary,
                                                    width: 120,
                                                    flexShrink: 0,
                                                    fontFamily: 'monospace',
                                                }}>
                                                    {prop.property}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={prop.value}
                                                    onChange={e => handlePropertyChange(ruleIdx, propIdx, e.target.value)}
                                                    style={{
                                                        flex: 1,
                                                        fontSize: 11,
                                                        padding: '3px 6px',
                                                        border: `1px solid ${border}`,
                                                        borderRadius: 4,
                                                        backgroundColor: inputBg,
                                                        color: text,
                                                    }}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
