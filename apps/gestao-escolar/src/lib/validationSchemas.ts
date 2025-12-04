import { z } from 'zod';

/**
 * Validação de CPF
 */
function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // Todos os dígitos iguais

  let sum = 0;
  let remainder;

  // Validação do primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

  // Validação do segundo dígito verificador
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
 * Validação de telefone brasileiro
 */
function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

/**
 * Validação de CEP brasileiro
 */
function validateCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
}

/**
 * Schema base para validação de estudante
 */
export const studentSchema = z.object({
  // Dados pessoais
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200, 'Nome muito longo'),
  date_of_birth: z.string().optional().or(z.literal('')),
  cpf: z.string().optional().refine(
    (val) => !val || validateCPF(val),
    { message: 'CPF inválido' }
  ),
  rg: z.string().optional(),
  birth_certificate: z.string().optional(),
  naturalidade: z.string().optional(),
  nationality: z.string().default('Brasileira'),

  // Endereço
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2, 'Estado deve ter 2 caracteres').optional(),
  zip_code: z.string().optional().refine(
    (val) => !val || validateCEP(val),
    { message: 'CEP inválido' }
  ),

  // Contatos
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().refine(
    (val) => !val || validatePhone(val),
    { message: 'Telefone inválido' }
  ),

  // Dados familiares
  mother_name: z.string().optional(),
  father_name: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_cpf: z.string().optional().refine(
    (val) => !val || validateCPF(val),
    { message: 'CPF do responsável inválido' }
  ),
  guardian_phone: z.string().optional().refine(
    (val) => !val || validatePhone(val),
    { message: 'Telefone do responsável inválido' }
  ),
  guardian_email: z.string().email('Email do responsável inválido').optional().or(z.literal('')),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional().refine(
    (val) => !val || validatePhone(val),
    { message: 'Telefone de emergência inválido' }
  ),

  // Dados escolares
  school_id: z.string().uuid('ID da escola inválido').optional(),
  class_id: z.string().uuid('ID da turma inválido').optional(),
  registration_number: z.string().optional(),
  student_id: z.string().optional(),
  enrollment_date: z.string().optional(),

  // Dados de saúde
  health_info: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),

  // Necessidades especiais
  has_special_needs: z.boolean().default(false),
  special_needs_types: z.array(z.string()).default([]),
  family_guidance_notes: z.string().optional(),
}).refine(
  (data) => {
    // Se tem necessidades especiais, deve ter pelo menos um tipo
    if (data.has_special_needs && data.special_needs_types.length === 0) {
      return false;
    }
    return true;
  },
  {
    message: 'Selecione pelo menos um tipo de necessidade especial',
    path: ['special_needs_types'],
  }
);

export type StudentFormData = z.infer<typeof studentSchema>;

/**
 * Schema para validação de profissional
 */
export const professionalSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional().refine(
    (val) => !val || validatePhone(val),
    { message: 'Telefone inválido' }
  ),
  professional_role: z.string().min(1, 'Função é obrigatória'),
  school_id: z.string().uuid('Selecione uma escola'),
  registration_number: z.string().optional(),
  specialization: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type ProfessionalFormData = z.infer<typeof professionalSchema>;

/**
 * Schema genérico para validação de importação (CSV/Excel)
 */
export const importRecordSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  full_name: z.string().min(1, 'Nome completo é obrigatório').optional(),
  cpf: z.string().optional().refine(
    (val) => !val || validateCPF(val),
    { message: 'CPF inválido' }
  ),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().refine(
    (val) => !val || validatePhone(val),
    { message: 'Telefone inválido' }
  ),
  date_of_birth: z.string().optional(),
}).passthrough(); // Permite campos adicionais

export type ImportRecordData = z.infer<typeof importRecordSchema>;

/**
 * Utilitário para validar um registro usando schema Zod
 */
export function validateRecordWithSchema<T extends z.ZodTypeAny>(
  schema: T,
  record: unknown
): { valid: boolean; errors: Array<{ field: string; message: string }> } {
  const result = schema.safeParse(record);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return { valid: false, errors };
}

/**
 * Utilitário para formatar CPF
 */
export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
}

/**
 * Utilitário para formatar telefone
 */
export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  return phone;
}

/**
 * Utilitário para formatar CEP
 */
export function formatCEP(cep: string): string {
  const clean = cep.replace(/\D/g, '');
  if (clean.length === 8) {
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  }
  return cep;
}
