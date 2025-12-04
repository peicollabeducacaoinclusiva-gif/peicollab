// ============================================================================
// COMPONENTE: QuickRecord
// ============================================================================
// Registro rápido de atendimento diário
// Data: 2025-01-09
// ============================================================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
  Label,
} from '@/components/ui';
import { Save, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePlanGoals } from '../../../hooks/usePlanGoals';
import { useAttendance } from '../../../hooks/useAttendance';
import type { AttendanceStatus } from '../../../types/planoAEE.types';
import { ATTENDANCE_STATUS_ICONS } from '../../../types/planoAEE.types';

// ============================================================================
// PROPS
// ============================================================================

interface QuickRecordProps {
  planId: string;
  studentId: string;
  studentName: string;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function QuickRecord({ planId, studentId, studentName }: QuickRecordProps) {
  const { goals } = usePlanGoals(planId);
  const { recordAttendance, hasTodayAttendance } = useAttendance({ plan_id: planId });
  const [status, setStatus] = useState<AttendanceStatus>('presente');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const form = useForm();

  // Verificar se já tem atendimento hoje
  const hasAttendanceToday = hasTodayAttendance();

  const handleSubmit = form.handleSubmit(async (data) => {
    await recordAttendance.mutateAsync({
      plan_id: planId,
      student_id: studentId,
      attendance_date: format(new Date(), 'yyyy-MM-dd'),
      attendance_status: status,
      goals_worked: status === 'presente' ? selectedGoals : undefined,
      activities_performed: data.activities_performed,
      student_performance: data.student_performance,
      behavior_observations: data.behavior_observations,
      observations: data.observations,
      absence_reason: status !== 'presente' ? data.absence_reason : undefined,
    });

    // Limpar formulário
    form.reset();
    setSelectedGoals([]);
    setStatus('presente');
  });

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  return (
    <Card className={hasAttendanceToday ? 'border-green-200 bg-green-50/50' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Registro de Atendimento - {studentName}
            </CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardDescription>
          </div>
          {hasAttendanceToday && (
            <Badge className="bg-green-600">✅ Já registrado hoje</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status do Atendimento */}
        <div className="space-y-2">
          <Label>Status do Atendimento *</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="presente">
                {ATTENDANCE_STATUS_ICONS.presente} Presente
              </SelectItem>
              <SelectItem value="falta_justificada">
                {ATTENDANCE_STATUS_ICONS.falta_justificada} Falta Justificada
              </SelectItem>
              <SelectItem value="falta_injustificada">
                {ATTENDANCE_STATUS_ICONS.falta_injustificada} Falta Injustificada
              </SelectItem>
              <SelectItem value="remarcado">
                {ATTENDANCE_STATUS_ICONS.remarcado} Remarcado
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {status === 'presente' ? (
          <>
            {/* Metas Trabalhadas */}
            {goals.length > 0 && (
              <div className="space-y-2">
                <Label>Metas Trabalhadas</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto bg-white">
                  {goals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma meta cadastrada. Crie metas primeiro para registrar o trabalho
                      realizado.
                    </p>
                  ) : (
                    goals.map((goal) => (
                      <div key={goal.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`goal-${goal.id}`}
                          checked={selectedGoals.includes(goal.id)}
                          onCheckedChange={() => toggleGoal(goal.id)}
                        />
                        <label
                          htmlFor={`goal-${goal.id}`}
                          className="text-sm cursor-pointer flex-1 leading-relaxed"
                        >
                          {goal.goal_description}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({goal.progress_percentage}%)
                          </span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {selectedGoals.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedGoals.length} meta(s) selecionada(s)
                  </p>
                )}
              </div>
            )}

            {/* Atividades Realizadas */}
            <div className="space-y-2">
              <Label>Atividades Realizadas *</Label>
              <Textarea
                {...form.register('activities_performed', { required: status === 'presente' })}
                placeholder="Descreva as atividades realizadas durante o atendimento..."
                rows={4}
              />
            </div>

            {/* Desempenho do Aluno */}
            <div className="space-y-2">
              <Label>Desempenho do Aluno</Label>
              <Textarea
                {...form.register('student_performance')}
                placeholder="Como foi o desempenho do aluno? Conseguiu realizar as atividades?"
                rows={3}
              />
            </div>

            {/* Observações de Comportamento */}
            <div className="space-y-2">
              <Label>Comportamento</Label>
              <Textarea
                {...form.register('behavior_observations')}
                placeholder="Observações sobre o comportamento do aluno durante o atendimento..."
                rows={2}
              />
            </div>

            {/* Observações Gerais */}
            <div className="space-y-2">
              <Label>Observações Gerais</Label>
              <Textarea
                {...form.register('observations')}
                placeholder="Outras observações relevantes, conquistas, desafios..."
                rows={2}
              />
            </div>
          </>
        ) : (
          /* Motivo da Falta/Remarcação */
          <div className="space-y-2">
            <Label>
              {status === 'remarcado'
                ? 'Motivo da Remarcação *'
                : 'Motivo da Falta *'}
            </Label>
            <Textarea
              {...form.register('absence_reason', { required: status !== 'presente' })}
              placeholder={
                status === 'remarcado'
                  ? 'Por que o atendimento foi remarcado?'
                  : 'Descreva o motivo da falta...'
              }
              rows={3}
            />
            {status === 'falta_injustificada' && (
              <p className="text-xs text-amber-600">
                ⚠️ Atenção: 3 faltas injustificadas consecutivas podem resultar em desligamento do
                AEE
              </p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-4">
        <Button
          onClick={handleSubmit}
          disabled={recordAttendance.isPending || hasAttendanceToday}
          className="flex-1"
        >
          <Save className="mr-2 h-4 w-4" />
          {recordAttendance.isPending
            ? 'Salvando...'
            : hasAttendanceToday
            ? 'Já registrado hoje'
            : 'Salvar Registro'}
        </Button>

        {Object.keys(form.formState.dirtyFields).length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              setSelectedGoals([]);
              setStatus('presente');
            }}
          >
            Limpar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}






























