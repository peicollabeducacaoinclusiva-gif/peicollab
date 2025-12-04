// ============================================================================
// TIPOS: Integração com Cronogramas Existentes
// ============================================================================
// Tipos TypeScript para vinculação de cronogramas AEE aos cronogramas existentes
// (class_schedules e academic_calendars do app Gestão Escolar)
// Data: 2025-02-20
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type ScheduleType = 
  | 'individual_aee' 
  | 'group_aee' 
  | 'co_teaching' 
  | 'material_production'
  | 'visit'
  | 'assessment';

export type ScheduleFrequency = 
  | 'daily' 
  | 'weekly' 
  | 'biweekly' 
  | 'monthly' 
  | 'custom';

export type ScheduleLocation = 
  | 'aee_room' 
  | 'regular_classroom' 
  | 'library' 
  | 'lab' 
  | 'outside' 
  | 'online'
  | 'other';

export type ScheduleStatus = 
  | 'active' 
  | 'paused' 
  | 'completed' 
  | 'cancelled';

export type ExceptionType = 
  | 'holiday' 
  | 'absence' 
  | 'reschedule' 
  | 'cancellation'
  | 'substitute'
  | 'special_event';

// ============================================================================
// INTERFACES: Cronogramas
// ============================================================================

export interface ServiceScheduleLink {
  id: string;
  plan_id: string;
  schedule_id?: string; // ID do class_schedule (se vinculado)
  student_id?: string;
  aee_teacher_id: string;
  
  schedule_type: ScheduleType;
  
  // Horário específico (se não vinculado a class_schedule)
  day_of_week?: number; // 0=Domingo, 1=Segunda, etc.
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  
  frequency: ScheduleFrequency;
  custom_frequency?: CustomFrequency;
  
  start_date?: string;
  end_date?: string;
  
  location_specific?: ScheduleLocation;
  location_details?: string;
  
  co_teaching_session_id?: string;
  visit_id?: string;
  
  group_students: GroupStudent[];
  max_students?: number;
  
  status: ScheduleStatus;
  notes?: string;
  
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relacionamentos (opcional, preenchidos via joins)
  student_name?: string;
  aee_teacher_name?: string;
  class_name?: string;
  class_grade?: string;
  class_shift?: string;
  academic_year?: number;
}

export interface CustomFrequency {
  pattern: string; // 'every_2_weeks', 'first_monday', etc.
  description?: string;
}

export interface GroupStudent {
  student_id: string;
  name: string;
}

export interface ScheduleException {
  id: string;
  schedule_link_id: string;
  exception_date: string;
  exception_type: ExceptionType;
  reason?: string;
  rescheduled_to?: string;
  replacement_date?: string;
  substitute_teacher_id?: string;
  created_at: string;
  created_by?: string;
  
  // Relacionamentos (opcional, preenchidos via joins)
  substitute_teacher_name?: string;
}

// ============================================================================
// INTERFACES: Inputs (Create/Update)
// ============================================================================

export interface CreateServiceScheduleLinkInput {
  plan_id: string;
  schedule_id?: string;
  student_id?: string;
  aee_teacher_id: string;
  schedule_type: ScheduleType;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  frequency?: ScheduleFrequency;
  custom_frequency?: CustomFrequency;
  start_date?: string;
  end_date?: string;
  location_specific?: ScheduleLocation;
  location_details?: string;
  co_teaching_session_id?: string;
  visit_id?: string;
  group_students?: GroupStudent[];
  max_students?: number;
  status?: ScheduleStatus;
  notes?: string;
}

export interface UpdateServiceScheduleLinkInput {
  schedule_id?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  frequency?: ScheduleFrequency;
  custom_frequency?: CustomFrequency;
  start_date?: string;
  end_date?: string;
  location_specific?: ScheduleLocation;
  location_details?: string;
  group_students?: GroupStudent[];
  max_students?: number;
  status?: ScheduleStatus;
  notes?: string;
}

export interface CreateScheduleExceptionInput {
  schedule_link_id: string;
  exception_date: string;
  exception_type: ExceptionType;
  reason?: string;
  rescheduled_to?: string;
  replacement_date?: string;
  substitute_teacher_id?: string;
}

export interface UpdateScheduleExceptionInput {
  exception_date?: string;
  exception_type?: ExceptionType;
  reason?: string;
  rescheduled_to?: string;
  replacement_date?: string;
  substitute_teacher_id?: string;
}

// ============================================================================
// INTERFACES: Filtros e Consultas
// ============================================================================

export interface ServiceScheduleLinkFilters {
  plan_id?: string;
  student_id?: string;
  aee_teacher_id?: string;
  schedule_type?: ScheduleType;
  status?: ScheduleStatus;
  day_of_week?: number;
  date_from?: string;
  date_to?: string;
  schedule_id?: string;
}

export interface ScheduleConflictCheck {
  has_conflict: boolean;
  conflict_type?: string;
  conflict_details?: Record<string, unknown>;
}

export interface AvailableSlot {
  suggested_date: string;
  suggested_day_of_week: number;
  suggested_start_time: string;
  suggested_end_time: string;
  available: boolean;
}

// ============================================================================
// INTERFACES: Integração com Class Schedules
// ============================================================================

export interface ClassScheduleIntegration {
  schedule_id: string;
  class_id: string;
  class_name: string;
  class_grade?: string;
  class_shift?: string;
  academic_year: number;
  monday?: ScheduleSlot[];
  tuesday?: ScheduleSlot[];
  wednesday?: ScheduleSlot[];
  thursday?: ScheduleSlot[];
  friday?: ScheduleSlot[];
  saturday?: ScheduleSlot[];
}

export interface ScheduleSlot {
  time_start: string;
  time_end: string;
  subject_id?: string;
  teacher_id?: string;
  room?: string;
}


