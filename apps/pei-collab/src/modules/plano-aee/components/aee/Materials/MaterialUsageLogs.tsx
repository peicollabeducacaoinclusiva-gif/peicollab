// ============================================================================
// COMPONENTE: MaterialUsageLogs
// ============================================================================
// Lista de logs de uso de materiais de acessibilidade
// Data: 2025-02-20
// ============================================================================

import { useState } from 'react';
import { useMaterialUsageLogs } from '../../../hooks/useMaterials';
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
import { Calendar, Star, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MaterialUsageContext } from '../../../types/materials.types';
import { MaterialUsageLogForm } from './MaterialUsageLogForm';

interface MaterialUsageLogsProps {
  planId: string;
  studentId?: string;
}

export function MaterialUsageLogs({ planId, studentId }: MaterialUsageLogsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<string | null>(null);

  const filters = {
    student_id: studentId,
  };

  const { logs, isLoading } = useMaterialUsageLogs(planId, filters);

  const handleEdit = (logId: string) => {
    setEditingLog(logId);
    setShowForm(true);
  };

  const getContextLabel = (context?: MaterialUsageContext) => {
    const labels: Record<MaterialUsageContext, string> = {
      individual_aee: 'AEE Individual',
      group_aee: 'AEE em Grupo',
      co_teaching: 'Co-ensino',
      material_production: 'Produção',
    };
    return context ? labels[context] : 'N/A';
  };

  const getEngagementColor = (engagement?: string) => {
    switch (engagement) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (showForm) {
    return (
      <MaterialUsageLogForm
        planId={planId}
        studentId={studentId}
        logId={editingLog || undefined}
        onClose={() => {
          setShowForm(false);
          setEditingLog(null);
        }}
        onSuccess={() => {
          setShowForm(false);
          setEditingLog(null);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Registro de Uso de Materiais</CardTitle>
            <CardDescription>
              Histórico de uso de materiais de acessibilidade
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Registro
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando registros...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum registro de uso encontrado.
            <br />
            <Button
              variant="link"
              onClick={() => setShowForm(true)}
              className="mt-2"
            >
              Criar primeiro registro
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Contexto</TableHead>
                  <TableHead>Eficácia</TableHead>
                  <TableHead>Engajamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(log.used_date), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{log.material_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getContextLabel(log.context)}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.effectiveness_rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{log.effectiveness_rating}/5</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.student_engagement ? (
                        <Badge variant={getEngagementColor(log.student_engagement)}>
                          {log.student_engagement === 'high'
                            ? 'Alto'
                            : log.student_engagement === 'medium'
                            ? 'Médio'
                            : 'Baixo'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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


