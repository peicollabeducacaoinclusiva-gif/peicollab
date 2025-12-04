// ============================================================================
// COMPONENTE: MaterialProductionList
// ============================================================================
// Lista de sessões de produção de materiais de acessibilidade
// Data: 2025-02-20
// ============================================================================

import { useState } from 'react';
import { useMaterialProductionSessions } from '../../../hooks/useMaterials';
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
import { Calendar, Clock, Edit, Trash2, Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MaterialType, MaterialProductionStatus } from '../../../types/materials.types';
import { MaterialProductionForm } from './MaterialProductionForm';

interface MaterialProductionListProps {
  planId: string;
  studentId?: string;
}

export function MaterialProductionList({
  planId,
  studentId,
}: MaterialProductionListProps) {
  const [typeFilter, setTypeFilter] = useState<MaterialType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MaterialProductionStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);

  const filters = {
    student_id: studentId,
    material_type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };

  const {
    sessions,
    isLoading,
    deleteSession,
    isDeleting,
  } = useMaterialProductionSessions(planId, filters);

  const handleEdit = (sessionId: string) => {
    setEditingSession(sessionId);
    setShowForm(true);
  };

  const handleDelete = async (sessionId: string) => {
    if (confirm('Tem certeza que deseja remover esta sessão de produção?')) {
      deleteSession.mutate(sessionId);
    }
  };

  const getTypeLabel = (type: MaterialType) => {
    const labels: Record<MaterialType, string> = {
      visual: 'Visual',
      tactile: 'Tátil',
      audio: 'Áudio',
      digital: 'Digital',
      adaptation: 'Adaptação',
      other: 'Outro',
    };
    return labels[type] || type;
  };

  const getStatusBadgeVariant = (status: MaterialProductionStatus) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'planned':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: MaterialProductionStatus) => {
    const labels: Record<MaterialProductionStatus, string> = {
      planned: 'Planejada',
      in_progress: 'Em Produção',
      completed: 'Concluída',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  };

  if (showForm) {
    return (
      <MaterialProductionForm
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
            <CardTitle>Produção de Materiais de Acessibilidade</CardTitle>
            <CardDescription>
              Gerencie as sessões de produção de materiais adaptados
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as MaterialType | 'all')}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="visual">Visual</SelectItem>
                <SelectItem value="tactile">Tátil</SelectItem>
                <SelectItem value="audio">Áudio</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="adaptation">Adaptação</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as MaterialProductionStatus | 'all')
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="planned">Planejadas</SelectItem>
                <SelectItem value="in_progress">Em Produção</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
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
            Nenhuma sessão de produção encontrada.
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
                  <TableHead>Material</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Duração</TableHead>
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
                        {session.file_url && (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{session.material_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(session.material_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {session.duration_minutes} min
                      </div>
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


