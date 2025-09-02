import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Obter endpoint do Hasura do ambiente
const hasuraEndpoint = process.env.HASURA_ENDPOINT;
if (!hasuraEndpoint) {
  throw new Error('HASURA_ENDPOINT is not defined');
}
const hasuraUrl = new URL(hasuraEndpoint);

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
        target: hasuraUrl.origin,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/graphql/, hasuraUrl.pathname),
        secure: true,
      },
    },
  },
  define: {
    'import.meta.env.HASURA_ENDPOINT': JSON.stringify(hasuraEndpoint),
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
