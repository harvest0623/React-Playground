import ReactPlayground from './ReactPlayground'
import './App.scss'
import { PlaygroundProvider } from './ReactPlayground/PlaygroundContext.tsx'

export default function App() {
    return (
        <PlaygroundProvider>
            <ReactPlayground />
        </PlaygroundProvider>
    )
}