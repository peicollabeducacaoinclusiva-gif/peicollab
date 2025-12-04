import { supabase } from '@/integrations/supabase/client';

export interface PEIVersion {
  id: string;
  pei_id: string;
  version_number: number;
  changed_by: string;
  changed_at: string;
  change_type: string;
  change_summary: string;
  diagnosis_data?: any;
  planning_data?: any;
  evaluation_data?: any;
  status?: string;
  previous_version_id?: string;
  diff_data?: any;
  is_snapshot?: boolean;
  changed_by_user?: {
    id: string;
    full_name: string;
  };
}

export interface VersionDiff {
  diagnosis_changed: boolean;
  planning_changed: boolean;
  evaluation_changed: boolean;
  status_changed: boolean;
  version1: {
    diagnosis: any;
    planning: any;
    evaluation: any;
    status: string;
  };
  version2: {
    diagnosis: any;
    planning: any;
    evaluation: any;
    status: string;
  };
}

export interface CreateVersionParams {
  peiId: string;
  changes: {
    diagnosis?: any;
    planning?: any;
    evaluation?: any;
    status?: string;
  };
  changeType?: 'created' | 'updated' | 'status_changed';
  changeSummary?: string;
}

export const peiVersioningService = {
  /**
   * Cria uma nova versão do PEI com diff calculado
   */
  async createVersion(params: CreateVersionParams): Promise<string> {
    const { data, error } = await supabase.rpc('create_pei_version_with_diff', {
      p_pei_id: params.peiId,
      p_changes: params.changes as any,
      p_change_type: params.changeType || 'updated',
      p_change_summary: params.changeSummary || '',
    });

    if (error) throw error;
    return data as string;
  },

  /**
   * Busca todas as versões de um PEI
   */
  async getVersions(peiId: string): Promise<PEIVersion[]> {
    const { data, error } = await supabase
      .from('pei_history')
      .select(`
        *,
        changed_by_user:profiles!pei_history_changed_by_fkey(id, full_name)
      `)
      .eq('pei_id', peiId)
      .order('version_number', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      changed_by_user: item.changed_by_user,
    })) as PEIVersion[];
  },

  /**
   * Busca uma versão específica
   */
  async getVersion(peiId: string, versionNumber: number): Promise<PEIVersion> {
    const { data, error } = await supabase
      .from('pei_history')
      .select(`
        *,
        changed_by_user:profiles!pei_history_changed_by_fkey(id, full_name)
      `)
      .eq('pei_id', peiId)
      .eq('version_number', versionNumber)
      .single();

    if (error) throw error;

    return {
      ...data,
      changed_by_user: (data as any).changed_by_user,
    } as PEIVersion;
  },

  /**
   * Obtém diff entre duas versões
   */
  async getVersionDiff(
    peiId: string,
    version1: number,
    version2: number
  ): Promise<VersionDiff> {
    const { data, error } = await supabase.rpc('get_pei_version_diff', {
      p_pei_id: peiId,
      p_version1: version1,
      p_version2: version2,
    });

    if (error) throw error;
    return data as VersionDiff;
  },

  /**
   * Restaura uma versão específica (cria nova versão baseada na restaurada)
   */
  async restoreVersion(peiId: string, versionNumber: number): Promise<string> {
    // Buscar a versão a ser restaurada
    const version = await this.getVersion(peiId, versionNumber);

    // Criar nova versão com os dados da versão restaurada
    return await this.createVersion({
      peiId,
      changes: {
        diagnosis: version.diagnosis_data,
        planning: version.planning_data,
        evaluation: version.evaluation_data,
        status: version.status,
      },
      changeType: 'updated',
      changeSummary: `Restaurado da versão ${versionNumber}`,
    });
  },

  /**
   * Cria um snapshot completo do PEI atual
   */
  async createSnapshot(peiId: string): Promise<string> {
    // Buscar PEI atual
    const { data: pei, error: peiError } = await supabase
      .from('peis')
      .select('diagnosis_data, planning_data, evaluation_data, status, version_number')
      .eq('id', peiId)
      .eq('is_active_version', true)
      .single();

    if (peiError) throw peiError;

    // Buscar último número de versão
    const { data: lastVersion } = await supabase
      .from('pei_history')
      .select('version_number')
      .eq('pei_id', peiId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const newVersionNumber = (lastVersion?.version_number || pei.version_number || 0) + 1;

    // Criar snapshot no histórico
    const { data: historyData, error: historyError } = await supabase
      .from('pei_history')
      .insert({
        pei_id: peiId,
        version_number: newVersionNumber,
        changed_by: (await supabase.auth.getUser()).data.user?.id,
        change_type: 'snapshot',
        change_summary: 'Snapshot completo do PEI',
        diagnosis_data: pei.diagnosis_data,
        planning_data: pei.planning_data,
        evaluation_data: pei.evaluation_data,
        status: pei.status,
        is_snapshot: true,
      })
      .select('id')
      .single();

    if (historyError) throw historyError;
    return historyData.id;
  },
};

