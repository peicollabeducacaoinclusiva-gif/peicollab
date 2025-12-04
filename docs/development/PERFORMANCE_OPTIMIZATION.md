# Guia de Otimização de Performance - PEI Collab

## Metas de Performance

### Web Vitals

- **LCP (Largest Contentful Paint)**: < 2.5s
- **INP (Interaction to Next Paint)**: < 200ms
- **FCP (First Contentful Paint)**: < 1.8s
- **TTFB (Time to First Byte)**: < 800ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FID (First Input Delay)**: < 100ms

## Otimizações Implementadas

### 1. Code Splitting

**Configuração no Vite:**

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
        'supabase-vendor': ['@supabase/supabase-js'],
      },
    },
  },
}
```

**Benefícios:**
- Reduz tamanho do bundle inicial
- Permite cache independente de vendors
- Melhora tempo de carregamento inicial

### 2. Lazy Loading

**Uso do componente LazyLoad:**

```tsx
import { LazyLoad, createLazyComponent } from '@pei/ui';

// Para componentes
const HeavyComponent = createLazyComponent(() => import('./HeavyComponent'));

// Para rotas
const Dashboard = lazyRoute(() => import('./pages/Dashboard'));

// Com fallback customizado
<LazyLoad fallback={<CustomLoader />}>
  <HeavyComponent />
</LazyLoad>
```

**Benefícios:**
- Carrega componentes apenas quando necessário
- Reduz bundle inicial
- Melhora LCP e FCP

### 3. Compressão e Minificação

**Configuração no Vite:**

```typescript
build: {
  target: 'esnext',
  minify: 'esbuild',
  sourcemap: false,
  cssCodeSplit: true,
  reportCompressedSize: true,
}
```

**Benefícios:**
- Reduz tamanho dos arquivos
- Melhora tempo de download
- Melhora TTFB

### 4. Tree Shaking

**Configuração no Vite:**

```typescript
esbuild: {
  legalComments: 'none',
  treeShaking: true,
}
```

**Benefícios:**
- Remove código não utilizado
- Reduz bundle size
- Melhora performance geral

### 5. Cache Strategy

**Service Worker (PWA):**

- Cache First para assets estáticos
- Network First para API calls
- Cache de imagens por 30 dias

## Monitoramento

### Hook usePerformanceMetrics

```tsx
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';

function MyComponent() {
  const { vitals, isHealthy, violations } = usePerformanceMetrics('gestao-escolar');

  if (!isHealthy) {
    console.warn('Violações de performance:', violations);
  }

  return (
    <div>
      LCP: {vitals.lcp}ms
      INP: {vitals.inp}ms
    </div>
  );
}
```

### Dashboard de Observabilidade

Acesse `/observability` no app Gestão Escolar para ver:
- Web Vitals em tempo real
- Estatísticas de performance agregadas
- Alertas de violação de thresholds

## Boas Práticas

### 1. Imagens

- Use formatos modernos (WebP, AVIF)
- Implemente lazy loading de imagens
- Otimize tamanho antes do upload
- Use `loading="lazy"` em imagens abaixo do fold

### 2. Fontes

- Use `font-display: swap`
- Preload de fontes críticas
- Subset de fontes quando possível

### 3. JavaScript

- Evite imports desnecessários
- Use dynamic imports para código não crítico
- Minimize re-renders com React.memo
- Use useMemo e useCallback quando apropriado

### 4. CSS

- Evite CSS não utilizado
- Use CSS-in-JS com cuidado (prefira Tailwind)
- Minimize especificidade
- Use CSS variables para temas

### 5. API Calls

- Implemente debounce/throttle
- Use React Query para cache
- Implemente paginação
- Use optimistic updates quando possível

## Ferramentas de Análise

### Lighthouse

```bash
# Executar Lighthouse
npx lighthouse http://localhost:5174 --view
```

### Web Vitals Extension

Instale a extensão do Chrome para monitorar Web Vitals em tempo real.

### Bundle Analyzer

```bash
# Analisar bundle size
pnpm build --analyze
```

## Checklist de Performance

- [ ] LCP < 2.5s
- [ ] INP < 200ms
- [ ] FCP < 1.8s
- [ ] TTFB < 800ms
- [ ] CLS < 0.1
- [ ] Bundle inicial < 200KB (gzipped)
- [ ] Imagens otimizadas
- [ ] Fontes otimizadas
- [ ] Code splitting implementado
- [ ] Lazy loading implementado
- [ ] Cache strategy configurada
- [ ] Service Worker ativo (PWA)

## Troubleshooting

### LCP Alto

1. Otimize imagens grandes
2. Preload recursos críticos
3. Reduza JavaScript bloqueante
4. Use CDN para assets estáticos

### INP Alto

1. Otimize event handlers
2. Use debounce/throttle
3. Evite JavaScript pesado no main thread
4. Use Web Workers para processamento pesado

### Bundle Grande

1. Analise com bundle analyzer
2. Identifique dependências grandes
3. Use code splitting
4. Considere alternativas mais leves

## Referências

- [Web Vitals](https://web.dev/vitals/)
- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

