import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // em desenvolvimento o /api vai para o backend local; assim o cookie de
    // sessao fica no mesmo dominio do site (em producao a vercel faz o mesmo)
    proxy: {
      '/api': process.env.E2E_API || 'http://127.0.0.1:8000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
