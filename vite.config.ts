import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "0.0.0.0", // Explicitly set host to listen on all network interfaces
    // port: 8080, // Removed to allow dynamic host/port, or set by package.json
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // No rewrite needed as backend routes already include /api
      },
    },
    // Add allowedHosts to prevent blocked requests from ngrok
    allowedHosts: ["unwidened-lorette-unlively.ngrok-free.dev"],
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));