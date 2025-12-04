import { useState, useEffect } from 'react';
import { Shield, FileText, Download, UserCheck, UserX, Eye, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useUserProfile } from '../hooks/useUserProfile';
import { lgpdService, type DataConsent, type LGPDRequest, type PrivacyPolicy } from '../services/lgpdService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CONSENT_TYPES = {
  data_collection: 'Coleta de Dados',
  data_sharing: 'Compartilhamento de Dados',
  data_processing: 'Processamento de Dados',
  marketing: 'Marketing',
  research: 'Pesquisa',
  photo_video: 'Foto/Video',
};

const REQUEST_TYPES = {
  access: 'Acesso aos Dados',
  rectification: 'Retificação',
  deletion: 'Exclusão',
  portability: 'Portabilidade',
  opposition: 'Oposição',
  restriction: 'Restrição',
};

export default function LGPDManagement() {
  const { data: userProfile } = useUserProfile();

  const [consents, setConsents] = useState<DataConsent[]>([]);
  const [requests, setRequests] = useState<LGPDRequest[]>([]);
  const [policies, setPolicies] = useState<PrivacyPolicy[]>([]);
  const [loading, setLoading] = useState(false);

  const [_consentDialogOpen, _setConsentDialogOpen] = useState(false);
  const [_requestDialogOpen, _setRequestDialogOpen] = useState(false);
  const [_policyDialogOpen, _setPolicyDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [anonymizeDialogOpen, setAnonymizeDialogOpen] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [_selectedRequest, _setSelectedRequest] = useState<LGPDRequest | null>(null);

  useEffect(() => {
    if (userProfile?.tenant_id) {
      loadData();
    }
  }, [userProfile]);

  async function loadData() {
    if (!userProfile?.tenant_id) return;

    try {
      setLoading(true);
      const [consentsData, requestsData, policiesData] = await Promise.all([
        lgpdService.getConsents({}),
        lgpdService.getLGPDRequests({ tenantId: userProfile.tenant_id }),
        lgpdService.getPrivacyPolicies(userProfile.tenant_id),
      ]);

      setConsents(consentsData);
      setRequests(requestsData);
      setPolicies(policiesData);
    } catch (error: any) {
      console.error('Erro ao carregar dados LGPD:', error);
      toast.error('Erro ao carregar dados LGPD');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportData(studentId: string) {
    try {
      const data = await lgpdService.exportPersonalData(studentId);
      
      // Criar arquivo JSON para download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dados_pessoais_${studentId}_${format(new Date(), 'yyyyMMdd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Dados exportados com sucesso');
      setExportDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao exportar dados:', error);
      toast.error(error.message || 'Erro ao exportar dados');
    }
  }

  async function handleAnonymize(studentId: string, reason: string) {
    if (!reason.trim()) {
      toast.error('Informe o motivo da anonimização');
      return;
    }

    if (!confirm('ATENÇÃO: Esta ação é IRREVERSÍVEL. Deseja continuar?')) {
      return;
    }

    try {
      await lgpdService.anonymizeStudentData(studentId, reason);
      toast.success('Dados anonimizados com sucesso');
      setAnonymizeDialogOpen(false);
      await loadData();
    } catch (error: any) {
      console.error('Erro ao anonimizar dados:', error);
      toast.error(error.message || 'Erro ao anonimizar dados');
    }
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };

    const icons: Record<string, any> = {
      pending: Clock,
      in_progress: Clock,
      completed: CheckCircle,
      rejected: XCircle,
      cancelled: XCircle,
    };

    const Icon = icons[status] || Clock;

    return (
      <Badge className={colors[status] || 'bg-gray-100'}>
        <Icon className="h-3 w-3 mr-1" />
        {status === 'pending' ? 'Pendente' :
         status === 'in_progress' ? 'Em Andamento' :
         status === 'completed' ? 'Concluída' :
         status === 'rejected' ? 'Rejeitada' :
         status === 'cancelled' ? 'Cancelada' : status}
      </Badge>
    );
  }

  const appUserProfile = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: (userProfile.tenant as any)?.network_name || null,
    school_name: (userProfile.school as any)?.school_name || null,
  } as any : undefined;

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
            <h1 className="text-3xl font-bold text-foreground">Gestão LGPD</h1>
            <p className="text-muted-foreground mt-1">
              Conformidade com a Lei Geral de Proteção de Dados
            </p>
          </div>
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requests">
              <FileText className="h-4 w-4 mr-2" />
              Solicitações
            </TabsTrigger>
            <TabsTrigger value="consents">
              <UserCheck className="h-4 w-4 mr-2" />
              Consentimentos
            </TabsTrigger>
            <TabsTrigger value="policies">
              <Shield className="h-4 w-4 mr-2" />
              Políticas
            </TabsTrigger>
          </TabsList>

          {/* Aba: Solicitações */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Direitos LGPD</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhuma solicitação encontrada
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Solicitante</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{REQUEST_TYPES[request.request_type as keyof typeof REQUEST_TYPES]}</TableCell>
                          <TableCell>{request.requested_by}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            {format(new Date(request.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                _setSelectedRequest(request);
                                if (request.request_type === 'portability') {
                                  setExportDialogOpen(true);
                                } else if (request.request_type === 'deletion') {
                                  setAnonymizeDialogOpen(true);
                                }
                              }}
                            >
                              {request.request_type === 'portability' ? (
                                <Download className="h-4 w-4 mr-1" />
                              ) : request.request_type === 'deletion' ? (
                                <Trash2 className="h-4 w-4 mr-1" />
                              ) : (
                                <Eye className="h-4 w-4 mr-1" />
                              )}
                              Processar
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

          {/* Aba: Consentimentos */}
          <TabsContent value="consents">
            <Card>
              <CardHeader>
                <CardTitle>Consentimentos de Dados</CardTitle>
              </CardHeader>
              <CardContent>
                {consents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum consentimento registrado
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Método</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consents.map((consent) => (
                        <TableRow key={consent.id}>
                          <TableCell>
                            {CONSENT_TYPES[consent.consent_type as keyof typeof CONSENT_TYPES]}
                          </TableCell>
                          <TableCell>
                            <Badge variant={consent.consent_given && !consent.withdrawn_at ? 'default' : 'secondary'}>
                              {consent.consent_given && !consent.withdrawn_at ? (
                                <UserCheck className="h-3 w-3 mr-1" />
                              ) : (
                                <UserX className="h-3 w-3 mr-1" />
                              )}
                              {consent.consent_given && !consent.withdrawn_at ? 'Ativo' : 'Retirado'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(consent.consent_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {consent.consent_method === 'digital' ? 'Digital' :
                             consent.consent_method === 'paper' ? 'Papel' :
                             consent.consent_method === 'verbal' ? 'Verbal' : consent.consent_method}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Políticas */}
          <TabsContent value="policies">
            <Card>
              <CardHeader>
                <CardTitle>Políticas de Privacidade</CardTitle>
              </CardHeader>
              <CardContent>
                {policies.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhuma política cadastrada
                  </div>
                ) : (
                  <div className="space-y-4">
                    {policies.map((policy) => (
                      <Card key={policy.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>{policy.title}</CardTitle>
                            <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                              {policy.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Versão: {policy.version} | 
                              Vigência: {format(new Date(policy.effective_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                            <p className="text-sm">{policy.content.substring(0, 200)}...</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Exportar Dados */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Dados Pessoais</DialogTitle>
            <DialogDescription>
              Exportar todos os dados pessoais do aluno (Portabilidade)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="exportStudentId">ID do Aluno *</Label>
              <Input
                id="exportStudentId"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                placeholder="UUID do aluno"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => handleExportData(selectedStudentId)}
                disabled={!selectedStudentId}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Anonimizar */}
      <Dialog open={anonymizeDialogOpen} onOpenChange={setAnonymizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anonimizar Dados</DialogTitle>
            <DialogDescription>
              Anonimizar dados do aluno (Direito ao Esquecimento) - AÇÃO IRREVERSÍVEL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="anonymizeStudentId">ID do Aluno *</Label>
              <Input
                id="anonymizeStudentId"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                placeholder="UUID do aluno"
                required
              />
            </div>
            <div>
              <Label htmlFor="anonymizeReason">Motivo *</Label>
              <Textarea
                id="anonymizeReason"
                placeholder="Informe o motivo da anonimização..."
                rows={4}
                required
              />
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">
                <strong>Atenção:</strong> Esta ação é irreversível. Todos os dados pessoais serão anonimizados permanentemente.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAnonymizeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const reason = (document.getElementById('anonymizeReason') as HTMLTextAreaElement)?.value;
                  if (reason) {
                    handleAnonymize(selectedStudentId, reason);
                  }
                }}
                disabled={!selectedStudentId}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Anonimizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



