import { Input, InputProps } from '../input';
import { forwardRef } from 'react';

export interface AccessibleInputProps extends InputProps {
  label: string;
  errorMessage?: string;
  hint?: string;
  required?: boolean;
  ariaDescribedBy?: string;
}

/**
 * Input acessível com label, erro e hint
 */
export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  (
    {
      label,
      errorMessage,
      hint,
      required,
      ariaDescribedBy,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    const errorId = errorMessage ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const describedBy = [ariaDescribedBy, errorId, hintId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1" aria-label="obrigatório">*</span>}
        </label>
        {hint && (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
        <Input
          ref={ref}
          id={inputId}
          aria-label={label}
          aria-describedby={describedBy}
          aria-invalid={!!errorMessage}
          aria-required={required}
          aria-errormessage={errorId}
          {...props}
        />
        {errorMessage && (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';
