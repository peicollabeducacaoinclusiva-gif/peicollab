import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Mock do Supabase Client para testes
 * Simula comportamento do Supabase com RLS
 */

export interface MockSupabaseData {
  [table: string]: any[];
}

export class MockSupabaseClient {
  private data: MockSupabaseData = {};
  private rlsEnabled: boolean = true;
  private currentUser: { id: string; tenant_id?: string } | null = null;

  constructor(initialData?: MockSupabaseData) {
    this.data = initialData || {};
  }

  /**
   * Define dados iniciais
   */
  setData(data: MockSupabaseData): void {
    this.data = { ...this.data, ...data };
  }

  /**
   * Define usuário atual (para RLS)
   */
  setUser(user: { id: string; tenant_id?: string } | null): void {
    this.currentUser = user;
  }

  /**
   * Ativa/desativa RLS
   */
  setRLS(enabled: boolean): void {
    this.rlsEnabled = enabled;
  }

  /**
   * Mock do método from()
   */
  from(table: string) {
    return {
      select: (columns?: string) => this.mockSelect(table, columns),
      insert: (values: any) => this.mockInsert(table, values),
      update: (values: any) => this.mockUpdate(table, values),
      delete: () => this.mockDelete(table),
      upsert: (values: any) => this.mockUpsert(table, values),
      eq: (column: string, value: any) => this.mockEq(table, column, value),
      neq: (column: string, value: any) => this.mockNeq(table, column, value),
      in: (column: string, values: any[]) => this.mockIn(table, column, values),
      single: () => this.mockSingle(table),
    };
  }

  /**
   * Mock do método rpc()
   */
  rpc(functionName: string, params?: Record<string, any>) {
    return this.mockRPC(functionName, params);
  }

  /**
   * Mock do método auth
   */
  auth = {
    getSession: vi.fn().mockResolvedValue({
      data: { session: this.currentUser ? { user: this.currentUser } : null },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: this.currentUser },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: this.currentUser, session: { user: this.currentUser } },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  };

  private mockSelect(table: string, columns?: string) {
    return {
      eq: (column: string, value: any) => this.mockEq(table, column, value),
      neq: (column: string, value: any) => this.mockNeq(table, column, value),
      in: (column: string, values: any[]) => this.mockIn(table, column, values),
      single: () => this.mockSingle(table),
      then: (onResolve: (value: any) => any) => {
        const data = this.getTableData(table);
        return Promise.resolve({ data, error: null }).then(onResolve);
      },
    };
  }

  private mockInsert(table: string, values: any) {
    return {
      select: (columns?: string) => ({
        single: () => {
          const newRecord = Array.isArray(values) ? values[0] : values;
          const id = newRecord.id || `mock-${Date.now()}`;
          const record = { ...newRecord, id };
          this.addToTable(table, record);
          return Promise.resolve({ data: record, error: null });
        },
        then: (onResolve: (value: any) => any) => {
          const records = Array.isArray(values) ? values : [values];
          records.forEach((record) => {
            const id = record.id || `mock-${Date.now()}-${Math.random()}`;
            this.addToTable(table, { ...record, id });
          });
          return Promise.resolve({ data: records, error: null }).then(onResolve);
        },
      }),
      then: (onResolve: (value: any) => any) => {
        const records = Array.isArray(values) ? values : [values];
        records.forEach((record) => {
          const id = record.id || `mock-${Date.now()}-${Math.random()}`;
          this.addToTable(table, { ...record, id });
        });
        return Promise.resolve({ data: records, error: null }).then(onResolve);
      },
    };
  }

  private mockUpdate(table: string, values: any) {
    return {
      eq: (column: string, value: any) => {
        const records = this.getTableData(table);
        const updated = records.map((record: any) =>
          record[column] === value ? { ...record, ...values } : record
        );
        this.data[table] = updated;
        return Promise.resolve({ data: updated, error: null });
      },
      then: (onResolve: (value: any) => any) => {
        return Promise.resolve({ data: null, error: null }).then(onResolve);
      },
    };
  }

  private mockDelete(table: string) {
    return {
      eq: (column: string, value: any) => {
        const records = this.getTableData(table);
        const filtered = records.filter((record: any) => record[column] !== value);
        this.data[table] = filtered;
        return Promise.resolve({ data: filtered, error: null });
      },
      then: (onResolve: (value: any) => any) => {
        return Promise.resolve({ data: null, error: null }).then(onResolve);
      },
    };
  }

  private mockUpsert(table: string, values: any) {
    const records = Array.isArray(values) ? values : [values];
    records.forEach((record) => {
      const existing = this.getTableData(table).find((r: any) => r.id === record.id);
      if (existing) {
        Object.assign(existing, record);
      } else {
        this.addToTable(table, record);
      }
    });
    return Promise.resolve({ data: records, error: null });
  }

  private mockEq(table: string, column: string, value: any) {
    const records = this.getTableData(table);
    const filtered = records.filter((record: any) => {
      // Aplicar RLS se habilitado
      if (this.rlsEnabled && this.currentUser) {
        if (table === 'students' || table === 'peis' || table === 'aee_plans') {
          if (record.tenant_id && record.tenant_id !== this.currentUser.tenant_id) {
            return false;
          }
        }
      }
      return record[column] === value;
    });
    return {
      single: () => Promise.resolve({ data: filtered[0] || null, error: null }),
      then: (onResolve: (value: any) => any) => {
        return Promise.resolve({ data: filtered, error: null }).then(onResolve);
      },
    };
  }

  private mockNeq(table: string, column: string, value: any) {
    const records = this.getTableData(table);
    const filtered = records.filter((record: any) => record[column] !== value);
    return {
      single: () => Promise.resolve({ data: filtered[0] || null, error: null }),
      then: (onResolve: (value: any) => any) => {
        return Promise.resolve({ data: filtered, error: null }).then(onResolve);
      },
    };
  }

  private mockIn(table: string, column: string, values: any[]) {
    const records = this.getTableData(table);
    const filtered = records.filter((record: any) => values.includes(record[column]));
    return {
      single: () => Promise.resolve({ data: filtered[0] || null, error: null }),
      then: (onResolve: (value: any) => any) => {
        return Promise.resolve({ data: filtered, error: null }).then(onResolve);
      },
    };
  }

  private mockSingle(table: string) {
    const records = this.getTableData(table);
    return Promise.resolve({ data: records[0] || null, error: null });
  }

  private mockRPC(functionName: string, params?: Record<string, any>) {
    // Mock básico de RPC - pode ser estendido
    return Promise.resolve({ data: null, error: null });
  }

  private getTableData(table: string): any[] {
    return this.data[table] || [];
  }

  private addToTable(table: string, record: any): void {
    if (!this.data[table]) {
      this.data[table] = [];
    }
    this.data[table].push(record);
  }
}

/**
 * Cria um mock do Supabase Client
 */
export function createMockSupabaseClient(
  initialData?: MockSupabaseData
): MockSupabaseClient {
  return new MockSupabaseClient(initialData);
}

/**
 * Helper para criar dados de teste
 */
export const testData = {
  student: (overrides?: Partial<any>) => ({
    id: 'student-1',
    name: 'João Silva',
    cpf: '12345678900',
    birth_date: '2010-01-01',
    tenant_id: 'tenant-1',
    ...overrides,
  }),

  pei: (overrides?: Partial<any>) => ({
    id: 'pei-1',
    student_id: 'student-1',
    tenant_id: 'tenant-1',
    status: 'draft',
    ...overrides,
  }),

  user: (overrides?: Partial<any>) => ({
    id: 'user-1',
    email: 'test@example.com',
    tenant_id: 'tenant-1',
    ...overrides,
  }),
};

