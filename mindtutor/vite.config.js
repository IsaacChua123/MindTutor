import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: ".",
  server: {
    port: 3000,
    host: true,
    // Optimize for development performance
    hmr: {
      overlay: false // Disable error overlay for better performance
    }
  },
  build: {
    outDir: "dist",
    // Let Vite handle chunking automatically to avoid conflicts with dynamic imports
    rollupOptions: {
      output: {
        // Automatic chunking - no manual chunks to prevent dynamic import conflicts
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
    // Only include essential dependencies for faster startup
    include: [
      'react',
      'react-dom'
    ],
    exclude: [
      // Exclude heavy libraries from pre-bundling to speed up dev startup
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-vis',
      'tesseract.js',
      'pdfjs-dist'
    ]
  },
  // Enable faster builds in development
  esbuild: {
    // Reduce logging in development
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});
