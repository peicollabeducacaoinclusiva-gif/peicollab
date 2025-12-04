// ============================================================================
// COMPONENTE: ServiceScheduleList
// ============================================================================
// Lista de cronogramas de serviço AEE
// Data: 2025-02-20
// ============================================================================

import { useState } from 'react';
import { useServiceSchedules } from '../../../hooks/useSchedules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';;
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Edit, Trash2, Plus, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ScheduleType, ScheduleStatus } from '../../../types/schedules.types';
import { ServiceScheduleForm } from './ServiceScheduleForm';

interface ServiceScheduleListProps {
  planId: string;
  studentId?: string;
}

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export function ServiceScheduleList({
  planId,
  studentId,
}: ServiceScheduleListProps) {
  const [typeFilter, setTypeFilter] = useState<ScheduleType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ScheduleStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);

  const filters = {
    student_id: studentId,
    schedule_type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };

  const {
    schedules,
    isLoading,
    deleteSchedule,
    isDeleting,
  } = useServiceSchedules(planId, filters);

  const handleEdit = (scheduleId: string) => {
    setEditingSchedule(scheduleId);
    setShowForm(true);
  };

  const handleDelete = async (scheduleId: string) => {
    if (confirm('Tem certeza que deseja remover este cronograma?')) {
      deleteSchedule.mutate(scheduleId);
    }
  };

  const getTypeLabel = (type: ScheduleType) => {
    const labels: Record<ScheduleType, string> = {
      individual_aee: 'AEE Individual',
      group_aee: 'AEE em Grupo',
      co_teaching: 'Co-ensino',
      material_production: 'Produção de Materiais',
      visit: 'Visita',
      assessment: 'Avaliação',
    };
    return labels[type] || type;
  };

  const getStatusBadgeVariant = (status: ScheduleStatus) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: ScheduleStatus) => {
    const labels: Record<ScheduleStatus, string> = {
      active: 'Ativo',
      paused: 'Pausado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  if (showForm) {
    return (
      <ServiceScheduleForm
        planId={planId}
        studentId={studentId}
        scheduleId={editingSchedule || undefined}
        onClose={() => {
          setShowForm(false);
          setEditingSchedule(null);
        }}
        onSuccess={() => {
          setShowForm(false);
          setEditingSchedule(null);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cronogramas de Atendimento AEE</CardTitle>
            <CardDescription>
              Gerencie os horários de atendimento AEE integrados com as grades regulares
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as ScheduleType | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="individual_aee">AEE Individual</SelectItem>
                <SelectItem value="group_aee">AEE em Grupo</SelectItem>
                <SelectItem value="co_teaching">Co-ensino</SelectItem>
                <SelectItem value="material_production">Produção</SelectItem>
                <SelectItem value="visit">Visita</SelectItem>
                <SelectItem value="assessment">Avaliação</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as ScheduleStatus | 'all')
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cronograma
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando cronogramas...
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum cronograma encontrado.
            <br />
            <Button
              variant="link"
              onClick={() => setShowForm(true)}
              className="mt-2"
            >
              Criar primeiro cronograma
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Dia da Semana</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(schedule.schedule_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      {schedule.day_of_week !== undefined
                        ? DAYS_OF_WEEK[schedule.day_of_week]
                        : schedule.class_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {schedule.start_time && schedule.end_time ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {schedule.start_time} - {schedule.end_time}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Vinculado à grade</span>
                      )}
                    </TableCell>
                    <TableCell>{schedule.student_name || 'Grupo'}</TableCell>
                    <TableCell>
                      {schedule.location_specific && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {schedule.location_specific === 'aee_room'
                              ? 'Sala AEE'
                              : schedule.location_specific === 'regular_classroom'
                              ? 'Sala Regular'
                              : schedule.location_specific}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(schedule.status)}>
                        {getStatusLabel(schedule.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(schedule.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(schedule.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


