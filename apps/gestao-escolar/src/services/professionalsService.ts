import { supabase } from '@pei/database';
import { auditMiddleware } from '@pei/database/audit';

export interface Professional {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  professional_role: string;
  registration_number?: string;
  specialization?: string;
  is_active: boolean;
  school_id?: string;
  tenant_id?: string;
  school?: {
    school_name: string;
  };
}

export interface ProfessionalFilters {
  tenantId: string;
  schoolId?: string;
  search?: string;
  selectedSchoolFilter?: string;
  selectedRoleFilter?: string;
  sortKey?: 'full_name' | 'professional_role' | 'school';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const professionalsService = {
  async getProfessionals(filters: ProfessionalFilters) {
    const {
      tenantId,
      schoolId,
      search,
      selectedSchoolFilter,
      selectedRoleFilter,
      sortKey = 'full_name',
      sortDir = 'asc',
      page = 1,
      pageSize = 10,
    } = filters;

    let query = supabase
      .from('professionals')
      .select(`
        id,
        full_name,
        email,
        phone,
        professional_role,
        registration_number,
        specialization,
        is_active,
        school_id,
        tenant_id,
        schools!professionals_school_id_fkey(school_name)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }

    if (selectedSchoolFilter && selectedSchoolFilter !== 'all') {
      query = query.eq('school_id', selectedSchoolFilter);
    }

    if (selectedRoleFilter && selectedRoleFilter !== 'all') {
      query = query.eq('professional_role', selectedRoleFilter);
    }

    if (search) {
      query = query.ilike('full_name', `%${search}%`);
    }

    // Ordenação
    if (sortKey === 'school') {
      query = query.order('school_id', { ascending: sortDir === 'asc' });
    } else {
      query = query.order(sortKey, { ascending: sortDir === 'asc' });
    }

    // Paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    let items = (data || []).map((row: any) => ({
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      professional_role: row.professional_role,
      registration_number: row.registration_number,
      specialization: row.specialization,
      is_active: row.is_active ?? true,
      school: { school_name: row.schools?.school_name || null },
      school_id: row.school_id,
      tenant_id: row.tenant_id,
    })) as Professional[];

    // Ordenar por nome da escola se necessário (após buscar os dados)
    if (sortKey === 'school') {
      items = items.sort((a, b) => {
        const aName = a.school?.school_name || '';
        const bName = b.school?.school_name || '';
        return sortDir === 'asc'
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      });
    }

    return {
      data: items,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  async getProfessionalById(professionalId: string) {
    const { data, error } = await supabase
      .from('professionals')
      .select(`
        *,
        schools!professionals_school_id_fkey(school_name)
      `)
      .eq('id', professionalId)
      .single();

    if (error) throw error;
    return data;
  },

  async createProfessional(professional: Partial<Professional>) {
    if (!professional.tenant_id) {
      throw new Error('tenant_id é obrigatório para criar profissional');
    }

    const { data, error } = await auditMiddleware.withAudit(
      professional.tenant_id,
      'professional',
      'INSERT',
      async () => {
        return supabase
          .from('professionals')
          .insert({
            full_name: professional.full_name,
            email: professional.email,
            phone: professional.phone,
            professional_role: professional.professional_role,
            registration_number: professional.registration_number,
            specialization: professional.specialization,
            school_id: professional.school_id,
            tenant_id: professional.tenant_id,
            is_active: professional.is_active ?? true,
          })
          .select()
          .single();
      },
      {
        new_values: professional as Record<string, unknown>,
        source: 'create_professional',
      }
    );

    if (error) throw error;
    return data;
  },

  async updateProfessional(professionalId: string, updates: Partial<Professional>) {
    // Buscar profissional para obter tenant_id
    const { data: existing } = await supabase
      .from('professionals')
      .select('tenant_id')
      .eq('id', professionalId)
      .single();

    if (!existing?.tenant_id) {
      throw new Error('Profissional não encontrado ou sem tenant_id');
    }

    const { data, error } = await auditMiddleware.withAudit(
      existing.tenant_id,
      'professional',
      'UPDATE',
      async () => {
        return supabase
          .from('professionals')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', professionalId)
          .select()
          .single();
      },
      {
        entityId: professionalId,
        new_values: updates as Record<string, unknown>,
        source: 'update_professional',
      }
    );

    if (error) throw error;
    return data;
  },

  async deleteProfessional(professionalId: string) {
    // Buscar profissional para obter tenant_id
    const { data: existing } = await supabase
      .from('professionals')
      .select('tenant_id, full_name')
      .eq('id', professionalId)
      .single();

    if (!existing?.tenant_id) {
      throw new Error('Profissional não encontrado ou sem tenant_id');
    }

    const { error } = await auditMiddleware.withAudit(
      existing.tenant_id,
      'professional',
      'DELETE',
      async () => {
        return supabase
          .from('professionals')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', professionalId);
      },
      {
        entityId: professionalId,
        new_values: { is_active: false },
        source: 'delete_professional',
        professional_name: existing.full_name,
      }
    );

    if (error) throw error;
  },
};

