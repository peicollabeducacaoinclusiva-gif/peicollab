/**
 * Tipos relacionados à entidade Enrollment (Matrículas)
 */

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  school_id: string;
  
  // Ano Letivo
  ano_letivo: number; // 2025, 2026
  data_matricula: string;
  
  // Tipo de Matrícula
  modalidade: 'Regular' | 'Transferência' | 'Rematrícula';
  escola_origem?: string; // Se transferência
  
  // Status
  status: 'Matriculado' | 'Transferido' | 'Cancelado' | 'Concluído' | 'Abandonou';
  motivo_saida?: string;
  data_saida?: string;
  
  observacoes?: string;
  
  // Auditoria
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type EnrollmentStatus = Enrollment['status'];
export type EnrollmentModalidade = Enrollment['modalidade'];

export interface EnrollmentCreateInput extends Omit<Enrollment, 'id' | 'created_at' | 'updated_at'> {}

export interface EnrollmentUpdateInput extends Partial<Omit<Enrollment, 'id' | 'student_id' | 'created_at'>> {}

// Enrollment com relações expandidas
export interface EnrollmentExpanded extends Enrollment {
  student?: {
    id: string;
    full_name: string;
    codigo_identificador?: string;
  };
  class?: {
    id: string;
    class_name: string;
    education_level: string;
  };
  school?: {
    id: string;
    school_name: string;
  };
}

