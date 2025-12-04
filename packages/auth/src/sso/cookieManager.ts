/**
 * Gerenciador de Cookies para SSO entre subdomínios
 * Permite compartilhamento de sessão entre apps em subdomínios diferentes
 */

export interface CookieOptions {
  domain?: string;
  path?: string;
  maxAge?: number;
  expires?: Date;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Obtém o domínio base para cookies compartilhados
 * Ex: app1.peicollab.com.br → .peicollab.com.br
 */
export function getBaseDomain(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const hostname = window.location.hostname;

  // Em desenvolvimento (localhost), não usar domínio compartilhado
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return '';
  }

  // Extrair domínio base (ex: peicollab.com.br)
  const parts = hostname.split('.');
  
  // Se tiver menos de 2 partes, não é um domínio válido
  if (parts.length < 2) {
    return '';
  }

  // Retornar domínio base com ponto inicial para compartilhamento entre subdomínios
  // Ex: .peicollab.com.br permite cookies em app1.peicollab.com.br, app2.peicollab.com.br, etc.
  return '.' + parts.slice(-2).join('.');
}

/**
 * Define um cookie com opções padrão para SSO
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  if (typeof document === 'undefined') {
    return;
  }

  const baseDomain = getBaseDomain();
  const defaultOptions: CookieOptions = {
    domain: baseDomain || undefined,
    path: '/',
    secure: window.location.protocol === 'https:',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias padrão
  };

  const finalOptions = { ...defaultOptions, ...options };

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (finalOptions.domain) {
    cookieString += `; domain=${finalOptions.domain}`;
  }

  if (finalOptions.path) {
    cookieString += `; path=${finalOptions.path}`;
  }

  if (finalOptions.maxAge !== undefined) {
    cookieString += `; max-age=${finalOptions.maxAge}`;
  }

  if (finalOptions.expires) {
    cookieString += `; expires=${finalOptions.expires.toUTCString()}`;
  }

  if (finalOptions.secure) {
    cookieString += `; secure`;
  }

  if (finalOptions.sameSite) {
    cookieString += `; samesite=${finalOptions.sameSite}`;
  }

  document.cookie = cookieString;
}

/**
 * Obtém o valor de um cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
}

/**
 * Remove um cookie
 */
export function removeCookie(name: string, options: CookieOptions = {}): void {
  const baseDomain = getBaseDomain();
  const defaultOptions: CookieOptions = {
    domain: baseDomain || undefined,
    path: '/',
  };

  const finalOptions = { ...defaultOptions, ...options };

  // Para remover, definir com data de expiração no passado
  setCookie(name, '', {
    ...finalOptions,
    expires: new Date(0),
    maxAge: 0,
  });
}

/**
 * Verifica se cookies são suportados
 */
export function areCookiesEnabled(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const testCookie = '__cookie_test__';
    setCookie(testCookie, '1');
    const exists = getCookie(testCookie) !== null;
    removeCookie(testCookie);
    return exists;
  } catch (error) {
    return false;
  }
}

/**
 * Obtém todos os cookies como objeto
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') {
    return {};
  }

  const cookies: Record<string, string> = {};
  const cookieStrings = document.cookie.split(';');

  for (const cookieString of cookieStrings) {
    const [name, ...valueParts] = cookieString.trim().split('=');
    if (name) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(valueParts.join('='));
    }
  }

  return cookies;
}

