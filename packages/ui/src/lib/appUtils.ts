/**
 * Utilitários para identificar e gerenciar apps no sistema
 */

/**
 * Identifica o app atual baseado na URL/hostname
 */
export function getCurrentAppId(): string {
  if (typeof window === 'undefined') return 'pei-collab';
  
  try {
    const url = window.location.href;
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Verificar variável de ambiente primeiro (se disponível)
    const envAppId = import.meta.env.VITE_APP_ID;
    if (envAppId) return envAppId;
    
    // Mapear domínios/portas para app IDs
    if (hostname.includes('gestao-escolar') || url.includes(':5174')) {
      return 'gestao-escolar';
    }
    if (hostname.includes('plano-aee') || url.includes(':5175')) {
      return 'plano-aee';
    }
    if (hostname.includes('planejamento') || url.includes(':5176')) {
      return 'planejamento';
    }
    if (hostname.includes('atividades') || url.includes(':5178') && !url.includes('portal')) {
      return 'atividades';
    }
    if (hostname.includes('blog') || url.includes(':5179')) {
      return 'blog';
    }
    if (hostname.includes('portal-responsavel') || url.includes(':5180')) {
      return 'portal-responsavel';
    }
    if (hostname.includes('transporte-escolar') || url.includes(':5181')) {
      return 'transporte-escolar';
    }
    if (hostname.includes('merenda-escolar') || url.includes(':5182')) {
      return 'merenda-escolar';
    }
    if (hostname.includes('pei-collab') || url.includes(':8080') || url.includes(':8081')) {
      return 'pei-collab';
    }
    
    // Default: pei-collab
    return 'pei-collab';
  } catch {
    return 'pei-collab';
  }
}

/**
 * Retorna o nome do app baseado no ID
 */
export function getAppName(appId: string): string {
  const appNames: Record<string, string> = {
    'pei-collab': 'PEI Collab',
    'gestao-escolar': 'Gestão Escolar',
    'plano-aee': 'Plano de AEE',
    'planejamento': 'Planejamento',
    'atividades': 'Atividades',
    'blog': 'Blog',
    'portal-responsavel': 'Portal do Responsável',
    'transporte-escolar': 'Transporte Escolar',
    'merenda-escolar': 'Merenda Escolar',
  };
  
  return appNames[appId] || 'PEI Collab';
}

/**
 * Retorna o caminho do logo do app baseado no ID
 */
export function getAppLogo(appId: string): string {
  // Por padrão, todos os apps usam /logo.png
  // Mas pode ser customizado por app se necessário
  const appLogos: Record<string, string> = {
    'pei-collab': '/logo.png',
    'gestao-escolar': '/logo.png',
    'plano-aee': '/logo.png',
    'planejamento': '/logo.png',
    'atividades': '/logo.png',
    'blog': '/logo.png',
    'portal-responsavel': '/logo.png',
    'transporte-escolar': '/logo.png',
    'merenda-escolar': '/logo.png',
  };
  
  return appLogos[appId] || '/logo.png';
}

