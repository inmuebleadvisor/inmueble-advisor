import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions', 'firebase/analytics', 'firebase/remote-config'],
          'ui-libs': ['leaflet', 'react-leaflet', 'recharts', 'lucide-react', 'canvas-confetti', 'scrollreveal'],
          'analytics': ['posthog-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Raise limit slightly to reduce noise for remaining chunks
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', '**/test_*.{js,jsx}'],
  },
})
