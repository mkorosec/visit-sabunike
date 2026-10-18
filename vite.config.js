import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  server: { port: 5180, strictPort: true },
  preview: { port: 5181, strictPort: true },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        twin: resolve(import.meta.dirname, 'twin.html'),
      },
      // Name the shared vendor chunks after what they contain (bundle audits, caching).
      output: {
        manualChunks: (id) => (id.includes('node_modules/three/') ? 'three' : id.includes('node_modules/leaflet/') ? 'leaflet' : undefined),
      },
    },
  },
});
