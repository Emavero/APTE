import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // ✅ Écoute sur tous les interfaces
    port: 5173,
    strictPort: false,
    hmr: {
      host: 'localhost',  // À adapter selon votre setup
      port: 5173,
      protocol: 'ws'
    }
  }
})
