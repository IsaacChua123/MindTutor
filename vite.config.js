import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/MindTutor/",
  root: "mindtutor",
  server: {
    port: 3000,
    host: true,
    hmr: {
      overlay: false 
    }
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom'
    ],
    exclude: [
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-vis',
      'tesseract.js',
      'pdfjs-dist'
    ]
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});
