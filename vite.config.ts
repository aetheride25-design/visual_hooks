import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: path.resolve(import.meta.dirname, 'app'),
  plugins: [react()],
  server: { fs: { allow: [import.meta.dirname] } },
});
