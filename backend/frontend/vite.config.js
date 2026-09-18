import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Electron file:// üzerinden açacağı için asset yollarını göreceli oluştur.
  base: './',
})