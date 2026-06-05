import { useEffect, useState } from 'react'

const STYLE_ID = 'splash-screen-styles'

const KEYFRAMES = `
@keyframes splashPulse {
    0%, 100% { transform: scale(0.8); }
    50% { transform: scale(1); }
}
@keyframes splashTextSlide {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
}
@keyframes splashDot1 {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-8px); }
}
@keyframes splashDot2 {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-8px); }
}
@keyframes splashDot3 {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-8px); }
}
@keyframes splashFadeOut {
    0% { opacity: 1; }
    100% { opacity: 0; }
}
`

export default function SplashScreen({ onComplete }: { onComplete?: () => void }) {
    const [phase, setPhase] = useState<'loading' | 'fadeOut' | 'unmount'>('loading')

    useEffect(() => {
        if (!document.getElementById(STYLE_ID)) {
            const style = document.createElement('style')
            style.id = STYLE_ID
            style.textContent = KEYFRAMES
            document.head.appendChild(style)
        }

        const timer = setTimeout(() => {
            setPhase('fadeOut')
        }, 2500)

        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (phase === 'fadeOut') {
            const timer = setTimeout(() => {
                setPhase('unmount')
                sessionStorage.setItem('splash-done', '1')
                onComplete?.()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [phase, onComplete])

    if (phase === 'unmount') return null

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            animation: phase === 'fadeOut' ? 'splashFadeOut 0.5s ease-out forwards' : undefined,
        }}>
            <div style={{
                animation: 'splashPulse 1.5s ease-in-out infinite',
                marginBottom: 24,
            }}>
                <img src="/vite.svg" alt="logo" style={{ width: 80, height: 80 }} />
            </div>
            <div style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: '#ffffff',
                letterSpacing: 2,
                animation: 'splashTextSlide 0.8s ease-out forwards',
                animationDelay: '0.3s',
                opacity: 0,
            }}>
                React Playground
            </div>
            <div style={{
                display: 'flex',
                gap: 8,
                marginTop: 40,
            }}>
                <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#4fc3f7',
                    animation: 'splashDot1 1.2s ease-in-out infinite',
                    animationDelay: '0s',
                }} />
                <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#4fc3f7',
                    animation: 'splashDot2 1.2s ease-in-out infinite',
                    animationDelay: '0.2s',
                }} />
                <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#4fc3f7',
                    animation: 'splashDot3 1.2s ease-in-out infinite',
                    animationDelay: '0.4s',
                }} />
            </div>
        </div>
    )
}
