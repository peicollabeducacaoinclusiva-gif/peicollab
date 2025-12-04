import { useState, useEffect } from 'react';
import { FileText, Plus, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
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
import { useSchools } from '../hooks/useStudents';
import { documentService, type OfficialDocument, type DocumentType } from '../services/documentService';
import { supabase } from '@pei/database';
import { DocumentGenerator } from '../components/DocumentGenerator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  declaracao_escolar: 'Declaração Escolar',
  historico_escolar: 'Histórico Escolar',
  certificado_conclusao: 'Certificado de Conclusão',
  diploma: 'Diploma',
  atestado_frequencia: 'Atestado de Frequência',
  declaracao_transferencia: 'Declaração de Transferência',
  declaracao_vinculo: 'Declaração de Vínculo',
};

export default function Documents() {
  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');

  const [documents, setDocuments] = useState<OfficialDocument[]>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  const [_search, _setSearch] = useState('');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<OfficialDocument | null>(null);

  useEffect(() => {
    if (userProfile?.tenant_id) {
      loadDocuments();
    }
  }, [userProfile, selectedSchool, documentTypeFilter, statusFilter, academicYear]);

  useEffect(() => {
    if (selectedSchool && userProfile?.tenant_id) {
      loadStudents();
    }
  }, [selectedSchool, userProfile, academicYear]);

  async function loadDocuments() {
    if (!userProfile?.tenant_id) return;

    try {
      setLoading(true);
      const data = await documentService.getDocuments({
        tenantId: userProfile.tenant_id,
        schoolId: selectedSchool || undefined,
        studentId: selectedStudent || undefined,
        documentType: documentTypeFilter !== 'all' ? (documentTypeFilter as DocumentType) : undefined,
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
        academicYear,
      });

      setDocuments(data);
    } catch (error: any) {
      console.error('Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents() {
    if (!selectedSchool || !userProfile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name')
        .eq('school_id', selectedSchool)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
    }
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      issued: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    };

    const icons: Record<string, any> = {
      draft: FileText,
      pending_approval: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      issued: CheckCircle,
    };

    const Icon = icons[status] || FileText;

    return (
      <Badge className={colors[status] || 'bg-gray-100'}>
        <Icon className="h-3 w-3 mr-1" />
        {status === 'draft' ? 'Rascunho' :
         status === 'pending_approval' ? 'Aguardando Aprovação' :
         status === 'approved' ? 'Aprovado' :
         status === 'rejected' ? 'Rejeitado' :
         status === 'issued' ? 'Emitido' : status}
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
            <h1 className="text-3xl font-bold text-foreground">Documentos Oficiais</h1>
            <p className="text-muted-foreground mt-1">
              Gere e gerencie documentos escolares oficiais
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Documento
          </Button>
        </div>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">
              <FileText className="h-4 w-4 mr-2" />
              Lista de Documentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="schoolFilter">Escola</Label>
                    <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                      <SelectTrigger id="schoolFilter">
                        <SelectValue placeholder="Todas as escolas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        {schoolsData.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.school_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="typeFilter">Tipo</Label>
                    <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                      <SelectTrigger id="typeFilter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="statusFilter">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="statusFilter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="rejected">Rejeitado</SelectItem>
                        <SelectItem value="issued">Emitido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="academicYear">Ano Letivo</Label>
                    <Input
                      id="academicYear"
                      type="number"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum documento encontrado
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead>Código de Verificação</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.student_id.substring(0, 8)}...</TableCell>
                          <TableCell>{DOCUMENT_TYPE_LABELS[doc.document_type]}</TableCell>
                          <TableCell>{getStatusBadge(doc.status)}</TableCell>
                          <TableCell>
                            {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {doc.verification_code ? (
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {doc.verification_code}
                              </code>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDocument(doc);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
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
        </Tabs>
      </div>

      {/* Dialog: Criar Documento */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Documento</DialogTitle>
            <DialogDescription>
              Selecione o aluno e gere o documento oficial
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && userProfile && (
            <DocumentGenerator
              studentId={selectedStudent}
              schoolId={selectedSchool || userProfile.school_id || ''}
              tenantId={userProfile.tenant_id || ''}
              onDocumentGenerated={(_doc) => {
                setCreateDialogOpen(false);
                setSelectedStudent('');
                loadDocuments();
              }}
            />
          )}
          {!selectedStudent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="studentSelect">Aluno *</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger id="studentSelect">
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Visualizar Documento */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument && DOCUMENT_TYPE_LABELS[selectedDocument.document_type]}
            </DialogTitle>
            <DialogDescription>
              Detalhes do documento
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{getStatusBadge(selectedDocument.status)}</p>
                </div>
                {selectedDocument.verification_code && (
                  <div>
                    <p className="text-sm text-muted-foreground">Código de Verificação</p>
                    <p className="font-mono font-medium">{selectedDocument.verification_code}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Conteúdo</p>
                <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                  {JSON.stringify(selectedDocument.content, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



