import { supabase } from '@/integrations/supabase/client';

export interface PEIComment {
  id: string;
  pei_id: string;
  user_id: string;
  comment: string;
  parent_id?: string;
  resolved_at?: string;
  resolved_by?: string;
  section?: 'diagnosis' | 'planning' | 'evaluation' | 'general';
  line_number?: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
  };
}

export interface PEICollaborator {
  id: string;
  pei_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'reviewer' | 'viewer';
  permissions: Record<string, any>;
  invited_by?: string;
  invited_at: string;
  last_active_at?: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface PEISuggestion {
  id: string;
  pei_id: string;
  user_id: string;
  suggestion_type: 'goal' | 'strategy' | 'adaptation' | 'resource';
  section: 'diagnosis' | 'planning' | 'evaluation';
  original_content?: any;
  suggested_content: any;
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
  };
}

export interface AddCommentParams {
  peiId: string;
  comment: string;
  parentId?: string;
  section?: 'diagnosis' | 'planning' | 'evaluation' | 'general';
  lineNumber?: number;
}

export interface AddCollaboratorParams {
  peiId: string;
  userId: string;
  role: 'owner' | 'editor' | 'reviewer' | 'viewer';
  permissions?: Record<string, any>;
}

export const peiCollaborationService = {
  /**
   * Adiciona um comentário ao PEI
   */
  async addComment(params: AddCommentParams): Promise<PEIComment> {
    const { data, error } = await supabase
      .from('pei_comments')
      .insert({
        pei_id: params.peiId,
        comment: params.comment,
        parent_id: params.parentId,
        section: params.section || 'general',
        line_number: params.lineNumber,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PEIComment;
  },

  /**
   * Busca todos os comentários de um PEI
   */
  async getComments(peiId: string): Promise<PEIComment[]> {
    const { data, error } = await supabase
      .from('pei_comments')
      .select(`
        *,
        user:profiles!pei_comments_user_id_fkey(id, full_name)
      `)
      .eq('pei_id', peiId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      user: item.user,
    })) as PEIComment[];
  },

  /**
   * Resolve um comentário
   */
  async resolveComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('pei_comments')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', commentId);

    if (error) throw error;
  },

  /**
   * Remove a resolução de um comentário
   */
  async unresolveComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('pei_comments')
      .update({
        resolved_at: null,
        resolved_by: null,
      })
      .eq('id', commentId);

    if (error) throw error;
  },

  /**
   * Deleta um comentário
   */
  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('pei_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  },

  /**
   * Adiciona um colaborador ao PEI
   */
  async addCollaborator(params: AddCollaboratorParams): Promise<PEICollaborator> {
    const { data, error } = await supabase
      .from('pei_collaborators')
      .insert({
        pei_id: params.peiId,
        user_id: params.userId,
        role: params.role,
        permissions: params.permissions || {},
        invited_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PEICollaborator;
  },

  /**
   * Busca todos os colaboradores de um PEI
   */
  async getCollaborators(peiId: string): Promise<PEICollaborator[]> {
    const { data, error } = await supabase
      .from('pei_collaborators')
      .select(`
        *,
        user:profiles!pei_collaborators_user_id_fkey(id, full_name, email)
      `)
      .eq('pei_id', peiId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      user: item.user,
    })) as PEICollaborator[];
  },

  /**
   * Atualiza o papel de um colaborador
   */
  async updateCollaboratorRole(
    collaboratorId: string,
    role: 'owner' | 'editor' | 'reviewer' | 'viewer'
  ): Promise<void> {
    const { error } = await supabase
      .from('pei_collaborators')
      .update({ role })
      .eq('id', collaboratorId);

    if (error) throw error;
  },

  /**
   * Remove um colaborador
   */
  async removeCollaborator(collaboratorId: string): Promise<void> {
    const { error } = await supabase
      .from('pei_collaborators')
      .delete()
      .eq('id', collaboratorId);

    if (error) throw error;
  },

  /**
   * Atualiza última atividade do colaborador
   */
  async updateLastActive(peiId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('pei_collaborators')
      .update({ last_active_at: new Date().toISOString() })
      .eq('pei_id', peiId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Inicia modo de revisão (track changes)
   */
  async startReview(peiId: string): Promise<void> {
    // Marcar PEI como em revisão (pode adicionar campo na tabela peis se necessário)
    // Por enquanto, apenas atualizamos colaboradores
    const { error } = await supabase
      .from('pei_collaborators')
      .update({ last_active_at: new Date().toISOString() })
      .eq('pei_id', peiId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) throw error;
  },

  /**
   * Adiciona uma sugestão
   */
  async addSuggestion(suggestion: Omit<PEISuggestion, 'id' | 'created_at' | 'updated_at'>): Promise<PEISuggestion> {
    const { data, error } = await supabase
      .from('pei_suggestions')
      .insert({
        pei_id: suggestion.pei_id,
        user_id: suggestion.user_id,
        suggestion_type: suggestion.suggestion_type,
        section: suggestion.section,
        original_content: suggestion.original_content,
        suggested_content: suggestion.suggested_content,
        reason: suggestion.reason,
        status: suggestion.status || 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data as PEISuggestion;
  },

  /**
   * Busca sugestões de um PEI
   */
  async getSuggestions(peiId: string): Promise<PEISuggestion[]> {
    const { data, error } = await supabase
      .from('pei_suggestions')
      .select(`
        *,
        user:profiles!pei_suggestions_user_id_fkey(id, full_name)
      `)
      .eq('pei_id', peiId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      user: item.user,
    })) as PEISuggestion[];
  },

  /**
   * Aceita ou rejeita uma sugestão
   */
  async reviewSuggestion(
    suggestionId: string,
    status: 'accepted' | 'rejected'
  ): Promise<void> {
    const { error } = await supabase
      .from('pei_suggestions')
      .update({
        status,
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', suggestionId);

    if (error) throw error;
  },
};

