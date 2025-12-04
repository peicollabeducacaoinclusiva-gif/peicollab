export type ModuleName =
  | 'declarations'
  | 'history'
  | 'online_enrollment'
  | 're_enrollment'
  | 'student_documents'
  | 'students'
  | 'classes'
  | 'professionals';

export interface ModuleConfig {
  id: string;
  tenant_id: string;
  module_name: ModuleName;
  enabled: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ModuleInfo {
  name: ModuleName;
  label: string;
  description: string;
  category: 'core' | 'secretary' | 'optional';
  defaultEnabled: boolean;
}

export const MODULE_INFO: Record<ModuleName, ModuleInfo> = {
  students: {
    name: 'students',
    label: 'Cadastro de Alunos',
    description: 'Gerenciamento de cadastro de estudantes',
    category: 'core',
    defaultEnabled: true,
  },
  classes: {
    name: 'classes',
    label: 'Turmas',
    description: 'Gerenciamento de turmas e classes',
    category: 'core',
    defaultEnabled: true,
  },
  professionals: {
    name: 'professionals',
    label: 'Profissionais',
    description: 'Cadastro de profissionais da educação',
    category: 'core',
    defaultEnabled: true,
  },
  declarations: {
    name: 'declarations',
    label: 'Declarações',
    description: 'Emissão de declarações escolares',
    category: 'secretary',
    defaultEnabled: false,
  },
  history: {
    name: 'history',
    label: 'Histórico Escolar',
    description: 'Gerenciamento de histórico escolar',
    category: 'secretary',
    defaultEnabled: false,
  },
  online_enrollment: {
    name: 'online_enrollment',
    label: 'Matrícula Online',
    description: 'Sistema de matrícula online',
    category: 'secretary',
    defaultEnabled: false,
  },
  re_enrollment: {
    name: 're_enrollment',
    label: 'Rematrícula',
    description: 'Sistema de rematrícula',
    category: 'secretary',
    defaultEnabled: false,
  },
  student_documents: {
    name: 'student_documents',
    label: 'Documentos do Aluno',
    description: 'Gerenciamento de documentos dos alunos',
    category: 'secretary',
    defaultEnabled: false,
  },
};

export const CORE_MODULES: ModuleName[] = ['students', 'classes', 'professionals'];
export const SECRETARY_MODULES: ModuleName[] = [
  'declarations',
  'history',
  'online_enrollment',
  're_enrollment',
  'student_documents',
];

