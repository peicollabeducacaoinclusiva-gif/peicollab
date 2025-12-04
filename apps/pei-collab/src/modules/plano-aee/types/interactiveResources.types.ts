// ============================================================================
// TIPOS: Integração com Recursos Interativos do App Atividades
// ============================================================================
// Tipos TypeScript para vinculação de atividades do App Atividades ao Plano AEE
// Nota: Recursos interativos são desenvolvidos no App Atividades
// Este módulo apenas registra o uso e adaptações no contexto do AEE
// Data: 2025-02-20
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type ActivityType = 
  | 'game' 
  | 'quiz' 
  | 'simulation' 
  | 'story' 
  | 'exercise'
  | 'other';

export type ActivityUsageContext = 
  | 'individual_aee' 
  | 'group_aee' 
  | 'co_teaching' 
  | 'homework'
  | 'assessment';

export type StudentEngagement = 'low' | 'medium' | 'high';

export type AccessibilityFeature = 
  | 'screen_reader' 
  | 'high_contrast' 
  | 'adjustable_speed'
  | 'subtitles'
  | 'audio_description'
  | 'keyboard_navigation'
  | 'voice_control'
  | 'other';

// ============================================================================
// INTERFACES: Vinculação de Atividades
// ============================================================================

export interface ActivityLink {
  id: string;
  plan_id: string;
  student_id?: string;
  
  activity_id: string; // ID da atividade no App Atividades
  activity_name: string;
  activity_type?: ActivityType;
  activity_url?: string; // URL da atividade no App Atividades
  
  adaptations_made: ActivityAdaptation[];
  target_disabilities: string[];
  target_skills: TargetSkill[];
  accessibility_adaptations: AccessibilityAdaptation[];
  
  used_in_context?: ActivityUsageContext;
  co_teaching_session_id?: string;
  
  effectiveness_rating?: number; // 1-5
  student_response?: string;
  effectiveness_feedback?: string;
  usage_count: number;
  
  linked_by: string;
  linked_at: string;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (opcional, preenchidos via joins)
  student_name?: string;
  linked_by_name?: string;
}

export interface ActivityAdaptation {
  adaptation_type: string;
  description: string;
  reason: string;
}

export interface TargetSkill {
  skill: string;
  level: string;
}

export interface AccessibilityAdaptation {
  feature: AccessibilityFeature;
  enabled: boolean;
  description?: string;
}

// ============================================================================
// INTERFACES: Sessões de Uso de Atividades
// ============================================================================

export interface ActivitySession {
  id: string;
  activity_link_id: string;
  plan_id: string;
  student_id: string;
  
  session_date: string;
  duration_minutes?: number;
  used_by: string;
  
  student_responses: StudentResponses;
  performance_data: PerformanceData;
  learning_outcomes?: string;
  skills_demonstrated: string[];
  areas_needing_improvement: string[];
  
  observations?: string;
  student_engagement?: StudentEngagement;
  adaptations_used: ActivityAdaptation[];
  
  next_steps?: string;
  recommended_follow_up?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (opcional, preenchidos via joins)
  student_name?: string;
  user_name?: string;
  activity_name?: string;
}

export interface StudentResponses {
  responses?: unknown[];
  score?: number;
  completion_percentage?: number;
  correct_answers?: number;
  total_questions?: number;
  time_spent_seconds?: number;
}

export interface PerformanceData {
  time_spent?: number; // em minutos
  attempts?: number;
  errors?: number;
  hints_used?: number;
  level_achieved?: number;
  achievements?: string[];
  improvements_from_baseline?: number;
}

// ============================================================================
// INTERFACES: Inputs (Create/Update)
// ============================================================================

export interface CreateActivityLinkInput {
  plan_id: string;
  activity_id: string;
  activity_name: string;
  activity_type?: ActivityType;
  activity_url?: string;
  adaptations_made?: ActivityAdaptation[];
  target_disabilities?: string[];
  target_skills?: TargetSkill[];
  accessibility_adaptations?: AccessibilityAdaptation[];
  used_in_context?: ActivityUsageContext;
  student_id?: string;
  co_teaching_session_id?: string;
}

export interface UpdateActivityLinkInput {
  adaptations_made?: ActivityAdaptation[];
  target_disabilities?: string[];
  target_skills?: TargetSkill[];
  accessibility_adaptations?: AccessibilityAdaptation[];
  used_in_context?: ActivityUsageContext;
  effectiveness_rating?: number;
  student_response?: string;
  effectiveness_feedback?: string;
}

export interface CreateActivitySessionInput {
  activity_link_id: string;
  plan_id: string;
  student_id: string;
  session_date: string;
  duration_minutes?: number;
  student_responses?: StudentResponses;
  performance_data?: PerformanceData;
  learning_outcomes?: string;
  skills_demonstrated?: string[];
  areas_needing_improvement?: string[];
  observations?: string;
  student_engagement?: StudentEngagement;
  adaptations_used?: ActivityAdaptation[];
  next_steps?: string;
  recommended_follow_up?: string;
}

export interface UpdateActivitySessionInput {
  duration_minutes?: number;
  student_responses?: StudentResponses;
  performance_data?: PerformanceData;
  learning_outcomes?: string;
  skills_demonstrated?: string[];
  areas_needing_improvement?: string[];
  observations?: string;
  student_engagement?: StudentEngagement;
  adaptations_used?: ActivityAdaptation[];
  next_steps?: string;
  recommended_follow_up?: string;
}

// ============================================================================
// INTERFACES: Filtros e Consultas
// ============================================================================

export interface ActivityLinkFilters {
  plan_id?: string;
  student_id?: string;
  activity_id?: string;
  activity_type?: ActivityType;
  used_in_context?: ActivityUsageContext;
  target_disabilities?: string[];
}

export interface ActivitySessionFilters {
  activity_link_id?: string;
  plan_id?: string;
  student_id?: string;
  date_from?: string;
  date_to?: string;
  used_by?: string;
}


