import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string
}
const appVersion = packageJson.version
const appBuildTime = new Date().toISOString()
const appBuildId = `${appVersion}-${appBuildTime.replace(/[:.]/g, '-')}`

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_BUILD_TIME__: JSON.stringify(appBuildTime),
    __APP_BUILD_ID__: JSON.stringify(appBuildId),
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'LonePawn',
        short_name: 'LonePawn',
        description: 'Pawnshop management for LonePawn tenant users',
        theme_color: '#00677f',
        background_color: '#f5f7f8',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/loanpawn-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/loanpawn-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/loanpawn-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cacheId: `lonepawn-${appBuildId}`,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    host: true,
    allowedHosts: [
      '.loanpawn.1morebit.tech' ,// allow all subdomains
      '.loanpawntest.1morebit.tech' // allow all subdomains
    ]
  }
})
