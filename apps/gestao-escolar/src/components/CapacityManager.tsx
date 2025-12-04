import { useState, useEffect } from 'react';
import { CheckCircle, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { capacityService, type CapacityAlert } from '../services/capacityService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CapacityManagerProps {
  classId?: string;
  schoolId?: string;
  tenantId?: string;
}

export function CapacityManager({ classId, schoolId, tenantId }: CapacityManagerProps) {
  const [alerts, setAlerts] = useState<CapacityAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [maxCapacity, setMaxCapacity] = useState<string>('');
  const [warningThreshold, setWarningThreshold] = useState<string>('80');

  useEffect(() => {
    loadAlerts();
  }, [classId, schoolId, tenantId]);

  async function loadAlerts() {
    try {
      setLoading(true);
      const alertsData = await capacityService.getCapacityAlerts({
        classId,
        schoolId,
        tenantId,
        acknowledged: false,
      });
      setAlerts(alertsData);
    } catch (error: any) {
      console.error('Erro ao carregar alertas:', error);
      toast.error('Erro ao carregar alertas de capacidade');
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledgeAlert(alertId: string) {
    try {
      await capacityService.acknowledgeAlert(alertId);
      toast.success('Alerta reconhecido');
      await loadAlerts();
    } catch (error: any) {
      console.error('Erro ao reconhecer alerta:', error);
      toast.error(error.message || 'Erro ao reconhecer alerta');
    }
  }

  async function handleSetCapacity() {
    if (!selectedClassId || !maxCapacity) {
      toast.error('Preencha todos os campos');
      return;
    }

    const capacity = parseInt(maxCapacity);
    const threshold = parseInt(warningThreshold);

    if (isNaN(capacity) || capacity <= 0) {
      toast.error('Capacidade deve ser um número positivo');
      return;
    }

    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      toast.error('Limite de alerta deve ser entre 0 e 100');
      return;
    }

    try {
      await capacityService.setClassCapacity(selectedClassId, capacity, threshold);
      toast.success('Capacidade configurada com sucesso');
      setConfigDialogOpen(false);
      setSelectedClassId('');
      setMaxCapacity('');
      setWarningThreshold('80');
      await loadAlerts();
    } catch (error: any) {
      console.error('Erro ao configurar capacidade:', error);
      toast.error(error.message || 'Erro ao configurar capacidade');
    }
  }

  function getAlertBadge(alert: CapacityAlert) {
    const colors: Record<string, string> = {
      over_capacity: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      full: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      near_capacity: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    };

    const labels: Record<string, string> = {
      over_capacity: 'Acima da Capacidade',
      full: 'Lotada',
      near_capacity: 'Próxima da Lotação',
    };

    return (
      <Badge className={colors[alert.alert_type] || 'bg-gray-100'}>
        {labels[alert.alert_type] || alert.alert_type}
      </Badge>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Alertas de Lotação</h3>
        <Button onClick={() => setConfigDialogOpen(true)}>
          <Users className="h-4 w-4 mr-2" />
          Configurar Capacidade
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum alerta de lotação no momento</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Alertas Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turma</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ocupação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => {
                  const percentage = alert.occupation_percentage;
                  return (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">
                        {alert.class_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{getAlertBadge(alert)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{alert.current_enrollments} / {alert.max_capacity}</span>
                            <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
                          </div>
                          <Progress value={Math.min(percentage, 100)} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {percentage >= 100 ? (
                          <Badge variant="destructive">Lotada</Badge>
                        ) : percentage >= 80 ? (
                          <Badge variant="outline" className="border-orange-500 text-orange-700">
                            Próxima da Lotação
                          </Badge>
                        ) : (
                          <Badge variant="outline">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Reconhecer
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Configurar Capacidade */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Capacidade da Turma</DialogTitle>
            <DialogDescription>
              Defina a capacidade máxima e o limite de alerta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="classId">ID da Turma *</Label>
              <Input
                id="classId"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                placeholder="UUID da turma"
                required
              />
            </div>

            <div>
              <Label htmlFor="maxCapacity">Capacidade Máxima *</Label>
              <Input
                id="maxCapacity"
                type="number"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                placeholder="Ex: 30"
                min="1"
                required
              />
            </div>

            <div>
              <Label htmlFor="warningThreshold">Limite de Alerta (%)</Label>
              <Input
                id="warningThreshold"
                type="number"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(e.target.value)}
                placeholder="Ex: 80"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Alerta será gerado quando a ocupação atingir esta porcentagem
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSetCapacity}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


