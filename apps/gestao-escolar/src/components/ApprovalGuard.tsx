import React, { ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useAttendanceApproval } from '../hooks/useAttendanceApproval';

interface ApprovalGuardProps {
  studentId: string;
  enrollmentId: string;
  academicYear?: number;
  children: (props: { canApprove: boolean; validating: boolean; onValidate: () => Promise<void> }) => ReactNode;
  onApprovalBlocked?: (reason: string, attendancePercentage?: number) => void;
}

/**
 * Componente guard que valida frequência antes de permitir aprovação
 * Usa o hook useAttendanceApproval para validar
 */
export function ApprovalGuard({
  studentId,
  enrollmentId,
  academicYear,
  children,
  onApprovalBlocked,
}: ApprovalGuardProps) {
  const { validateApproval, validating } = useAttendanceApproval();
  const [canApprove, setCanApprove] = React.useState<boolean | null>(null);
  const [blockReason, setBlockReason] = React.useState<string>();

  const handleValidate = async () => {
    const result = await validateApproval(studentId, enrollmentId, academicYear);
    setCanApprove(result.canApprove);
    
    if (!result.canApprove) {
      setBlockReason(result.reason);
      onApprovalBlocked?.(result.reason || '', result.attendancePercentage);
    }
  };

  return (
    <>
      {canApprove === false && blockReason && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Aprovação bloqueada</AlertTitle>
          <AlertDescription>{blockReason}</AlertDescription>
        </Alert>
      )}
      {children({
        canApprove: canApprove ?? true, // Default true até validar
        validating,
        onValidate: handleValidate,
      })}
    </>
  );
}

