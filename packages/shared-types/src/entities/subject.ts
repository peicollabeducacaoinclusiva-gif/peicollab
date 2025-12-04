/**
 * Tipos relacionados à entidade Subject (Disciplinas)
 */

export interface Subject {
  id: string;
  tenant_id: string;
  
  // Identificação
  codigo: string; // MAT, PORT, HIST
  nome: string; // Matemática, Língua Portuguesa
  
  // Classificação
  componente_curricular?: string; // Base Nacional Comum / Parte Diversificada
  area_conhecimento?: string; // Linguagens, Matemática, Ciências Humanas
  
  // Carga Horária
  carga_horaria_semanal?: number;
  
  // BNCC
  competencias_bncc?: Record<string, any>;
  
  // Status
  is_active: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export type AreaConhecimento = 
  | 'Linguagens'
  | 'Matemática' 
  | 'Ciências Humanas'
  | 'Ciências da Natureza'
  | 'Ensino Religioso';

export interface SubjectCreateInput extends Omit<Subject, 'id' | 'created_at' | 'updated_at'> {}

