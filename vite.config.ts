import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
const root = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root: path.join(root, 'frontend'),
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.join(root, 'frontend/src'),
      '@workspace/api-client-react': path.join(
        root,
        'shared/api-client/index.ts',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: { outDir: path.join(root, 'dist/public'), emptyOutDir: true },
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:3002', changeOrigin: false } },
  },
});
