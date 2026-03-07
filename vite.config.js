import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/analytics'],
          'ui-vendor': ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
          'maps-vendor': ['leaflet', 'react-leaflet']
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    include: ['src/**/test_*.?(c|m)[jt]s?(x)', 'src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },

  server: {
    proxy: {
      // Proxy para imágenes de Firebase Storage en desarrollo local
      // Elimina el bloqueo CORS ya que la petición viaja Vite (Node) → Firebase, no browser → Firebase
      '/img-proxy': {
        target: 'https://storage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/img-proxy\/storage\.googleapis\.com/, ''),
      },
      '/img-proxy-firebase': {
        target: 'https://firebasestorage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/img-proxy-firebase\/firebasestorage\.googleapis\.com/, ''),
      },
    }
  },

})
