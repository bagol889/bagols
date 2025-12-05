import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Konfigurasi agar process.env bisa dibaca di browser
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env': env
    }
  }
})
