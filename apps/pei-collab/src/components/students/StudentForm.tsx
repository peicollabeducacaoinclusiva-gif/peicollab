import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const studentSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  serie: z.string().optional(),
  turno: z.enum(['manha', 'tarde', 'noite', 'integral']).optional(),
  categoria_necessidade: z
    .enum(['DI', 'TEA', 'AHSD', 'DF', 'DV', 'Surdez', 'TDAH', 'Dislexia', 'Discalculia', 'Outro'])
    .optional(),
  school_id: z.string().min(1, 'Selecione uma escola'),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

type StudentFormProps = {
  onCreate: (values: StudentFormValues) => Promise<void>;
  schools: { id: string; name: string }[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function StudentForm({ onCreate, schools, open: controlledOpen, onOpenChange }: StudentFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
  });

  const onSubmit = async (values: StudentFormValues) => {
    await onCreate(values);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined ? (
        <DialogTrigger asChild>
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700">Novo aluno</Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo estudante</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" {...register('nome')} />
            {errors.nome ? <p className="text-sm text-destructive">{errors.nome.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="serie">Série</Label>
            <Input id="serie" {...register('serie')} />
          </div>

          <div className="space-y-2">
            <Label>Turno</Label>
            <Select
              onValueChange={(value) => setValue('turno', value as StudentFormValues['turno'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manha">Manhã</SelectItem>
                <SelectItem value="tarde">Tarde</SelectItem>
                <SelectItem value="noite">Noite</SelectItem>
                <SelectItem value="integral">Integral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              onValueChange={(value) =>
                setValue(
                  'categoria_necessidade',
                  value as StudentFormValues['categoria_necessidade']
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {[
                  'DI',
                  'TEA',
                  'AHSD',
                  'DF',
                  'DV',
                  'Surdez',
                  'TDAH',
                  'Dislexia',
                  'Discalculia',
                  'Outro',
                ].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Escola</Label>
            <Select onValueChange={(value) => setValue('school_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a escola" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.school_id ? (
              <p className="text-sm text-destructive">{errors.school_id.message}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
