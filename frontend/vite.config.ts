import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                manualChunks: {
                    'monaco-editor': ['@monaco-editor/react'],
                    'babel': ['@babel/standalone'],
                    'react-vendor': ['react', 'react-dom'],
                }
            }
        }
    }
})