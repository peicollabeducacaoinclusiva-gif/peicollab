// ============================================================================
// COMPONENTE: CoTeachingSessionsList
// ============================================================================
// Lista de sessões de co-ensino com filtros e ações
// Data: 2025-02-20
// ============================================================================

import { useState } from 'react';
import { useCoTeachingSessions } from '../../../hooks/useCoTeaching';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
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
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Users, Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CoTeachingSessionStatus } from '../../../types/coTeaching.types';
import { CoTeachingSessionForm } from './CoTeachingSessionForm';

interface CoTeachingSessionsListProps {
  planId: string;
  studentId?: string;
}

export function CoTeachingSessionsList({
  planId,
  studentId,
}: CoTeachingSessionsListProps) {
  const [statusFilter, setStatusFilter] = useState<CoTeachingSessionStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);

  const filters = {
    student_id: studentId,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };

  const {
    sessions,
    isLoading,
    deleteSession,
    isDeleting,
  } = useCoTeachingSessions(planId, filters);

  const handleEdit = (sessionId: string) => {
    setEditingSession(sessionId);
    setShowForm(true);
  };

  const handleDelete = async (sessionId: string) => {
    if (confirm('Tem certeza que deseja remover esta sessão de co-ensino?')) {
      deleteSession.mutate(sessionId);
    }
  };

  const getStatusBadgeVariant = (status: CoTeachingSessionStatus) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'planned':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      case 'postponed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: CoTeachingSessionStatus) => {
    const labels: Record<CoTeachingSessionStatus, string> = {
      planned: 'Planejada',
      in_progress: 'Em Andamento',
      completed: 'Concluída',
      cancelled: 'Cancelada',
      postponed: 'Adiada',
    };
    return labels[status] || status;
  };

  if (showForm) {
    return (
      <CoTeachingSessionForm
        planId={planId}
        studentId={studentId}
        sessionId={editingSession || undefined}
        onClose={() => {
          setShowForm(false);
          setEditingSession(null);
        }}
        onSuccess={() => {
          setShowForm(false);
          setEditingSession(null);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sessões de Co-ensino</CardTitle>
            <CardDescription>
              Gerencie as sessões de co-ensino entre professor AEE e professor regular
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as CoTeachingSessionStatus | 'all')
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="planned">Planejadas</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="postponed">Adiadas</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Sessão
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando sessões...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma sessão de co-ensino encontrada.
            <br />
            <Button
              variant="link"
              onClick={() => setShowForm(true)}
              className="mt-2"
            >
              Criar primeira sessão
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Professor Regular</TableHead>
                  <TableHead>Professor AEE</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(session.session_date), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {session.start_time} - {session.end_time}
                      </div>
                    </TableCell>
                    <TableCell>{session.student_name || 'N/A'}</TableCell>
                    <TableCell>{session.regular_teacher_name || 'N/A'}</TableCell>
                    <TableCell>{session.aee_teacher_name || 'N/A'}</TableCell>
                    <TableCell>
                      {session.subject_name || session.topic || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(session.status)}>
                        {getStatusLabel(session.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(session.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(session.id)}
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

