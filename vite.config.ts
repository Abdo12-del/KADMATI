import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// KADMATI Studio — build config
// The dev server binds to 0.0.0.0 and accepts any Host so it can run behind a proxy.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  optimizeDeps: {
    include: ['pptxgenjs', 'jszip'],
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      // Vite 8 builds with rolldown, which only accepts the function form of manualChunks.
      // Keeping pptxgenjs (and the chart stack) out of the entry chunk matters: the editor
      // should not download the exporter before the first slide is painted.
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (id.includes('pptxgenjs') || id.includes('pptxtojson') || id.includes('jszip')) return 'pptx'
          if (id.includes('recharts') || id.includes('victory-vendor') || id.includes('d3-')) return 'charts'
        },
      },
    },
  },
})
