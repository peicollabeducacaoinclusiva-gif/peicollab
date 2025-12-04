import { supabase } from '@/integrations/supabase/client';

export type RecommendationType = 'goal' | 'strategy' | 'adaptation' | 'resource' | 'referral';
export type ClassificationType = 'deficiency' | 'disorder' | 'giftedness' | 'other';

export interface StudentClassification {
  id: string;
  student_id: string;
  classification_type: ClassificationType;
  classification: string;
  confidence: number;
  source?: string;
  diagnosed_by?: string;
  diagnosis_date?: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface RecommendationTemplate {
  id: string;
  tenant_id?: string;
  classification: string;
  recommendation_type: RecommendationType;
  title: string;
  description: string;
  content: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  stage?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  recommendation_type: RecommendationType;
  title: string;
  description: string;
  content: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  template_id?: string;
}

export interface AppliedRecommendation {
  id: string;
  student_id: string;
  pei_id?: string;
  template_id?: string;
  recommendation_type: RecommendationType;
  title: string;
  description: string;
  content: Record<string, any>;
  applied_at: string;
  applied_by?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  notes?: string;
}

export const peiRecommendationsService = {
  /**
   * Gera recomendações automáticas baseadas nas classificações do aluno
   */
  async generateRecommendations(
    studentId: string,
    peiId: string
  ): Promise<Recommendation[]> {
    const { data, error } = await supabase.rpc('generate_recommendations', {
      p_student_id: studentId,
      p_pei_id: peiId,
    });

    if (error) throw error;
    return (data || []) as Recommendation[];
  },

  /**
   * Busca classificações de um aluno
   */
  async getStudentClassifications(studentId: string): Promise<StudentClassification[]> {
    const { data, error } = await supabase
      .from('student_classifications')
      .select('*')
      .eq('student_id', studentId)
      .order('confidence', { ascending: false });

    if (error) throw error;
    return (data || []) as StudentClassification[];
  },

  /**
   * Adiciona ou atualiza classificação do aluno
   */
  async upsertClassification(
    classification: Partial<StudentClassification>
  ): Promise<StudentClassification> {
    const { data, error } = await supabase
      .from('student_classifications')
      .upsert(
        {
          ...classification,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'student_id,classification',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data as StudentClassification;
  },

  /**
   * Busca templates de recomendações
   */
  async getTemplates(
    classification?: string,
    recommendationType?: RecommendationType,
    tenantId?: string
  ): Promise<RecommendationTemplate[]> {
    let query = supabase
      .from('recommendation_templates')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: false });

    if (classification) {
      query = query.eq('classification', classification);
    }

    if (recommendationType) {
      query = query.eq('recommendation_type', recommendationType);
    }

    if (tenantId) {
      query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    } else {
      query = query.is('tenant_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as RecommendationTemplate[];
  },

  /**
   * Aplica uma recomendação
   */
  async applyRecommendation(
    studentId: string,
    peiId: string,
    recommendation: Recommendation,
    templateId?: string
  ): Promise<AppliedRecommendation> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('applied_recommendations')
      .insert({
        student_id: studentId,
        pei_id: peiId,
        template_id: templateId,
        recommendation_type: recommendation.recommendation_type,
        title: recommendation.title,
        description: recommendation.description,
        content: recommendation.content,
        applied_by: user?.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data as AppliedRecommendation;
  },

  /**
   * Busca recomendações aplicadas
   */
  async getAppliedRecommendations(
    studentId: string,
    peiId?: string
  ): Promise<AppliedRecommendation[]> {
    let query = supabase
      .from('applied_recommendations')
      .select('*')
      .eq('student_id', studentId)
      .order('applied_at', { ascending: false });

    if (peiId) {
      query = query.eq('pei_id', peiId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as AppliedRecommendation[];
  },

  /**
   * Atualiza status de uma recomendação aplicada
   */
  async updateAppliedRecommendationStatus(
    recommendationId: string,
    status: 'pending' | 'accepted' | 'rejected' | 'modified',
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('applied_recommendations')
      .update({
        status,
        notes,
      })
      .eq('id', recommendationId);

    if (error) throw error;
  },
};

