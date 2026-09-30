import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const HTML_PORTAL = 'http://127.0.0.1:2816'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-files-on-2816',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || ''
          if (url.includes('.html')) {
            res.statusCode = 302
            res.setHeader('Location', `http://localhost:2816${url}`)
            res.end()
            return
          }
          next()
        })
      },
    },
  ],
  server: {
    port: 2341,
    strictPort: true,
    host: true,
    proxy: {
      '/api': { target: HTML_PORTAL, changeOrigin: true },
      '/auth': { target: HTML_PORTAL, changeOrigin: true },
      '/uploads': { target: HTML_PORTAL, changeOrigin: true },
    },
  },
  preview: {
    port: 2341,
    strictPort: true,
    proxy: {
      '/api': { target: HTML_PORTAL, changeOrigin: true },
      '/auth': { target: HTML_PORTAL, changeOrigin: true },
      '/uploads': { target: HTML_PORTAL, changeOrigin: true },
    },
  },
})
