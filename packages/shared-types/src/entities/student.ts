/**
 * Tipos relacionados à entidade Student (Aluno)
 */

export interface Student {
  // Identificação
  id: string;
  codigo_identificador?: string;
  numero_ficha?: string;
  
  // Nomes
  name: string; // Nome real no banco
  full_name?: string; // Alias para compatibilidade
  nome_social?: string;
  
  // Documentos
  cpf?: string;
  rg?: string;
  date_of_birth: string; // Mantido para compatibilidade
  
  // Dados Pessoais
  sexo?: 'M' | 'F' | 'Outro';
  raca_cor?: string;
  naturalidade?: string;
  tipo_sanguineo?: string;
  cartao_sus?: string;
  
  // Endereço
  endereco_logradouro?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_cep?: string;
  localizacao_geografica?: {
    latitude: number;
    longitude: number;
  };
  
  // Contatos
  telefone_principal?: string;
  telefone_secundario?: string;
  email?: string;
  
  // Responsáveis
  guardian_name?: string; // Mantido para compatibilidade
  guardian_phone?: string; // Mantido para compatibilidade
  mae_nome?: string;
  mae_telefone?: string;
  mae_cpf?: string;
  pai_nome?: string;
  pai_telefone?: string;
  pai_cpf?: string;
  
  // Status
  is_active: boolean; // Mantido para compatibilidade
  status_matricula: 'Ativo' | 'Transferido' | 'Cancelado' | 'Concluído' | 'Abandonou';
  
  // Necessidades Especiais
  special_needs?: string; // Mantido para compatibilidade
  necessidades_especiais: boolean;
  tipo_necessidade?: string[];
  laudo_medico_url?: string;
  
  // Relações
  school_id: string;
  tenant_id: string;
  class_id?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export type StudentStatus = Student['status_matricula'];

export interface StudentCreateInput extends Omit<Student, 'id' | 'created_at' | 'updated_at'> {}

export interface StudentUpdateInput extends Partial<Omit<Student, 'id' | 'created_at'>> {}

