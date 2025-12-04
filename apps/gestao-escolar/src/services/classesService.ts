import { supabase } from '@pei/database';

export interface Class {
  id: string;
  class_name: string;
  education_level: string;
  grade?: string;
  shift?: string;
  academic_year: string;
  current_students: number;
  max_students: number;
  is_active: boolean;
  school_id?: string;
  tenant_id?: string;
  main_teacher_id?: string;
  school?: {
    school_name: string;
  };
  main_teacher?: {
    full_name: string;
  };
}

export interface ClassFilters {
  tenantId: string;
  schoolId?: string;
  search?: string;
  schoolFilter?: string;
  sortKey?: 'class_name' | 'grade' | 'school';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const classesService = {
  async getClasses(filters: ClassFilters) {
    const {
      tenantId,
      schoolId,
      search,
      schoolFilter,
      sortKey = 'class_name',
      sortDir = 'asc',
      page = 1,
      pageSize = 12,
    } = filters;

    // Verificar se existe RPC get_classes_paginated
    try {
      const { data, error } = await supabase.rpc('get_classes_paginated', {
        p_tenant_id: tenantId,
        p_school_id: schoolFilter === 'all' || !schoolFilter ? null : schoolFilter,
        p_search: search || null,
        p_sort_key: sortKey,
        p_sort_dir: sortDir,
        p_page: page,
        p_page_size: pageSize,
      });

      if (error) throw error;

      const items = (data || []).map((row: any) => ({
        id: row.id,
        class_name: row.class_name,
        grade: row.grade,
        academic_year: row.academic_year,
        shift: row.shift,
        education_level: row.education_level || 'ensino_fundamental_1',
        is_active: row.is_active ?? true,
        current_students: row.current_students || 0,
        max_students: row.max_students || 0,
        school: { school_name: row.school_name },
        school_id: row.school_id,
        tenant_id: tenantId,
      })) as Class[];

      const totalCount = data && data.length > 0 && typeof data[0].total_count === 'number'
        ? data[0].total_count
        : items.length;

      return {
        data: items,
        count: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    } catch (rpcError) {
      // Fallback para query direta se RPC não existir
      let query = supabase
        .from('classes')
        .select(`
          id,
          class_name,
          education_level,
          grade,
          shift,
          academic_year,
          current_students,
          max_students,
          is_active,
          school_id,
          tenant_id,
          main_teacher_id,
          schools!classes_school_id_fkey(school_name),
          main_teacher:profiles!classes_main_teacher_id_fkey(full_name)
        `, { count: 'exact' })
        .eq('tenant_id', tenantId);

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      if (schoolFilter && schoolFilter !== 'all') {
        query = query.eq('school_id', schoolFilter);
      }

      if (search) {
        query = query.ilike('class_name', `%${search}%`);
      }

      // Ordenação
      if (sortKey === 'school') {
        query = query.order('school_id', { ascending: sortDir === 'asc' });
      } else if (sortKey === 'grade') {
        query = query.order('grade', { ascending: sortDir === 'asc' });
      } else {
        query = query.order('class_name', { ascending: sortDir === 'asc' });
      }

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const items = (data || []).map((row: any) => ({
        id: row.id,
        class_name: row.class_name,
        education_level: row.education_level || 'ensino_fundamental_1',
        grade: row.grade,
        shift: row.shift,
        academic_year: row.academic_year,
        current_students: row.current_students || 0,
        max_students: row.max_students || 0,
        is_active: row.is_active ?? true,
        school: { school_name: row.schools?.school_name || null },
        main_teacher: row.main_teacher ? { full_name: row.main_teacher.full_name } : null,
        school_id: row.school_id,
        tenant_id: row.tenant_id,
        main_teacher_id: row.main_teacher_id,
      })) as Class[];

      return {
        data: items,
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    }
  },

  async getClassById(classId: string) {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        schools!classes_school_id_fkey(school_name),
        main_teacher:profiles!classes_main_teacher_id_fkey(full_name)
      `)
      .eq('id', classId)
      .single();

    if (error) throw error;
    return data;
  },

  async createClass(classData: Partial<Class>) {
    const { data, error } = await supabase
      .from('classes')
      .insert({
        class_name: classData.class_name,
        education_level: classData.education_level,
        grade: classData.grade,
        shift: classData.shift,
        academic_year: classData.academic_year,
        current_students: classData.current_students || 0,
        max_students: classData.max_students || 0,
        school_id: classData.school_id,
        tenant_id: classData.tenant_id,
        main_teacher_id: classData.main_teacher_id,
        is_active: classData.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateClass(classId: string, updates: Partial<Class>) {
    const { data, error } = await supabase
      .from('classes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', classId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteClass(classId: string) {
    const { error } = await supabase
      .from('classes')
      .update({ is_active: false })
      .eq('id', classId);

    if (error) throw error;
  },
};

