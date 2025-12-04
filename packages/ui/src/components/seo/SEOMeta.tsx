import { Helmet } from 'react-helmet-async';

export interface SEOMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  noindex?: boolean;
  nofollow?: boolean;
  children?: React.ReactNode;
}

/**
 * Componente para gerenciar meta tags SEO
 * Suporta Open Graph, Twitter Cards e meta tags padrão
 */
export function SEOMeta({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noindex = false,
  nofollow = false,
  children,
}: SEOMetaProps) {
  const siteName = 'PEI Collab';
  const defaultTitle = `${siteName} - Sistema de Gestão Educacional Inclusiva`;
  const defaultDescription = 'Sistema completo para gestão educacional inclusiva, PEI, AEE e planejamento pedagógico.';
  const defaultImage = '/logo.png';

  const finalTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalImage = ogImage || defaultImage;
  const finalCanonical = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');

  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
  ].join(', ');

  return (
    <Helmet>
      {/* Meta tags básicas */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={finalCanonical} />

      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />

      {/* Meta tags adicionais */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#3b82f6" />
      <meta name="format-detection" content="telephone=no" />

      {children}
    </Helmet>
  );
}

/**
 * Hook para atualizar meta tags dinamicamente
 */
export function useSEO(meta: SEOMetaProps) {
  return <SEOMeta {...meta} />;
}

