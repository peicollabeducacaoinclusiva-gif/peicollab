import { useEffect } from 'react';
import { getLandingSitemapUrls, generateSitemap } from '../utils/sitemap';

/**
 * Página que gera sitemap.xml dinamicamente
 * Pode ser servida como /sitemap.xml
 */
export default function Sitemap() {
  useEffect(() => {
    const baseUrl = window.location.origin;
    const urls = getLandingSitemapUrls(baseUrl);
    const sitemap = generateSitemap(urls);

    // Criar blob e fazer download ou servir como XML
    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);

    // Se estiver em uma rota /sitemap.xml, servir o conteúdo
    if (window.location.pathname === '/sitemap.xml') {
      // Redirecionar para o conteúdo XML
      window.location.href = url;
    }
  }, []);

  return null;
}

/**
 * Função para gerar sitemap como resposta HTTP
 * Usar em Edge Function ou API route
 */
export function sitemapHandler(baseUrl: string) {
  const urls = getLandingSitemapUrls(baseUrl);
  const sitemap = generateSitemap(urls);

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
    },
  });
}

