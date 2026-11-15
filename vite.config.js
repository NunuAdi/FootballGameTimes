import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/FootballGameTimes/',
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
        'sounds/one-minute.mp3',
        'sounds/thirty-seconds.mp3',
        'sounds/countdown-end.mp3',
      ],
      manifest: {
        id: '/FootballGameTimes/',
        name: 'שעון משחק 7 דקות',
        short_name: 'שעון משחק',
        description: 'טיימר משחק כדורגל של 7 דקות למגרש, עם שלט בלוטות׳ וצפירה.',
        lang: 'he',
        dir: 'rtl',
        start_url: '/FootballGameTimes/',
        scope: '/FootballGameTimes/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#020617',
        theme_color: '#020617',
        categories: ['sports'],
        icons: [
          { src: '/FootballGameTimes/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/FootballGameTimes/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/FootballGameTimes/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,mp3,woff2,webmanifest}'],
        navigateFallback: '/FootballGameTimes/index.html',
        navigateFallbackDenylist: [
          /^\/FootballGameTimes\/sw\.js$/,
          /^\/FootballGameTimes\/workbox-.*\.js$/,
          /^\/FootballGameTimes\/manifest\.webmanifest$/,
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
})
