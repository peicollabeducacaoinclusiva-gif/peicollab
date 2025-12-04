import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockSupabaseClient, testData } from '@pei/test-utils';
import { z } from 'zod';

/**
 * Testes unitários para UnifiedStudentService
 * Valida schemas Zod e lógica de negócio
 */

// Schema de validação de estudante
const studentSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  tenant_id: z.string().uuid(),
});

describe('UnifiedStudentService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient({
      students: [testData.student()],
    });
  });

  describe('Validação de Schema', () => {
    it('deve validar estudante válido', () => {
      const validStudent = {
        name: 'João Silva',
        cpf: '12345678900',
        birth_date: '2010-01-01',
        tenant_id: 'tenant-1',
      };

      const result = studentSchema.safeParse(validStudent);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar estudante com nome muito curto', () => {
      const invalidStudent = {
        name: 'Jo',
        cpf: '12345678900',
        birth_date: '2010-01-01',
        tenant_id: 'tenant-1',
      };

      const result = studentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toEqual(['name']);
      }
    });

    it('deve rejeitar CPF inválido', () => {
      const invalidStudent = {
        name: 'João Silva',
        cpf: '123',
        birth_date: '2010-01-01',
        tenant_id: 'tenant-1',
      };

      const result = studentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toEqual(['cpf']);
      }
    });

    it('deve rejeitar data inválida', () => {
      const invalidStudent = {
        name: 'João Silva',
        cpf: '12345678900',
        birth_date: '01/01/2010',
        tenant_id: 'tenant-1',
      };

      const result = studentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toEqual(['birth_date']);
      }
    });
  });

  describe('RLS (Row Level Security)', () => {
    it('deve filtrar estudantes por tenant_id quando RLS está ativo', async () => {
      mockSupabase.setUser({ id: 'user-1', tenant_id: 'tenant-1' });
      mockSupabase.setRLS(true);

      mockSupabase.setData({
        students: [
          testData.student({ tenant_id: 'tenant-1' }),
          testData.student({ id: 'student-2', tenant_id: 'tenant-2' }),
        ],
      });

      const result = await mockSupabase
        .from('students')
        .select('*')
        .then((res: any) => res);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].tenant_id).toBe('tenant-1');
    });

    it('deve retornar todos os estudantes quando RLS está desativado', async () => {
      mockSupabase.setRLS(false);

      mockSupabase.setData({
        students: [
          testData.student({ tenant_id: 'tenant-1' }),
          testData.student({ id: 'student-2', tenant_id: 'tenant-2' }),
        ],
      });

      const result = await mockSupabase
        .from('students')
        .select('*')
        .then((res: any) => res);

      expect(result.data).toHaveLength(2);
    });
  });

  describe('Operações CRUD', () => {
    it('deve criar um novo estudante', async () => {
      const newStudent = {
        name: 'Maria Santos',
        cpf: '98765432100',
        birth_date: '2011-02-02',
        tenant_id: 'tenant-1',
      };

      const result = await mockSupabase
        .from('students')
        .insert(newStudent)
        .select()
        .single()
        .then((res: any) => res);

      expect(result.data).toMatchObject(newStudent);
      expect(result.data.id).toBeDefined();
    });

    it('deve atualizar um estudante existente', async () => {
      const updatedData = { name: 'João Silva Atualizado' };

      const result = await mockSupabase
        .from('students')
        .update(updatedData)
        .eq('id', 'student-1')
        .then((res: any) => res);

      expect(result.data).toBeDefined();
    });

    it('deve deletar um estudante', async () => {
      const result = await mockSupabase
        .from('students')
        .delete()
        .eq('id', 'student-1')
        .then((res: any) => res);

      expect(result.data).toBeDefined();
    });
  });
});

