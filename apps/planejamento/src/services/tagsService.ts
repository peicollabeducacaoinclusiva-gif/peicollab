import { supabase } from '@pei/database';

export interface PedagogicalTag {
  id: string;
  tenant_id?: string;
  tag_name: string;
  tag_category?: string; // 'tema', 'habilidade', 'meta', 'area_conhecimento'
  description?: string;
  color?: string;
  usage_count: number;
  created_at: string;
  created_by?: string;
}

export const tagsService = {
  /**
   * Busca tags pedagógicas
   */
  async getTags(tenantId?: string, category?: string): Promise<PedagogicalTag[]> {
    let query = supabase
      .from('pedagogical_tags')
      .select('*')
      .order('usage_count', { ascending: false })
      .order('tag_name', { ascending: true });

    if (tenantId) {
      query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    } else {
      query = query.is('tenant_id', null);
    }

    if (category) {
      query = query.eq('tag_category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as PedagogicalTag[];
  },

  /**
   * Cria uma tag
   */
  async createTag(tag: Partial<PedagogicalTag>): Promise<PedagogicalTag> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('pedagogical_tags')
      .insert({
        ...tag,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PedagogicalTag;
  },

  /**
   * Atualiza uma tag
   */
  async updateTag(tagId: string, updates: Partial<PedagogicalTag>): Promise<PedagogicalTag> {
    const { data, error } = await supabase
      .from('pedagogical_tags')
      .update(updates)
      .eq('id', tagId)
      .select()
      .single();

    if (error) throw error;
    return data as PedagogicalTag;
  },

  /**
   * Remove uma tag
   */
  async deleteTag(tagId: string): Promise<void> {
    const { error } = await supabase
      .from('pedagogical_tags')
      .delete()
      .eq('id', tagId);

    if (error) throw error;
  },
};

