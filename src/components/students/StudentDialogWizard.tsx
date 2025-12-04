// ============================================================================
// COMPONENTE: StudentDialogWizard
// ============================================================================
// Dialog wrapper para o formulário wizard de alunos
// ============================================================================

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StudentFormWizard } from './StudentFormWizard';

interface StudentDialogWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: any;
  tenantId?: string;
  schoolId?: string;
  onSuccess: () => void;
}

export function StudentDialogWizard({
  open,
  onOpenChange,
  student,
  tenantId,
  schoolId,
  onSuccess,
}: StudentDialogWizardProps) {
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {student ? 'Editar Aluno' : 'Novo Aluno'}
          </DialogTitle>
          <DialogDescription>
            {student 
              ? 'Atualize os dados completos do aluno'
              : 'Cadastre um novo aluno com informações completas'
            }
          </DialogDescription>
        </DialogHeader>
        
        <StudentFormWizard
          student={student}
          tenantId={tenantId}
          schoolId={schoolId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}






























