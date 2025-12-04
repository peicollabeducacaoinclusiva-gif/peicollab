/**
 * Tipos relacionados à entidade Attendance (Frequência)
 */

export interface Attendance {
  id: string;
  class_id: string;
  student_id: string;
  subject_id?: string; // NULL = frequência geral do dia
  
  // Data e Presença
  data: string; // ISO date
  presenca: boolean;
  atraso_minutos: number;
  saida_antecipada_minutos: number;
  
  // Justificativa
  justificativa?: string;
  observacao?: string;
  
  // Auditoria
  registrado_por: string;
  is_synced: boolean; // Para offline PWA
  
  created_at: string;
  updated_at: string;
}

export interface AttendanceCreateInput extends Omit<Attendance, 'id' | 'created_at' | 'updated_at' | 'is_synced'> {}

export interface AttendanceUpdateInput extends Partial<Omit<Attendance, 'id' | 'student_id' | 'data' | 'created_at'>> {}

// Attendance com relações expandidas
export interface AttendanceExpanded extends Attendance {
  student?: {
    id: string;
    full_name: string;
  };
  subject?: {
    id: string;
    nome: string;
    codigo: string;
  };
  class?: {
    id: string;
    class_name: string;
  };
}

// Estatísticas de frequência
export interface AttendanceStats {
  total_aulas: number;
  presencas: number;
  faltas: number;
  atrasos: number;
  taxa_presenca: number; // Percentual
  faltas_mes_atual: number;
}

