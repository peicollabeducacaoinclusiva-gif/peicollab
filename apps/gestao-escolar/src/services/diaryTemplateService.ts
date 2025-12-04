import { supabase } from '@pei/database';

export interface DiaryTemplate {
  id: string;
  tenant_id: string;
  school_id?: string;
  template_type: 'diary_entry' | 'descriptive_report' | 'report_card';
  template_name: string;
  template_content: string; // HTML ou Markdown
  template_fields: Record<string, any>; // Campos dinâmicos do template
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export const diaryTemplateService = {
  async getTemplates(filters: {
    tenantId: string;
    schoolId?: string;
    templateType?: 'diary_entry' | 'descriptive_report' | 'report_card';
  }): Promise<DiaryTemplate[]> {
    let query = supabase
      .from('diary_templates')
      .select('*')
      .eq('tenant_id', filters.tenantId)
      .eq('is_active', true);

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId);
    }

    if (filters.templateType) {
      query = query.eq('template_type', filters.templateType);
    }

    const { data, error } = await query.order('is_default', { ascending: false }).order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTemplate(templateId: string): Promise<DiaryTemplate | null> {
    const { data, error } = await supabase
      .from('diary_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async getDefaultTemplate(
    tenantId: string,
    schoolId: string | undefined,
    templateType: 'diary_entry' | 'descriptive_report' | 'report_card'
  ): Promise<DiaryTemplate | null> {
    let query = supabase
      .from('diary_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('template_type', templateType)
      .eq('is_default', true)
      .eq('is_active', true);

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    } else {
      query = query.is('school_id', null);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async createTemplate(template: Partial<DiaryTemplate>): Promise<DiaryTemplate> {
    // Se este template for marcado como padrão, desmarcar outros
    if (template.is_default) {
      await supabase
        .from('diary_templates')
        .update({ is_default: false })
        .eq('tenant_id', template.tenant_id)
        .eq('template_type', template.template_type)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('diary_templates')
      .insert({
        tenant_id: template.tenant_id,
        school_id: template.school_id,
        template_type: template.template_type,
        template_name: template.template_name,
        template_content: template.template_content,
        template_fields: template.template_fields || {},
        is_default: template.is_default || false,
        is_active: template.is_active !== undefined ? template.is_active : true,
        created_by: template.created_by,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTemplate(templateId: string, updates: Partial<DiaryTemplate>): Promise<DiaryTemplate> {
    // Se este template for marcado como padrão, desmarcar outros
    if (updates.is_default) {
      const { data: currentTemplate } = await supabase
        .from('diary_templates')
        .select('tenant_id, template_type')
        .eq('id', templateId)
        .single();

      if (currentTemplate) {
        await supabase
          .from('diary_templates')
          .update({ is_default: false })
          .eq('tenant_id', currentTemplate.tenant_id)
          .eq('template_type', currentTemplate.template_type)
          .eq('is_default', true)
          .neq('id', templateId);
      }
    }

    // O trigger criará automaticamente uma versão antes da atualização
    const { data, error } = await supabase
      .from('diary_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTemplateVersions(templateId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('diary_template_versions')
      .select(`
        *,
        created_by_profile:created_by(full_name)
      `)
      .eq('template_id', templateId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async restoreTemplateVersion(templateId: string, versionId: string): Promise<DiaryTemplate> {
    // Buscar versão
    const { data: version, error: versionError } = await supabase
      .from('diary_template_versions')
      .select('*')
      .eq('id', versionId)
      .eq('template_id', templateId)
      .single();

    if (versionError) throw versionError;

    // Restaurar conteúdo da versão
    const { data, error } = await supabase
      .from('diary_templates')
      .update({
        template_content: version.template_content,
        template_fields: version.template_fields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('diary_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  },

  async renderTemplate(
    template: DiaryTemplate,
    data: Record<string, any>
  ): Promise<string> {
    let rendered = template.template_content;

    // Substituir variáveis do template
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    });

    // Substituir variáveis padrão
    const defaultVars = {
      date: new Date().toLocaleDateString('pt-BR'),
      year: new Date().getFullYear(),
      month: new Date().toLocaleDateString('pt-BR', { month: 'long' }),
    };

    Object.entries(defaultVars).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });

    return rendered;
  },
};

