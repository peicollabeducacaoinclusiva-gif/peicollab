/**
 * Tipos e Interfaces do Sistema PEI Colaborativo
 * Atualizado: 2025-11-05
 * 
 * Inclui novos campos para importação CSV e geração automática de metas
 */

// ============================================================================
// BARREIRAS
// ============================================================================

export interface Barrier {
  id?: string
  description: string
  severity?: 'leve' | 'moderada' | 'severa'
}

// ============================================================================
// IDENTIFICAÇÃO E CONTEXTO EXPANDIDO
// ============================================================================

export interface StudentContextData {
  // Dados escolares
  age?: number                 // Idade calculada
  grade?: string               // Ano/série (ex: "3º Ano EF")
  class?: string               // Turma (ex: "A", "B")
  enrollment_date?: string     // Data de ingresso na escola
  teaching_modality?: string   // Modalidade (ex: "Ensino Fundamental Anos Iniciais")
  school_address?: string      // Endereço completo da escola
  pei_period?: string          // Período de vigência (ex: "2025.2")
  pei_review_date?: string     // Data prevista para revisão
  
  // Profissionais envolvidos
  professionals?: {
    regent_teacher?: string    // Professor regente
    aee_teacher?: string       // Professor AEE
    assistant?: string         // Auxiliar
    technical_team?: string[]  // Equipe técnica (psicólogo, fono, etc.)
    coordinator?: string       // Coordenador
    principal?: string         // Diretor
  }
  
  // Dados familiares
  family?: {
    father_name?: string
    mother_name?: string
    guardian_name?: string     // Responsável legal
    contact_phone?: string
    contact_email?: string
    father_education?: string  // Escolaridade do pai
    mother_education?: string  // Escolaridade da mãe
    family_dynamics?: string   // Breve descrição do convívio familiar
    family_address?: string    // Endereço da família
  }
  
  // Histórico de escolarização
  schooling_history?: {
    previous_schools?: Array<{
      school_name: string
      period: string           // Ex: "2020-2022"
      grade: string
      observations?: string
    }>
    previous_advances?: string  // Avanços em anos anteriores
    repetitions?: Array<{
      year: string
      grade: string
      reason?: string
    }>
    summary?: string           // Resumo geral da trajetória
  }
}

// ============================================================================
// DIAGNÓSTICO (Estrutura Atualizada e Expandida)
// ============================================================================

export interface DiagnosisData {
  // ✅ Campos existentes
  history: string               // Histórico do aluno
  interests: string            // Interesses e hiperfocos
  specialNeeds: string         // O que precisa de ajuda
  barriers: Barrier[]          // Barreiras identificadas
  cid10?: string              // CID-10 (opcional)
  description?: string        // Descrição adicional
  
  // ✅ CAMPOS ESTENDIDOS (Formulários e Importação CSV)
  aversions?: string          // Desinteresses / Aversão
  abilities?: string          // O que já consegue fazer (habilidades)
  barriersComments?: string   // Comentários sobre barreiras
  strengths?: string          // Pontos fortes (alias de abilities)
  challenges?: string         // Desafios (alias de aversions)
  familyNeeds?: string        // Necessidades relatadas pela família
  familyExpectations?: string // Expectativas da família em relação à escola
  
  // 🆕 RELATÓRIO CIRCUNSTANCIADO (RC)
  circumstantial_report?: {
    how_student_learns?: string        // Como o aluno aprende
    learning_barriers?: string         // Barreiras encontradas no aprendizado
    social_interaction?: string        // Interação social
    communication?: string             // Comunicação
    attention?: string                 // Atenção e concentração
    autonomy?: string                 // Autonomia
    behavior?: string                 // Comportamento
    emotional_context?: string        // Contexto emocional
    observations?: string             // Observações gerais
  }
  
  // 🆕 NÍVEL DE DESENVOLVIMENTO E DESEMPENHO
  development_level?: {
    language?: {
      autonomous?: string[]            // O que faz com autonomia
      with_help?: string[]             // O que faz com ajuda
      not_yet?: string[]               // O que ainda não realiza
    }
    reading?: {
      autonomous?: string[]
      with_help?: string[]
      not_yet?: string[]
    }
    writing?: {
      autonomous?: string[]
      with_help?: string[]
      not_yet?: string[]
    }
    logical_reasoning?: {
      autonomous?: string[]
      with_help?: string[]
      not_yet?: string[]
    }
    motor_coordination?: {
      autonomous?: string[]
      with_help?: string[]
      not_yet?: string[]
    }
    social_skills?: {
      autonomous?: string[]
      with_help?: string[]
      not_yet?: string[]
    }
  }
  
  // 🆕 INFORMAÇÕES DE SAÚDE E IMPLICAÇÕES CURRICULARES
  health_info?: {
    condition_impact?: string         // Como a condição impacta o aprendizado
    curriculum_adaptations?: string[] // Adaptações curriculares necessárias
    behavioral_adaptations?: string[] // Adaptações comportamentais
    examples?: string                 // Exemplos práticos (rotina visual, apoio transições, etc.)
  }
}

// ============================================================================
// METAS
// ============================================================================

export interface PEIGoal {
  id?: string
  barrier_id?: string
  category: 'academic' | 'functional'  // ✅ OBRIGATÓRIO: Categoria da meta
  description: string
  target_date: string                   // ✅ OBRIGATÓRIO: Data alvo
  timeline?: 'short_term' | 'medium_term' | 'long_term'  // 🆕 Prazo (curto/médio/longo)
  progress_level?: 'não iniciada' | 'em andamento' | 'parcialmente alcançada' | 'alcançada'
  progress_score?: number
  notes?: string
  strategies?: string[]                 // ✅ Estratégias de intervenção
  bncc_code?: string                   // Código BNCC relacionado (para metas acadêmicas)
  
  // 🆕 METAS ESPECÍFICAS E MENSURÁVEIS
  specific_objectives?: string[]       // Objetivos específicos e mensuráveis
  measurement_criteria?: string         // Critérios de mensuração
  expected_outcomes?: string            // Resultados esperados
  
  // ✅ NOVO: AVALIAÇÃO DA META
  evaluation?: {
    current_status?: string             // Status atual da meta
    achieved_percentage?: number        // % de alcance (0-100)
    evaluation_date?: string            // Data da última avaliação
    evaluator?: string                  // Quem avaliou
    evidence?: string                   // Evidências do progresso
    next_actions?: string               // Próximas ações
  }
}

// ============================================================================
// ENCAMINHAMENTOS
// ============================================================================

export interface PEIReferral {
  id?: string
  service: string             // Ex: "Fonoaudiologia", "Psicologia"
  reason: string              // Motivo do encaminhamento
  priority?: 'baixa' | 'média' | 'alta'
  status?: 'pendente' | 'em andamento' | 'concluído' | 'cancelado'
  date?: string              // Data do encaminhamento
  follow_up?: string         // Acompanhamento
}

// ============================================================================
// RECURSOS DE ACESSIBILIDADE
// ============================================================================

export interface AccessibilityResource {
  id?: string
  type: string                           // ✅ Tipo de recurso (ex: "Tecnologia Assistiva", "Material Adaptado")
  description: string                    // ✅ Descrição detalhada do recurso
  frequency: 'diária' | 'semanal' | 'quinzenal' | 'mensal' | 'quando necessário'  // ✅ Frequência de uso
  status?: 'solicitado' | 'disponível' | 'em uso'
  responsible?: string                   // Responsável pela disponibilização
  observations?: string                  // Observações sobre o uso
}

// ============================================================================
// ADAPTAÇÕES E ESTRATÉGIAS POR TIPO DE BARREIRA
// ============================================================================

export interface BarrierAdaptation {
  barrier_type: 'Pedagógica' | 'Comunicacional' | 'Atitudinal' | 'Arquitetônica' | 'Tecnológica' | 'Cognitiva' | 'Comportamental' | 'Sensorial' | 'Motora' | 'Social'
  adaptations: string[]        // Adaptações possíveis (mudanças pedagógicas internas)
  strategies: string[]         // Estratégias de acessibilidade (condições externas/estruturais)
  priority?: 'baixa' | 'média' | 'alta'
  implementation_status?: 'planejada' | 'em implementação' | 'implementada'
  responsible?: string         // Responsável pela implementação
  deadline?: string           // Prazo para implementação
}

// ============================================================================
// PLANEJAMENTO
// ============================================================================

export interface PlanningData {
  goals: PEIGoal[]                                    // ✅ Mínimo de 3 metas
  referrals?: PEIReferral[]
  accessibility_resources?: AccessibilityResource[]
  barrier_adaptations?: BarrierAdaptation[]          // ✅ NOVO: Adaptações por tipo de barreira
  general_adaptations?: string                        // Adaptações gerais do currículo
  general_strategies?: string                         // Estratégias gerais de acessibilidade
  
  // 🆕 ADEQUAÇÕES CURRICULARES DETALHADAS
  curriculum_adaptations?: {
    priority_contents?: string[]       // Conteúdos prioritários
    priority_competencies?: string[]  // Competências prioritárias
    differentiated_methodologies?: string[]  // Metodologias diferenciadas
    adapted_assessments?: string[]     // Avaliações adaptadas
    content_flexibilization?: string   // Flexibilização de conteúdos
    sequence_reorganization?: string  // Reorganização da sequência didática
  }
  
  // 🆕 RECURSOS E MATERIAIS ESPECÍFICOS
  specific_resources?: {
    pedagogical_games?: string[]       // Jogos pedagógicos
    communication_boards?: string[]    // Pranchas de comunicação
    assistive_technologies?: string[]  // Tecnologias assistivas
    visual_supports?: string[]         // Apoios visuais
    images?: string[]                  // Uso de imagens
    other_materials?: string[]         // Outros materiais
  }
  
  // 🆕 SERVIÇOS E SUPORTE
  support_services?: Array<{
    service_type: string              // Tipo (AEE, psicológico, fonoaudiológico, etc.)
    frequency: string                 // Frequência (diária, semanal, etc.)
    duration?: string                 // Duração da sessão
    provider?: string                 // Prestador do serviço
    location?: string                // Local (escola, clínica, etc.)
    observations?: string            // Observações
  }>
  
  // 🆕 CRONOGRAMA DE INTERVENÇÃO
  intervention_schedule?: Array<{
    period: string                    // Período (ex: "Janeiro-Março 2025")
    actions: string[]                 // Ações a serem realizadas
    responsible: string               // Responsável (professor, AEE, família, etc.)
    expected_results?: string         // Resultados esperados
  }>
}

// ============================================================================
// AVALIAÇÃO
// ============================================================================

export interface EvaluationData {
  period?: string
  observations?: string
  progress?: string
  next_steps?: string
  review_date?: string              // ✅ NOVO: Data de revisão do PEI
  last_review_date?: string         // ✅ NOVO: Data da última revisão
  next_review_date?: string         // ✅ NOVO: Próxima revisão programada
  
  // Avaliação geral do PEI
  overall_progress?: 'insatisfatório' | 'regular' | 'bom' | 'excelente'
  goals_evaluation?: string         // Avaliação geral das metas
  family_feedback?: string          // Feedback da família
  adjustments_needed?: string       // Ajustes necessários
  
  // 🆕 CRITÉRIOS DE AVALIAÇÃO INDIVIDUALIZADA
  evaluation_criteria?: {
    progress_indicators?: string[]    // O que será considerado progresso
    examples?: string[]              // Exemplos (aumento vocabulário, maior atenção, etc.)
    measurement_methods?: string[]    // Métodos de mensuração
  }
  
  // 🆕 FORMA DE REGISTRO DO PROGRESSO
  progress_recording?: {
    frequency?: 'bimestral' | 'trimestral' | 'semestral' | 'anual'
    format?: 'descriptive' | 'quantitative' | 'mixed'  // Formato do registro
    responsible?: string             // Responsável pelo registro
    next_report_date?: string        // Data do próximo relatório
    last_report_date?: string        // Data do último relatório
  }
  
  // 🆕 REVISÃO E REFORMULAÇÃO DO PEI
  pei_review?: {
    review_frequency?: string        // Frequência de revisão (trimestral, etc.)
    review_process?: string          // Como será reavaliado
    participants?: string[]          // Participantes (equipe escolar, família, etc.)
    last_review_meeting?: string     // Data da última reunião
    next_review_meeting?: string     // Data da próxima reunião
    reformulation_needed?: boolean   // Se precisa reformulação
    reformulation_reason?: string     // Motivo da reformulação
  }
  
  // 🆕 ASSINATURAS COMPLETAS
  signatures?: Array<{
    name: string                     // Nome legível
    role: string                     // Cargo/função
    signature_date?: string          // Data da assinatura
    cpf?: string                     // CPF (opcional)
    registration?: string            // Registro profissional (opcional)
  }>
}

// ============================================================================
// ESTUDANTE
// ============================================================================

export interface Student {
  id: string
  name: string
  date_of_birth?: string
  student_id?: string
  school_id: string
  tenant_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Informações adicionais (opcionais)
  mother_name?: string
  father_name?: string
  email?: string
  phone?: string
  family_guidance_notes?: string
}

// ============================================================================
// MATRÍCULA (student_enrollments)
// ============================================================================

export interface StudentEnrollment {
  id: string
  student_id: string
  school_id: string
  academic_year: number
  grade: string               // Série/Ano (ex: "3º ano", "Grupo 5")
  class_name: string          // Turma (ex: "A", "B", "6A")
  shift: string               // Turno (Matutino, Vespertino, Noturno, Integral)
  enrollment_number?: string
  enrollment_date?: string
  status: 'active' | 'transferred' | 'completed' | 'dropped'
  start_date?: string
  end_date?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

// ============================================================================
// PEI
// ============================================================================

export interface PEI {
  id: string
  student_id: string
  school_id: string
  tenant_id: string
  assigned_teacher_id?: string
  created_by: string
  status: 'draft' | 'pending' | 'approved' | 'returned'
  version_number: number
  is_active_version: boolean
  
  // Dados em JSONB
  student_context_data?: StudentContextData  // 🆕 Identificação e contexto expandido
  diagnosis_data?: DiagnosisData
  planning_data?: PlanningData
  evaluation_data?: EvaluationData
  
  // Aprovação familiar
  family_approved_at?: string
  family_approved_by?: string
  
  // Metadados
  is_synced?: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// TEMPLATES DE METAS (BNCC)
// ============================================================================

export interface GoalTemplate {
  id: string
  code: string                // Ex: "BNCC-LP-01"
  title: string
  description: string
  category: 'academic' | 'functional'
  domain: string              // Ex: "Linguagens", "Matemática"
  bncc_code?: string          // Código oficial BNCC
  educational_stage: string   // Ex: "Anos Iniciais"
  grade_range: string[]       // Ex: ["1º ano", "2º ano"]
  keywords: string[]          // Para detecção automática
  default_strategies: string[]
  adaptable_by_interests: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// IMPORTAÇÃO EM LOTE
// ============================================================================

export interface ImportBatch {
  id: string
  coordinator_id?: string
  tenant_id?: string
  school_id?: string
  file_name: string
  file_size?: number
  import_date: string
  
  // Estatísticas
  total_rows: number
  success_count: number
  error_count: number
  warning_count: number
  skipped_count: number
  
  // Status
  status: 'processing' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  
  // Detalhes
  report_data?: any
  error_log?: string
  
  created_at: string
  created_by?: string
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

export type PEIStatus = 'draft' | 'pending' | 'approved' | 'returned'
export type UserRole = 'superadmin' | 'education_secretary' | 'coordinator' | 
                       'school_manager' | 'aee_teacher' | 'teacher' | 'family' | 'specialist'
export type BarrierSeverity = 'leve' | 'moderada' | 'severa'
export type GoalCategory = 'academic' | 'functional'
export type ProgressLevel = 'não iniciada' | 'em andamento' | 'parcialmente alcançada' | 'alcançada'
export type ReferralPriority = 'baixa' | 'média' | 'alta'
export type ReferralStatus = 'pendente' | 'em andamento' | 'concluído' | 'cancelado'

// ============================================================================
// FUNÇÕES AUXILIARES DE TIPO
// ============================================================================

/**
 * Verifica se diagnosis_data tem os campos novos preenchidos
 */
export function hasExtendedDiagnosis(data: DiagnosisData): boolean {
  return !!(data.aversions || data.abilities || data.barriersComments)
}

/**
 * Verifica se uma meta foi gerada automaticamente (tem bncc_code)
 */
export function isAutogeneratedGoal(goal: PEIGoal): boolean {
  return !!goal.bncc_code
}

/**
 * Formata nome da série para display
 */
export function formatGrade(grade: string): string {
  return grade.replace(/(\d)(º|°)/, '$1º')
}

/**
 * Formata turno para display
 */
export function formatShift(shift: string): string {
  const shifts: Record<string, string> = {
    'Matutino': '🌅 Matutino',
    'Vespertino': '🌆 Vespertino',
    'Noturno': '🌙 Noturno',
    'Integral': '⏰ Integral'
  }
  return shifts[shift] || shift
}

/**
 * Obtém ícone para categoria de meta
 */
export function getGoalCategoryIcon(category: GoalCategory): string {
  return category === 'academic' ? '📚' : '🎯'
}

/**
 * Obtém cor para severidade de barreira
 */
export function getBarrierSeverityColor(severity?: BarrierSeverity): string {
  switch (severity) {
    case 'leve': return 'text-yellow-600'
    case 'moderada': return 'text-orange-600'
    case 'severa': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

/**
 * Obtém cor para prioridade de encaminhamento
 */
export function getReferralPriorityColor(priority?: ReferralPriority): string {
  switch (priority) {
    case 'baixa': return 'text-green-600'
    case 'média': return 'text-yellow-600'
    case 'alta': return 'text-red-600'
    default: return 'text-gray-600'
  }
}



