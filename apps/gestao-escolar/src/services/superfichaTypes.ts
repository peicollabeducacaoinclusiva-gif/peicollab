/**
 * Tipos para os dados da Superficha
 * Arquivo separado para garantir compatibilidade com esbuild
 */

export interface RiskIndicator {
  level: 'low' | 'medium' | 'high' | 'unknown';
  percentage?: number;
  total_absences?: number;
  total_classes?: number;
  recent_absences?: number;
  average_grade?: number;
  needs_attention?: boolean;
  has_special_needs?: boolean;
  has_active_pei?: boolean;
  has_active_aee?: boolean;
  pei_status?: string;
}

export interface RiskIndicators {
  frequency_risk: RiskIndicator;
  grade_risk: RiskIndicator;
  inclusion_risk: RiskIndicator;
  overall_risk: 'low' | 'medium' | 'high';
  calculated_at: string;
}

export interface Suggestion {
  type: 'frequency' | 'academic' | 'inclusion' | 'behavior' | 'other';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: string;
}

export interface StudentSuggestions {
  suggestions: Suggestion[];
  count: number;
  high_priority_count: number;
  generated_at: string;
}

export interface ActivityTimelineItem {
  id: string;
  type: 'diary_entry' | 'pei_change' | 'enrollment_change' | 'document' | 'other';
  title: string;
  description: string;
  date: string;
  created_at: string;
  created_by?: string;
  metadata?: Record<string, any>;
}

export interface ActivityTimeline {
  activities: ActivityTimelineItem[];
  count: number;
}

export interface CompleteStudentProfile {
  student: Record<string, any>;
  school: Record<string, any>;
  tenant: Record<string, any>;
  active_pei?: Record<string, any> | null;
  active_aee?: Record<string, any> | null;
  current_enrollment?: Record<string, any> | null;
  enrollments_history: Record<string, any>[];
  recent_attendance?: Array<{
    id: string;
    date: string;
    present: boolean;
    delay_minutes?: number;
    notes?: string;
  }>;
  accessibility_indicators: Record<string, any>;
}

