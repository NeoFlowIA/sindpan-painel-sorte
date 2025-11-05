import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// Obter endpoint do Hasura do ambiente com fallback para desenvolvimento
const hasuraEndpoint = process.env.HASURA_ENDPOINT || 'https://infra-hasura-sindpan.k3p3ex.easypanel.host/v1/graphql';

// Log da configuração em desenvolvimento
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  console.log('🔧 Vite Configuration:');
  console.log('📍 HASURA_ENDPOINT:', hasuraEndpoint);
  console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'development');
}

const hasuraUrl = new URL(hasuraEndpoint);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 3000,
    strictPort: false,
    cors: {
      origin: true,
      credentials: true,
    },
    proxy: {
      '/api': {
        target: 'https://infra-hasura-sindpan.k3p3ex.easypanel.host',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Proxy /api error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📤 Proxying /api request:', req.method, req.url);
          });
        },
      },
      '/graphql': {
        target: hasuraUrl.origin,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/graphql/, hasuraUrl.pathname),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Proxy /graphql error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📤 Proxying GraphQL request:', req.method, hasuraUrl.origin + hasuraUrl.pathname);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📥 GraphQL response status:', proxyRes.statusCode);
          });
        },
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
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon1.ico', 'robots.txt'],
      // Gerar ícones automaticamente (opcional - você pode criar manualmente)
      // iconPaths: {
      //   favicon32: 'favicon1.ico',
      //   favicon16: 'favicon1.ico',
      //   appleTouchIcon: 'favicon1.ico',
      //   maskIcon: 'favicon1.ico',
      //   msTileImage: 'favicon1.ico'
      // },
      manifest: {
        name: 'Sindpan Painel Sorte',
        short_name: 'Sindpan',
        description: 'Painel de sorteios e cupons Sindpan',
        theme_color: '#FF9712',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/infra-hasura-sindpan\.k3p3ex\.easypanel\.host\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'hasura-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false // Desabilitar em desenvolvimento para evitar problemas
      }
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Garantir que os arquivos tenham hash único para cache busting
    rollupOptions: {
      output: {
        // Garantir que os assets tenham hash no nome
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif/i.test(ext)) {
            return `assets/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Aumentar o limite de avisos de tamanho (opcional)
    chunkSizeWarningLimit: 1000,
    // Gerar source maps em produção (opcional, pode ser removido se não necessário)
    sourcemap: false,
  },
}));
