import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// GitHub Pages serve o site em /novo_portifolio/, não na raiz do domínio.
// Em dev o base continua '/' para não poluir a URL do localhost.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/novo_portifolio/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: true,
  },
}));
