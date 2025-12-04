/**
 * Tipos relacionados à entidade Staff/Profiles (Profissionais)
 */

export interface Staff {
  // Identificação
  id: string;
  full_name: string;
  matricula_funcional?: string;
  
  // Função
  cargo_funcao?: string;
  tipo_vinculo?: 'Efetivo' | 'Contrato' | 'Comissionado' | 'Voluntário';
  regime_trabalho?: '20h' | '30h' | '40h' | 'Dedicação Exclusiva';
  departamento_setor?: string;
  
  // Datas
  data_entrada?: string;
  data_saida?: string;
  
  // Formação
  escolaridade?: string;
  formacao?: Array<{
    curso: string;
    instituicao: string;
    ano: number;
    nivel: string; // Graduação, Especialização, Mestrado, Doutorado
  }>;
  habilitacoes?: string[]; // ['Libras', 'Braille', 'AEE', etc]
  
  // Documentos Pessoais
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  
  // Contatos
  email?: string; // Email institucional
  email_pessoal?: string;
  telefone?: string;
  endereco_completo?: string;
  
  // Papel no Sistema
  role?: string; // teacher, aee_teacher, coordinator, etc
  
  // Vinculações
  school_id?: string;
  tenant_id: string;
  
  // Status
  is_active: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export type StaffVinculo = Staff['tipo_vinculo'];
export type StaffRegime = Staff['regime_trabalho'];

export interface StaffCreateInput extends Omit<Staff, 'id' | 'created_at' | 'updated_at'> {}

export interface StaffUpdateInput extends Partial<Omit<Staff, 'id' | 'created_at'>> {}

