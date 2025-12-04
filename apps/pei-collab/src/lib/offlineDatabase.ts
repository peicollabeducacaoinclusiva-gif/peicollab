import Dexie, { Table } from 'dexie';

// Interfaces para tipagem
export interface OfflineStudent {
  id: string;
  name: string;
  date_of_birth?: string;
  mother_name?: string;
  father_name?: string;
  email?: string;
  phone?: string;
  family_guidance_notes?: string;
  school_id: string;
  tenant_id: string;
  is_synced: boolean;
  last_modified: number;
  created_at: string;
  updated_at: string;
}

export interface OfflinePEI {
  id: string;
  student_id: string;
  school_id: string;
  tenant_id: string;
  created_by: string;
  assigned_teacher_id?: string;
  version_number: number;
  is_active_version: boolean;
  status: 'draft' | 'pending' | 'returned' | 'approved' | 'obsolete';
  diagnosis_data?: any;
  planning_data?: any;
  evaluation_data?: any;
  family_approved_at?: string;
  family_approved_by?: string;
  is_synced: boolean;
  last_modified: number;
  created_at: string;
  updated_at: string;
}

export interface OfflinePEIGoal {
  id: string;
  pei_id: string;
  barrier_id?: string;
  description: string;
  category?: 'academic' | 'functional';
  target_date?: string;
  progress_level: string;
  progress_score?: number;
  notes?: string;
  is_synced: boolean;
  last_modified: number;
  created_at: string;
  updated_at: string;
}

export interface OfflinePEIBarrier {
  id: string;
  pei_id: string;
  barrier_type?: string;
  description?: string;
  severity?: string;
  is_synced: boolean;
  last_modified: number;
  created_at: string;
}

export interface OfflineSyncQueue {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  created_at: number;
  retry_count: number;
  last_error?: string;
}

export interface OfflineSettings {
  id: string;
  key: string;
  value: any;
  updated_at: number;
}

// Classe principal do banco offline
export class OfflineDatabase extends Dexie {
  students!: Table<OfflineStudent>;
  peis!: Table<OfflinePEI>;
  pei_goals!: Table<OfflinePEIGoal>;
  pei_barriers!: Table<OfflinePEIBarrier>;
  sync_queue!: Table<OfflineSyncQueue>;
  settings!: Table<OfflineSettings>;

  constructor() {
    super('PEICollabOffline');
    
    this.version(1).stores({
      students: 'id, name, school_id, tenant_id, is_synced, last_modified',
      peis: 'id, student_id, school_id, tenant_id, is_active_version, status, is_synced, last_modified',
      pei_goals: 'id, pei_id, is_synced, last_modified',
      pei_barriers: 'id, pei_id, is_synced, last_modified',
      sync_queue: 'id, table_name, record_id, action, created_at, retry_count',
      settings: 'id, key, updated_at'
    });

    // Hooks para controle de sincronização
    this.students.hook('creating', (primKey, obj, trans) => {
      obj.is_synced = false;
      obj.last_modified = Date.now();
    });

    this.students.hook('updating', (modifications: any) => ({
      ...modifications,
      is_synced: false,
      last_modified: Date.now(),
    }));

    this.peis.hook('creating', (primKey, obj, trans) => {
      obj.is_synced = false;
      obj.last_modified = Date.now();
    });

    this.peis.hook('updating', (modifications: any) => ({
      ...modifications,
      is_synced: false,
      last_modified: Date.now(),
    }));

    this.pei_goals.hook('creating', (primKey, obj, trans) => {
      obj.is_synced = false;
      obj.last_modified = Date.now();
    });

    this.pei_goals.hook('updating', (modifications: any) => ({
      ...modifications,
      is_synced: false,
      last_modified: Date.now(),
    }));

    this.pei_barriers.hook('creating', (primKey, obj, trans) => {
      obj.is_synced = false;
      obj.last_modified = Date.now();
    });

    this.pei_barriers.hook('updating', (modifications: any) => ({
      ...modifications,
      is_synced: false,
      last_modified: Date.now(),
    }));
  }

  // Métodos de utilidade
  async getUnsyncedRecords(): Promise<{
    students: OfflineStudent[];
    peis: OfflinePEI[];
    pei_goals: OfflinePEIGoal[];
    pei_barriers: OfflinePEIBarrier[];
  }> {
    try {
      // 🔧 FIX: Usar filter ao invés de where/equals para campos não indexados
      const [students, peis, pei_goals, pei_barriers] = await Promise.all([
        this.students.toArray().then(arr => arr.filter(s => s.is_synced === false)).catch(() => []),
        this.peis.toArray().then(arr => arr.filter(p => p.is_synced === false)).catch(() => []),
        this.pei_goals.toArray().then(arr => arr.filter(g => g.is_synced === false)).catch(() => []),
        this.pei_barriers.toArray().then(arr => arr.filter(b => b.is_synced === false)).catch(() => [])
      ]);

      return { students, peis, pei_goals, pei_barriers };
    } catch (error) {
      console.warn("⚠️ Erro ao buscar registros não sincronizados:", error);
      return { students: [], peis: [], pei_goals: [], pei_barriers: [] };
    }
  }

  async markAsSynced(tableName: string, recordId: string): Promise<void> {
    const table = this.table(tableName as any);
    await table.update(recordId, { is_synced: true });
  }

  async addToSyncQueue(tableName: string, recordId: string, action: 'INSERT' | 'UPDATE' | 'DELETE', data: any): Promise<void> {
    await this.sync_queue.add({
      id: crypto.randomUUID(),
      table_name: tableName,
      record_id: recordId,
      action,
      data,
      created_at: Date.now(),
      retry_count: 0
    });
  }

  async getSyncQueue(): Promise<OfflineSyncQueue[]> {
    return this.sync_queue.orderBy('created_at').toArray();
  }

  async clearSyncQueue(): Promise<void> {
    await this.sync_queue.clear();
  }

  async getSetting(key: string): Promise<any> {
    try {
      // 🔧 FIX: Usar filter ao invés de where para evitar IDBKeyRange error
      const allSettings = await this.settings.toArray();
      const setting = allSettings.find(s => s.key === key);
      return setting?.value;
    } catch (error) {
      console.warn(`⚠️ Erro ao buscar setting '${key}':`, error);
      return null;
    }
  }

  async setSetting(key: string, value: any): Promise<void> {
    await this.settings.put({
      id: crypto.randomUUID(),
      key,
      value,
      updated_at: Date.now()
    });
  }

  // Método para limpar dados antigos (manutenção)
  async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    try {
      // 🔧 FIX: Usar filter para evitar erro de IDBKeyRange
      const oldStudents = await this.students.toArray()
        .then(arr => arr.filter(s => s.is_synced === true && s.last_modified < cutoffDate));
      
      const oldPEIs = await this.peis.toArray()
        .then(arr => arr.filter(p => p.is_synced === true && p.last_modified < cutoffDate));
      
      // Deletar em lote
      if (oldStudents.length > 0) {
        await this.students.bulkDelete(oldStudents.map(s => s.id));
      }
      
      if (oldPEIs.length > 0) {
        await this.peis.bulkDelete(oldPEIs.map(p => p.id));
      }
      
      console.log(`✓ Limpeza concluída: ${oldStudents.length} students, ${oldPEIs.length} PEIs removidos`);
    } catch (error) {
      console.warn("⚠️ Erro na limpeza de dados antigos:", error);
    }
  }
}

// Instância global do banco
export const offlineDB = new OfflineDatabase();

// Funções de utilidade para sincronização
export const syncUtils = {
  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  },

  async waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      if (navigator.onLine) {
        resolve();
        return;
      }

      const handleOnline = () => {
        window.removeEventListener('online', handleOnline);
        resolve();
      };

      window.addEventListener('online', handleOnline);
    });
  },

  async getLastSyncTime(): Promise<number> {
    return await offlineDB.getSetting('lastSyncTime') || 0;
  },

  async setLastSyncTime(timestamp: number): Promise<void> {
    await offlineDB.setSetting('lastSyncTime', timestamp);
  }
};

