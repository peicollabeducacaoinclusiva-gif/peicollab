import { useState } from 'react';
import { attendanceService } from '../services/attendanceService';
import { useToast } from './use-toast';

/**
 * Hook para validar aprovação de aluno baseado em frequência
 * Bloqueia aprovação se frequência < 75%
 */
export function useAttendanceApproval() {
  const [validating, setValidating] = useState(false);
  const { toast } = useToast();

  const validateApproval = async (
    studentId: string,
    enrollmentId: string,
    academicYear?: number
  ): Promise<{ canApprove: boolean; reason?: string; attendancePercentage?: number }> => {
    try {
      setValidating(true);
      
      const validation = await attendanceService.canApproveStudent(
        studentId,
        enrollmentId,
        academicYear
      );

      if (!validation.can_approve) {
        toast({
          title: 'Aprovação bloqueada',
          description: validation.reason || 'Frequência abaixo do mínimo legal',
          variant: 'destructive',
        });
        
        return {
          canApprove: false,
          reason: validation.reason,
          attendancePercentage: validation.attendance_percentage,
        };
      }

      return {
        canApprove: true,
        attendancePercentage: validation.attendance_percentage,
      };
    } catch (error: any) {
      console.error('Erro ao validar aprovação:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível validar frequência',
        variant: 'destructive',
      });
      
      // Em caso de erro, permitir aprovação mas avisar
      return {
        canApprove: true,
        reason: 'Erro ao validar frequência. Verifique manualmente.',
      };
    } finally {
      setValidating(false);
    }
  };

  return {
    validateApproval,
    validating,
  };
}

