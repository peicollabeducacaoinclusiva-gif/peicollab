import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@pei/database';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number;
  pendingChanges: number;
  syncError?: string;
}

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: 0,
    pendingChanges: 0
  });

  // Verificar status online/offline
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carregar status inicial
  useEffect(() => {
    const loadInitialStatus = async () => {
      // TODO: Implementar quando offlineDatabase estiver disponível
      // const lastSyncTime = await syncUtils.getLastSyncTime();
      // const unsyncedRecords = await offlineDB.getUnsyncedRecords();
      // const pendingChanges = 
      //   unsyncedRecords.students.length + 
      //   unsyncedRecords.peis.length + 
      //   unsyncedRecords.pei_goals.length + 
      //   unsyncedRecords.pei_barriers.length;

      setStatus(prev => ({
        ...prev,
        lastSyncTime: 0,
        pendingChanges: 0
      }));
    };

    loadInitialStatus();
  }, []);

  // Sincronizar dados
  const syncData = useCallback(async () => {
    if (!status.isOnline || status.isSyncing) return;

    setStatus(prev => ({ ...prev, isSyncing: true, syncError: undefined }));

    try {
      // TODO: Implementar quando offlineDatabase estiver disponível
      // const unsyncedRecords = await offlineDB.getUnsyncedRecords();
      // Por enquanto, não há sincronização offline implementada
      const unsyncedRecords: { students: any[]; peis: any[]; pei_goals: any[]; pei_barriers: any[] } = { 
        students: [], 
        peis: [], 
        pei_goals: [], 
        pei_barriers: [] 
      };
      
      // Sincronizar estudantes
      for (const student of unsyncedRecords.students) {
        const { error } = await supabase
          .from('students')
          .upsert({
            id: student.id,
            name: student.name,
            date_of_birth: student.date_of_birth,
            mother_name: student.mother_name,
            father_name: student.father_name,
            email: student.email,
            phone: student.phone,
            family_guidance_notes: student.family_guidance_notes,
            school_id: student.school_id,
            tenant_id: student.tenant_id,
            created_at: student.created_at,
            updated_at: student.updated_at
          });

        if (!error) {
          // TODO: await offlineDB.markAsSynced('students', student.id);
        } else {
          throw new Error(`Erro ao sincronizar estudante ${student.id}: ${error.message}`);
        }
      }

      // Sincronizar PEIs
      for (const pei of unsyncedRecords.peis) {
        const { error } = await supabase
          .from('peis')
          .upsert({
            id: pei.id,
            student_id: pei.student_id,
            school_id: pei.school_id,
            tenant_id: pei.tenant_id,
            created_by: pei.created_by,
            assigned_teacher_id: pei.assigned_teacher_id,
            version_number: pei.version_number,
            is_active_version: pei.is_active_version,
            status: pei.status,
            diagnosis_data: pei.diagnosis_data,
            planning_data: pei.planning_data,
            evaluation_data: pei.evaluation_data,
            family_approved_at: pei.family_approved_at,
            family_approved_by: pei.family_approved_by,
            created_at: pei.created_at,
            updated_at: pei.updated_at
          });

        if (!error) {
          // TODO: await offlineDB.markAsSynced('peis', pei.id);
        } else {
          throw new Error(`Erro ao sincronizar PEI ${pei.id}: ${error.message}`);
        }
      }

      // Sincronizar metas
      for (const goal of unsyncedRecords.pei_goals) {
        const { error } = await supabase
          .from('pei_goals')
          .upsert({
            id: goal.id,
            pei_id: goal.pei_id,
            barrier_id: goal.barrier_id,
            description: goal.description,
            category: goal.category,
            target_date: goal.target_date,
            progress_level: goal.progress_level,
            progress_score: goal.progress_score,
            notes: goal.notes,
            created_at: goal.created_at,
            updated_at: goal.updated_at
          });

        if (!error) {
          // TODO: await offlineDB.markAsSynced('pei_goals', goal.id);
        } else {
          throw new Error(`Erro ao sincronizar meta ${goal.id}: ${error.message}`);
        }
      }

      // Sincronizar barreiras
      for (const barrier of unsyncedRecords.pei_barriers) {
        const { error } = await supabase
          .from('pei_barriers')
          .upsert({
            id: barrier.id,
            pei_id: barrier.pei_id,
            barrier_type: barrier.barrier_type,
            description: barrier.description,
            severity: barrier.severity,
            created_at: barrier.created_at
          });

        if (!error) {
          // TODO: await offlineDB.markAsSynced('pei_barriers', barrier.id);
        } else {
          throw new Error(`Erro ao sincronizar barreira ${barrier.id}: ${error.message}`);
        }
      }

      // Atualizar timestamp da última sincronização
      // TODO: await syncUtils.setLastSyncTime(Date.now());

      // Recarregar status
      const newLastSyncTime = Date.now();
      // TODO: const newUnsyncedRecords = await offlineDB.getUnsyncedRecords();
      const newUnsyncedRecords = { students: [], peis: [], pei_goals: [], pei_barriers: [] };
      const newPendingChanges = 
        newUnsyncedRecords.students.length + 
        newUnsyncedRecords.peis.length + 
        newUnsyncedRecords.pei_goals.length + 
        newUnsyncedRecords.pei_barriers.length;

      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: newLastSyncTime,
        pendingChanges: newPendingChanges
      }));

    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Erro desconhecido na sincronização'
      }));
    }
  }, [status.isOnline, status.isSyncing]);

  // Sincronização automática quando voltar online
  useEffect(() => {
    if (status.isOnline && status.pendingChanges > 0) {
      const timer = setTimeout(() => {
        syncData();
      }, 2000); // Aguarda 2 segundos após voltar online

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [status.isOnline, status.pendingChanges, syncData]);

  // Sincronização periódica (a cada 5 minutos quando online)
  useEffect(() => {
    if (!status.isOnline) return;

    const interval = setInterval(() => {
      if (status.pendingChanges > 0) {
        syncData();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [status.isOnline, status.pendingChanges, syncData]);

  return {
    ...status,
    syncData,
    retrySync: syncData
  };
}

