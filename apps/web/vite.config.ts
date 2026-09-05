import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Hilo es una PWA estática: no hay API que proxyar ni rutas que excluir de
// la caché. Todo lo que sirve nginx es este directorio compilado.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icono.svg', 'icono-192.png', 'icono-512.png', 'icono-512-maskable.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        // La página del alumnado tiene que abrir sin red en tablets que ya la
        // han visitado una vez: se precachea todo el arranque.
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'EDUmind Hilo',
        short_name: 'Hilo',
        description: 'Sociograma de aula local-first y sin servidor. Los datos del alumnado no salen del dispositivo del docente.',
        lang: 'es',
        categories: ['education'],
        theme_color: '#17181a',
        background_color: '#ece9e1',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icono-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      // Siempre desde el código fuente del núcleo, nunca desde un dist
      // compilado: así lo que se prueba es lo que se está tocando.
      '@edumind-hilo/nucleo': resolve(import.meta.dirname, '../../packages/nucleo/src/index.ts'),
    },
  },
  server: { port: 5190 },
  preview: { port: 4190 },
})
