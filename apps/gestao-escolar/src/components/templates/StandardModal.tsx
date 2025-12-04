import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { Button } from '@/components/ui';
import { X, Loader2 } from 'lucide-react';

interface StandardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  showCancel?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * Template padrão para modais
 * 
 * Inclui:
 * - Header com título e descrição
 * - Conteúdo customizável
 * - Footer com ações
 * - Loading states
 * - Tamanhos variados
 */
export function StandardModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
  showCancel = true,
  size = 'md',
}: StandardModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sizeClasses[size]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-4">{children}</div>

        <DialogFooter>
          {footer ? (
            footer
          ) : (
            <>
              {showCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  {cancelLabel}
                </Button>
              )}
              {onConfirm && (
                <Button
                  type="button"
                  variant={variant}
                  onClick={onConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    confirmLabel
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Modal de confirmação padrão
 */
export function ConfirmModal({
  open,
  onOpenChange,
  title = 'Confirmar ação',
  description,
  onConfirm,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
}: Omit<StandardModalProps, 'children' | 'footer' | 'onCancel' | 'showCancel'>) {
  return (
    <StandardModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      onConfirm={onConfirm}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      variant={variant}
      loading={loading}
      size="sm"
    >
      <p className="text-sm text-muted-foreground">
        Esta ação não pode ser desfeita.
      </p>
    </StandardModal>
  );
}
