import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // Explicitly set host to listen on all network interfaces
    port: 32101, // Explicitly set the port here
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Default backend port for Vite dev proxy
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
  define: {
    // Inject VITE_API_BASE_URL based on environment
    'import.meta.env.VITE_API_BASE_URL': mode === 'production' || process.env.ELECTRON_BUILD ? JSON.stringify('http://localhost:' + process.env.BACKEND_PORT) : JSON.stringify('http://localhost:3000'),
  },
}));