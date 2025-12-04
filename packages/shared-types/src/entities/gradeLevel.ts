/**
 * Tipos relacionados à entidade Grade Level (Níveis de Ensino)
 */

export interface GradeLevel {
  id: string;
  tenant_id: string;
  
  // Identificação
  codigo: string; // EI-PRE, EF-1, EJA-MOD1
  nome: string; // "Pré-escola", "1º Ano EF"
  
  // Classificação
  modalidade: 'Educação Infantil' | 'Ensino Fundamental' | 'Ensino Médio' | 'EJA' | 'Educação Especial';
  etapa?: string; // Anos Iniciais, Anos Finais
  
  // Faixa Etária
  idade_minima?: number;
  idade_maxima?: number;
  
  // Carga Horária
  carga_horaria_anual?: number;
  
  // BNCC
  competencias_bncc?: Record<string, any>;
  descricao?: string;
  
  // Status
  is_active: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export type Modalidade = GradeLevel['modalidade'];

export interface GradeLevelCreateInput extends Omit<GradeLevel, 'id' | 'created_at' | 'updated_at'> {}

