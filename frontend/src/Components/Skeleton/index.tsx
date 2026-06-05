import { useMemo } from 'react'

const STYLE_ID = 'skeleton-styles'

const KEYFRAMES = `
@keyframes skeletonShimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}
@keyframes skeletonSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`

interface SkeletonProps {
    type: 'editor' | 'preview' | 'explorer'
}

function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = KEYFRAMES
    document.head.appendChild(style)
}

function ShimmerBar({ width, height = 14, style }: { width: string; height?: number; style?: React.CSSProperties }) {
    return (
        <div style={{
            width,
            height,
            borderRadius: 4,
            background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeletonShimmer 1.5s ease-in-out infinite',
            ...style,
        }} />
    )
}

function EditorSkeleton() {
    const lines = useMemo(() => [
        { w: '75%', indent: 0 },
        { w: '60%', indent: 16 },
        { w: '85%', indent: 16 },
        { w: '70%', indent: 32 },
    ], [])

    return (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lines.map((line, i) => (
                <ShimmerBar
                    key={i}
                    width={line.w}
                    height={16}
                    style={{ marginLeft: line.indent }}
                />
            ))}
        </div>
    )
}

function PreviewSkeleton() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 16,
        }}>
            <div style={{
                width: 40,
                height: 40,
                border: '3px solid #333',
                borderTopColor: '#888',
                borderRadius: '50%',
                animation: 'skeletonSpin 0.8s linear infinite',
            }} />
            <ShimmerBar width="60%" height={14} />
        </div>
    )
}

function ExplorerSkeleton() {
    const bars = useMemo(() => [
        { w: '70%' },
        { w: '55%' },
        { w: '80%' },
        { w: '65%' },
        { w: '50%' },
    ], [])

    return (
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bars.map((bar, i) => (
                <ShimmerBar
                    key={i}
                    width={bar.w}
                    height={12}
                />
            ))}
        </div>
    )
}

export default function Skeleton({ type }: SkeletonProps) {
    ensureStyles()

    return (
        <div style={{ height: '100%', overflow: 'hidden' }}>
            {type === 'editor' && <EditorSkeleton />}
            {type === 'preview' && <PreviewSkeleton />}
            {type === 'explorer' && <ExplorerSkeleton />}
        </div>
    )
}
