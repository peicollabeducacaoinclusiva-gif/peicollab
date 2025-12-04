// ============================================================================
// SERVIÇO: Sync Service
// ============================================================================
// Sincronização automática de dados offline
// Data: 2025-01-09
// ============================================================================

import { supabase } from '@pei/database';
import { db, getUnsyncedAttendances, markAttendanceAsSynced } from '../db/indexedDB';
import { toast } from 'sonner';

// ============================================================================
// SYNC SERVICE
// ============================================================================

export class SyncService {
  private static isSyncing = false;

  /**
   * Sincronizar todos os dados pendentes
   */
  static async syncAll(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sincronização já em andamento...');
      return;
    }

    this.isSyncing = true;

    try {
      console.log('🔄 Iniciando sincronização...');

      // Sincronizar atendimentos
      await this.syncAttendances();

      // Sincronizar metas
      await this.syncGoals();

      // Sincronizar avaliações
      await this.syncAssessments();

      console.log('✅ Sincronização concluída!');
      toast.success('Dados sincronizados com sucesso!');
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      toast.error('Erro ao sincronizar dados');
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sincronizar atendimentos pendentes
   */
  private static async syncAttendances(): Promise<void> {
    const unsyncedAttendances = await getUnsyncedAttendances();

    console.log(`📊 ${unsyncedAttendances.length} atendimentos para sincronizar`);

    for (const attendance of unsyncedAttendances) {
      try {
        const { data, error } = await supabase
          .from('aee_attendance_records')
          .insert(attendance.data)
          .select()
          .single();

        if (!error) {
          await markAttendanceAsSynced(attendance.id);
          console.log(`✅ Atendimento ${attendance.id} sincronizado`);
        } else {
          console.error(`❌ Erro ao sincronizar atendimento ${attendance.id}:`, error);
        }
      } catch (error) {
        console.error('Erro ao sincronizar atendimento:', error);
      }
    }
  }

  /**
   * Sincronizar metas pendentes
   */
  private static async syncGoals(): Promise<void> {
    const unsyncedGoals = await db.goals.where('synced').equals(false).toArray();

    console.log(`📊 ${unsyncedGoals.length} metas para sincronizar`);

    for (const goal of unsyncedGoals) {
      try {
        const { error } = await supabase
          .from('aee_plan_goals')
          .upsert(goal.data);

        if (!error) {
          await db.goals.update(goal.id, { synced: true });
          console.log(`✅ Meta ${goal.id} sincronizada`);
        }
      } catch (error) {
        console.error('Erro ao sincronizar meta:', error);
      }
    }
  }

  /**
   * Sincronizar avaliações pendentes
   */
  private static async syncAssessments(): Promise<void> {
    const unsyncedAssessments = await db.assessments
      .where('synced')
      .equals(false)
      .toArray();

    console.log(`📊 ${unsyncedAssessments.length} avaliações para sincronizar`);

    for (const assessment of unsyncedAssessments) {
      try {
        const { error } = await supabase
          .from('aee_diagnostic_assessments')
          .upsert(assessment.data);

        if (!error) {
          await db.assessments.update(assessment.id, { synced: true });
          console.log(`✅ Avaliação ${assessment.id} sincronizada`);
        }
      } catch (error) {
        console.error('Erro ao sincronizar avaliação:', error);
      }
    }
  }

  /**
   * Verificar se há dados pendentes
   */
  static async hasPendingData(): Promise<boolean> {
    const unsyncedAttendances = await getUnsyncedAttendances();
    const unsyncedGoals = await db.goals.where('synced').equals(false).count();
    const unsyncedAssessments = await db.assessments.where('synced').equals(false).count();

    return (
      unsyncedAttendances.length > 0 || unsyncedGoals > 0 || unsyncedAssessments > 0
    );
  }

  /**
   * Obter contagem de dados pendentes
   */
  static async getPendingCount(): Promise<number> {
    const unsyncedAttendances = await getUnsyncedAttendances();
    const unsyncedGoals = await db.goals.where('synced').equals(false).count();
    const unsyncedAssessments = await db.assessments.where('synced').equals(false).count();

    return unsyncedAttendances.length + unsyncedGoals + unsyncedAssessments;
  }
}

// ============================================================================
// AUTO-SYNC
// ============================================================================

// Sincronizar automaticamente quando voltar online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Conexão restaurada - sincronizando...');
    SyncService.syncAll();
  });

  // Sincronizar a cada 5 minutos se online
  setInterval(
    () => {
      if (navigator.onLine) {
        SyncService.syncAll();
      }
    },
    5 * 60 * 1000
  ); // 5 minutos
}


