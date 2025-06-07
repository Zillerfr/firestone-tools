import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/firestone-tools/", // Assurez-vous que cette base est correcte et se termine par un slash
})