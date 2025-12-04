import { supabase } from '@/integrations/supabase/client';

export type DisabilityType = 'deficiencia_intelectual' | 'autismo' | 'tdah' | 'deficiencia_visual' | 'deficiencia_auditiva' | 'deficiencia_fisica' | 'outro';
export type Stage = 'infantil' | 'fundamental_anos_iniciais' | 'fundamental_anos_finais' | 'medio';
export type GoalCategory = 'academic' | 'functional' | 'social' | 'communication';
export type AdaptationType = 'curricular' | 'metodologica' | 'avaliacao' | 'fisica';

export interface GoalTemplate {
  id: string;
  tenant_id?: string;
  disability_type: DisabilityType;
  stage?: Stage;
  goal_category: GoalCategory;
  goal_schema: Record<string, any>;
  title: string;
  description: string;
  suggested_strategies: string[];
  suggested_resources: string[];
  suggested_adaptations: string[];
  enabled: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdaptationTemplate {
  id: string;
  tenant_id?: string;
  disability_type: DisabilityType;
  stage?: Stage;
  adaptation_type: AdaptationType;
  adaptation_schema: Record<string, any>;
  title: string;
  description: string;
  resources_needed: string[];
  implementation_notes?: string;
  enabled: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface GoalTemplateUsage {
  id: string;
  goal_id: string;
  template_id?: string;
  customizations: Record<string, any>;
  created_at: string;
}

export const goalMatrixService = {
  /**
   * Busca templates de metas
   */
  async getGoalTemplates(
    disabilityType: DisabilityType,
    stage?: Stage,
    category?: GoalCategory,
    tenantId?: string
  ): Promise<GoalTemplate[]> {
    const { data, error } = await supabase.rpc('get_goal_templates', {
      p_disability_type: disabilityType,
      p_stage: stage || null,
      p_category: category || null,
      p_tenant_id: tenantId || null,
    });

    if (error) throw error;
    return (data || []) as GoalTemplate[];
  },

  /**
   * Cria uma meta a partir de um template
   */
  async createGoalFromTemplate(
    peiId: string,
    templateId: string,
    customizations?: Record<string, any>
  ): Promise<string> {
    const { data, error } = await supabase.rpc('create_goal_from_template', {
      p_pei_id: peiId,
      p_template_id: templateId,
      p_customizations: customizations || {},
    });

    if (error) throw error;
    return data as string;
  },

  /**
   * Busca templates de adaptações
   */
  async getAdaptationTemplates(
    disabilityType: DisabilityType,
    adaptationType?: AdaptationType,
    stage?: Stage,
    tenantId?: string
  ): Promise<AdaptationTemplate[]> {
    let query = supabase
      .from('adaptation_templates')
      .select('*')
      .eq('disability_type', disabilityType)
      .eq('enabled', true)
      .order('usage_count', { ascending: false });

    if (adaptationType) {
      query = query.eq('adaptation_type', adaptationType);
    }

    if (stage) {
      query = query.eq('stage', stage);
    }

    if (tenantId) {
      query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    } else {
      query = query.is('tenant_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as AdaptationTemplate[];
  },

  /**
   * Cria um template de meta personalizado
   */
  async createGoalTemplate(template: Partial<GoalTemplate>): Promise<GoalTemplate> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('goal_templates')
      .insert({
        ...template,
        created_by: user?.id,
        enabled: template.enabled ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as GoalTemplate;
  },

  /**
   * Cria um template de adaptação personalizado
   */
  async createAdaptationTemplate(template: Partial<AdaptationTemplate>): Promise<AdaptationTemplate> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('adaptation_templates')
      .insert({
        ...template,
        created_by: user?.id,
        enabled: template.enabled ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AdaptationTemplate;
  },

  /**
   * Busca histórico de uso de templates
   */
  async getTemplateUsage(templateId: string): Promise<GoalTemplateUsage[]> {
    const { data, error } = await supabase
      .from('goal_template_usage')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as GoalTemplateUsage[];
  },
};

