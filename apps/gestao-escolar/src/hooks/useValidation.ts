import { useState } from 'react';
import { z } from 'zod';
import { useToast } from './use-toast';

/**
 * Hook para validação de formulários com feedback visual
 */
export function useValidation<T extends z.ZodTypeAny>(schema: T) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validate = (data: unknown): data is z.infer<T> => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);

        // Mostrar toast com primeiro erro
        const firstError = error.errors[0];
        if (firstError) {
          toast({
            title: 'Erro de Validação',
            description: firstError.message,
            variant: 'destructive',
          });
        }
      }
      return false;
    }
  };

  const validateField = (field: string, value: unknown): boolean => {
    try {
      // Validar apenas o campo específico
      const fieldSchema = (schema as any).shape?.[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        if (firstError) {
          setErrors((prev) => ({
            ...prev,
            [field]: firstError.message,
          }));
        }
      }
      return false;
    }
  };

  const clearErrors = () => {
    setErrors({});
  };

  const getError = (field: string): string | undefined => {
    return errors[field];
  };

  const hasError = (field: string): boolean => {
    return !!errors[field];
  };

  return {
    validate,
    validateField,
    clearErrors,
    getError,
    hasError,
    errors,
  };
}

