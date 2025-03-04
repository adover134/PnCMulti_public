import { defineConfig } from 'vite';

export default defineConfig({
  // Your custom Vite config here
  server: {
    port: 8080,
    open: "/index.html"
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        app: "./index.html"
      },
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  // base: "/PnC-Online/"
});