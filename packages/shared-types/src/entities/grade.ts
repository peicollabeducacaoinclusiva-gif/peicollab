/**
 * Tipos relacionados à entidade Grade (Notas)
 */

export interface Grade {
  id: string;
  enrollment_id: string;
  subject_id: string;
  
  // Tipo de Avaliação
  avaliacao_tipo: 'Prova' | 'Trabalho' | 'Projeto' | 'Participação' | 'Recuperação' | 'Simulado';
  periodo: string; // "1BIM", "2BIM", "SEM1", "ANUAL"
  
  // Nota
  nota_valor?: number; // 0.00 a 10.00
  conceito?: string; // A, B, C, D, E ou MB, B, R, I
  peso: number; // Para média ponderada
  
  comentario?: string;
  
  // Aprovação
  lancado_por: string;
  aprovado_por?: string;
  aprovado_em?: string;
  
  created_at: string;
  updated_at: string;
}

export type AvaliacaoTipo = Grade['avaliacao_tipo'];
export type Periodo = '1BIM' | '2BIM' | '3BIM' | '4BIM' | 'SEM1' | 'SEM2' | 'ANUAL' | 'REC';

export interface GradeCreateInput extends Omit<Grade, 'id' | 'created_at' | 'updated_at' | 'aprovado_por' | 'aprovado_em'> {}

export interface GradeUpdateInput extends Partial<Omit<Grade, 'id' | 'enrollment_id' | 'created_at'>> {}

// Grade com relações expandidas
export interface GradeExpanded extends Grade {
  subject?: {
    id: string;
    nome: string;
    codigo: string;
  };
  enrollment?: {
    id: string;
    student?: {
      id: string;
      full_name: string;
    };
  };
  lancado_por_user?: {
    id: string;
    full_name: string;
  };
}

// Boletim: médias por disciplina
export interface Boletim {
  student_id: string;
  student_name: string;
  enrollment_id: string;
  ano_letivo: number;
  disciplinas: Array<{
    subject_id: string;
    subject_nome: string;
    subject_codigo: string;
    media_final: number;
    conceito?: string;
    situacao: 'Aprovado' | 'Reprovado' | 'Recuperação';
    avaliacoes: Grade[];
  }>;
  media_geral: number;
  total_faltas: number;
  taxa_presenca: number;
}

