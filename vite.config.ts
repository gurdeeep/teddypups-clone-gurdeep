import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep the libraries in their own long-lived chunk so app changes do not bust their cache.
        manualChunks: {
          vendor: ['react', 'react-dom', 'motion', 'lenis', 'html-react-parser'],
        },
      },
    },
  },
});
