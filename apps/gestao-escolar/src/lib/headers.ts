/**
 * Headers de segurança para respostas HTTP
 */

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Ajustar conforme necessário
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

/**
 * Aplicar headers de segurança em respostas
 * (Para uso em servidores/Edge Functions)
 */
export function applySecurityHeaders(headers: Headers): void {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

