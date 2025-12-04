import { supabase } from '@pei/database';

export interface InclusionIndicators {
  period: {
    start_date: string;
    end_date: string;
  };
  students: {
    total: number;
    with_pei: number;
    with_aee: number;
    pei_coverage: number;
    aee_coverage: number;
  };
  pei: {
    total_goals: number;
    goals_achieved: number;
    goals_in_progress: number;
    goals_not_started: number;
    achievement_rate: number;
  };
  aee: {
    total_objectives: number;
    objectives_completed: number;
    objectives_active: number;
    completion_rate: number;
  };
  attendance: {
    average_rate: number;
    students_low_attendance: number;
  };
  teachers: {
    total_teachers: number;
    teachers_with_pei: number;
    aee_teachers_active: number;
  };
}

export interface SchoolIndicators {
  school_id: string;
  school_name: string;
  tenant_id: string;
  network_name: string;
  total_students: number;
  students_with_pei: number;
  students_with_aee: number;
  average_attendance_rate: number;
  students_low_attendance: number;
  pei_goals_achieved: number;
  pei_goals_in_progress: number;
  pei_goals_not_started: number;
  aee_objectives_completed: number;
  aee_objectives_active: number;
  teachers_with_pei_assigned: number;
  aee_teachers_active: number;
}

export interface NetworkIndicators {
  tenant_id: string;
  network_name: string;
  total_schools: number;
  total_students: number;
  students_with_pei: number;
  students_with_aee: number;
  pei_coverage_percentage: number;
  aee_coverage_percentage: number;
  average_attendance_rate: number;
  total_pei_goals_achieved: number;
  total_pei_goals_in_progress: number;
  total_aee_objectives_completed: number;
}

export interface DrilldownData {
  level: 'network' | 'school' | 'class' | 'student';
  [key: string]: any;
}

export const inclusionIndicatorsService = {
  /**
   * Calcula indicadores de inclusão
   */
  async calculateIndicators(
    tenantId?: string,
    schoolId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<InclusionIndicators> {
    const { data, error } = await supabase.rpc('calculate_inclusion_indicators', {
      p_tenant_id: tenantId || null,
      p_school_id: schoolId || null,
      p_start_date: startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      p_end_date: endDate || new Date().toISOString().split('T')[0],
    });

    if (error) throw error;
    return data as InclusionIndicators;
  },

  /**
   * Busca indicadores por escola
   */
  async getSchoolIndicators(tenantId?: string): Promise<SchoolIndicators[]> {
    let query = supabase
      .from('inclusion_indicators_by_school')
      .select('*')
      .order('school_name', { ascending: true });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as SchoolIndicators[];
  },

  /**
   * Busca indicadores por rede
   */
  async getNetworkIndicators(tenantId?: string): Promise<NetworkIndicators[]> {
    let query = supabase
      .from('inclusion_indicators_by_network')
      .select('*')
      .order('network_name', { ascending: true });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as NetworkIndicators[];
  },

  /**
   * Busca dados para drilldown
   */
  async getDrilldownData(
    tenantId: string,
    schoolId?: string,
    classId?: string,
    studentId?: string,
    metricType: string = 'all'
  ): Promise<DrilldownData> {
    const { data, error } = await supabase.rpc('get_drilldown_data', {
      p_tenant_id: tenantId,
      p_school_id: schoolId || null,
      p_class_id: classId || null,
      p_student_id: studentId || null,
      p_metric_type: metricType,
    });

    if (error) throw error;
    return data as DrilldownData;
  },

  /**
   * Exporta dados de inclusão
   */
  async exportInclusionData(
    tenantId: string,
    schoolId?: string,
    format: 'csv' | 'excel' = 'csv',
    includeDetails: boolean = false
  ): Promise<Record<string, any>> {
    const { data, error } = await supabase.rpc('export_inclusion_data', {
      p_tenant_id: tenantId,
      p_school_id: schoolId || null,
      p_format: format,
      p_include_details: includeDetails,
    });

    if (error) throw error;
    return data as Record<string, any>;
  },
};

