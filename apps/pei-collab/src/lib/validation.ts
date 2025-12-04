/**
 * Biblioteca Centralizada de Validação - PEI Collab
 * 
 * Garante validação consistente e segura de todos os inputs do sistema
 * Previne SQL Injection, XSS e outros ataques de injeção
 * 
 * @security Todas as funções sanitizam e validam dados antes do uso
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS ZOD PARA VALIDAÇÃO
// ============================================================================

/**
 * Schema para validação de email
 */
export const emailSchema = z.string()
  .email('Email inválido')
  .max(255, 'Email muito longo')
  .toLowerCase()
  .trim();

/**
 * Schema para validação de senha (conforme LGPD e melhores práticas)
 */
export const passwordSchema = z.string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .max(128, 'A senha deve ter no máximo 128 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial');

/**
 * Schema para nome completo
 */
export const fullNameSchema = z.string()
  .min(3, 'Nome deve ter no mínimo 3 caracteres')
  .max(255, 'Nome muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome contém caracteres inválidos')
  .trim();

/**
 * Schema para CPF
 */
export const cpfSchema = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato XXX.XXX.XXX-XX')
  .refine(validateCPF, 'CPF inválido');

/**
 * Schema para telefone brasileiro
 */
export const phoneSchema = z.string()
  .regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX');

/**
 * Schema para CEP
 */
export const cepSchema = z.string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato XXXXX-XXX');

/**
 * Schema para UUID
 */
export const uuidSchema = z.string()
  .uuid('ID inválido');

/**
 * Schema para texto livre (com sanitização)
 */
export const safeTextSchema = z.string()
  .max(10000, 'Texto muito longo')
  .transform(sanitizeText);

/**
 * Schema para texto curto (títulos, labels)
 */
export const shortTextSchema = z.string()
  .min(1, 'Campo obrigatório')
  .max(255, 'Texto muito longo')
  .trim();

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO ESPECÍFICAS
// ============================================================================

/**
 * Valida CPF brasileiro
 */
export function validateCPF(cpf: string): boolean {
  // Remove formatação
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // Valida dígitos verificadores
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
}

/**
 * Valida CNPJ brasileiro
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  // Validação dos dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cleanCNPJ.charAt(12)) !== digit) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cleanCNPJ.charAt(13)) !== digit) return false;
  
  return true;
}

// ============================================================================
// FUNÇÕES DE SANITIZAÇÃO
// ============================================================================

/**
 * Sanitiza texto para prevenir XSS
 * Remove tags HTML e scripts perigosos
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    // Remove tags HTML
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: e data: URIs
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    // Trim
    .trim();
}

/**
 * Sanitiza HTML permitindo apenas tags seguras
 */
export function sanitizeHTML(html: string, allowedTags: string[] = ['b', 'i', 'u', 'strong', 'em', 'p', 'br']): string {
  if (!html) return '';
  
  // Remove todas as tags exceto as permitidas
  const tagPattern = new RegExp(`<(?!\\/?(${allowedTags.join('|')})\\b)[^>]+>`, 'gi');
  let sanitized = html.replace(tagPattern, '');
  
  // Sanitiza atributos
  sanitized = sanitized.replace(/(<\w+)([^>]*)(>)/gi, (match, tagStart, attributes, tagEnd) => {
    // Remove todos os atributos
    return tagStart + tagEnd;
  });
  
  return sanitized;
}

/**
 * Sanitiza SQL para prevenir SQL Injection
 * NOTA: Supabase já protege contra SQL Injection, mas esta função adiciona camada extra
 */
export function sanitizeSQL(value: string): string {
  if (!value) return '';
  
  return value
    .replace(/'/g, "''")  // Escapa aspas simples
    .replace(/;/g, '')    // Remove ponto-e-vírgula
    .replace(/--/g, '')   // Remove comentários SQL
    .replace(/\/\*/g, '') // Remove comentários multi-linha
    .replace(/\*\//g, '')
    .trim();
}

/**
 * Valida e sanitiza URL
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';
  
  try {
    const parsedUrl = new URL(url);
    
    // Apenas permite http e https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }
    
    return parsedUrl.href;
  } catch {
    return '';
  }
}

// ============================================================================
// FUNÇÕES DE FORMATAÇÃO
// ============================================================================

/**
 * Formata CPF
 */
export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ
 */
export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '');
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata telefone
 */
export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

/**
 * Formata CEP
 */
export function formatCEP(cep: string): string {
  const clean = cep.replace(/\D/g, '');
  return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO COMPOSTAS
// ============================================================================

/**
 * Valida formulário de login
 */
export function validateLoginForm(email: string, password: string): { success: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  const emailResult = emailSchema.safeParse(email);
  if (!emailResult.success) {
    errors.email = emailResult.error.issues[0].message;
  }
  
  if (!password || password.length < 8) {
    errors.password = 'Senha deve ter no mínimo 8 caracteres';
  }
  
  return {
    success: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Valida formulário de cadastro de usuário
 */
export function validateUserForm(data: {
  fullName: string;
  email: string;
  password: string;
  cpf?: string;
  phone?: string;
}): { success: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  const nameResult = fullNameSchema.safeParse(data.fullName);
  if (!nameResult.success) {
    errors.fullName = nameResult.error.issues[0].message;
  }
  
  const emailResult = emailSchema.safeParse(data.email);
  if (!emailResult.success) {
    errors.email = emailResult.error.issues[0].message;
  }
  
  const passwordResult = passwordSchema.safeParse(data.password);
  if (!passwordResult.success) {
    errors.password = passwordResult.error.issues[0].message;
  }
  
  if (data.cpf) {
    const cpfResult = cpfSchema.safeParse(data.cpf);
    if (!cpfResult.success) {
      errors.cpf = cpfResult.error.issues[0].message;
    }
  }
  
  if (data.phone) {
    const phoneResult = phoneSchema.safeParse(data.phone);
    if (!phoneResult.success) {
      errors.phone = phoneResult.error.issues[0].message;
    }
  }
  
  return {
    success: Object.keys(errors).length === 0,
    errors
  };
}

// ============================================================================
// EXPORTAÇÕES AGRUPADAS
// ============================================================================

export default {
  // Schemas
  emailSchema,
  passwordSchema,
  fullNameSchema,
  cpfSchema,
  phoneSchema,
  cepSchema,
  uuidSchema,
  safeTextSchema,
  shortTextSchema,
  
  // Validação
  validateCPF,
  validateCNPJ,
  validateLoginForm,
  validateUserForm,
  
  // Sanitização
  sanitizeText,
  sanitizeHTML,
  sanitizeSQL,
  sanitizeURL,
  
  // Formatação
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatCEP
};

