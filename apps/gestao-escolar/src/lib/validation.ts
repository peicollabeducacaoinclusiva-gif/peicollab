import { z } from 'zod';
import { 
  cpfSchema, 
  emailSchema, 
  phoneSchema, 
  cepSchema,
  uuidSchema,
  dateSchema,
  academicYearSchema,
  validateAndSanitize,
} from './security';

/**
 * Schemas de validação para formulários e APIs
 */

// Schema para criação de aluno
export const createStudentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200),
  cpf: cpfSchema.optional(),
  rg: z.string().optional(),
  date_of_birth: dateSchema,
  sexo: z.enum(['M', 'F', 'Outro']).optional(),
  raca_cor: z.string().optional(),
  nis: z.string().optional(),
  numero_bolsa_familia: z.string().optional(),
  school_id: uuidSchema,
  tenant_id: uuidSchema,
});

// Schema para atualização de aluno
export const updateStudentSchema = createStudentSchema.partial();

// Schema para criação de matrícula
export const createEnrollmentSchema = z.object({
  student_id: uuidSchema,
  class_id: uuidSchema,
  ano_letivo: academicYearSchema,
  status: z.enum(['Matriculado', 'Transferido', 'Evadido', 'Concluído']).default('Matriculado'),
  data_matricula: dateSchema,
});

// Schema para lançamento de frequência
export const attendanceSchema = z.object({
  enrollment_id: uuidSchema,
  date: dateSchema,
  present: z.boolean(),
  justified: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

// Schema para lançamento de nota
export const gradeSchema = z.object({
  student_id: uuidSchema,
  enrollment_id: uuidSchema,
  subject_id: uuidSchema,
  period: z.string(),
  grade_value: z.number().min(0).max(10),
  grade_type: z.enum(['numeric', 'conceptual', 'descriptive']),
});

// Schema para criação de profissional
export const createProfessionalSchema = z.object({
  full_name: z.string().min(3).max(200),
  cpf: cpfSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  school_id: uuidSchema,
  tenant_id: uuidSchema,
  professional_role: z.string(),
});

// Schema para criação de escola
export const createSchoolSchema = z.object({
  school_name: z.string().min(3).max(200),
  codigo_inep: z.string().optional(),
  municipio_ibge: z.string().min(7).max(7),
  uf: z.string().length(2),
  cep: cepSchema.optional(),
  zona: z.enum(['urbana', 'rural']),
  localizacao: z.string().optional(),
  tenant_id: uuidSchema,
});

// Schema para exportação Educacenso
export const educacensoExportSchema = z.object({
  tenant_id: uuidSchema,
  school_id: uuidSchema.optional(),
  academic_year: academicYearSchema,
});

// Schema para validação de aprovação
export const approvalValidationSchema = z.object({
  student_id: uuidSchema,
  enrollment_id: uuidSchema,
  academic_year: academicYearSchema.optional(),
});

// Helper para validar e sanitizar dados
export function validateStudent(data: unknown) {
  return createStudentSchema.parse(data);
}

export function validateEnrollment(data: unknown) {
  return createEnrollmentSchema.parse(data);
}

export function validateAttendance(data: unknown) {
  return attendanceSchema.parse(data);
}

export function validateGrade(data: unknown) {
  return gradeSchema.parse(data);
}

export function validateProfessional(data: unknown) {
  return createProfessionalSchema.parse(data);
}

export function validateSchool(data: unknown) {
  return createSchoolSchema.parse(data);
}

// Helper para sanitizar strings de input
export function sanitizeInput(input: string): string {
  return validateAndSanitize(input);
}

