import { pendingChangesStorage, PendingChange } from '@/lib/offlineStorage';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Serviço para gerenciar mudanças offline que precisam ser sincronizadas
 */
export class PendingChangesService {
  /**
   * Adiciona uma mudança à fila de sincronização
   */
  static async addPendingChange(
    type: 'create' | 'update' | 'delete',
    table: string,
    data: any
  ) {
    try {
      const change: PendingChange = {
        id: uuidv4(),
        type,
        table,
        data,
        created_at: new Date().toISOString(),
        retry_count: 0,
      };

      const pendingChanges = await this.getAllPendingChanges();
      pendingChanges.push(change);
      
      await pendingChangesStorage.setItem('changes', pendingChanges);
      console.log('✅ Mudança adicionada à fila:', change);
      
      return change.id;
    } catch (error) {
      console.error('❌ Erro ao adicionar mudança pendente:', error);
      throw error;
    }
  }

  /**
   * Recupera todas as mudanças pendentes
   */
  static async getAllPendingChanges(): Promise<PendingChange[]> {
    try {
      const changes = await pendingChangesStorage.getItem<PendingChange[]>('changes');
      return changes || [];
    } catch (error) {
      console.error('❌ Erro ao recuperar mudanças pendentes:', error);
      return [];
    }
  }

  /**
   * Remove uma mudança da fila após sincronização bem-sucedida
   */
  static async removePendingChange(changeId: string) {
    try {
      const pendingChanges = await this.getAllPendingChanges();
      const filtered = pendingChanges.filter(c => c.id !== changeId);
      
      await pendingChangesStorage.setItem('changes', filtered);
      console.log('✅ Mudança removida da fila:', changeId);
    } catch (error) {
      console.error('❌ Erro ao remover mudança pendente:', error);
    }
  }

  /**
   * Sincroniza todas as mudanças pendentes com o servidor
   */
  static async syncPendingChanges(): Promise<{ success: number; failed: number }> {
    const pendingChanges = await this.getAllPendingChanges();
    let success = 0;
    let failed = 0;

    console.log(`🔄 Sincronizando ${pendingChanges.length} mudanças pendentes...`);

    for (const change of pendingChanges) {
      try {
        await this.executePendingChange(change);
        await this.removePendingChange(change.id);
        success++;
      } catch (error) {
        console.error(`❌ Falha ao sincronizar mudança ${change.id}:`, error);
        
        // Incrementa contador de tentativas
        change.retry_count++;
        
        // Remove se falhou muitas vezes (mais de 3 tentativas)
        if (change.retry_count > 3) {
          console.error(`❌ Mudança ${change.id} descartada após 3 tentativas`);
          await this.removePendingChange(change.id);
        }
        
        failed++;
      }
    }

    console.log(`✅ Sincronização concluída: ${success} sucesso, ${failed} falhas`);
    return { success, failed };
  }

  /**
   * Executa uma mudança pendente no servidor
   */
  private static async executePendingChange(change: PendingChange) {
    const { type, table, data } = change;

    switch (type) {
      case 'create':
        const { error: createError } = await supabase
          .from(table)
          .insert(data);
        if (createError) throw createError;
        break;

      case 'update':
        const { error: updateError } = await supabase
          .from(table)
          .update(data)
          .eq('id', data.id);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  /**
   * Limpa todas as mudanças pendentes
   */
  static async clearPendingChanges() {
    try {
      await pendingChangesStorage.clear();
      console.log('✅ Mudanças pendentes limpas');
    } catch (error) {
      console.error('❌ Erro ao limpar mudanças pendentes:', error);
    }
  }

  /**
   * Conta quantas mudanças estão pendentes
   */
  static async getPendingCount(): Promise<number> {
    const changes = await this.getAllPendingChanges();
    return changes.length;
  }
}