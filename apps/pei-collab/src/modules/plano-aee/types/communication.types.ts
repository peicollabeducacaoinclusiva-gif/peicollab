// ============================================================================
// TIPOS: Comunicação e Monitoramento
// ============================================================================
// Tipos TypeScript para comunicação entre professores e monitoramento de progresso
// Data: 2025-02-20
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type CommunicationType = 
  | 'message' 
  | 'meeting_request' 
  | 'feedback' 
  | 'alert'
  | 'question'
  | 'suggestion'
  | 'update';

export type CommunicationPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

export type LearningRepertoireRecordType = 
  | 'initial' 
  | 'continuous' 
  | 'assessment' 
  | 'update';

export type MetricType = 
  | 'skill_acquisition' 
  | 'behavior_change' 
  | 'participation' 
  | 'independence'
  | 'communication'
  | 'social_interaction'
  | 'academic_achievement'
  | 'motor_skills'
  | 'self_care'
  | 'other';

export type MetricUnit = 
  | 'percentage' 
  | 'count' 
  | 'rating' 
  | 'duration_minutes' 
  | 'score'
  | 'other';

export type ProgressTrend = 
  | 'improving' 
  | 'stable' 
  | 'declining' 
  | 'fluctuating';

export type SupportLevel = 'low' | 'medium' | 'high';

export type PerformanceLevel = 'below' | 'at' | 'above';

export type LearningPace = 'slow' | 'average' | 'fast';

export type MotivationLevel = 'low' | 'medium' | 'high';

export type WorkingPreference = 'individual' | 'pair' | 'group' | 'flexible';

// ============================================================================
// INTERFACES: Comunicação
// ============================================================================

export interface TeacherCommunication {
  id: string;
  plan_id: string;
  from_user_id: string;
  to_user_id: string;
  
  communication_type: CommunicationType;
  subject?: string;
  message_text: string;
  priority: CommunicationPriority;
  
  read_status: boolean;
  read_at?: string;
  
  related_session_id?: string;
  related_material_id?: string;
  related_activity_id?: string;
  parent_message_id?: string; // Para threads
  
  attachments: CommunicationAttachment[];
  
  action_required: boolean;
  action_deadline?: string;
  action_completed: boolean;
  action_completed_at?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (opcional, preenchidos via joins)
  from_user_name?: string;
  to_user_name?: string;
}

export interface CommunicationAttachment {
  file_name: string;
  file_url: string;
  file_type: string;
}

// ============================================================================
// INTERFACES: Repertório de Aprendizagem
// ============================================================================

export interface LearningRepertoire {
  id: string;
  student_id: string;
  plan_id: string;
  recorded_by: string;
  
  record_date: string;
  record_type: LearningRepertoireRecordType;
  
  family_context: FamilyContext;
  social_context: SocialContext;
  academic_context: AcademicContext;
  communication_profile: CommunicationProfile;
  learning_preferences: LearningPreferences;
  strengths_weaknesses: StrengthsWeaknesses;
  interventions_history: InterventionHistory[];
  
  notes?: string;
  next_assessment_date?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (opcional, preenchidos via joins)
  student_name?: string;
  recorded_by_name?: string;
}

export interface FamilyContext {
  structure?: string;
  dynamics?: string;
  support_level?: SupportLevel;
  family_members?: FamilyMember[];
  economic_situation?: string;
  cultural_background?: string;
  home_environment?: string;
}

export interface FamilyMember {
  name: string;
  relationship: string;
  support_role: string;
}

export interface SocialContext {
  peer_relationships?: string;
  integration_level?: SupportLevel;
  group_participation?: string;
  social_skills?: string;
  friendships?: Friendship[];
  social_challenges?: string;
  social_strengths?: string;
}

export interface Friendship {
  friend_name: string;
  relationship_quality: string;
}

export interface AcademicContext {
  performance_level?: PerformanceLevel;
  strengths_subjects?: string[];
  challenges_subjects?: string[];
  areas_of_interest?: string[];
  learning_pace?: LearningPace;
  motivation_level?: MotivationLevel;
  study_habits?: string;
  homework_completion?: string;
}

export interface CommunicationProfile {
  preferred_forms?: string[]; // 'verbal', 'gestural', 'written', 'visual', 'augmentative'
  communication_devices?: string[];
  vocabulary_level?: string;
  comprehension_level?: string;
  expression_level?: string;
  assistive_technology_used?: string[];
  barriers?: string[];
}

export interface LearningPreferences {
  learning_styles?: string[]; // 'visual', 'auditory', 'kinesthetic', 'reading'
  learning_pace?: string;
  attention_span?: string;
  effective_strategies?: string[];
  environment_preferences?: string;
  stimuli_preferences?: string;
  working_preferences?: WorkingPreference;
}

export interface StrengthsWeaknesses {
  strengths?: StrengthWeakness[];
  weaknesses?: StrengthWeakness[];
  opportunities?: string[];
  challenges?: string[];
}

export interface StrengthWeakness {
  area: string;
  description: string;
  examples?: string[];
  interventions_needed?: string[];
}

export interface InterventionHistory {
  intervention_type: string;
  date_start: string;
  date_end?: string;
  provider: string;
  effectiveness?: string;
  notes?: string;
}

// ============================================================================
// INTERFACES: Monitoramento de Progresso
// ============================================================================

export interface ProgressTracking {
  id: string;
  plan_id: string;
  student_id: string;
  goal_id?: string;
  
  tracking_date: string;
  tracker_id: string;
  
  metric_type: MetricType;
  metric_value?: number;
  metric_unit?: MetricUnit;
  metric_description?: string;
  
  observation_data: ObservationData;
  evidence_attachments: EvidenceAttachment[];
  
  baseline_comparison?: ComparisonData;
  target_comparison?: ComparisonData;
  
  trend?: ProgressTrend;
  trend_analysis?: string;
  
  observations?: string;
  recommendations?: string;
  next_steps?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (opcional, preenchidos via joins)
  student_name?: string;
  tracker_name?: string;
}

export interface ObservationData {
  context?: string;
  method?: string;
  duration?: number;
  environment?: string;
  supports_used?: string[];
  challenges_observed?: string[];
  successes_observed?: string[];
}

export interface EvidenceAttachment {
  type: 'photo' | 'video' | 'document' | 'audio';
  url: string;
  description?: string;
}

export interface ComparisonData {
  baseline_value?: number;
  baseline_date?: string;
  improvement?: number;
  target_value?: number;
  target_date?: string;
  progress_percentage?: number;
}

// ============================================================================
// INTERFACES: Inputs (Create/Update)
// ============================================================================

export interface CreateTeacherCommunicationInput {
  plan_id: string;
  to_user_id: string;
  communication_type: CommunicationType;
  subject?: string;
  message_text: string;
  priority?: CommunicationPriority;
  related_session_id?: string;
  related_material_id?: string;
  related_activity_id?: string;
  parent_message_id?: string;
  attachments?: CommunicationAttachment[];
  action_required?: boolean;
  action_deadline?: string;
}

export interface UpdateTeacherCommunicationInput {
  read_status?: boolean;
  action_completed?: boolean;
  message_text?: string;
  attachments?: CommunicationAttachment[];
}

export interface CreateLearningRepertoireInput {
  student_id: string;
  plan_id: string;
  record_date: string;
  record_type: LearningRepertoireRecordType;
  family_context?: FamilyContext;
  social_context?: SocialContext;
  academic_context?: AcademicContext;
  communication_profile?: CommunicationProfile;
  learning_preferences?: LearningPreferences;
  strengths_weaknesses?: StrengthsWeaknesses;
  interventions_history?: InterventionHistory[];
  notes?: string;
  next_assessment_date?: string;
}

export interface UpdateLearningRepertoireInput {
  record_date?: string;
  record_type?: LearningRepertoireRecordType;
  family_context?: FamilyContext;
  social_context?: SocialContext;
  academic_context?: AcademicContext;
  communication_profile?: CommunicationProfile;
  learning_preferences?: LearningPreferences;
  strengths_weaknesses?: StrengthsWeaknesses;
  interventions_history?: InterventionHistory[];
  notes?: string;
  next_assessment_date?: string;
}

export interface CreateProgressTrackingInput {
  plan_id: string;
  student_id: string;
  goal_id?: string;
  tracking_date: string;
  metric_type: MetricType;
  metric_value?: number;
  metric_unit?: MetricUnit;
  metric_description?: string;
  observation_data?: ObservationData;
  evidence_attachments?: EvidenceAttachment[];
  baseline_comparison?: ComparisonData;
  target_comparison?: ComparisonData;
  trend?: ProgressTrend;
  trend_analysis?: string;
  observations?: string;
  recommendations?: string;
  next_steps?: string;
}

export interface UpdateProgressTrackingInput {
  tracking_date?: string;
  metric_value?: number;
  metric_unit?: MetricUnit;
  metric_description?: string;
  observation_data?: ObservationData;
  evidence_attachments?: EvidenceAttachment[];
  baseline_comparison?: ComparisonData;
  target_comparison?: ComparisonData;
  trend?: ProgressTrend;
  trend_analysis?: string;
  observations?: string;
  recommendations?: string;
  next_steps?: string;
}

// ============================================================================
// INTERFACES: Filtros e Consultas
// ============================================================================

export interface TeacherCommunicationFilters {
  plan_id?: string;
  from_user_id?: string;
  to_user_id?: string;
  communication_type?: CommunicationType;
  priority?: CommunicationPriority;
  read_status?: boolean;
  action_required?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface LearningRepertoireFilters {
  student_id?: string;
  plan_id?: string;
  record_type?: LearningRepertoireRecordType;
  date_from?: string;
  date_to?: string;
  recorded_by?: string;
}

export interface ProgressTrackingFilters {
  plan_id?: string;
  student_id?: string;
  goal_id?: string;
  metric_type?: MetricType;
  trend?: ProgressTrend;
  date_from?: string;
  date_to?: string;
  tracker_id?: string;
}

// ============================================================================
// INTERFACES: Estatísticas e Agregações
// ============================================================================

export interface UnreadMessage {
  id: string;
  plan_id: string;
  from_user_id: string;
  from_user_name: string;
  communication_type: CommunicationType;
  subject?: string;
  message_text: string;
  priority: CommunicationPriority;
  created_at: string;
}

export interface ProgressSummary {
  total_records: number;
  records_by_type: Record<MetricType, number>;
  average_improvement: number;
  trends: Record<ProgressTrend, number>;
  recent_trend: ProgressTrend;
}


