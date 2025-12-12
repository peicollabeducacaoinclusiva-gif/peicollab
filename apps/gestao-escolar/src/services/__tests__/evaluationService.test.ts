import { describe, it, expect, beforeEach, vi } from 'vitest';
import { evaluationService, type Grade, type Attendance, type DescriptiveReport } from '../evaluationService';
import { supabase } from '@pei/database';

// Mock do Supabase
vi.mock('@pei/database', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('evaluationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGrades', () => {
    it('deve buscar notas com dados relacionados', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          student_id: 'student-1',
          subject_id: 'subject-1',
          academic_year: 2025,
          period: 1,
          grade_value: 8.5,
        },
      ];

      const mockStudents = [
        { id: 'student-1', name: 'João Silva' },
      ];

      const mockSubjects = [
        { id: 'subject-1', subject_name: 'Matemática' },
      ];

      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockGrades, error: null }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockStudents, error: null }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockSubjects, error: null }),
        });

      const result = await evaluationService.getGrades({
        tenantId: 'tenant-1',
        enrollmentId: 'enrollment-1',
        academicYear: 2025,
      });

      expect(result).toHaveLength(1);
      expect(result[0].student_name).toBe('João Silva');
      expect(result[0].subject_name).toBe('Matemática');
    });

    it('deve retornar array vazio se não houver notas', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await evaluationService.getGrades({
        tenantId: 'tenant-1',
        academicYear: 2025,
      });

      expect(result).toEqual([]);
    });
  });

  describe('getAttendance', () => {
    it('deve buscar frequência com dados relacionados', async () => {
      const mockAttendance = [
        {
          id: 'att-1',
          student_id: 'student-1',
          subject_id: 'subject-1',
          academic_year: 2025,
          period: 1,
          total_classes: 20,
          present_classes: 18,
        },
      ];

      const mockStudents = [
        { id: 'student-1', name: 'João Silva' },
      ];

      const mockSubjects = [
        { id: 'subject-1', subject_name: 'Matemática' },
      ];

      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockAttendance, error: null }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockStudents, error: null }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockSubjects, error: null }),
        });

      const result = await evaluationService.getAttendance({
        tenantId: 'tenant-1',
        enrollmentId: 'enrollment-1',
        academicYear: 2025,
      });

      expect(result).toHaveLength(1);
      expect(result[0].student_name).toBe('João Silva');
      expect(result[0].subject_name).toBe('Matemática');
    });
  });

  describe('getDescriptiveReports', () => {
    it('deve buscar pareceres descritivos com dados relacionados', async () => {
      const mockReports = [
        {
          id: 'report-1',
          student_id: 'student-1',
          enrollment_id: 'enrollment-1',
          academic_year: 2025,
          period: 1,
          report_text: 'Bom desempenho',
          created_by: 'user-1',
        },
      ];

      const mockStudents = [
        { id: 'student-1', name: 'João Silva' },
      ];

      const mockProfiles = [
        { id: 'user-1', full_name: 'Prof. Maria' },
      ];

      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockReports, error: null }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockStudents, error: null }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
        });

      const result = await evaluationService.getDescriptiveReports({
        tenantId: 'tenant-1',
        enrollmentId: 'enrollment-1',
        academicYear: 2025,
      });

      expect(result).toHaveLength(1);
      expect(result[0].student_name).toBe('João Silva');
      expect(result[0].created_by_name).toBe('Prof. Maria');
    });
  });

  describe('createGrade', () => {
    it('deve criar nota com dados válidos', async () => {
      const newGrade: Partial<Grade> = {
        student_id: 'student-1',
        enrollment_id: 'enrollment-1',
        subject_id: 'subject-1',
        academic_year: 2025,
        period: 1,
        grade_value: 8.5,
        evaluation_type: 'numeric',
      };

      const createdGrade = {
        ...newGrade,
        id: 'grade-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdGrade, error: null }),
      });

      const result = await evaluationService.createGrade(newGrade);
      expect(result.id).toBe('grade-1');
      expect(result.grade_value).toBe(8.5);
    });
  });
});
