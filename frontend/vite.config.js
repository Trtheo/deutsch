import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // REACT_APP_API_HOST is the name Render already uses for the API address
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: {
    port: 3000,
    proxy: { '/api': 'http://localhost:5000' }, // the backend in development
  },
  build: {
    outDir: 'build', // the folder Render, Docker and nginx serve
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    // Several tests render the whole app (sidebar, 70+ lessons); allow time on slow machines
    testTimeout: 20000,
    css: false,
  },
});
