import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useSchools } from '../hooks/useStudents';
import { useUpdateProfessional } from '../hooks/useProfessionals';
import { professionalSchema, type ProfessionalFormData, formatPhone } from '../lib/validationSchemas';
import { PROFESSIONAL_ROLES } from '../lib/constants';
import type { Professional } from '../services/professionalsService';

interface EditProfessionalDialogProps {
  professional: Professional | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  onUpdated: () => void;
}

export function EditProfessionalDialog({
  professional,
  open,
  onOpenChange,
  tenantId,
  onUpdated,
}: EditProfessionalDialogProps) {
  const { data: schoolsData = [] } = useSchools(tenantId);
  const updateProfessional = useUpdateProfessional();

  const form = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      professional_role: '',
      school_id: '',
      registration_number: '',
      specialization: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (open && professional) {
      form.reset({
        full_name: professional.full_name || '',
        email: professional.email || '',
        phone: professional.phone || '',
        professional_role: professional.professional_role || '',
        school_id: professional.school_id || '',
        registration_number: professional.registration_number || '',
        specialization: professional.specialization || '',
        is_active: professional.is_active ?? true,
      });
    }
  }, [open, professional, form]);

  const onSubmit = async (data: ProfessionalFormData) => {
    if (!professional) return;

    try {
      await updateProfessional.mutateAsync({
        professionalId: professional.id,
        updates: data,
      });
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Profissional</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@escola.gov.br" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(xx) xxxxx-xxxx"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="professional_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROFESSIONAL_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="school_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escola</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a escola" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {schoolsData.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.school_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registration_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrícula</FormLabel>
                    <FormControl>
                      <Input placeholder="Número de matrícula" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialização</FormLabel>
                    <FormControl>
                      <Input placeholder="Especialização" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Profissional ativo
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateProfessional.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateProfessional.isPending}
              >
                {updateProfessional.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
