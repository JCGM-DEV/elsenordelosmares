import { defineConfig } from 'vite';

export default defineConfig({
  base: '/elsenordelosmares/', // Matches the repository name for correct subpath routing
  build: {
    outDir: 'dist',
  }
});
