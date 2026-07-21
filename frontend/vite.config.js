import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from 'tailwindcss';
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    port: 5173,
    open: true
  }
});