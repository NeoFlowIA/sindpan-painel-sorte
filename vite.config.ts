import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 8080,
    strictPort: true,
    cors: {
      origin: true,
      credentials: true,
    },
    proxy: {
      '/api': {
        target: 'https://neotalks-sindpan-auth.t2wird.easypanel.host',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
      },
      '/graphql': {
        target: 'https://neotalks-hasura.t2wird.easypanel.host',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/graphql/, '/v1/graphql'),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📡 GraphQL Request:', req.method, req.url);
            // Adicionar headers necessários para Hasura
            // proxyReq.setHeader('x-hasura-admin-secret', 'your-secret-here');
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('✅ GraphQL Response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ GraphQL Proxy Error:', err.message);
          });
        },
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
