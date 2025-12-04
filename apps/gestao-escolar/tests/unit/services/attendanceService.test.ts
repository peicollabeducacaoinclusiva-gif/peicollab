import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attendanceService } from '@/services/attendanceService';
import { supabase } from '@pei/database';

// Mock do Supabase
vi.mock('@pei/database', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe('attendanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStudentsBelowThreshold', () => {
    it('deve retornar lista de alunos abaixo do threshold', async () => {
      const mockData = [
        {
          student_id: '1',
          student_name: 'João Silva',
          enrollment_id: 'e1',
          class_name: '1º Ano A',
          attendance_percentage: 70.5,
          status: 'ALERTA',
          total_classes: 100,
          absent_classes: 30,
          period_start: '2025-01-01',
          period_end: '2025-03-31',
        },
      ];

      (supabase.rpc as any).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await attendanceService.getStudentsBelowThreshold('school-1', 75);

      expect(result).toEqual(mockData);
      expect(supabase.rpc).toHaveBeenCalledWith('get_students_below_attendance_threshold', {
        p_school_id: 'school-1',
        p_threshold: 75,
      });
    });

    it('deve lançar erro quando RPC falha', async () => {
      const mockError = new Error('Database error');
      (supabase.rpc as any).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        attendanceService.getStudentsBelowThreshold('school-1', 75)
      ).rejects.toThrow('Database error');
    });
  });

  describe('canApproveStudent', () => {
    it('deve retornar true quando aluno pode ser aprovado', async () => {
      const mockData = {
        can_approve: true,
        attendance_percentage: 80.0,
        reason: undefined,
      };

      (supabase.rpc as any).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await attendanceService.canApproveStudent('student-1', 'enrollment-1', 2025);

      expect(result.can_approve).toBe(true);
      expect(result.attendance_percentage).toBe(80.0);
    });

    it('deve retornar false quando aluno não pode ser aprovado', async () => {
      const mockData = {
        can_approve: false,
        attendance_percentage: 70.0,
        reason: 'Frequência abaixo do mínimo legal (75%)',
      };

      (supabase.rpc as any).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await attendanceService.canApproveStudent('student-1', 'enrollment-1', 2025);

      expect(result.can_approve).toBe(false);
      expect(result.reason).toContain('Frequência abaixo');
    });
  });
});

