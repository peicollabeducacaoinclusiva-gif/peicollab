import localforage from 'localforage';

/**
 * Configuração do LocalForage para persistência offline
 */
export const offlineStorage = localforage.createInstance({
  name: 'PEI-Collab',
  storeName: 'offline_data',
  description: 'Armazenamento local de dados offline do PEI Collab',
});

/**
 * Armazenamento para mudanças pendentes (a serem sincronizadas)
 */
export const pendingChangesStorage = localforage.createInstance({
  name: 'PEI-Collab',
  storeName: 'pending_changes',
  description: 'Mudanças pendentes para sincronização',
});

/**
 * Armazenamento para cache de assets (imagens, etc)
 */
export const assetsStorage = localforage.createInstance({
  name: 'PEI-Collab',
  storeName: 'assets_cache',
  description: 'Cache de arquivos e imagens',
});

// Tipos para estruturar os dados salvos
export interface OfflineStudent {
  id: string;
  name: string;
  birth_date: string;
  tenant_id: string;
  cached_at: string; // timestamp de quando foi cacheado
}

export interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  created_at: string;
  retry_count: number;
}