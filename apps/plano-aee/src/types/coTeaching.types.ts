// ============================================================================
// TIPOS: Co-ensino e Planejamento Conjunto
// ============================================================================
// Tipos TypeScript para o sistema de co-ensino entre professor AEE e regular
// Data: 2025-02-20
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type CoTeachingSessionStatus = 
  | 'planned' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'postponed';

export type StudentEngagement = 'low' | 'medium' | 'high';

export type CoTeachingParticipantRole = 
  | 'co_teacher' 
  | 'observer' 
  | 'support' 
  | 'student_support' 
  | 'specialist';

export type ParticipationLevel = 'active' | 'observing' | 'supporting';

export type LessonPlanStatus = 'draft' | 'shared' | 'approved' | 'rejected';

// ============================================================================
// INTERFACES: Co-ensino
// ============================================================================

export interface CoTeachingSession {
  id: string;
  plan_id: string;
  student_id: string;
  class_id: string;
  regular_teacher_id: string;
  aee_teacher_id: string;
  
  session_date: string;
  start_time: string;
  end_time: string;
  subject_id?: string;
  subject_name?: string;
  topic?: string;
  grade?: string;
  
  lesson_plan_id?: string;
  materials_used: MaterialUsed[];
  
  observations?: string;
  effectiveness_rating?: number; // 1-5
  student_engagement?: StudentEngagement;
  inclusion_success?: boolean;
  challenges_faced?: string;
  success_factors?: string;
  next_steps?: string;
  
  status: CoTeachingSessionStatus;
  
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relacionamentos (opcional, preenchidos via joins)
  regular_teacher_name?: string;
  aee_teacher_name?: string;
  student_name?: string;
  class_name?: string;
  lesson_plan?: LessonPlan;
}

export interface MaterialUsed {
  material_id?: string;
  material_name: string;
  how_used: string;
}

export interface LessonPlan {
  id: string;
  co_teaching_session_id?: string;
  plan_id: string;
  class_id?: string;
  subject_id?: string;
  
  subject: string;
  topic: string;
  grade?: string;
  duration_minutes?: number;
  planned_date?: string;
  
  learning_objectives: LearningObjective[];
  inclusive_strategies: InclusiveStrategy[];
  differentiated_activities: DifferentiatedActivity[];
  
  aee_teacher_contributions: TeacherContributions;
  regular_teacher_contributions: TeacherContributions;
  
  adaptations_needed: Adaptation[];
  materials_list: LessonMaterial[];
  assessment_methods: AssessmentMethod[];
  
  status: LessonPlanStatus;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  
  created_at: string;
  updated_at: string;
}

export interface LearningObjective {
  objective: string;
  target_student: string | 'all';
  success_criteria: string;
}

export interface InclusiveStrategy {
  strategy: string;
  description: string;
  applied_to: string;
}

export interface DifferentiatedActivity {
  activity_name: string;
  description: string;
  for_whom: string;
  materials: string[];
}

export interface TeacherContributions {
  role: string;
  responsibilities: string[];
  specialized_support?: string;
  content_delivery?: string;
}

export interface Adaptation {
  type: string;
  description: string;
  implementation: string;
}

export interface LessonMaterial {
  material: string;
  quantity?: number;
  location?: string;
  accessibility_features?: string[];
}

export interface AssessmentMethod {
  method: string;
  description: string;
  adapted_for?: string;
}

export interface CoTeachingParticipant {
  id: string;
  session_id: string;
  user_id: string;
  role: CoTeachingParticipantRole;
  participation_level?: ParticipationLevel;
  feedback: ParticipantFeedback;
  
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (opcional, preenchidos via joins)
  user_name?: string;
}

export interface ParticipantFeedback {
  observations?: string;
  suggestions?: string;
  effectiveness_rating?: number; // 1-5
}

// ============================================================================
// INTERFACES: Inputs (Create/Update)
// ============================================================================

export interface CreateCoTeachingSessionInput {
  plan_id: string;
  student_id: string;
  class_id: string;
  regular_teacher_id: string;
  aee_teacher_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  subject_id?: string;
  subject_name?: string;
  topic?: string;
  grade?: string;
  lesson_plan_id?: string;
  materials_used?: MaterialUsed[];
  status?: CoTeachingSessionStatus;
}

export interface UpdateCoTeachingSessionInput {
  session_date?: string;
  start_time?: string;
  end_time?: string;
  topic?: string;
  materials_used?: MaterialUsed[];
  observations?: string;
  effectiveness_rating?: number;
  student_engagement?: StudentEngagement;
  inclusion_success?: boolean;
  challenges_faced?: string;
  success_factors?: string;
  next_steps?: string;
  status?: CoTeachingSessionStatus;
}

export interface CreateLessonPlanInput {
  plan_id: string;
  co_teaching_session_id?: string;
  class_id?: string;
  subject_id?: string;
  subject: string;
  topic: string;
  grade?: string;
  duration_minutes?: number;
  planned_date?: string;
  learning_objectives?: LearningObjective[];
  inclusive_strategies?: InclusiveStrategy[];
  differentiated_activities?: DifferentiatedActivity[];
  aee_teacher_contributions?: TeacherContributions;
  regular_teacher_contributions?: TeacherContributions;
  adaptations_needed?: Adaptation[];
  materials_list?: LessonMaterial[];
  assessment_methods?: AssessmentMethod[];
  status?: LessonPlanStatus;
}

export interface UpdateLessonPlanInput {
  subject?: string;
  topic?: string;
  duration_minutes?: number;
  planned_date?: string;
  learning_objectives?: LearningObjective[];
  inclusive_strategies?: InclusiveStrategy[];
  differentiated_activities?: DifferentiatedActivity[];
  aee_teacher_contributions?: TeacherContributions;
  regular_teacher_contributions?: TeacherContributions;
  adaptations_needed?: Adaptation[];
  materials_list?: LessonMaterial[];
  assessment_methods?: AssessmentMethod[];
  status?: LessonPlanStatus;
  approval_notes?: string;
}

export interface AddParticipantInput {
  session_id: string;
  user_id: string;
  role: CoTeachingParticipantRole;
  participation_level?: ParticipationLevel;
}

export interface UpdateParticipantFeedbackInput {
  feedback: ParticipantFeedback;
}

// ============================================================================
// INTERFACES: Filtros e Consultas
// ============================================================================

export interface CoTeachingSessionFilters {
  plan_id?: string;
  student_id?: string;
  class_id?: string;
  regular_teacher_id?: string;
  aee_teacher_id?: string;
  status?: CoTeachingSessionStatus;
  date_from?: string;
  date_to?: string;
}

export interface LessonPlanFilters {
  plan_id?: string;
  class_id?: string;
  subject_id?: string;
  status?: LessonPlanStatus;
  created_by?: string;
  date_from?: string;
  date_to?: string;
}

