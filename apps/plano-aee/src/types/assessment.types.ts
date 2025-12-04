// ============================================================================
// TIPOS: Avaliação Diagnóstica
// ============================================================================
// Tipos para o sistema de avaliação diagnóstica (8 áreas)
// Data: 2025-01-09
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type AssessmentType = 'inicial' | 'continuada' | 'final';
export type WritingLevel = 
  | 'pre_silabico' 
  | 'silabico_sem_valor' 
  | 'silabico_com_valor' 
  | 'silabico_alfabetico' 
  | 'alfabetico';
export type FrustrationLevel = 'baixa' | 'moderada' | 'alta';
export type SelfEsteemLevel = 'baixa' | 'adequada' | 'elevada';
export type DominanceType = 'direita' | 'esquerda' | 'cruzada' | 'indefinida';
export type QualityLevel = 'adequada' | 'dificuldade' | 'nao_observado';
export type VocabularyLevel = 'amplo' | 'adequado' | 'restrito';

// ============================================================================
// INTERFACES DAS ÁREAS AVALIADAS
// ============================================================================

export interface Laterality {
  dominancia?: DominanceType;
  usa_corretamente?: boolean;
  observacoes?: string;
}

export interface SpatialOrientation {
  reconhece_posicoes?: boolean; // em cima, embaixo, dentro, fora
  compreende_relacoes_espaciais?: boolean;
  identifica_direita_esquerda?: boolean;
  observacoes?: string;
}

export interface TemporalOrientation {
  reconhece_dias_semana?: boolean;
  compreende_sequencia_temporal?: boolean; // antes, depois, ontem, hoje
  tem_nocao_tempo?: boolean;
  observacoes?: string;
}

export interface VisualPerception {
  discrimina_cores?: boolean;
  identifica_formas?: boolean;
  figura_fundo?: boolean; // separa figura do fundo
  constancia_forma?: boolean;
  observacoes?: string;
}

export interface AuditoryPerception {
  discrimina_sons?: boolean;
  memoria_auditiva?: boolean;
  atencao_auditiva?: boolean;
  observacoes?: string;
}

export interface OralExpression {
  vocabulario?: VocabularyLevel;
  articulacao?: 'clara' | 'dificuldade';
  forma_frases_completas?: boolean;
  conta_experiencias?: boolean;
  observacoes?: string;
}

export interface WrittenExpression {
  caligrafia?: 'legivel' | 'irregular' | 'ilegivel';
  ortografia?: 'adequada' | 'dificuldade';
  segmenta_palavras?: boolean;
  usa_pontuacao?: boolean;
  observacoes?: string;
}

export interface ReadingSkills {
  reconhece_letras?: boolean;
  le_silabas?: boolean;
  le_palavras?: boolean;
  le_frases?: boolean;
  compreende_leitura?: boolean;
  fluencia?: 'adequada' | 'lenta' | 'muito_lenta';
  observacoes?: string;
}

export interface LogicalReasoning {
  resolve_problemas?: boolean;
  sequencia_logica?: boolean;
  classificacao?: boolean;
  seriacao?: boolean;
  conservacao?: boolean;
  observacoes?: string;
}

export interface MotorCoordination {
  coordenacao_fina?: QualityLevel;
  coordenacao_ampla?: QualityLevel;
  equilibrio?: QualityLevel;
  lateralidade_estabelecida?: boolean;
  observacoes?: string;
}

export interface InterpersonalRelations {
  relaciona_bem_colegas?: boolean;
  aceita_regras?: boolean;
  trabalha_grupo?: boolean;
  compartilha_materiais?: boolean;
  respeita_vez?: boolean;
  observacoes?: string;
}

export interface StudentSkills {
  pontos_fortes?: string[];
  areas_melhorar?: string[];
  interesses?: string[];
  motivacao?: string;
}

export interface ProfessionalSupport {
  profissional: string; // 'Fonoaudiólogo', 'Psicólogo', etc.
  local?: string;
  frequencia?: string;
  observacoes?: string;
}

// ============================================================================
// AVALIAÇÃO DIAGNÓSTICA COMPLETA
// ============================================================================

export interface DiagnosticAssessment {
  id: string;
  student_id: string;
  teacher_id: string;
  aee_center_id?: string;
  plan_id?: string;
  
  // Tipo e data
  assessment_date: string;
  assessment_type: AssessmentType;
  
  // 8 Áreas principais
  laterality: Laterality;
  spatial_orientation: SpatialOrientation;
  temporal_orientation: TemporalOrientation;
  visual_perception: VisualPerception;
  auditory_perception: AuditoryPerception;
  oral_expression: OralExpression;
  written_expression: WrittenExpression;
  writing_level?: WritingLevel;
  reading_skills: ReadingSkills;
  logical_reasoning: LogicalReasoning;
  motor_coordination: MotorCoordination;
  interpersonal_relations: InterpersonalRelations;
  frustration_tolerance?: FrustrationLevel;
  self_esteem?: SelfEsteemLevel;
  
  // Informações escolares
  school_complaints?: string;
  school_progress?: string;
  academic_performance?: string;
  
  // Indicações clínicas
  clinical_indications?: string;
  professional_support: ProfessionalSupport[];
  
  // Habilidades
  student_skills: StudentSkills;
  
  // Observações
  observations?: string;
  recommendations?: string;
  next_assessment_date?: string;
  
  // Metadados
  created_at: string;
  updated_at: string;
}

export interface CreateAssessmentInput {
  student_id: string;
  aee_center_id?: string;
  plan_id?: string;
  assessment_date?: string;
  assessment_type?: AssessmentType;
  laterality?: Laterality;
  spatial_orientation?: SpatialOrientation;
  temporal_orientation?: TemporalOrientation;
  visual_perception?: VisualPerception;
  auditory_perception?: AuditoryPerception;
  oral_expression?: OralExpression;
  written_expression?: WrittenExpression;
  writing_level?: WritingLevel;
  reading_skills?: ReadingSkills;
  logical_reasoning?: LogicalReasoning;
  motor_coordination?: MotorCoordination;
  interpersonal_relations?: InterpersonalRelations;
  frustration_tolerance?: FrustrationLevel;
  self_esteem?: SelfEsteemLevel;
  school_complaints?: string;
  school_progress?: string;
  academic_performance?: string;
  clinical_indications?: string;
  professional_support?: ProfessionalSupport[];
  student_skills?: StudentSkills;
  observations?: string;
  recommendations?: string;
  next_assessment_date?: string;
}

// ============================================================================
// ANAMNESE (ENTREVISTA FAMILIAR)
// ============================================================================

export interface PregnancyBirth {
  tipo_parto?: 'normal' | 'cesariana';
  complicacoes?: boolean;
  detalhes?: string;
}

export interface DevelopmentalMilestones {
  sentou?: string; // "6 meses"
  andou?: string; // "1 ano"
  falou?: string; // "2 anos"
  controle_esfincteriano?: string; // "3 anos"
}

export interface FamilyMember {
  nome: string;
  parentesco: string; // "pai", "mãe", "irmão"
  idade?: number;
  profissao?: string;
}

export interface DailyRoutine {
  acordar?: string;
  cafe?: string;
  escola?: string;
  almoco?: string;
  atividades?: string;
  jantar?: string;
  dormir?: string;
}

export interface SchoolHistoryItem {
  escola: string;
  ano: string;
  serie: string;
  observacoes?: string;
}

export interface Medication {
  nome: string;
  dosagem: string;
  horario: string;
  motivo?: string;
}

export interface AttendingProfessional {
  profissional: string;
  local: string;
  frequencia: string;
  desde_quando?: string;
}

export interface InterviewParticipant {
  nome: string;
  parentesco: string;
  presente: boolean;
}

export interface FamilyInterview {
  id: string;
  student_id: string;
  teacher_id: string;
  interview_date: string;
  interview_type: AssessmentType;
  
  // Seções da anamnese
  initial_complaint?: string;
  pregnancy_birth: PregnancyBirth;
  biopsychosocial_development?: string;
  developmental_milestones: DevelopmentalMilestones;
  family_structure?: string;
  family_members: FamilyMember[];
  student_bonds?: string;
  favorite_activities?: string;
  social_interactions?: string;
  daily_routine: DailyRoutine;
  family_health_history?: string;
  genetic_conditions?: string;
  school_history: SchoolHistoryItem[];
  clinical_restrictions?: string;
  medications: Medication[];
  allergies?: string;
  attending_professionals: AttendingProfessional[];
  student_communication?: string;
  communication_methods: string[];
  observations?: string;
  interviewer_notes?: string;
  family_emotional_reactions?: string;
  participants: InterviewParticipant[];
  
  // Metadados
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LABELS E TRADUÇÕES
// ============================================================================

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  inicial: 'Avaliação Inicial',
  continuada: 'Avaliação Continuada',
  final: 'Avaliação Final',
};

export const WRITING_LEVEL_LABELS: Record<WritingLevel, string> = {
  pre_silabico: 'Pré-Silábico',
  silabico_sem_valor: 'Silábico sem Valor Sonoro',
  silabico_com_valor: 'Silábico com Valor Sonoro',
  silabico_alfabetico: 'Silábico-Alfabético',
  alfabetico: 'Alfabético',
};

export const FRUSTRATION_LABELS: Record<FrustrationLevel, string> = {
  baixa: 'Baixa Tolerância',
  moderada: 'Tolerância Moderada',
  alta: 'Alta Tolerância',
};

export const SELF_ESTEEM_LABELS: Record<SelfEsteemLevel, string> = {
  baixa: 'Baixa Autoestima',
  adequada: 'Autoestima Adequada',
  elevada: 'Autoestima Elevada',
};

// ============================================================================
// STEPS DO FORMULÁRIO
// ============================================================================

export interface AssessmentStep {
  id: string;
  title: string;
  description: string;
  fields: string[];
}

export const ASSESSMENT_STEPS: AssessmentStep[] = [
  {
    id: 'identification',
    title: 'Identificação',
    description: 'Dados básicos do aluno e da avaliação',
    fields: ['student_id', 'assessment_date', 'assessment_type'],
  },
  {
    id: 'laterality',
    title: 'Lateralidade',
    description: 'Dominância lateral (direita/esquerda)',
    fields: ['laterality'],
  },
  {
    id: 'orientation',
    title: 'Orientação',
    description: 'Orientação espacial e temporal',
    fields: ['spatial_orientation', 'temporal_orientation'],
  },
  {
    id: 'perception',
    title: 'Percepção',
    description: 'Percepção visual e auditiva',
    fields: ['visual_perception', 'auditory_perception'],
  },
  {
    id: 'expression',
    title: 'Expressão',
    description: 'Expressão oral e escrita',
    fields: ['oral_expression', 'written_expression', 'writing_level'],
  },
  {
    id: 'reading',
    title: 'Leitura',
    description: 'Habilidades de leitura',
    fields: ['reading_skills'],
  },
  {
    id: 'reasoning',
    title: 'Raciocínio e Coordenação',
    description: 'Raciocínio lógico e coordenação motora',
    fields: ['logical_reasoning', 'motor_coordination'],
  },
  {
    id: 'relations',
    title: 'Relações',
    description: 'Relações interpessoais e comportamento',
    fields: ['interpersonal_relations', 'frustration_tolerance', 'self_esteem'],
  },
  {
    id: 'summary',
    title: 'Resumo',
    description: 'Observações finais e recomendações',
    fields: ['school_complaints', 'clinical_indications', 'professional_support', 'student_skills', 'observations', 'recommendations'],
  },
];






























