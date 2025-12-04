/**
 * Geração dinâmica de sitemap.xml
 * Pode ser usado como endpoint de API ou gerado estaticamente
 */

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemap(urls: SitemapUrl[]): string {
  const urlEntries = urls.map((url) => {
    const lastmod = url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>\n` : '';
    const changefreq = url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>\n` : '';
    const priority = url.priority !== undefined ? `    <priority>${url.priority}</priority>\n` : '';

    return `  <url>\n    <loc>${url.loc}</loc>\n${lastmod}${changefreq}${priority}  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * URLs padrão para o sitemap da Landing
 */
export function getLandingSitemapUrls(baseUrl: string = 'https://peicollab.com.br'): SitemapUrl[] {
  const now = new Date().toISOString().split('T')[0];

  return [
    {
      loc: `${baseUrl}/`,
      lastmod: now,
      changefreq: 'daily',
      priority: 1.0,
    },
    {
      loc: `${baseUrl}/sobre`,
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/contato`,
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.7,
    },
    {
      loc: `${baseUrl}/blog`,
      lastmod: now,
      changefreq: 'daily',
      priority: 0.9,
    },
  ];
}

