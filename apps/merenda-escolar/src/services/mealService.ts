import { supabase } from '@pei/database';
import type { MealMenu, MealPlan, MealSupplier, MealPurchase, MealAttendance } from '../types';

export const mealService = {
  // Cardápios
  async getMenus(filters?: {
    schoolId?: string;
    tenantId?: string;
    periodStart?: string;
    periodEnd?: string;
    mealType?: string;
  }) {
    const { data, error } = await supabase.rpc('get_meal_menus', {
      p_school_id: filters?.schoolId || null,
      p_tenant_id: filters?.tenantId || null,
      p_period_start: filters?.periodStart || null,
      p_period_end: filters?.periodEnd || null,
      p_meal_type: filters?.mealType || null,
    });

    if (error) throw error;
    return data as MealMenu[];
  },

  async createMenu(menu: {
    schoolId: string;
    tenantId: string;
    periodStart: string;
    periodEnd: string;
    mealType: string;
    dailyMenus?: any[];
    nutritionalInfo?: any;
  }) {
    const { data, error } = await supabase.rpc('create_meal_menu', {
      p_school_id: menu.schoolId,
      p_tenant_id: menu.tenantId,
      p_period_start: menu.periodStart,
      p_period_end: menu.periodEnd,
      p_meal_type: menu.mealType,
      p_daily_menus: menu.dailyMenus || [],
      p_nutritional_info: menu.nutritionalInfo || {},
    });

    if (error) throw error;
    return data;
  },

  async updateMenu(menuId: string, updates: Partial<MealMenu>) {
    const { data, error } = await supabase
      .from('meal_menus')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', menuId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMenu(menuId: string) {
    const { error } = await supabase
      .from('meal_menus')
      .delete()
      .eq('id', menuId);

    if (error) throw error;
  },

  // Planejamentos
  async getPlans(filters?: {
    schoolId?: string;
    tenantId?: string;
    status?: string;
  }) {
    let query = supabase
      .from('meal_plans')
      .select(`
        id,
        school_id,
        tenant_id,
        period_start,
        period_end,
        items,
        total_estimated_cost,
        status,
        approved_by,
        approved_at,
        created_at,
        updated_at,
        school:schools!meal_plans_school_id_fkey(school_name)
      `)
      .order('period_start', { ascending: false });

    if (filters?.schoolId) {
      query = query.eq('school_id', filters.schoolId);
    }
    if (filters?.tenantId) {
      query = query.eq('tenant_id', filters.tenantId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as MealPlan[];
  },

  async createPlan(plan: {
    schoolId: string;
    tenantId: string;
    periodStart: string;
    periodEnd: string;
    items?: any[];
    totalEstimatedCost?: number;
  }) {
    const { data, error } = await supabase.rpc('create_meal_plan', {
      p_school_id: plan.schoolId,
      p_tenant_id: plan.tenantId,
      p_period_start: plan.periodStart,
      p_period_end: plan.periodEnd,
      p_items: plan.items || [],
      p_total_estimated_cost: plan.totalEstimatedCost || null,
    });

    if (error) throw error;
    return data;
  },

  async updatePlan(planId: string, updates: Partial<MealPlan>) {
    const { data, error } = await supabase
      .from('meal_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Fornecedores
  async getSuppliers(tenantId: string, activeOnly = true) {
    let query = supabase
      .from('meal_suppliers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('supplier_name');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as MealSupplier[];
  },

  async createSupplier(supplier: Omit<MealSupplier, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('meal_suppliers')
      .insert(supplier)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSupplier(supplierId: string, updates: Partial<MealSupplier>) {
    const { data, error } = await supabase
      .from('meal_suppliers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', supplierId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Compras
  async getPurchases(filters?: {
    schoolId?: string;
    tenantId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let query = supabase
      .from('meal_purchases')
      .select(`
        id,
        meal_plan_id,
        supplier_id,
        school_id,
        tenant_id,
        purchase_date,
        items,
        total_amount,
        invoice_number,
        invoice_url,
        approved_by,
        approved_at,
        created_at,
        supplier:meal_suppliers!meal_purchases_supplier_id_fkey(supplier_name),
        school:schools!meal_purchases_school_id_fkey(school_name)
      `)
      .order('purchase_date', { ascending: false });

    if (filters?.schoolId) {
      query = query.eq('school_id', filters.schoolId);
    }
    if (filters?.tenantId) {
      query = query.eq('tenant_id', filters.tenantId);
    }
    if (filters?.startDate) {
      query = query.gte('purchase_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('purchase_date', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as MealPurchase[];
  },

  async createPurchase(purchase: Omit<MealPurchase, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('meal_purchases')
      .insert(purchase)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Consumo
  async getAttendance(filters?: {
    schoolId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
    mealType?: string;
  }) {
    let query = supabase
      .from('student_meal_attendance')
      .select(`
        id,
        student_id,
        school_id,
        meal_date,
        meal_type,
        consumed,
        quantity_served,
        observations,
        recorded_by,
        created_at,
        student:students!student_meal_attendance_student_id_fkey(name)
      `)
      .order('meal_date', { ascending: false });

    if (filters?.schoolId) {
      query = query.eq('school_id', filters.schoolId);
    }
    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters?.startDate) {
      query = query.gte('meal_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('meal_date', filters.endDate);
    }
    if (filters?.mealType) {
      query = query.eq('meal_type', filters.mealType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as MealAttendance[];
  },

  async recordConsumption(attendance: {
    studentId: string;
    schoolId: string;
    mealDate: string;
    mealType: string;
    consumed?: boolean;
    quantityServed?: number;
    observations?: string;
  }) {
    const { data, error } = await supabase.rpc('record_meal_consumption', {
      p_student_id: attendance.studentId,
      p_school_id: attendance.schoolId,
      p_meal_date: attendance.mealDate,
      p_meal_type: attendance.mealType,
      p_consumed: attendance.consumed ?? true,
      p_quantity_served: attendance.quantityServed || null,
      p_observations: attendance.observations || null,
    });

    if (error) throw error;
    return data;
  },
};

