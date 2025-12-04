// ============================================================================
// TIPOS: Materiais de Acessibilidade
// ============================================================================
// Tipos TypeScript para produção e uso de materiais de acessibilidade
// Nota: A biblioteca de materiais fica no app responsável
// Este módulo apenas registra produção e uso no contexto do AEE
// Data: 2025-02-20
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type MaterialType = 
  | 'visual' 
  | 'tactile' 
  | 'audio' 
  | 'digital' 
  | 'adaptation' 
  | 'other';

export type MaterialProductionStatus = 
  | 'planned' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export type MaterialUsageContext = 
  | 'individual_aee' 
  | 'group_aee' 
  | 'co_teaching' 
  | 'material_production';

export type StudentEngagement = 'low' | 'medium' | 'high';

// ============================================================================
// INTERFACES: Produção de Materiais
// ============================================================================

export interface MaterialProductionSession {
  id: string;
  plan_id: string;
  student_id?: string;
  created_by: string;
  
  material_name: string;
  material_type: MaterialType;
  material_reference_id?: string; // ID do material na biblioteca externa
  material_reference_url?: string; // URL do material na biblioteca externa
  
  description?: string;
  purpose: string;
  target_disability: string[];
  
  session_date: string;
  duration_minutes: number;
  production_steps: ProductionStep[];
  resources_used: ResourceUsed[];
  
  cost_estimate?: number;
  time_spent_minutes?: number;
  materials_cost?: number;
  
  file_url?: string; // URL no Supabase Storage
  file_type?: string;
  file_size?: number;
  
  notes?: string;
  status: MaterialProductionStatus;
  
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (opcional, preenchidos via joins)
  student_name?: string;
  creator_name?: string;
}

export interface ProductionStep {
  step: string;
  description: string;
  duration_minutes: number;
}

export interface ResourceUsed {
  resource: string;
  quantity: number;
  unit: string;
  cost?: number;
}

// ============================================================================
// INTERFACES: Uso de Materiais
// ============================================================================

export interface MaterialUsageLog {
  id: string;
  plan_id: string;
  student_id: string;
  attendance_id?: string;
  co_teaching_session_id?: string;
  production_session_id?: string;
  
  material_name: string;
  material_type?: MaterialType;
  material_reference_id?: string; // ID do material na biblioteca externa
  material_reference_url?: string; // URL do material na biblioteca externa
  
  used_date: string;
  used_by: string;
  context?: MaterialUsageContext;
  how_used?: string;
  duration_minutes?: number;
  
  effectiveness_feedback?: string;
  effectiveness_rating?: number; // 1-5
  student_response?: string;
  student_engagement?: StudentEngagement;
  learning_outcomes?: string;
  improvements_suggested?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (opcional, preenchidos via joins)
  student_name?: string;
  user_name?: string;
}

// ============================================================================
// INTERFACES: Inputs (Create/Update)
// ============================================================================

export interface CreateMaterialProductionSessionInput {
  plan_id: string;
  student_id?: string;
  material_name: string;
  material_type: MaterialType;
  material_reference_id?: string;
  material_reference_url?: string;
  description?: string;
  purpose: string;
  target_disability?: string[];
  session_date: string;
  duration_minutes: number;
  production_steps?: ProductionStep[];
  resources_used?: ResourceUsed[];
  cost_estimate?: number;
  time_spent_minutes?: number;
  materials_cost?: number;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  notes?: string;
  status?: MaterialProductionStatus;
}

export interface UpdateMaterialProductionSessionInput {
  material_name?: string;
  description?: string;
  purpose?: string;
  target_disability?: string[];
  session_date?: string;
  duration_minutes?: number;
  production_steps?: ProductionStep[];
  resources_used?: ResourceUsed[];
  cost_estimate?: number;
  time_spent_minutes?: number;
  materials_cost?: number;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  notes?: string;
  status?: MaterialProductionStatus;
}

export interface CreateMaterialUsageLogInput {
  plan_id: string;
  student_id: string;
  attendance_id?: string;
  co_teaching_session_id?: string;
  production_session_id?: string;
  material_name: string;
  material_type?: MaterialType;
  material_reference_id?: string;
  material_reference_url?: string;
  used_date: string;
  context?: MaterialUsageContext;
  how_used?: string;
  duration_minutes?: number;
  effectiveness_feedback?: string;
  effectiveness_rating?: number;
  student_response?: string;
  student_engagement?: StudentEngagement;
  learning_outcomes?: string;
  improvements_suggested?: string;
}

export interface UpdateMaterialUsageLogInput {
  how_used?: string;
  duration_minutes?: number;
  effectiveness_feedback?: string;
  effectiveness_rating?: number;
  student_response?: string;
  student_engagement?: StudentEngagement;
  learning_outcomes?: string;
  improvements_suggested?: string;
}

// ============================================================================
// INTERFACES: Filtros e Consultas
// ============================================================================

export interface MaterialProductionSessionFilters {
  plan_id?: string;
  student_id?: string;
  material_type?: MaterialType;
  status?: MaterialProductionStatus;
  date_from?: string;
  date_to?: string;
  created_by?: string;
}

export interface MaterialUsageLogFilters {
  plan_id?: string;
  student_id?: string;
  material_type?: MaterialType;
  context?: MaterialUsageContext;
  date_from?: string;
  date_to?: string;
  used_by?: string;
  material_reference_id?: string;
}

