# Guia de SEO - PEI Collab

## Componente SEOMeta

Use o componente `SEOMeta` para gerenciar meta tags em cada página:

```tsx
import { SEOMeta } from '@pei/ui';

function MyPage() {
  return (
    <>
      <SEOMeta
        title="Título da Página"
        description="Descrição da página para SEO"
        keywords="palavras, chave, relevantes"
        canonicalUrl="https://peicollab.com.br/pagina"
        ogImage="/og-image.png"
        ogType="website"
      />
      {/* Conteúdo da página */}
    </>
  );
}
```

## Meta Tags Suportadas

### Básicas

- `title`: Título da página (obrigatório)
- `description`: Descrição para resultados de busca
- `keywords`: Palavras-chave (opcional, menos relevante hoje)
- `canonicalUrl`: URL canônica para evitar conteúdo duplicado

### Open Graph

- `og:title`: Título para compartilhamento social
- `og:description`: Descrição para compartilhamento
- `og:image`: Imagem para compartilhamento (1200x630px recomendado)
- `og:type`: Tipo de conteúdo (website, article, profile)
- `og:url`: URL canônica

### Twitter Card

- `twitter:card`: Tipo de card (summary, summary_large_image)
- `twitter:title`: Título para Twitter
- `twitter:description`: Descrição para Twitter
- `twitter:image`: Imagem para Twitter

### Robots

- `noindex`: Impede indexação pela página
- `nofollow`: Impede seguir links da página

## Robots.txt

Cada app tem seu próprio `robots.txt` em `public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /auth/
Disallow: /api/
Disallow: /admin/

Sitemap: https://peicollab.com.br/sitemap.xml
```

## Sitemap.xml

### Geração Dinâmica

Use a função `generateSitemap` para gerar sitemaps dinamicamente:

```tsx
import { generateSitemap, getLandingSitemapUrls } from '@/utils/sitemap';

// Em uma API route ou Edge Function
export function GET() {
  const baseUrl = 'https://peicollab.com.br';
  const urls = getLandingSitemapUrls(baseUrl);
  const sitemap = generateSitemap(urls);

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
```

### URLs do Sitemap

Configure URLs importantes no sitemap:

```typescript
const urls: SitemapUrl[] = [
  {
    loc: 'https://peicollab.com.br/',
    lastmod: '2025-11-27',
    changefreq: 'daily',
    priority: 1.0,
  },
  {
    loc: 'https://peicollab.com.br/sobre',
    lastmod: '2025-11-27',
    changefreq: 'weekly',
    priority: 0.8,
  },
];
```

## Boas Práticas

### 1. Títulos

- Use títulos únicos e descritivos
- Mantenha entre 50-60 caracteres
- Inclua palavras-chave relevantes
- Evite duplicação

### 2. Descrições

- Use descrições únicas e atraentes
- Mantenha entre 150-160 caracteres
- Inclua call-to-action quando apropriado
- Evite duplicação

### 3. URLs Canônicas

- Sempre defina URL canônica
- Use HTTPS
- Evite parâmetros desnecessários
- Use URLs amigáveis

### 4. Imagens Open Graph

- Tamanho recomendado: 1200x630px
- Formato: PNG ou JPG
- Peso: < 1MB
- Inclua texto relevante na imagem

### 5. Estrutura de Dados

- Use dados estruturados (JSON-LD)
- Implemente Schema.org quando apropriado
- Valide com Google Rich Results Test

## Checklist de SEO

- [ ] Meta tags em todas as páginas
- [ ] Títulos únicos e descritivos
- [ ] Descrições otimizadas
- [ ] URLs canônicas definidas
- [ ] Imagens Open Graph configuradas
- [ ] robots.txt configurado
- [ ] sitemap.xml gerado
- [ ] Dados estruturados implementados
- [ ] Performance otimizada (LCP, INP)
- [ ] Acessibilidade implementada
- [ ] Mobile-friendly
- [ ] HTTPS configurado

## Ferramentas de Validação

### Google Search Console

1. Adicione propriedade
2. Verifique propriedade
3. Envie sitemap
4. Monitore performance

### Google Rich Results Test

Valide dados estruturados:
https://search.google.com/test/rich-results

### Lighthouse SEO Audit

Execute audit de SEO:
```bash
npx lighthouse http://localhost:5174 --only-categories=seo
```

## Troubleshooting

### Páginas não indexadas

1. Verifique robots.txt
2. Verifique meta tags noindex
3. Verifique sitemap.xml
4. Verifique Google Search Console

### Duplicação de conteúdo

1. Use URLs canônicas
2. Evite parâmetros desnecessários
3. Consolide conteúdo similar

### Performance afeta SEO

1. Otimize Web Vitals
2. Melhore LCP e INP
3. Reduza bundle size
4. Otimize imagens

## Referências

- [Google Search Central](https://developers.google.com/search)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/)

