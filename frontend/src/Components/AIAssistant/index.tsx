import { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { PlaygroundContext } from '../../ReactPlayground/PlaygroundContext'
import { useLanguage, type TranslationKey } from '../../i18n/LanguageContext'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function AIAssistant() {
    const { isDarkMode, showAI, setShowAI, files, selectedFileName, setFiles } = useContext(PlaygroundContext)
    const { t } = useLanguage()

    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [showApiKeyModal, setShowApiKeyModal] = useState(false)
    const [apiKeyInput, setApiKeyInput] = useState('')
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai-api-key') || '')
    const [copiedIndex, setCopiedIndex] = useState<string | null>(null)

    const chatEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const bg = isDarkMode ? '#1e1e1e' : '#fff'
    const border = isDarkMode ? '#333' : '#e5e5e5'
    const text = isDarkMode ? '#fff' : '#1a1a1a'
    const textSecondary = isDarkMode ? '#888' : '#666'
    const inputBg = isDarkMode ? '#2d2d2d' : '#f8f8f8'
    const userBubbleBg = isDarkMode ? '#2a5a8a' : '#e3f2fd'
    const aiBubbleBg = isDarkMode ? '#2d2d2d' : '#f0f0f0'

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSaveApiKey = () => {
        const trimmed = apiKeyInput.trim()
        if (trimmed) {
            setApiKey(trimmed)
            localStorage.setItem('ai-api-key', trimmed)
            setShowApiKeyModal(false)
            setApiKeyInput('')
        }
    }

    const handleCopyCode = useCallback((code: string, key: string) => {
        navigator.clipboard.writeText(code)
        setCopiedIndex(key)
        setTimeout(() => setCopiedIndex(null), 2000)
    }, [])

    const handleInsertToEditor = useCallback((code: string) => {
        const file = files[selectedFileName]
        if (!file) return
        setFiles(prev => ({
            ...prev,
            [selectedFileName]: { ...prev[selectedFileName], value: code }
        }))
    }, [files, selectedFileName, setFiles])

    const renderMarkdown = (content: string, msgIndex: number) => {
        const parts = content.split(/(```[\s\S]*?```)/g)
        return parts.map((part, i) => {
            const codeMatch = part.match(/^```(\w*)\n?([\s\S]*?)```$/)
            if (codeMatch) {
                const code = codeMatch[2]
                const blockKey = `${msgIndex}-${i}`
                return (
                    <div key={i} style={{
                        margin: '8px 0',
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 6,
                            padding: '4px 8px',
                            backgroundColor: '#2d2d2d',
                            borderBottom: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                        }}>
                            <button
                                onClick={() => handleCopyCode(code, blockKey)}
                                style={{
                                    padding: '2px 8px',
                                    fontSize: 11,
                                    borderRadius: 4,
                                    border: 'none',
                                    backgroundColor: copiedIndex === blockKey ? '#98c379' : '#555',
                                    color: '#fff',
                                    cursor: 'pointer',
                                }}
                            >
                                {copiedIndex === blockKey ? t('codeCopied') : '📋 Copy'}
                            </button>
                            <button
                                onClick={() => handleInsertToEditor(code)}
                                style={{
                                    padding: '2px 8px',
                                    fontSize: 11,
                                    borderRadius: 4,
                                    border: 'none',
                                    backgroundColor: '#61afef',
                                    color: '#fff',
                                    cursor: 'pointer',
                                }}
                            >
                                ⬆ {t('insertToEditor')}
                            </button>
                        </div>
                        <pre style={{
                            margin: 0,
                            padding: '12px 16px',
                            backgroundColor: '#1e1e1e',
                            color: '#d4d4d4',
                            fontSize: 13,
                            fontFamily: "'Consolas', 'Courier New', monospace",
                            overflowX: 'auto',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                        }}>
                            {code}
                        </pre>
                    </div>
                )
            }
            return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>
        })
    }

    const sendMessage = async (text?: string) => {
        const content = (text || input).trim()
        if (!content || loading) return
        if (!apiKey) {
            setShowApiKeyModal(true)
            return
        }

        const currentFile = files[selectedFileName]
        const contextMessage = currentFile
            ? `\n\n[Current file: ${selectedFileName}]\n\`\`\`${currentFile.value}\`\`\``
            : ''

        const userMsg: Message = { role: 'user', content: content + contextMessage }
        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setInput('')
        setLoading(true)

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a React code assistant. Help users write, explain, fix, and improve React/TypeScript/CSS code. When generating code, always use TypeScript. Format code in markdown code blocks.',
                        },
                        ...newMessages.map(m => ({
                            role: m.role,
                            content: m.content,
                        })),
                    ],
                    stream: true,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Error: ${response.status} - ${errorText}`,
                }])
                setLoading(false)
                return
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let assistantContent = ''

            setMessages(prev => [...prev, { role: 'assistant', content: '' }])

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value, { stream: true })
                    const lines = chunk.split('\n')

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6)
                            if (data === '[DONE]') continue
                            try {
                                const parsed = JSON.parse(data)
                                const delta = parsed.choices?.[0]?.delta?.content
                                if (delta) {
                                    assistantContent += delta
                                    setMessages(prev => {
                                        const updated = [...prev]
                                        updated[updated.length - 1] = {
                                            role: 'assistant',
                                            content: assistantContent,
                                        }
                                        return updated
                                    })
                                }
                            } catch {
                                // skip malformed JSON chunks
                            }
                        }
                    }
                }
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Request failed: ${err instanceof Error ? err.message : String(err)}`,
            }])
        }

        setLoading(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
        }
    }

    const quickActions: { key: TranslationKey; prompt: string }[] = [
        { key: 'explainCode', prompt: 'Please explain the code in the current file.' },
        { key: 'fixError', prompt: 'There is an error in the current file. Please fix it.' },
        { key: 'generateComponent', prompt: 'Please generate a new React component for me.' },
        { key: 'improveCode', prompt: 'Please review and improve the code in the current file.' },
    ]

    if (!showAI) return null

    return (
        <>
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9998,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }}
                onClick={() => setShowAI(false)}
            />
            <div style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 420,
                zIndex: 9999,
                backgroundColor: bg,
                borderLeft: `1px solid ${border}`,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.15)',
                transform: showAI ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s ease',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: `1px solid ${border}`,
                }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: text }}>
                        🤖 {t('aiAssistant')}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                            onClick={() => { setApiKeyInput(apiKey); setShowApiKeyModal(true) }}
                            style={{
                                cursor: 'pointer',
                                padding: 4,
                                borderRadius: 6,
                                color: textSecondary,
                                fontSize: 16,
                                lineHeight: 1,
                            }}
                            title={t('setApiKey')}
                        >
                            ⚙️
                        </div>
                        <div
                            onClick={() => setShowAI(false)}
                            style={{
                                cursor: 'pointer',
                                padding: 4,
                                borderRadius: 6,
                                color: textSecondary,
                                fontSize: 18,
                                lineHeight: 1,
                            }}
                        >
                            ✕
                        </div>
                    </div>
                </div>

                {!apiKey && (
                    <div style={{
                        padding: '12px 20px',
                        backgroundColor: '#e06c75' + '22',
                        borderBottom: `1px solid ${border}`,
                        fontSize: 13,
                        color: '#e06c75',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        <span>⚠️</span>
                        <span>{t('apiKeyRequired')}</span>
                        <span
                            onClick={() => setShowApiKeyModal(true)}
                            style={{
                                color: '#61afef',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                marginLeft: 'auto',
                            }}
                        >
                            {t('setApiKey')}
                        </span>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                    {messages.length === 0 && !loading && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: textSecondary,
                            fontSize: 14,
                            gap: 8,
                        }}>
                            <span style={{ fontSize: 48 }}>🤖</span>
                            <span>{t('aiAssistant')}</span>
                            <span style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>
                                {t('explainCode')} · {t('fixError')} · {t('generateComponent')} · {t('improveCode')}
                            </span>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            gap: 10,
                            marginBottom: 16,
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 18,
                                flexShrink: 0,
                                backgroundColor: isDarkMode ? '#333' : '#e8e8e8',
                            }}>
                                {msg.role === 'user' ? '🧑' : '🤖'}
                            </div>
                            <div style={{
                                maxWidth: '80%',
                                padding: '10px 14px',
                                borderRadius: msg.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                                backgroundColor: msg.role === 'user' ? userBubbleBg : aiBubbleBg,
                                color: text,
                                fontSize: 13,
                                lineHeight: 1.6,
                                wordBreak: 'break-word',
                            }}>
                                {msg.role === 'assistant'
                                    ? renderMarkdown(msg.content, idx)
                                    : <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                                }
                                {msg.role === 'assistant' && idx === messages.length - 1 && loading && !msg.content && (
                                    <span style={{ color: textSecondary }}>{t('thinking')}</span>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <div style={{ padding: '8px 20px 4px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {quickActions.map(action => (
                            <div
                                key={action.key}
                                onClick={() => {
                                    setInput(action.prompt)
                                    textareaRef.current?.focus()
                                }}
                                style={{
                                    padding: '4px 10px',
                                    fontSize: 11,
                                    borderRadius: 14,
                                    border: `1px solid ${border}`,
                                    backgroundColor: 'transparent',
                                    color: textSecondary,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {t(action.key)}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{
                    padding: '8px 20px 16px',
                    borderTop: `1px solid ${border}`,
                }}>
                    <div style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-end',
                    }}>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            placeholder={t('typeMessage')}
                            rows={1}
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                fontSize: 13,
                                borderRadius: 10,
                                border: `1px solid ${border}`,
                                backgroundColor: inputBg,
                                color: text,
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'inherit',
                                lineHeight: 1.5,
                                maxHeight: 120,
                            }}
                        />
                        <div
                            onClick={() => sendMessage()}
                            style={{
                                padding: '10px 14px',
                                borderRadius: 10,
                                border: 'none',
                                backgroundColor: input.trim() && !loading ? '#61afef' : '#555',
                                color: '#fff',
                                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                                fontSize: 16,
                                lineHeight: 1,
                                flexShrink: 0,
                            }}
                        >
                            ➤
                        </div>
                    </div>
                </div>
            </div>

            {showApiKeyModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}>
                    <div style={{
                        backgroundColor: bg,
                        borderRadius: 12,
                        padding: 32,
                        width: 400,
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        border: `1px solid ${border}`,
                    }}>
                        <h3 style={{
                            margin: '0 0 8px',
                            fontSize: 18,
                            fontWeight: 600,
                            color: text,
                        }}>
                            🔑 {t('setApiKey')}
                        </h3>
                        <p style={{
                            margin: '0 0 20px',
                            fontSize: 13,
                            color: textSecondary,
                        }}>
                            OpenAI API Key
                        </p>
                        <input
                            type="password"
                            value={apiKeyInput}
                            onChange={e => setApiKeyInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveApiKey() }}
                            placeholder="sk-..."
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                fontSize: 14,
                                borderRadius: 8,
                                border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                                backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f8f8',
                                color: isDarkMode ? '#fff' : '#000',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 10,
                            marginTop: 20,
                        }}>
                            <button
                                onClick={() => { setShowApiKeyModal(false); setApiKeyInput('') }}
                                style={{
                                    padding: '8px 18px',
                                    fontSize: 13,
                                    borderRadius: 8,
                                    border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                                    backgroundColor: 'transparent',
                                    color: isDarkMode ? '#ccc' : '#555',
                                    cursor: 'pointer',
                                }}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleSaveApiKey}
                                disabled={!apiKeyInput.trim()}
                                style={{
                                    padding: '8px 18px',
                                    fontSize: 13,
                                    borderRadius: 8,
                                    border: 'none',
                                    backgroundColor: apiKeyInput.trim() ? '#61afef' : '#555',
                                    color: '#fff',
                                    cursor: apiKeyInput.trim() ? 'pointer' : 'not-allowed',
                                    fontWeight: 500,
                                }}
                            >
                                {t('confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
