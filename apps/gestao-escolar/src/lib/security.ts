import { z } from 'zod';

/**
 * Validação de segurança para inputs
 */

// Schema para validação de CPF
export const cpfSchema = z
  .string()
  .regex(/^\d{11}$/, 'CPF deve conter 11 dígitos')
  .refine((cpf) => {
    // Validação básica de CPF
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false; // Todos os dígitos iguais
    
    // Validação de dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;

    return true;
  }, 'CPF inválido');

// Schema para validação de email
export const emailSchema = z.string().email('Email inválido');

// Schema para validação de telefone brasileiro
export const phoneSchema = z
  .string()
  .regex(/^(\+55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}-?\d{4})$/, 'Telefone inválido');

// Schema para validação de CEP
export const cepSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP inválido');

// Schema para sanitização de strings
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove tags HTML básicas
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 10000); // Limite de tamanho
}

// Schema para validação de SQL injection (básico)
export function validateNoSQLInjection(input: string): boolean {
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', '--', '/*', '*/',
  ];
  
  const upperInput = input.toUpperCase();
  return !sqlKeywords.some(keyword => upperInput.includes(keyword));
}

// Schema para validação de XSS (básico)
export function validateNoXSS(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  
  return !xssPatterns.some(pattern => pattern.test(input));
}

// Helper para validar e sanitizar input
export function validateAndSanitize(input: string): string {
  if (!validateNoSQLInjection(input)) {
    throw new Error('Input contém caracteres não permitidos');
  }
  if (!validateNoXSS(input)) {
    throw new Error('Input contém código potencialmente perigoso');
  }
  return sanitizeString(input);
}

// Schema para validação de UUID
export const uuidSchema = z.string().uuid('UUID inválido');

// Schema para validação de data
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: YYYY-MM-DD)');

// Schema para validação de ano letivo
export const academicYearSchema = z
  .number()
  .int('Ano letivo deve ser um número inteiro')
  .min(2000, 'Ano letivo muito antigo')
  .max(2100, 'Ano letivo muito futuro');

