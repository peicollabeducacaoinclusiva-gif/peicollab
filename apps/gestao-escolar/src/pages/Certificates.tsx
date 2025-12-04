import { useState, useEffect } from 'react';
import { Award, Download, Plus, Search, Eye, Settings } from 'lucide-react';
import { AppHeader, UserProfile as AppUserProfile } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSchools } from '../hooks/useStudents';
import { certificateService, type Certificate, type CertificateTemplate } from '../services/certificateService';
import { supabase } from '@pei/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const CERTIFICATE_TYPES = {
  completion: 'Certificado de Conclusão',
  diploma: 'Diploma',
  school_history: 'Histórico Escolar',
  declaration: 'Declaração Escolar',
};

export default function Certificates() {
  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string; enrollment_id?: string }>>([]);
  const [loading, setLoading] = useState(false);

  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [certificateTypeFilter, setCertificateTypeFilter] = useState<string>('all');
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  const [search, setSearch] = useState('');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  const [formCertificateType, setFormCertificateType] = useState<string>('completion');
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formEnrollmentId, setFormEnrollmentId] = useState<string>('');
  const [formTemplateId, setFormTemplateId] = useState<string>('');
  const [formCustomData, setFormCustomData] = useState<string>('');

  useEffect(() => {
    if (userProfile?.tenant_id) {
      loadCertificates();
      loadTemplates();
    }
  }, [userProfile, selectedSchool, certificateTypeFilter, academicYear]);

  useEffect(() => {
    if (selectedSchool && userProfile?.tenant_id) {
      loadStudents();
    }
  }, [selectedSchool, userProfile, academicYear]);

  async function loadCertificates() {
    if (!userProfile?.tenant_id) return;

    try {
      setLoading(true);
      const data = await certificateService.getCertificates({
        tenantId: userProfile.tenant_id,
        certificateType: certificateTypeFilter !== 'all' ? certificateTypeFilter : undefined,
        academicYear,
      });

      setCertificates((data || []) as unknown as Certificate[]);
    } catch (error: any) {
      console.error('Erro ao carregar certificados:', error);
      toast.error('Erro ao carregar certificados');
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplates() {
    if (!userProfile?.tenant_id) return;

    try {
      const data = await certificateService.getTemplates(
        userProfile.tenant_id,
        userProfile.school_id || undefined
      );
      setTemplates((data || []) as CertificateTemplate[]);
    } catch (error: any) {
      console.error('Erro ao carregar templates:', error);
    }
  }

  async function loadStudents() {
    if (!selectedSchool || !userProfile?.tenant_id) return;

    try {
      const { data: enrollments, error } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          student_id,
          students:student_id(name)
        `)
        .eq('school_id', selectedSchool)
        .eq('academic_year', academicYear)
        .eq('status', 'active');

      if (error) throw error;

      setStudents(
        (enrollments || []).map((e: any) => ({
          id: e.student_id,
          name: e.students?.name || 'N/A',
          enrollment_id: e.id,
        }))
      );
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
    }
  }

  async function handleCreateCertificate() {
    if (!formStudentId || !formEnrollmentId || !userProfile?.tenant_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      await certificateService.createCertificate({
        student_id: formStudentId,
        enrollment_id: formEnrollmentId,
        certificate_type: formCertificateType as any,
        academic_year: academicYear,
        template_id: formTemplateId || undefined,
        custom_data: formCustomData ? JSON.parse(formCustomData) : {},
        issued_by: user.id,
        tenant_id: userProfile.tenant_id,
      });

      toast.success('Certificado criado com sucesso');
      setCreateDialogOpen(false);
      setFormStudentId('');
      setFormEnrollmentId('');
      setFormTemplateId('');
      setFormCustomData('');
      await loadCertificates();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar certificado');
    }
  }

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = !search || 
      (cert as any).students?.name?.toLowerCase().includes(search.toLowerCase()) ||
      cert.certificate_number.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

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
            <h1 className="text-3xl font-bold text-foreground">Certificados e Diplomas</h1>
            <p className="text-muted-foreground mt-1">
              Emita certificados, diplomas, históricos e declarações escolares
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTemplateDialogOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Emitir Certificado
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por aluno ou número do certificado..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="certificateType">Tipo</Label>
                <Select value={certificateTypeFilter} onValueChange={setCertificateTypeFilter}>
                  <SelectTrigger id="certificateType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(CERTIFICATE_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
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

        {/* Lista de Certificados */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando certificados...</p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum certificado encontrado
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCertificates.map((certificate) => (
              <Card key={certificate.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          {CERTIFICATE_TYPES[certificate.certificate_type as keyof typeof CERTIFICATE_TYPES]}
                        </CardTitle>
                        <Badge variant="outline">{certificate.certificate_number}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Aluno: {(certificate as any).students?.name || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Emitido em {format(new Date(certificate.issue_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} • 
                        Ano Letivo {certificate.academic_year}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {certificate.pdf_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(certificate.pdf_url!, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar PDF
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCertificate(certificate);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Criar Certificado */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Emitir Certificado</DialogTitle>
            <DialogDescription>
              Preencha os dados para emitir um novo certificado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="certificateType">Tipo de Certificado *</Label>
              <Select value={formCertificateType} onValueChange={setFormCertificateType}>
                <SelectTrigger id="certificateType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CERTIFICATE_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="school">Escola</Label>
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger id="school">
                  <SelectValue placeholder="Selecione a escola" />
                </SelectTrigger>
                <SelectContent>
                  {schoolsData.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.school_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="student">Aluno *</Label>
              <Select
                value={formStudentId}
                onValueChange={(value) => {
                  setFormStudentId(value);
                  const student = students.find(s => s.id === value);
                  if (student?.enrollment_id) {
                    setFormEnrollmentId(student.enrollment_id);
                  }
                }}
                disabled={!selectedSchool}
              >
                <SelectTrigger id="student">
                  <SelectValue placeholder="Selecione o aluno" />
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

            <div>
              <Label htmlFor="template">Template (Opcional)</Label>
              <Select value={formTemplateId} onValueChange={setFormTemplateId}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Usar template padrão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Template Padrão</SelectItem>
                  {templates
                    .filter(t => t.certificate_type === formCertificateType)
                    .map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCertificate}>
                Emitir Certificado
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualizar Certificado */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCertificate && CERTIFICATE_TYPES[selectedCertificate.certificate_type as keyof typeof CERTIFICATE_TYPES]}
            </DialogTitle>
            <DialogDescription>
              Número: {selectedCertificate?.certificate_number}
            </DialogDescription>
          </DialogHeader>
          {selectedCertificate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Aluno</Label>
                  <p className="font-semibold">{(selectedCertificate as any).students?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label>Data de Emissão</Label>
                  <p className="font-semibold">
                    {format(new Date(selectedCertificate.issue_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <Label>Ano Letivo</Label>
                  <p className="font-semibold">{selectedCertificate.academic_year}</p>
                </div>
                <div>
                  <Label>Emitido por</Label>
                  <p className="font-semibold">
                    {(selectedCertificate as any).issued_by_profile?.full_name || 'N/A'}
                  </p>
                </div>
              </div>
              {selectedCertificate.pdf_url && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => window.open(selectedCertificate.pdf_url!, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Templates */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Templates</DialogTitle>
            <DialogDescription>
              Configure templates personalizados para certificados
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {templates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum template cadastrado. Use o template padrão do sistema.
              </p>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.template_name}</CardTitle>
                        <Badge>{CERTIFICATE_TYPES[template.certificate_type as keyof typeof CERTIFICATE_TYPES]}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {template.template_content.substring(0, 200)}...
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

