import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
}

/**
 * Componente para gerenciar meta tags e SEO
 */
export function SEOHead({
  title = 'PEI Collab - Gestão Escolar',
  description = 'Sistema de Gestão Escolar para administração de alunos, profissionais, turmas e disciplinas',
  keywords = 'gestão escolar, educação, alunos, professores, turmas',
  ogImage = '/og-image.png',
  ogType = 'website',
  canonical,
}: SEOHeadProps) {
  const fullTitle = title.includes('PEI Collab') ? title : `${title} | PEI Collab`;
  const canonicalUrl = canonical || window.location.href;

  return (
    <Helmet>
      {/* Meta tags básicas */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Outras meta tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="PEI Collab" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Helmet>
  );
}

