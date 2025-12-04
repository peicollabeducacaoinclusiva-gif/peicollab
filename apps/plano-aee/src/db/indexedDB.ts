// ============================================================================
// IndexedDB: Offline Storage
// ============================================================================
// Armazenamento local com Dexie.js para modo offline
// Data: 2025-01-09
// ============================================================================

import Dexie, { Table } from 'dexie';

// ============================================================================
// INTERFACES
// ============================================================================

export interface OfflinePlano {
  id: string;
  data: any;
  lastSynced: Date;
  hasLocalChanges: boolean;
}

export interface OfflineAttendance {
  id: string;
  data: any;
  synced: boolean;
  createdAt: Date;
}

export interface OfflineGoal {
  id: string;
  plan_id: string;
  data: any;
  synced: boolean;
}

export interface OfflineAssessment {
  id: string;
  student_id: string;
  data: any;
  synced: boolean;
}

export interface SyncQueue {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  attempts: number;
}

// ============================================================================
// DATABASE
// ============================================================================

class AEEDatabase extends Dexie {
  planos!: Table<OfflinePlano>;
  attendances!: Table<OfflineAttendance>;
  goals!: Table<OfflineGoal>;
  assessments!: Table<OfflineAssessment>;
  syncQueue!: Table<SyncQueue>;

  constructor() {
    super('aee_planner_db');

    this.version(1).stores({
      planos: 'id, lastSynced, hasLocalChanges',
      attendances: 'id, synced, createdAt',
      goals: 'id, plan_id, synced',
      assessments: 'id, student_id, synced',
      syncQueue: '++id, timestamp, attempts',
    });
  }
}

export const db = new AEEDatabase();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Salvar plano offline
 */
export async function savePlanoOffline(plano: any): Promise<void> {
  await db.planos.put({
    id: plano.id,
    data: plano,
    lastSynced: new Date(),
    hasLocalChanges: false,
  });
}

/**
 * Salvar atendimento offline
 */
export async function saveAttendanceOffline(attendance: any): Promise<void> {
  await db.attendances.add({
    id: crypto.randomUUID(),
    data: attendance,
    synced: false,
    createdAt: new Date(),
  });

  // Adicionar à fila de sincronização
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    table: 'aee_attendance_records',
    operation: 'insert',
    data: attendance,
    timestamp: new Date(),
    attempts: 0,
  });
}

/**
 * Buscar atendimentos não sincronizados
 */
export async function getUnsyncedAttendances(): Promise<OfflineAttendance[]> {
  return await db.attendances.where('synced').equals(false).toArray();
}

/**
 * Marcar atendimento como sincronizado
 */
export async function markAttendanceAsSynced(id: string): Promise<void> {
  await db.attendances.update(id, { synced: true });
}

/**
 * Limpar dados antigos (> 30 dias sincronizados)
 */
export async function cleanOldData(): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await db.attendances
    .where('synced')
    .equals(true)
    .and((att) => att.createdAt < thirtyDaysAgo)
    .delete();
}

