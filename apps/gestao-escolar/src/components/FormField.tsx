import React from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  description?: string;
}

export function FormField({ label, name, error, required, children, description }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
        {label}
      </Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

interface TextFieldProps extends Omit<FormFieldProps, 'children'> {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TextField({
  label,
  name,
  error,
  required,
  description,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
}: TextFieldProps) {
  return (
    <FormField label={label} name={name} error={error} required={required} description={description}>
      <Input
        id={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(error && 'border-red-500')}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
    </FormField>
  );
}

interface TextAreaFieldProps extends Omit<FormFieldProps, 'children'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

export function TextAreaField({
  label,
  name,
  error,
  required,
  description,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled,
}: TextAreaFieldProps) {
  return (
    <FormField label={label} name={name} error={error} required={required} description={description}>
      <Textarea
        id={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={cn(error && 'border-red-500')}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
    </FormField>
  );
}

interface SelectFieldProps extends Omit<FormFieldProps, 'children'> {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
}

export function SelectField({
  label,
  name,
  error,
  required,
  description,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: SelectFieldProps) {
  return (
    <FormField label={label} name={name} error={error} required={required} description={description}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={name}
          className={cn(error && 'border-red-500')}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
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
    </FormField>
  );
}

