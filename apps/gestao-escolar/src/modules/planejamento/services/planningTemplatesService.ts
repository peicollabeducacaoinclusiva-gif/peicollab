import { supabase } from '@pei/database';

export type PlanningType = 'daily' | 'weekly' | 'monthly' | 'bimonthly';
export type Stage = 'infantil' | 'fundamental_anos_iniciais' | 'fundamental_anos_finais' | 'medio';

export interface PlanningTemplate {
  id: string;
  tenant_id?: string;
  template_name: string;
  template_type: PlanningType;
  subject?: string;
  stage?: Stage;
  content_structure: Record<string, any>;
  tags?: string[];
  is_public: boolean;
  usage_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ExperienceField {
  id: string;
  field_name: string;
  field_code: string;
  stage: string;
  description?: string;
  learning_objectives?: Array<Record<string, any>>;
  created_at: string;
}

export interface KnowledgeArea {
  id: string;
  area_name: string;
  area_code: string;
  stage: string;
  description?: string;
  components?: Array<Record<string, any>>;
  created_at: string;
}

export const planningTemplatesService = {
  /**
   * Busca templates de planejamento
   */
  async getTemplates(
    templateType?: PlanningType,
    stage?: Stage,
    tenantId?: string,
    includePublic: boolean = true
  ): Promise<PlanningTemplate[]> {
    let query = supabase
      .from('planning_templates')
      .select('*')
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (templateType) {
      query = query.eq('template_type', templateType);
    }

    if (stage) {
      query = query.eq('stage', stage);
    }

    if (tenantId) {
      if (includePublic) {
        query = query.or(`tenant_id.eq.${tenantId},is_public.eq.true`);
      } else {
        query = query.eq('tenant_id', tenantId);
      }
    } else if (includePublic) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as PlanningTemplate[];
  },

  /**
   * Cria um template
   */
  async createTemplate(template: Partial<PlanningTemplate>): Promise<PlanningTemplate> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('planning_templates')
      .insert({
        ...template,
        created_by: user?.id,
        is_public: template.is_public ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PlanningTemplate;
  },

  /**
   * Cria planejamento a partir de template
   */
  async createFromTemplate(
    templateId: string,
    classId: string,
    startDate: string,
    customizations?: Record<string, any>
  ): Promise<any> {
    // Buscar template
    const { data: template, error: templateError } = await supabase
      .from('planning_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    // Aplicar customizações
    const content = { ...template.content_structure, ...customizations };

    // Criar planejamento
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('pedagogical_plannings')
      .insert({
        class_id: classId,
        teacher_id: user?.id,
        planning_type: template.template_type,
        start_date: startDate,
        subject: template.subject,
        content,
        tags: template.tags,
      })
      .select()
      .single();

    if (error) throw error;

    // Incrementar contador de uso
    await supabase
      .from('planning_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId);

    return data;
  },

  /**
   * Busca campos de experiência (BNCC)
   */
  async getExperienceFields(stage?: string): Promise<ExperienceField[]> {
    let query = supabase
      .from('experience_fields')
      .select('*')
      .order('field_code', { ascending: true });

    if (stage) {
      query = query.eq('stage', stage);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as ExperienceField[];
  },

  /**
   * Busca áreas do conhecimento (BNCC)
   */
  async getKnowledgeAreas(stage?: string): Promise<KnowledgeArea[]> {
    let query = supabase
      .from('knowledge_areas')
      .select('*')
      .order('area_code', { ascending: true });

    if (stage) {
      query = query.eq('stage', stage);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as KnowledgeArea[];
  },
};

