import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { Search, CheckCircle, XCircle, Download } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge, Textarea } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { useToast } from '@/components/ui/use-toast';
import { formatTimestampForFilename, downloadTextFile } from '@pei/ui';

interface EnrollmentRequest {
  id: string;
  student_id: string | null;
  student_name: string | null;
  school_id: string;
  school_name: string;
  tenant_id: string;
  request_type: 'pre_matricula' | 'rematricula' | 'transferencia';
  status: 'pendente' | 'em_analise' | 'aprovada' | 'rejeitada' | 'cancelada';
  academic_year: number;
  requested_class_id: string | null;
  requested_grade: string | null;
  requested_class_name: string | null;
  requested_shift: string | null;
  requested_by_name: string | null;
  requested_by_cpf: string | null;
  requested_by_relationship: string | null;
  rejection_reason: string | null;
  rejection_details: string | null;
  approved_at: string | null;
  approved_by_name: string | null;
  rejected_at: string | null;
  rejected_by_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const requestTypeLabels: Record<string, string> = {
  pre_matricula: 'Pré-Matrícula',
  rematricula: 'Rematrícula',
  transferencia: 'Transferência',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  cancelada: 'Cancelada',
};

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  em_analise: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  aprovada: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
  rejeitada: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  cancelada: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800',
};

export default function Enrollments() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [_schoolId, setSchoolId] = useState<string | null>(null);
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([]);
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  
  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EnrollmentRequest | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionDetails, setRejectionDetails] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (tenantId) {
      loadRequests();
    }
  }, [tenantId, schoolFilter, statusFilter, typeFilter, academicYear]);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar tenant_id e school_id do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, school_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id);
      } else {
        // Fallback para user_tenants
        const { data: userTenant } = await supabase
          .from('user_tenants')
          .select('tenant_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (userTenant) {
          setTenantId(userTenant.tenant_id);
        }
      }

      if (profile?.school_id) {
        setSchoolId(profile.school_id);
      }

      // Carregar escolas para filtro
      await loadSchools();
    } catch (error) {
      console.error('Erro ao inicializar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados iniciais',
        variant: 'destructive',
      });
    }
  }

  async function loadSchools() {
    try {
      if (!tenantId) return;

      const { data, error } = await supabase
        .from('schools')
        .select('id, school_name')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('school_name');

      if (error) throw error;

      setSchools((data?.map(s => ({ id: s.id, name: s.school_name || '' })) || []) as Array<{ id: string; name: string }>);
    } catch (error) {
      console.error('Erro ao carregar escolas:', error);
    }
  }

  async function loadRequests() {
    try {
      setLoading(true);
      if (!tenantId) return;

      const { data, error } = await supabase.rpc('get_enrollment_requests', {
        p_school_id: schoolFilter === 'all' ? null : schoolFilter,
        p_tenant_id: tenantId,
        p_status: statusFilter === 'all' ? null : statusFilter,
        p_academic_year: academicYear,
        p_request_type: typeFilter === 'all' ? null : typeFilter,
        p_limit: 100,
        p_offset: 0,
      });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar solicitações de matrícula',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!selectedRequest) return;

    try {
      setProcessing(true);

      const { error } = await supabase.rpc('approve_enrollment_request', {
        p_request_id: selectedRequest.id,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Solicitação aprovada e matrícula criada com sucesso',
      });

      setApproveDialogOpen(false);
      setSelectedRequest(null);
      await loadRequests();
    } catch (error: any) {
      console.error('Erro ao aprovar solicitação:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao aprovar solicitação',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast({
        title: 'Atenção',
        description: 'Informe o motivo da rejeição',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      const { error } = await supabase.rpc('reject_enrollment_request', {
        p_request_id: selectedRequest.id,
        p_rejection_reason: rejectionReason,
        p_rejection_details: rejectionDetails || null,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Solicitação rejeitada',
      });

      setRejectDialogOpen(false);
      setRejectionReason('');
      setRejectionDetails('');
      setSelectedRequest(null);
      await loadRequests();
    } catch (error: any) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao rejeitar solicitação',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  async function exportCSV() {
    try {
      const filtered = requests.filter(r => {
        const matchesSearch = !search || 
          r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
          r.requested_by_name?.toLowerCase().includes(search.toLowerCase()) ||
          r.school_name?.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
      });

      const headers = [
        'ID',
        'Aluno',
        'Escola',
        'Tipo',
        'Status',
        'Ano Letivo',
        'Série',
        'Turma',
        'Turno',
        'Solicitado Por',
        'CPF',
        'Parentesco',
        'Data Solicitação',
        'Data Aprovação',
        'Data Rejeição',
        'Motivo Rejeição',
      ];

      const rows = filtered.map(r => [
        r.id,
        r.student_name || 'N/A',
        r.school_name,
        requestTypeLabels[r.request_type],
        statusLabels[r.status],
        r.academic_year.toString(),
        r.requested_grade || 'N/A',
        r.requested_class_name || 'N/A',
        r.requested_shift || 'N/A',
        r.requested_by_name || 'N/A',
        r.requested_by_cpf || 'N/A',
        r.requested_by_relationship || 'N/A',
        new Date(r.created_at).toLocaleString('pt-BR'),
        r.approved_at ? new Date(r.approved_at).toLocaleString('pt-BR') : 'N/A',
        r.rejected_at ? new Date(r.rejected_at).toLocaleString('pt-BR') : 'N/A',
        r.rejection_reason || 'N/A',
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const filename = `solicitacoes_matricula_${formatTimestampForFilename()}.csv`;
      downloadTextFile(csv, filename, 'text/csv');

      toast({
        title: 'Sucesso',
        description: 'Arquivo CSV exportado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao exportar CSV',
        variant: 'destructive',
      });
    }
  }

  const filteredRequests = requests.filter(r => {
    const matchesSearch = !search || 
      r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.requested_by_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.school_name?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const pendingCount = requests.filter(r => r.status === 'pendente' || r.status === 'em_analise').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">Solicitações de Matrícula</h1>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-sm">
                {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por aluno, responsável ou escola..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as escolas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as escolas</SelectItem>
                  {schools.map(school => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="pre_matricula">Pré-Matrícula</SelectItem>
                  <SelectItem value="rematricula">Rematrícula</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="academicYear">Ano Letivo:</Label>
                <Input
                  id="academicYear"
                  type="number"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-24"
                />
              </div>

              <Button onClick={exportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Solicitações */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma solicitação encontrada
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map(request => (
              <Card 
                key={request.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedRequest(request);
                  setDetailDialogOpen(true);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {request.student_name || 'Novo Aluno'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.school_name}
                      </p>
                    </div>
                    <Badge className={statusColors[request.status]}>
                      {statusLabels[request.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{requestTypeLabels[request.request_type]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ano Letivo:</span>
                      <span className="font-medium">{request.academic_year}</span>
                    </div>
                    {request.requested_grade && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Série:</span>
                        <span className="font-medium">{request.requested_grade}</span>
                      </div>
                    )}
                    {request.requested_by_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Solicitado por:</span>
                        <span className="font-medium">{request.requested_by_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data:</span>
                      <span className="font-medium">
                        {new Date(request.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Detalhes */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
            <DialogDescription>
              Informações completas da solicitação de matrícula
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Badge className={statusColors[selectedRequest.status]}>
                    {statusLabels[selectedRequest.status]}
                  </Badge>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <p className="text-sm font-medium">{requestTypeLabels[selectedRequest.request_type]}</p>
                </div>
                <div>
                  <Label>Aluno</Label>
                  <p className="text-sm font-medium">{selectedRequest.student_name || 'Novo Aluno'}</p>
                </div>
                <div>
                  <Label>Escola</Label>
                  <p className="text-sm font-medium">{selectedRequest.school_name}</p>
                </div>
                <div>
                  <Label>Ano Letivo</Label>
                  <p className="text-sm font-medium">{selectedRequest.academic_year}</p>
                </div>
                {selectedRequest.requested_grade && (
                  <div>
                    <Label>Série</Label>
                    <p className="text-sm font-medium">{selectedRequest.requested_grade}</p>
                  </div>
                )}
                {selectedRequest.requested_class_name && (
                  <div>
                    <Label>Turma</Label>
                    <p className="text-sm font-medium">{selectedRequest.requested_class_name}</p>
                  </div>
                )}
                {selectedRequest.requested_shift && (
                  <div>
                    <Label>Turno</Label>
                    <p className="text-sm font-medium">{selectedRequest.requested_shift}</p>
                  </div>
                )}
                {selectedRequest.requested_by_name && (
                  <div>
                    <Label>Solicitado Por</Label>
                    <p className="text-sm font-medium">{selectedRequest.requested_by_name}</p>
                  </div>
                )}
                {selectedRequest.requested_by_relationship && (
                  <div>
                    <Label>Parentesco</Label>
                    <p className="text-sm font-medium">{selectedRequest.requested_by_relationship}</p>
                  </div>
                )}
              </div>

              {selectedRequest.notes && (
                <div>
                  <Label>Observações</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.rejection_reason && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <Label className="text-red-800 dark:text-red-300">Motivo da Rejeição</Label>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    {selectedRequest.rejection_reason}
                  </p>
                  {selectedRequest.rejection_details && (
                    <p className="text-sm text-red-600 dark:text-red-500 mt-2">
                      {selectedRequest.rejection_details}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                {(selectedRequest.status === 'pendente' || selectedRequest.status === 'em_analise') && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDetailDialogOpen(false);
                        setRejectDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button
                      onClick={() => {
                        setDetailDialogOpen(false);
                        setApproveDialogOpen(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Aprovação */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Solicitação</DialogTitle>
            <DialogDescription>
              Ao aprovar, uma matrícula será criada automaticamente. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing ? 'Processando...' : 'Confirmar Aprovação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. Este motivo será comunicado ao solicitante.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="rejectionReason">Motivo da Rejeição *</Label>
              <Input
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Documentação incompleta"
              />
            </div>
            <div>
              <Label htmlFor="rejectionDetails">Detalhes (opcional)</Label>
              <Textarea
                id="rejectionDetails"
                value={rejectionDetails}
                onChange={(e) => setRejectionDetails(e.target.value)}
                placeholder="Informações adicionais sobre a rejeição"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason('');
                setRejectionDetails('');
              }}>
                Cancelar
              </Button>
              <Button onClick={handleReject} disabled={processing || !rejectionReason.trim()}>
                {processing ? 'Processando...' : 'Confirmar Rejeição'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

