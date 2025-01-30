import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['three'],
    exclude: ['mind-ar']
  },
  resolve: {
    alias: {
      'three/addons': path.resolve(__dirname, './node_modules/three/examples/jsm')
    }
  },
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.mtl', '**/*.obj', '**/*.mp3'],
  publicDir: 'public',
  base: './',
  build: {
    target: 'esnext',
    modulePreload: {
      polyfill: true
    }
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Assuming your API server runs on port 3000
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/saveParameters': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
