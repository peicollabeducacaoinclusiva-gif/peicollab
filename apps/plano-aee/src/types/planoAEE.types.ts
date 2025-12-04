// ============================================================================
// TIPOS V2.0 - Sistema de Plano de AEE
// ============================================================================
// Tipos TypeScript completos para o sistema V2.0
// Data: 2025-01-09
// ============================================================================

// ============================================================================
// ENUMS E TIPOS BASE
// ============================================================================

export type AttendanceStatus = 
  | 'presente' 
  | 'falta_justificada' 
  | 'falta_injustificada' 
  | 'remarcado';

export type GoalStatus = 
  | 'nao_iniciada' 
  | 'em_andamento' 
  | 'alcancada' 
  | 'parcialmente_alcancada' 
  | 'ajustada' 
  | 'cancelada';

export type GoalArea = 
  | 'percepcao' 
  | 'linguagem' 
  | 'motora' 
  | 'socio_emocional' 
  | 'autonomia' 
  | 'academica' 
  | 'geral';

export type VisitType = 
  | 'diagnostica' 
  | 'acompanhamento' 
  | 'orientacao' 
  | 'avaliacao' 
  | 'outra';

export type VisitStatus = 
  | 'rascunho' 
  | 'realizada' 
  | 'cancelada';

export type ReferralStatus = 
  | 'rascunho' 
  | 'enviado' 
  | 'agendado' 
  | 'em_atendimento' 
  | 'concluido' 
  | 'cancelado' 
  | 'sem_resposta';

export type UrgencyLevel = 
  | 'baixa' 
  | 'media' 
  | 'alta' 
  | 'urgente';

export type GoalPriority = 'baixa' | 'media' | 'alta';

export type CenterType = 
  | 'sala_recursos' 
  | 'centro_especializado' 
  | 'itinerante';

export type PlanStatus = 
  | 'draft' 
  | 'active' 
  | 'pending' 
  | 'approved' 
  | 'returned' 
  | 'concluded' 
  | 'archived';

// ============================================================================
// CENTRO DE AEE
// ============================================================================

export interface AEECenter {
  id: string;
  school_id: string;
  tenant_id: string;
  center_name: string;
  center_type: CenterType;
  address?: string;
  phone?: string;
  operating_hours: Record<string, string>; // {"seg": "8:00-12:00", "ter": "8:00-12:00"}
  capacity: number;
  specializations: string[]; // ['TEA', 'Baixa Visão', 'Deficiência Intelectual']
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAEECenterInput {
  school_id: string;
  tenant_id: string;
  center_name: string;
  center_type?: CenterType;
  address?: string;
  phone?: string;
  operating_hours?: Record<string, string>;
  capacity?: number;
  specializations?: string[];
}

export interface UpdateAEECenterInput {
  center_name?: string;
  center_type?: CenterType;
  address?: string;
  phone?: string;
  operating_hours?: Record<string, string>;
  capacity?: number;
  specializations?: string[];
  is_active?: boolean;
}

// ============================================================================
// METAS DO PLANO (SMART Goals)
// ============================================================================

export interface PlanGoal {
  id: string;
  plan_id: string;
  goal_description: string;
  goal_area: GoalArea;
  is_measurable: boolean;
  target_date?: string; // ISO date string
  progress_status: GoalStatus;
  progress_percentage: number; // 0-100
  activities?: string;
  materials_needed?: string;
  strategies?: string;
  success_criteria?: string;
  evaluation_notes?: string;
  priority: GoalPriority;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanGoalInput {
  plan_id: string;
  goal_description: string;
  goal_area: GoalArea;
  is_measurable?: boolean;
  target_date?: string;
  activities?: string;
  materials_needed?: string;
  strategies?: string;
  success_criteria?: string;
  priority?: GoalPriority;
}

export interface UpdatePlanGoalInput {
  goal_description?: string;
  goal_area?: GoalArea;
  is_measurable?: boolean;
  target_date?: string;
  progress_status?: GoalStatus;
  progress_percentage?: number;
  activities?: string;
  materials_needed?: string;
  strategies?: string;
  success_criteria?: string;
  evaluation_notes?: string;
  priority?: GoalPriority;
}

// ============================================================================
// REGISTRO DE ATENDIMENTO
// ============================================================================

export interface AttendanceAttachment {
  nome: string;
  url: string;
  tipo: 'foto' | 'video' | 'documento';
}

export interface AttendanceRecord {
  id: string;
  plan_id: string;
  student_id: string;
  teacher_id: string;
  attendance_date: string; // ISO date string
  attendance_time?: string; // HH:mm format
  duration_minutes: number;
  attendance_status: AttendanceStatus;
  absence_reason?: string;
  activities_performed?: string;
  goals_worked?: string[]; // Array de goal IDs
  materials_used?: string;
  student_performance?: string;
  behavior_observations?: string;
  challenges_faced?: string;
  achievements?: string;
  observations?: string;
  next_steps?: string;
  attachments: AttendanceAttachment[];
  created_at: string;
  updated_at: string;
}

export interface CreateAttendanceInput {
  plan_id: string;
  student_id: string;
  attendance_date: string;
  attendance_time?: string;
  duration_minutes?: number;
  attendance_status: AttendanceStatus;
  absence_reason?: string;
  activities_performed?: string;
  goals_worked?: string[];
  materials_used?: string;
  student_performance?: string;
  behavior_observations?: string;
  challenges_faced?: string;
  achievements?: string;
  observations?: string;
  next_steps?: string;
  attachments?: AttendanceAttachment[];
}

export interface UpdateAttendanceInput {
  attendance_time?: string;
  duration_minutes?: number;
  attendance_status?: AttendanceStatus;
  absence_reason?: string;
  activities_performed?: string;
  goals_worked?: string[];
  materials_used?: string;
  student_performance?: string;
  behavior_observations?: string;
  challenges_faced?: string;
  achievements?: string;
  observations?: string;
  next_steps?: string;
  attachments?: AttendanceAttachment[];
}

// ============================================================================
// CICLO DE AVALIAÇÃO
// ============================================================================

export interface GoalProgress {
  status: GoalStatus;
  percentage: number;
  observations: string;
}

export interface EvaluationCycle {
  id: string;
  plan_id: string;
  cycle_number: 1 | 2 | 3;
  cycle_name: string; // 'I Ciclo', 'II Ciclo', 'III Ciclo'
  start_date: string; // ISO date
  end_date: string; // ISO date
  achievements?: string;
  challenges?: string;
  goals_progress: Record<string, GoalProgress>; // goal_id -> progress
  total_attendances_planned?: number;
  total_attendances_actual?: number;
  attendance_percentage?: number;
  plan_adjustments?: string;
  new_strategies?: string;
  resource_needs?: string;
  referrals_made: any[];
  recommendations_next_cycle?: string;
  evaluation_date?: string;
  evaluated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateEvaluationCycleInput {
  achievements?: string;
  challenges?: string;
  goals_progress?: Record<string, GoalProgress>;
  total_attendances_planned?: number;
  plan_adjustments?: string;
  new_strategies?: string;
  resource_needs?: string;
  referrals_made?: any[];
  recommendations_next_cycle?: string;
  evaluation_date?: string;
}

// ============================================================================
// PLANO DE AEE (Estendido com novos campos V2.0)
// ============================================================================

export interface PlanoAEE {
  id: string;
  pei_id?: string;
  student_id: string;
  school_id: string;
  tenant_id: string;
  aee_center_id?: string;
  created_by: string;
  assigned_aee_teacher_id?: string;
  
  // Dados básicos
  status: PlanStatus;
  version: number;
  start_date?: string;
  end_date?: string;
  
  // Seções do plano
  diagnosis_tools?: any[];
  anamnesis_data?: any;
  learning_barriers?: any[];
  school_complaint?: string;
  family_complaint?: string;
  resources?: any[];
  adaptations?: any[];
  teaching_objectives?: any[];
  evaluation_methodology?: string;
  evaluation_instruments?: any[];
  follow_ups?: any[];
  referrals?: any[];
  family_guidance?: string;
  school_guidance?: string;
  other_guidance?: string;
  
  // Avaliações cíclicas (V1.0)
  cycle_1_evaluation?: any;
  cycle_2_evaluation?: any;
  cycle_3_evaluation?: any;
  
  // Estatísticas (V2.0)
  total_attendances?: number;
  attendance_percentage?: number;
  goals_achieved?: number;
  total_goals?: number;
  
  // Metadados
  created_at: string;
  updated_at: string;
  
  // Relações (quando incluídas no select)
  student?: any;
  school?: any;
  aee_center?: AEECenter;
}

// ============================================================================
// QUERIES E FILTROS
// ============================================================================

export interface AttendanceFilters {
  plan_id?: string;
  student_id?: string;
  teacher_id?: string;
  date_from?: string;
  date_to?: string;
  attendance_status?: AttendanceStatus;
}

export interface GoalsFilters {
  plan_id?: string;
  goal_area?: GoalArea;
  progress_status?: GoalStatus;
  priority?: GoalPriority;
}

export interface PlanoAEEFilters {
  school_id?: string;
  tenant_id?: string;
  status?: PlanStatus;
  assigned_aee_teacher_id?: string;
  aee_center_id?: string;
}

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

export interface PlanStatistics {
  total_attendances: number;
  attendance_percentage: number;
  present: number;
  absences_justified: number;
  absences_unjustified: number;
  total_goals: number;
  goals_achieved: number;
  goals_in_progress: number;
  goals_not_started: number;
  current_cycle: number;
  days_since_start: number;
}

export interface AttendanceStatistics {
  total: number;
  presente: number;
  faltas_justificadas: number;
  faltas_injustificadas: number;
  remarcados: number;
  attendance_rate: number;
}

export interface GoalsStatistics {
  total: number;
  achieved: number;
  in_progress: number;
  not_started: number;
  partially_achieved: number;
  cancelled: number;
  high_priority: number;
  by_area: Record<GoalArea, number>;
}

export interface CycleStatistics {
  cycle_number: 1 | 2 | 3;
  attendance_rate: number;
  goals_achieved: number;
  goals_total: number;
  days_duration: number;
  is_completed: boolean;
}

// ============================================================================
// DASHBOARD E ANALYTICS
// ============================================================================

export interface DashboardStats {
  // Contadores gerais
  total_plans: number;
  active_plans: number;
  active_students: number;
  
  // Frequência
  overall_attendance_rate: number;
  students_at_risk: number; // < 75% de frequência
  
  // Metas
  total_goals: number;
  goals_achieved: number;
  goals_success_rate: number;
  
  // Tendências
  attendance_trend: 'up' | 'down' | 'stable';
  goals_trend: 'up' | 'down' | 'stable';
  
  // Alertas
  alerts: DashboardAlert[];
  
  // Dados para gráficos
  monthly_attendance: MonthlyAttendanceData[];
  goals_by_area: GoalsByAreaData[];
}

export interface DashboardAlert {
  id: string;
  type: 'low_attendance' | 'cycle_ending' | 'goal_overdue' | 'plan_review';
  severity: 'low' | 'medium' | 'high';
  message: string;
  student_id?: string;
  plan_id?: string;
  created_at: string;
}

export interface MonthlyAttendanceData {
  month: string; // 'YYYY-MM'
  total: number;
  presente: number;
  rate: number;
}

export interface GoalsByAreaData {
  area: GoalArea;
  total: number;
  achieved: number;
  in_progress: number;
}

// ============================================================================
// FORMS E INPUTS
// ============================================================================

export interface GoalFormData {
  goal_description: string;
  goal_area: GoalArea;
  target_date?: string;
  activities?: string;
  materials_needed?: string;
  strategies?: string;
  success_criteria?: string;
  priority: GoalPriority;
}

export interface AttendanceFormData {
  attendance_status: AttendanceStatus;
  attendance_time?: string;
  duration_minutes?: number;
  absence_reason?: string;
  activities_performed?: string;
  goals_worked?: string[];
  materials_used?: string;
  student_performance?: string;
  behavior_observations?: string;
  observations?: string;
}

export interface CycleEvaluationFormData {
  achievements?: string;
  challenges?: string;
  plan_adjustments?: string;
  new_strategies?: string;
  resource_needs?: string;
  recommendations_next_cycle?: string;
  evaluation_date?: string;
}

// ============================================================================
// HELPERS E UTILIDADES
// ============================================================================

// Tradução de status de metas
export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  nao_iniciada: 'Não Iniciada',
  em_andamento: 'Em Andamento',
  alcancada: 'Alcançada',
  parcialmente_alcancada: 'Parcialmente Alcançada',
  ajustada: 'Ajustada',
  cancelada: 'Cancelada',
};

// Tradução de áreas de metas
export const GOAL_AREA_LABELS: Record<GoalArea, string> = {
  percepcao: 'Percepção',
  linguagem: 'Linguagem',
  motora: 'Motora',
  socio_emocional: 'Socioemocional',
  autonomia: 'Autonomia',
  academica: 'Acadêmica',
  geral: 'Geral',
};

// Tradução de prioridades
export const GOAL_PRIORITY_LABELS: Record<GoalPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

// Ícones de prioridade
export const GOAL_PRIORITY_ICONS: Record<GoalPriority, string> = {
  baixa: '🟢',
  media: '🟡',
  alta: '🔴',
};

// Tradução de status de atendimento
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  presente: 'Presente',
  falta_justificada: 'Falta Justificada',
  falta_injustificada: 'Falta Injustificada',
  remarcado: 'Remarcado',
};

// Ícones de status de atendimento
export const ATTENDANCE_STATUS_ICONS: Record<AttendanceStatus, string> = {
  presente: '✅',
  falta_justificada: '📝',
  falta_injustificada: '❌',
  remarcado: '🔄',
};

// ============================================================================
// VISITAS ESCOLARES E ENCAMINHAMENTOS
// ============================================================================

export interface VisitParticipant {
  nome: string;
  funcao: string;
  assinatura_url?: string;
}

export interface Orientation {
  categoria: string;
  descricao: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
}

export interface ResourceNeeded {
  recurso: string;
  quantidade: number;
  urgencia: 'Alta' | 'Média' | 'Baixa';
  providenciado: boolean;
}

export interface SuggestedAdaptation {
  area: string;
  adaptacao: string;
  implementado: boolean;
}

export interface SchoolVisit {
  id: string;
  plan_id: string;
  student_id: string;
  school_id: string;
  tenant_id: string;
  visit_date: string;
  visit_time?: string;
  duration_minutes: number;
  visit_type: VisitType;
  aee_teacher_id: string;
  participants: VisitParticipant[];
  observations?: string;
  class_environment?: string;
  student_interaction?: string;
  teacher_feedback?: string;
  orientations_given: Orientation[];
  resources_needed: ResourceNeeded[];
  suggested_adaptations: SuggestedAdaptation[];
  next_steps?: string;
  follow_up_date?: string;
  attachments: Array<{
    nome: string;
    url: string;
    tipo: 'foto' | 'documento';
  }>;
  status: VisitStatus;
  report_generated: boolean;
  report_url?: string;
  signatures: Record<string, {
    data: string;
    url: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface SpecialistContact {
  telefone?: string;
  email?: string;
  endereco?: string;
}

export interface Referral {
  id: string;
  plan_id: string;
  student_id: string;
  school_id: string;
  tenant_id: string;
  referral_date: string;
  specialist_type: string;
  specialist_name?: string;
  institution?: string;
  contact_info: SpecialistContact;
  reason: string;
  symptoms_observed?: string;
  urgency_level: UrgencyLevel;
  requested_by: string;
  referral_letter_url?: string;
  attachments: Array<{
    nome: string;
    url: string;
    tipo: string;
  }>;
  status: ReferralStatus;
  appointment_date?: string;
  appointment_status?: string;
  specialist_feedback?: string;
  specialist_report_url?: string;
  feedback_received_date?: string;
  diagnosis_summary?: string;
  recommendations?: string;
  follow_up_needed: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  integrated_to_plan: boolean;
  integration_notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

export function isGoalAchieved(goal: PlanGoal): boolean {
  return goal.progress_status === 'alcancada';
}

export function isGoalInProgress(goal: PlanGoal): boolean {
  return goal.progress_status === 'em_andamento';
}

export function isHighPriority(goal: PlanGoal): boolean {
  return goal.priority === 'alta';
}

export function isAttendancePresent(attendance: AttendanceRecord): boolean {
  return attendance.attendance_status === 'presente';
}

export function isAttendanceAbsence(attendance: AttendanceRecord): boolean {
  return ['falta_justificada', 'falta_injustificada'].includes(attendance.attendance_status);
}

export function calculateAttendanceRate(attendances: AttendanceRecord[]): number {
  if (attendances.length === 0) return 0;
  const presente = attendances.filter(isAttendancePresent).length;
  return (presente / attendances.length) * 100;
}

export function calculateGoalSuccessRate(goals: PlanGoal[]): number {
  if (goals.length === 0) return 0;
  const achieved = goals.filter(isGoalAchieved).length;
  return (achieved / goals.length) * 100;
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export type {
  // Tipos base exportados acima
};

