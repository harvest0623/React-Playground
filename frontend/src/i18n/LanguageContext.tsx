import { createContext, useCallback, useContext, useState, type PropsWithChildren } from 'react'
import { translations, type Locale, type TranslationKey } from './translations'

export type { TranslationKey } from './translations'

interface LanguageContextType {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType)

export function LanguageProvider({ children }: PropsWithChildren) {
    const [locale, setLocale] = useState<Locale>(() => {
        return (localStorage.getItem('playground-locale') as Locale) || 'zh'
    })

    const handleSetLocale = useCallback((l: Locale) => {
        setLocale(l)
        localStorage.setItem('playground-locale', l)
    }, [])

    const t = useCallback((key: TranslationKey): string => {
        return translations[locale][key] || translations.en[key] || key
    }, [locale])

    return (
        <LanguageContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
    return useContext(LanguageContext)
}