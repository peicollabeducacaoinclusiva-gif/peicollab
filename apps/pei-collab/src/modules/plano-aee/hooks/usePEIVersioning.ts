import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PEIVersion {
  id: string;
  pei_id: string;
  version_number: number;
  status: string;
  changed_by: string;
  changed_at: string;
  change_type: string;
  change_summary: string;
  diagnosis_data?: any;
  planning_data?: any;
  evaluation_data?: any;
  is_active_version?: boolean;
}

interface CreateVersionData {
  pei_id: string;
  change_type: 'created' | 'updated' | 'status_changed';
  change_summary: string;
  diagnosis_data?: any;
  planning_data?: any;
  evaluation_data?: any;
  status?: string;
}

export function usePEIVersioning(peiId: string) {
  const { user } = useAuth();
  const [versions, setVersions] = useState<PEIVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<PEIVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar histórico de versões
      const { data: historyData, error: historyError } = await supabase
        .from('pei_history')
        .select(`
          id,
          pei_id,
          version_number,
          changed_by,
          changed_at,
          change_type,
          change_summary,
          status,
          diagnosis_data,
          planning_data,
          evaluation_data
        `)
        .eq('pei_id', peiId)
        .order('version_number', { ascending: false });

      if (historyError) throw historyError;

      // Buscar versão ativa atual
      const { data: activeData, error: activeError } = await supabase
        .from('peis')
        .select(`
          id,
          version_number,
          status,
          diagnosis_data,
          planning_data,
          evaluation_data,
          is_active_version
        `)
        .eq('id', peiId)
        .eq('is_active_version', true)
        .single();

      if (activeError) throw activeError;

      // Buscar informações dos usuários
      const userIds = [
        ...new Set([
          ...(historyData?.map(v => v.changed_by) || []),
          user?.id
        ])
      ];

      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (usersError) throw usersError;

      const userMap = new Map(users?.map(u => [u.id, u.full_name]) || []);

      // Processar versões do histórico
      const processedHistory: PEIVersion[] = historyData?.map(version => ({
        ...version,
        changed_by: userMap.get(version.changed_by) || 'Usuário desconhecido',
        is_active_version: false
      })) || [];

      // Processar versão ativa
      const processedActive: PEIVersion = activeData ? {
        id: activeData.id,
        pei_id: peiId,
        version_number: activeData.version_number,
        status: activeData.status,
        changed_by: userMap.get(user?.id || '') || 'Usuário atual',
        changed_at: new Date().toISOString(),
        change_type: 'current',
        change_summary: 'Versão atual',
        diagnosis_data: activeData.diagnosis_data,
        planning_data: activeData.planning_data,
        evaluation_data: activeData.evaluation_data,
        is_active_version: true
      } : null as any;

      // Combinar versões
      const allVersions = processedActive ? [processedActive, ...processedHistory] : processedHistory;
      
      setVersions(allVersions);
      setActiveVersion(processedActive);
    } catch (err) {
      console.error('Erro ao carregar versões:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createVersion = async (data: CreateVersionData) => {
    try {
      setError(null);

      // Buscar próxima versão
      const { data: lastVersion, error: versionError } = await supabase
        .from('pei_history')
        .select('version_number')
        .eq('pei_id', peiId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (versionError && versionError.code !== 'PGRST116') {
        throw versionError;
      }

      const nextVersion = (lastVersion?.version_number || 0) + 1;

      // Criar nova entrada no histórico
      const { data: historyData, error: historyError } = await supabase
        .from('pei_history')
        .insert({
          pei_id: data.pei_id,
          version_number: nextVersion,
          changed_by: user?.id,
          change_type: data.change_type,
          change_summary: data.change_summary,
          diagnosis_data: data.diagnosis_data,
          planning_data: data.planning_data,
          evaluation_data: data.evaluation_data,
          status: data.status
        })
        .select()
        .single();

      if (historyError) throw historyError;

      // Atualizar PEI principal se necessário
      if (data.change_type === 'updated' || data.change_type === 'status_changed') {
        const { error: updateError } = await supabase
          .from('peis')
          .update({
            version_number: nextVersion,
            status: data.status,
            diagnosis_data: data.diagnosis_data,
            planning_data: data.planning_data,
            evaluation_data: data.evaluation_data,
            updated_at: new Date().toISOString()
          })
          .eq('id', peiId);

        if (updateError) throw updateError;
      }

      // Recarregar versões
      await loadVersions();

      return historyData;
    } catch (err) {
      console.error('Erro ao criar versão:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    }
  };

  const restoreVersion = async (version: PEIVersion) => {
    try {
      setError(null);

      // Criar nova versão baseada na versão selecionada
      const { data, error } = await supabase
        .from('pei_history')
        .insert({
          pei_id: peiId,
          version_number: versions[0]?.version_number + 1 || 1,
          changed_by: user?.id,
          change_type: 'restored',
          change_summary: `Restaurado da versão ${version.version_number}`,
          diagnosis_data: version.diagnosis_data,
          planning_data: version.planning_data,
          evaluation_data: version.evaluation_data,
          status: version.status
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar PEI principal
      const { error: updateError } = await supabase
        .from('peis')
        .update({
          version_number: data.version_number,
          status: version.status,
          diagnosis_data: version.diagnosis_data,
          planning_data: version.planning_data,
          evaluation_data: version.evaluation_data,
          updated_at: new Date().toISOString()
        })
        .eq('id', peiId);

      if (updateError) throw updateError;

      // Recarregar versões
      await loadVersions();

      return data;
    } catch (err) {
      console.error('Erro ao restaurar versão:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    }
  };

  const getVersionDiff = (version1: PEIVersion, version2: PEIVersion) => {
    const changes: string[] = [];

    // Comparar dados de diagnóstico
    if (JSON.stringify(version1.diagnosis_data) !== JSON.stringify(version2.diagnosis_data)) {
      changes.push('Diagnóstico');
    }

    // Comparar dados de planejamento
    if (JSON.stringify(version1.planning_data) !== JSON.stringify(version2.planning_data)) {
      changes.push('Planejamento');
    }

    // Comparar dados de avaliação
    if (JSON.stringify(version1.evaluation_data) !== JSON.stringify(version2.evaluation_data)) {
      changes.push('Avaliação');
    }

    // Comparar status
    if (version1.status !== version2.status) {
      changes.push('Status');
    }

    return changes;
  };

  useEffect(() => {
    if (peiId) {
      loadVersions();
    }
  }, [peiId, user]);

  return {
    versions,
    activeVersion,
    loading,
    error,
    createVersion,
    restoreVersion,
    getVersionDiff,
    refreshVersions: loadVersions
  };
}



