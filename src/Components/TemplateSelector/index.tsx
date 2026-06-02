import { useEffect } from 'react'
import type { Files } from '../../ReactPlayground/PlaygroundContext'
import { templates } from '../../ReactPlayground/templates'
import styles from './index.module.scss'

interface Props {
    open: boolean
    onClose: () => void
    onSelect: (files: Files) => void
    isDarkMode: boolean
}

export default function TemplateSelector(props: Props) {
    const { open, onClose, onSelect, isDarkMode } = props

    useEffect(() => {
        if (!open) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open, onClose])

    if (!open) return null

    const handleSelect = (files: Files) => {
        onSelect(files)
        onClose()
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={`${styles.modal} ${isDarkMode ? styles.dark : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <h2>Choose a Template</h2>
                    <button className={styles.skipBtn} onClick={onClose}>
                        Skip
                    </button>
                </div>
                <div className={styles.grid}>
                    {templates.map(template => (
                        <div
                            key={template.name}
                            className={styles.card}
                            onClick={() => handleSelect(template.files)}
                        >
                            <div className={styles.icon}>{template.icon}</div>
                            <h3 className={styles.title}>{template.name}</h3>
                            <p className={styles.description}>{template.description}</p>
                            <pre className={styles.preview}>
                                {getPreview(template.files)}
                            </pre>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function getPreview(files: Files): string {
    const appFile = files['App.tsx']
    if (!appFile) return ''
    const lines = appFile.value.split('\n')
    return lines.slice(0, 3).join('\n')
}
