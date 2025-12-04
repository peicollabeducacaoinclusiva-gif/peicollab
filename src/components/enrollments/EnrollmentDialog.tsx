// ============================================================================
// COMPONENTE: EnrollmentDialog
// ============================================================================
// Dialog wrapper para o wizard de matrículas
// ============================================================================

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EnrollmentWizard } from './EnrollmentWizard';

interface EnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  tenantId: string;
  onSuccess: () => void;
}

export function EnrollmentDialog({
  open,
  onOpenChange,
  schoolId,
  tenantId,
  onSuccess,
}: EnrollmentDialogProps) {
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Matrícula</DialogTitle>
          <DialogDescription>
            Matricule um aluno em uma turma do ano letivo atual
          </DialogDescription>
        </DialogHeader>

        <EnrollmentWizard
          schoolId={schoolId}
          tenantId={tenantId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}






























