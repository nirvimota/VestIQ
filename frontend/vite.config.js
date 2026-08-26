import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('lucide-react')) return 'lucide';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('socket.io-client')) return 'socket';
            if (id.includes('react')) return 'vendor';
          }
        },
      },
    },
  },
}));