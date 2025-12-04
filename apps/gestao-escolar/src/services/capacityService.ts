import { supabase } from '@pei/database';

export type CapacityAlertType = 'near_capacity' | 'full' | 'over_capacity';

export interface CapacityAlert {
  id: string;
  class_id: string;
  school_id: string;
  tenant_id: string;
  alert_type: CapacityAlertType;
  occupation_percentage: number;
  current_enrollments: number;
  max_capacity: number;
  message?: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  created_at: string;
}

export interface ClassAvailability {
  available: boolean;
  unlimited?: boolean;
  max_capacity?: number;
  current_enrollments: number;
  available_spots: number;
  occupation_percentage: number;
  is_full: boolean;
  near_capacity: boolean;
}

export const capacityService = {
  async checkClassAvailability(classId: string): Promise<ClassAvailability> {
    const { data, error } = await supabase.rpc('check_class_availability', {
      p_class_id: classId,
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Erro ao verificar disponibilidade');
    }

    return {
      available: data.available,
      unlimited: data.unlimited,
      max_capacity: data.max_capacity,
      current_enrollments: data.current_enrollments,
      available_spots: data.available_spots,
      occupation_percentage: data.occupation_percentage,
      is_full: data.is_full,
      near_capacity: data.near_capacity,
    };
  },

  async setClassCapacity(
    classId: string,
    maxCapacity: number,
    warningThreshold?: number
  ): Promise<void> {
    const updateData: any = {
      max_capacity: maxCapacity,
      updated_at: new Date().toISOString(),
    };

    if (warningThreshold !== undefined) {
      updateData.capacity_warning_threshold = warningThreshold;
    }

    const { error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', classId);

    if (error) throw error;

    // Gerar alertas após atualizar capacidade
    await this.generateAlerts(classId);
  },

  async getCapacityAlerts(filters: {
    tenantId?: string;
    schoolId?: string;
    classId?: string;
    acknowledged?: boolean;
    alertType?: CapacityAlertType;
  }): Promise<CapacityAlert[]> {
    let query = supabase
      .from('capacity_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.tenantId) {
      query = query.eq('tenant_id', filters.tenantId);
    }

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId);
    }

    if (filters.classId) {
      query = query.eq('class_id', filters.classId);
    }

    if (filters.acknowledged !== undefined) {
      query = query.eq('acknowledged', filters.acknowledged);
    }

    if (filters.alertType) {
      query = query.eq('alert_type', filters.alertType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as CapacityAlert[];
  },

  async acknowledgeAlert(alertId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('capacity_alerts')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.id,
      })
      .eq('id', alertId);

    if (error) throw error;
  },

  async generateAlerts(classId?: string): Promise<{ alertsGenerated: number }> {
    const { data, error } = await supabase.rpc('generate_capacity_alerts', {
      p_class_id: classId || null,
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Erro ao gerar alertas');
    }

    return { alertsGenerated: data.alerts_generated };
  },

  async getClassesWithCapacity(filters: {
    tenantId?: string;
    schoolId?: string;
    academicYear?: number;
  }): Promise<any[]> {
    let query = supabase
      .from('classes')
      .select(`
        *,
        schools!inner(school_name, tenant_id)
      `)
      .eq('is_active', true)
      .not('max_capacity', 'is', null);

    if (filters.tenantId) {
      query = query.eq('schools.tenant_id', filters.tenantId);
    }

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId);
    }

    if (filters.academicYear) {
      query = query.eq('academic_year', filters.academicYear);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },
};



