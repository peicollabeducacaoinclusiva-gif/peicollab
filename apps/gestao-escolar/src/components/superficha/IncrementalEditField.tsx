import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { useUpdateStudentField } from '../../hooks/useSuperficha';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface IncrementalEditFieldProps {
  studentId: string;
  fieldName: string;
  label: string;
  value: string | undefined | null;
  type?: 'text' | 'email' | 'tel' | 'date';
  placeholder?: string;
  className?: string;
  onUpdate?: (newValue: string) => void;
}

export function IncrementalEditField({
  studentId,
  fieldName,
  label,
  value,
  type = 'text',
  placeholder,
  className,
  onUpdate,
}: IncrementalEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isHovering, setIsHovering] = useState(false);

  const updateMutation = useUpdateStudentField(studentId);

  const handleStartEdit = () => {
    setEditValue(value || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        fieldName,
        fieldValue: editValue,
      });

      setIsEditing(false);
      if (onUpdate) {
        onUpdate(editValue);
      }
    } catch (error) {
      // Erro já é tratado no hook
      console.error('Erro ao atualizar campo:', error);
    }
  };

  const displayValue = value || <span className="text-muted-foreground italic">Não informado</span>;

  return (
    <div
      className={cn('relative group', className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {isEditing ? (
        <div className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            {label}
          </Label>
          <div className="flex gap-2">
            <Input
              id={fieldName}
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                } else if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-shrink-0"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
          <div className="flex items-center gap-2">
            <p className="text-base flex-1">{displayValue}</p>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7',
                isHovering && 'opacity-100'
              )}
              onClick={handleStartEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

