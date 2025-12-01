import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
// import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // tsconfigPaths({
    //   projects: [path.resolve(__dirname, 'tsconfig.json')],
    // }),
  ],
  resolve: {
    alias: {
      // Alias local do app
      '@': path.resolve(__dirname, './src'),
      // Alias opcional para acessar o src raiz se necessário
      '@root': path.resolve(__dirname, '../../src'),
      // Forçar UI imports para o app local
      '@/components/ui/toast': path.resolve(__dirname, './src/components/ui/toast.tsx'),
      '@/components/ui/tooltip': path.resolve(__dirname, './src/components/ui/tooltip.tsx'),
      '@/components/ui/sonner': path.resolve(__dirname, './src/components/ui/sonner.tsx'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
    ],
  },
  server: {
    port: 8080,
    fs: {
      // Permitir importar arquivos fora do diretório do app
      allow: [
        path.resolve(__dirname, '../../'),
        path.resolve(__dirname, '../../src'),
        path.resolve(__dirname, '../../packages'),
      ],
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // UI libraries
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'ui-vendor';
            }
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // Charts
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            // PDF generation
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Query library
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            // Other vendor
            return 'vendor';
          }
          // App chunks - separar por feature
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1].split('/')[0];
            return `page-${pageName}`;
          }
          if (id.includes('/components/pei/')) {
            return 'components-pei';
          }
          if (id.includes('/components/dashboards/')) {
            return 'components-dashboards';
          }
          if (id.includes('/services/')) {
            return 'services';
          }
        },
        chunkSizeWarningLimit: 1000,
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    reportCompressedSize: true,
  },
  esbuild: {
    legalComments: 'none',
    treeShaking: true,
  },
});

