import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { existsSync } from 'fs';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Helper para resolver módulos: tenta do app primeiro, depois do workspace root
function resolveModule(moduleName: string): string {
  const appPath = path.resolve(__dirname, `./node_modules/${moduleName}`);
  const rootPath = path.resolve(__dirname, `../../node_modules/${moduleName}`);
  const pnpmPath = path.resolve(__dirname, `../../node_modules/.pnpm/node_modules/${moduleName}`);
  
  if (existsSync(appPath)) return appPath;
  if (existsSync(rootPath)) return rootPath;
  if (existsSync(pnpmPath)) return pnpmPath;
  return appPath;
}

// Plugin para reescrever imports @/lib/utils do pacote UI
function rewriteUIImports(): Plugin {
  const uiSrcPath = path.resolve(__dirname, '../../packages/ui/src');
  const utilsPath = path.resolve(uiSrcPath, 'lib/utils.ts');
  
  return {
    name: 'rewrite-ui-imports',
    enforce: 'pre',
    resolveId(id, importer) {
      if (id === '@/lib/utils') {
        if (importer) {
          const normalizedImporter = importer.replace(/\\/g, '/').toLowerCase();
          const normalizedUISrc = uiSrcPath.replace(/\\/g, '/').toLowerCase();
          
          if (normalizedImporter.includes('packages/ui/src') || 
              normalizedImporter.includes(normalizedUISrc)) {
            return utilsPath;
          }
        }
      }
      return null;
    },
    transform(code, id) {
      if (id && (id.endsWith('.tsx') || id.endsWith('.ts'))) {
        const normalizedId = id.replace(/\\/g, '/');
        const normalizedUISrc = uiSrcPath.replace(/\\/g, '/');
        
        if (normalizedId.includes('packages/ui/src') && code.includes('@/lib/utils')) {
          const fileDir = path.dirname(id);
          const relativePath = path.relative(fileDir, utilsPath).replace(/\\/g, '/');
          const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
          
          return {
            code: code.replace(/from\s+["']@\/lib\/utils["']/g, `from "${importPath}"`),
            map: null,
          };
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    rewriteUIImports(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Portal do Responsável - PEI Collab',
        short_name: 'Portal Responsável',
        description: 'Portal para responsáveis acompanharem informações escolares dos filhos',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait-primary',
        categories: ['education'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5180,
    host: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pei/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@pei/database': path.resolve(__dirname, '../../packages/database/src'),
      '@pei/auth': path.resolve(__dirname, '../../packages/auth/src'),
      '@/lib/utils': path.resolve(__dirname, '../../packages/ui/src/lib/utils'),
      'zod': resolveModule('zod'),
      'sonner': resolveModule('sonner'),
      'next-themes': resolveModule('next-themes'),
    },
    dedupe: ['react', 'react-dom', 'zod', 'sonner', 'next-themes', 'react-router-dom'],
    preserveSymlinks: false,
    conditions: ['import', 'module', 'browser', 'default'],
  },
  optimizeDeps: {
    include: ['zod', 'sonner', 'react-router-dom', 'next-themes'],
    esbuildOptions: {
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    },
  },
});

