import { useState, useEffect } from 'react';
import { FileText, Download, User, Database } from 'lucide-react';
import { AppHeader, UserProfile as AppUserProfile } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useUserProfile } from '../hooks/useUserProfile';
import { auditService, type AuditLog, type AccessLog, type AuditHistoryItem } from '../services/auditService';
import { supabase } from '@pei/database';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AUDIT_TABLES = [
  { value: 'students', label: 'Alunos' },
  { value: 'peis', label: 'PEIs' },
  { value: 'enrollments', label: 'Matrículas' },
  { value: 'grades', label: 'Notas' },
  { value: 'attendance', label: 'Frequência' },
  { value: 'classes', label: 'Turmas' },
  { value: 'professionals', label: 'Profissionais' },
  { value: 'certificates', label: 'Certificados' },
];

const AUDIT_ACTIONS = [
  { value: 'INSERT', label: 'Inserção' },
  { value: 'UPDATE', label: 'Atualização' },
  { value: 'DELETE', label: 'Exclusão' },
];

export default function AuditReports() {
  const { data: userProfile } = useUserProfile();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<{ tableName: string; recordId: string } | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);

  // Filtros de auditoria
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Filtros de acesso
  const [accessActionFilter, setAccessActionFilter] = useState<string>('');
  const [accessStartDate, setAccessStartDate] = useState<string>('');
  const [accessEndDate, setAccessEndDate] = useState<string>('');

  useEffect(() => {
    loadAuditLogs();
    loadAccessLogs();
  }, [tableFilter, actionFilter, startDate, endDate, accessActionFilter, accessStartDate, accessEndDate]);

  async function loadAuditLogs() {
    try {
      setLoading(true);
      const logs = await auditService.getAuditLogs({
        tableName: tableFilter !== 'all' ? tableFilter : undefined,
        action: actionFilter !== 'all' ? (actionFilter as any) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
        tenantId: userProfile?.tenant_id || undefined, // Passar tenantId
      });
      setAuditLogs(logs);
    } catch (error: any) {
      console.error('Erro ao carregar logs de auditoria:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  }

  async function loadAccessLogs() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const logs = await auditService.getAccessLogs({
        userId: user?.id,
        action: accessActionFilter || undefined,
        startDate: accessStartDate || undefined,
        endDate: accessEndDate || undefined,
        limit: 100,
      });
      setAccessLogs(logs);
    } catch (error: any) {
      console.error('Erro ao carregar logs de acesso:', error);
      toast.error('Erro ao carregar logs de acesso');
    }
  }

  async function handleViewHistory(tableName: string, recordId: string) {
    try {
      const historyData = await auditService.getAuditHistory(
        tableName,
        recordId,
        50,
        userProfile?.tenant_id || undefined // Passar tenantId
      );
      setHistory(historyData);
      setSelectedRecord({ tableName, recordId });
      setHistoryDialogOpen(true);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico');
    }
  }

  async function handleExportAudit() {
    try {
      const csv = await auditService.exportAuditLogs({
        tableName: tableFilter !== 'all' ? tableFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Logs de auditoria exportados com sucesso');
    } catch (error: any) {
      console.error('Erro ao exportar logs:', error);
      toast.error('Erro ao exportar logs de auditoria');
    }
  }

  function getActionBadge(action: string) {
    const colors: Record<string, string> = {
      INSERT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    return (
      <Badge className={colors[action] || 'bg-gray-100'}>
        {action === 'INSERT' ? 'Inserção' :
         action === 'UPDATE' ? 'Atualização' :
         action === 'DELETE' ? 'Exclusão' : action}
      </Badge>
    );
  }

  const appUserProfile: AppUserProfile | undefined = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: (typeof userProfile.tenant === 'object' && userProfile.tenant !== null && 'network_name' in userProfile.tenant) ? (userProfile.tenant as any).network_name : null,
    school_name: (typeof userProfile.school === 'object' && userProfile.school !== null && 'school_name' in userProfile.school) ? (userProfile.school as any).school_name : null,
  } as AppUserProfile : undefined;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        appName="Gestão Escolar"
        appLogo="/logo.png"
        currentApp="gestao-escolar"
        userProfile={appUserProfile}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios de Auditoria</h1>
            <p className="text-muted-foreground mt-1">
              Visualize e exporte logs de auditoria e acesso do sistema
            </p>
          </div>
          <Button onClick={handleExportAudit}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        <Tabs defaultValue="audit" className="space-y-4">
          <TabsList>
            <TabsTrigger value="audit">
              <Database className="h-4 w-4 mr-2" />
              Auditoria de Dados
            </TabsTrigger>
            <TabsTrigger value="access">
              <User className="h-4 w-4 mr-2" />
              Logs de Acesso
            </TabsTrigger>
          </TabsList>

          {/* Aba: Auditoria */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Auditoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label htmlFor="tableFilter">Tabela</Label>
                    <Select value={tableFilter} onValueChange={setTableFilter}>
                      <SelectTrigger id="tableFilter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {AUDIT_TABLES.map((table) => (
                          <SelectItem key={table.value} value={table.value}>
                            {table.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="actionFilter">Ação</Label>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger id="actionFilter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {AUDIT_ACTIONS.map((action) => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="startDate">Data Inicial</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">Data Final</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum log de auditoria encontrado
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tabela</TableHead>
                        <TableHead>Registro</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Alterado Por</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {format(new Date(log.changed_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium">{log.table_name}</TableCell>
                          <TableCell className="font-mono text-xs">{log.record_id.substring(0, 8)}...</TableCell>
                          <TableCell>{getActionBadge(log.action)}</TableCell>
                          <TableCell>{log.changed_by?.substring(0, 8) || '-'}...</TableCell>
                          <TableCell>{log.ip_address || '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewHistory(log.table_name, log.record_id)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Histórico
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Logs de Acesso */}
          <TabsContent value="access">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Acesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label htmlFor="accessActionFilter">Ação</Label>
                    <Input
                      id="accessActionFilter"
                      value={accessActionFilter}
                      onChange={(e) => setAccessActionFilter(e.target.value)}
                      placeholder="Filtrar por ação..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="accessStartDate">Data Inicial</Label>
                    <Input
                      id="accessStartDate"
                      type="date"
                      value={accessStartDate}
                      onChange={(e) => setAccessStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="accessEndDate">Data Final</Label>
                    <Input
                      id="accessEndDate"
                      type="date"
                      value={accessEndDate}
                      onChange={(e) => setAccessEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {accessLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum log de acesso encontrado
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Recurso</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                          </TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>
                            {log.resource}
                            {log.resource_id && (
                              <span className="text-muted-foreground ml-2">
                                ({log.resource_id.substring(0, 8)}...)
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.success ? 'default' : 'destructive'}>
                              {log.success ? 'Sucesso' : 'Erro'}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.ip_address || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Histórico */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Histórico de Alterações
              {selectedRecord && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {selectedRecord.tableName} - {selectedRecord.recordId.substring(0, 8)}...
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Histórico completo de alterações para este registro
            </DialogDescription>
          </DialogHeader>

          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum histórico encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getActionBadge(item.action)}
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(item.changed_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.changed_by_name || item.changed_by_email || item.changed_by?.substring(0, 8)}
                      </div>
                    </div>
                    {item.old_data && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Dados Anteriores:</p>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(item.old_data, null, 2)}
                        </pre>
                      </div>
                    )}
                    {item.new_data && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Novos Dados:</p>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(item.new_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



