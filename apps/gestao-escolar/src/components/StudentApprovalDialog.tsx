import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useAttendanceApproval } from '../hooks/useAttendanceApproval';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface StudentApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  enrollmentId: string;
  academicYear?: number;
  onApprove: () => Promise<void>;
}

/**
 * Dialog para aprovar aluno com validação de frequência
 */
export function StudentApprovalDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  enrollmentId,
  academicYear,
  onApprove,
}: StudentApprovalDialogProps) {
  const { validateApproval, validating } = useAttendanceApproval();
  const { toast } = useToast();
  const [approving, setApproving] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    canApprove: boolean;
    reason?: string;
    attendancePercentage?: number;
  } | null>(null);

  const handleValidate = async () => {
    const result = await validateApproval(studentId, enrollmentId, academicYear);
    setValidationResult(result);
    return result.canApprove;
  };

  const handleApprove = async () => {
    // Validar frequência primeiro
    const canApprove = await handleValidate();
    
    if (!canApprove) {
      return; // Já mostra toast no hook
    }

    try {
      setApproving(true);
      await onApprove();
      toast({
        title: 'Aluno aprovado',
        description: `${studentName} foi aprovado com sucesso.`,
      });
      onOpenChange(false);
      setValidationResult(null);
    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar',
        description: error.message || 'Não foi possível aprovar o aluno',
        variant: 'destructive',
      });
    } finally {
      setApproving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aprovar Aluno</DialogTitle>
          <DialogDescription>
            Confirmar aprovação de <strong>{studentName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {validationResult && !validationResult.canApprove && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Aprovação bloqueada</AlertTitle>
              <AlertDescription>
                {validationResult.reason}
                {validationResult.attendancePercentage !== undefined && (
                  <div className="mt-2 text-sm">
                    Frequência atual: {validationResult.attendancePercentage.toFixed(2)}%
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {validationResult && validationResult.canApprove && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Frequência adequada</AlertTitle>
              <AlertDescription>
                Aluno possui frequência de {validationResult.attendancePercentage?.toFixed(2)}%,
                acima do mínimo legal de 75%.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground">
            <p>
              Ao aprovar, o sistema verificará automaticamente se o aluno atende aos requisitos
              de frequência mínima (75%).
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setValidationResult(null);
            }}
            disabled={approving || validating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approving || validating || (validationResult ? !validationResult.canApprove : false)}
          >
            {approving || validating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {validating ? 'Validando...' : 'Aprovando...'}
              </>
            ) : (
              'Aprovar Aluno'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

