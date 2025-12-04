import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { Label } from '../label';
import { cn } from '../../lib/utils';

interface AccessibleSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  className?: string;
}

export const AccessibleSelect: React.FC<AccessibleSelectProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  error,
  hint,
  required,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  className,
}) => {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const describedBy = cn(errorId, hintId, ariaDescribedBy);

  return (
    <div className="space-y-2">
      <Label htmlFor={selectId} className={required ? 'after:content-["*"] after:ml-0.5 after:text-destructive' : ''}>
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          id={selectId}
          className={cn(error && 'border-destructive', className)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy || undefined}
          aria-required={required}
          aria-label={ariaLabel || label}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground" role="note">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

