// ============================================================================
// COMPONENTE: CoTeachingSessionForm
// ============================================================================
// Formulário para criar/editar sessões de co-ensino
// Data: 2025-02-20
// ============================================================================

import { useState, useEffect } from 'react';
import { useCoTeachingSessions } from '../../../hooks/useCoTeaching';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@pei/database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CreateCoTeachingSessionInput,
  CoTeachingSessionStatus,
} from '../../../types/coTeaching.types';

interface CoTeachingSessionFormProps {
  planId: string;
  studentId?: string;
  sessionId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CoTeachingSessionForm({
  planId,
  studentId,
  sessionId,
  onClose,
  onSuccess,
}: CoTeachingSessionFormProps) {
  const { sessions, createSession, updateSession, isLoading: isLoadingSessions } =
    useCoTeachingSessions(planId);

  const [formData, setFormData] = useState<CreateCoTeachingSessionInput>({
    plan_id: planId,
    student_id: studentId || '',
    class_id: '',
    regular_teacher_id: '',
    aee_teacher_id: '',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '09:00',
    subject_name: '',
    topic: '',
    status: 'planned',
  });

  const [date, setDate] = useState<Date | undefined>(
    formData.session_date ? new Date(formData.session_date) : new Date()
  );

  // Buscar professores regulares
  const { data: regularTeachers } = useQuery({
    queryKey: ['regular-teachers', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'teacher')
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar professores AEE
  const { data: aeeTeachers } = useQuery({
    queryKey: ['aee-teachers', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'aee_teacher')
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar turmas
  const { data: classes } = useQuery({
    queryKey: ['classes', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, class_name, grade')
        .order('class_name');

      if (error) throw error;
      return data || [];
    },
  });

  // Carregar dados da sessão se estiver editando
  useEffect(() => {
    if (sessionId) {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setFormData({
          plan_id: session.plan_id,
          student_id: session.student_id,
          class_id: session.class_id,
          regular_teacher_id: session.regular_teacher_id,
          aee_teacher_id: session.aee_teacher_id,
          session_date: session.session_date,
          start_time: session.start_time,
          end_time: session.end_time,
          subject_name: session.subject_name || '',
          topic: session.topic || '',
          status: session.status,
        });
        setDate(new Date(session.session_date));
      }
    }
  }, [sessionId, sessions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sessionId) {
      updateSession.mutate(
        {
          id: sessionId,
          input: {
            session_date: formData.session_date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            topic: formData.topic,
            status: formData.status,
          },
        },
        {
          onSuccess: () => {
            onSuccess();
          },
        }
      );
    } else {
      createSession.mutate(formData, {
        onSuccess: () => {
          onSuccess();
        },
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sessionId ? 'Editar Sessão de Co-ensino' : 'Nova Sessão de Co-ensino'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da sessão de co-ensino entre professor AEE e professor regular
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session_date">Data da Sessão</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      setDate(d);
                      if (d) {
                        setFormData({
                          ...formData,
                          session_date: d.toISOString().split('T')[0],
                        });
                      }
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as CoTeachingSessionStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planejada</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="postponed">Adiada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Horário de Início</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Horário de Término</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regular_teacher_id">Professor Regular</Label>
              <Select
                value={formData.regular_teacher_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, regular_teacher_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o professor regular" />
                </SelectTrigger>
                <SelectContent>
                  {regularTeachers?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aee_teacher_id">Professor AEE</Label>
              <Select
                value={formData.aee_teacher_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, aee_teacher_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o professor AEE" />
                </SelectTrigger>
                <SelectContent>
                  {aeeTeachers?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class_id">Turma</Label>
            <Select
              value={formData.class_id}
              onValueChange={(value) => setFormData({ ...formData, class_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.class_name} - {cls.grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject_name">Disciplina</Label>
              <Input
                id="subject_name"
                value={formData.subject_name}
                onChange={(e) =>
                  setFormData({ ...formData, subject_name: e.target.value })
                }
                placeholder="Ex: Matemática, Português..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Tópico/Tema</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Ex: Adição e subtração..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createSession.isPending || updateSession.isPending}
            >
              {sessionId ? 'Atualizar' : 'Criar'} Sessão
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


