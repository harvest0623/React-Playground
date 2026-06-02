import type { Files } from './PlaygroundContext'
import main from './template/main.tsx?raw'
import AppCss from './template/App.css?raw'
import App from './template/App.tsx?raw'
import importMap from './template/import-map.json?raw'

export interface Template {
    name: string
    description: string
    icon: string
    files: Files
}

const importMapFile = {
    name: 'import-map.json',
    value: importMap,
    language: 'json' as const,
}

const mainFile = {
    name: 'main.tsx',
    value: main,
    language: 'typescriptreact' as const,
}

const defaultAppCss = {
    name: 'App.css',
    value: AppCss,
    language: 'css' as const,
}

export const templates: Template[] = [
    {
        name: 'Empty Project',
        description: 'Start from scratch with a clean React project',
        icon: '📁',
        files: {
            'main.tsx': mainFile,
            'App.tsx': {
                name: 'App.tsx',
                value: `export default function App() {\n    return (\n        <div>\n            <h1>Hello World</h1>\n        </div>\n    )\n}`,
                language: 'typescriptreact',
            },
            'import-map.json': importMapFile,
        },
    },
    {
        name: 'Counter',
        description: 'A simple counter with useState hook',
        icon: '🔢',
        files: {
            'main.tsx': mainFile,
            'App.tsx': {
                name: 'App.tsx',
                value: App,
                language: 'typescriptreact',
            },
            'App.css': defaultAppCss,
            'import-map.json': importMapFile,
        },
    },
    {
        name: 'Todo List',
        description: 'Add, delete, and complete todo items',
        icon: '✅',
        files: {
            'main.tsx': mainFile,
            'App.tsx': {
                name: 'App.tsx',
                value: `import { useState } from 'react'\nimport './App.css'\n\ninterface Todo {\n    id: number\n    text: string\n    completed: boolean\n}\n\nexport default function App() {\n    const [todos, setTodos] = useState<Todo[]>([])\n    const [input, setInput] = useState('')\n\n    const addTodo = () => {\n        if (input.trim()) {\n            setTodos([...todos, { id: Date.now(), text: input, completed: false }])\n            setInput('')\n        }\n    }\n\n    const toggleTodo = (id: number) => {\n        setTodos(todos.map(todo =>\n            todo.id === id ? { ...todo, completed: !todo.completed } : todo\n        ))\n    }\n\n    const deleteTodo = (id: number) => {\n        setTodos(todos.filter(todo => todo.id !== id))\n    }\n\n    return (\n        <div className="todo-app">\n            <h1>Todo List</h1>\n            <div className="input-group">\n                <input\n                    value={input}\n                    onChange={e => setInput(e.target.value)}\n                    onKeyDown={e => e.key === 'Enter' && addTodo()}\n                    placeholder="Add a new todo..."\n                />\n                <button onClick={addTodo}>Add</button>\n            </div>\n            <ul>\n                {todos.map(todo => (\n                    <li key={todo.id} className={todo.completed ? 'completed' : ''}>\n                        <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>\n                        <button onClick={() => deleteTodo(todo.id)}>×</button>\n                    </li>\n                ))}\n            </ul>\n        </div>\n    )\n}`,
                language: 'typescriptreact',
            },
            'App.css': {
                name: 'App.css',
                value: `.todo-app {\n    max-width: 400px;\n    margin: 0 auto;\n    padding: 20px;\n}\n\n.input-group {\n    display: flex;\n    gap: 8px;\n    margin-bottom: 16px;\n}\n\ninput {\n    flex: 1;\n    padding: 8px 12px;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n    font-size: 14px;\n}\n\nbutton {\n    padding: 8px 16px;\n    background: #4caf50;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    cursor: pointer;\n}\n\nbutton:hover {\n    background: #45a049;\n}\n\nul {\n    list-style: none;\n    padding: 0;\n}\n\nli {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    padding: 8px 12px;\n    border-bottom: 1px solid #eee;\n}\n\nli span {\n    cursor: pointer;\n    flex: 1;\n}\n\nli.completed span {\n    text-decoration: line-through;\n    color: #999;\n}\n\nli button {\n    background: #f44336;\n    padding: 4px 8px;\n    font-size: 16px;\n}`,
                language: 'css',
            },
            'import-map.json': importMapFile,
        },
    },
    {
        name: 'Fetch Data',
        description: 'Fetch data from API with loading and error states',
        icon: '🌐',
        files: {
            'main.tsx': mainFile,
            'App.tsx': {
                name: 'App.tsx',
                value: `import { useState, useEffect } from 'react'\nimport './App.css'\n\ninterface Post {\n    id: number\n    title: string\n    body: string\n}\n\nexport default function App() {\n    const [posts, setPosts] = useState<Post[]>([])\n    const [loading, setLoading] = useState(true)\n    const [error, setError] = useState<string | null>(null)\n\n    useEffect(() => {\n        fetch('https://jsonplaceholder.typicode.com/posts?_limit=5')\n            .then(res => {\n                if (!res.ok) throw new Error('Failed to fetch')\n                return res.json()\n            })\n            .then(data => setPosts(data))\n            .catch(err => setError(err.message))\n            .finally(() => setLoading(false))\n    }, [])\n\n    if (loading) return <div className="loading">Loading...</div>\n    if (error) return <div className="error">Error: {error}</div>\n\n    return (\n        <div className="fetch-demo">\n            <h1>Posts</h1>\n            <div className="posts">\n                {posts.map(post => (\n                    <div key={post.id} className="post-card">\n                        <h3>{post.title}</h3>\n                        <p>{post.body}</p>\n                    </div>\n                ))}\n            </div>\n        </div>\n    )\n}`,
                language: 'typescriptreact',
            },
            'App.css': {
                name: 'App.css',
                value: `.fetch-demo {\n    max-width: 600px;\n    margin: 0 auto;\n    padding: 20px;\n}\n\n.loading, .error {\n    text-align: center;\n    padding: 40px;\n    font-size: 18px;\n}\n\n.error {\n    color: #f44336;\n}\n\n.posts {\n    display: flex;\n    flex-direction: column;\n    gap: 16px;\n}\n\n.post-card {\n    padding: 16px;\n    border: 1px solid #ddd;\n    border-radius: 8px;\n    background: #f9f9f9;\n}\n\n.post-card h3 {\n    margin: 0 0 8px 0;\n    color: #333;\n}\n\n.post-card p {\n    margin: 0;\n    color: #666;\n    line-height: 1.5;\n}`,
                language: 'css',
            },
            'import-map.json': importMapFile,
        },
    },
    {
        name: 'CSS Demo',
        description: 'Explore CSS animations, gradients, and grid layout',
        icon: '🎨',
        files: {
            'main.tsx': mainFile,
            'App.tsx': {
                name: 'App.tsx',
                value: `import './App.css'\n\nexport default function App() {\n    return (\n        <div className="css-demo">\n            <h1>CSS Demo</h1>\n            <div className="animation-section">\n                <div className="animated-box">Animate</div>\n            </div>\n            <div className="gradient-section">\n                <div className="gradient-box">Gradient</div>\n            </div>\n            <div className="grid-section">\n                {[1, 2, 3, 4, 5, 6].map(i => (\n                    <div key={i} className="grid-item">{i}</div>\n                ))}\n            </div>\n        </div>\n    )\n}`,
                language: 'typescriptreact',
            },
            'App.css': {
                name: 'App.css',
                value: `.css-demo {\n    max-width: 600px;\n    margin: 0 auto;\n    padding: 20px;\n}\n\nh1 {\n    text-align: center;\n}\n\n.animation-section, .gradient-section, .grid-section {\n    margin: 20px 0;\n}\n\n.animated-box {\n    width: 100px;\n    height: 100px;\n    background: #4caf50;\n    color: white;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    border-radius: 8px;\n    animation: pulse 2s infinite;\n}\n\n@keyframes pulse {\n    0%, 100% { transform: scale(1); }\n    50% { transform: scale(1.1); }\n}\n\n.gradient-box {\n    width: 100%;\n    height: 100px;\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    color: white;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    border-radius: 8px;\n    font-size: 18px;\n    font-weight: bold;\n}\n\n.grid-section {\n    display: grid;\n    grid-template-columns: repeat(3, 1fr);\n    gap: 12px;\n}\n\n.grid-item {\n    aspect-ratio: 1;\n    background: #2196f3;\n    color: white;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    border-radius: 8px;\n    font-size: 24px;\n    font-weight: bold;\n}`,
                language: 'css',
            },
            'import-map.json': importMapFile,
        },
    },
    {
        name: 'Multi-Component',
        description: 'Learn component composition with multiple files',
        icon: '🧩',
        files: {
            'main.tsx': mainFile,
            'App.tsx': {
                name: 'App.tsx',
                value: `import Header from './Header'\nimport Content from './Content'\nimport './App.css'\n\nexport default function App() {\n    return (\n        <div className="app">\n            <Header title="My App" />\n            <Content>\n                <p>This is the main content area.</p>\n                <p>You can pass any children here.</p>\n            </Content>\n        </div>\n    )\n}`,
                language: 'typescriptreact',
            },
            'Header.tsx': {
                name: 'Header.tsx',
                value: `interface Props {\n    title: string\n}\n\nexport default function Header({ title }: Props) {\n    return (\n        <header className="header">\n            <h1>{title}</h1>\n        </header>\n    )\n}`,
                language: 'typescriptreact',
            },
            'Content.tsx': {
                name: 'Content.tsx',
                value: `import type { ReactNode } from 'react'\n\ninterface Props {\n    children: ReactNode\n}\n\nexport default function Content({ children }: Props) {\n    return (\n        <main className="content">\n            {children}\n        </main>\n    )\n}`,
                language: 'typescriptreact',
            },
            'App.css': {
                name: 'App.css',
                value: `.app {\n    max-width: 600px;\n    margin: 0 auto;\n}\n\n.header {\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    color: white;\n    padding: 20px;\n    border-radius: 8px 8px 0 0;\n}\n\n.header h1 {\n    margin: 0;\n    font-size: 24px;\n}\n\n.content {\n    padding: 20px;\n    background: #f5f5f5;\n    border-radius: 0 0 8px 8px;\n}\n\n.content p {\n    margin: 8px 0;\n    color: #333;\n}`,
                language: 'css',
            },
            'import-map.json': importMapFile,
        },
    },
]
