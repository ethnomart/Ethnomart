import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {
  comingSoonEnabled,
  isWebsiteDocument,
} from './shared/site-status.ts';
const root = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root: path.join(root, 'frontend'),
  base: '/',
  plugins: [
    {
      name: 'ethnomart-site-availability',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const pathname = new URL(request.url || '/', 'http://localhost')
            .pathname;
          const accept = request.headers.accept;
          if (
            !comingSoonEnabled(process.env.ETHNOMART_COMING_SOON) ||
            !isWebsiteDocument(
              request.method || 'GET',
              pathname,
              !accept ||
                accept.includes('text/html') ||
                accept.includes('*/*'),
            )
          )
            return next();
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.setHeader('Cache-Control', 'no-store');
          response.setHeader('X-Robots-Tag', 'noindex, nofollow');
          response.end(
            readFileSync(
              path.join(root, 'frontend/public/coming-soon.html'),
            ),
          );
        });
      },
    },
    react(),
    tailwindcss(),
  ],
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
    proxy: {
      '/api': { target: 'http://127.0.0.1:3002', changeOrigin: false },
    },
  },
});
