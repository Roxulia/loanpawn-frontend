import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    host: true,
    allowedHosts: [
      '.loanpawn.1morebit.tech' ,// allow all subdomains
      '.loanpawntest.1morebit.tech' // allow all subdomains
    ]
  }
})
