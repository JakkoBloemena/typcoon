import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(fileURLToPath(import.meta.url));

// Twee pagina's:
//  /        → SEO-landingspagina (statische HTML, geen React — snel en crawlbaar)
//  /speel/  → het spel zelf (React)
export default defineConfig({
  plugins: [react()],
  server: { port: 5175, open: '/' },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        speel: resolve(root, 'speel/index.html'),
      },
    },
  },
});
