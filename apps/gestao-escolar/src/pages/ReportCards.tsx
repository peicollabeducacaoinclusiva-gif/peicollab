import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { FileText, Download, Plus, Search, Eye } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportCard {
  id: string;
  student_id: string;
  student_name: string;
  academic_year: number;
  bimester: number;
  generated_at: string;
  generated_by_name: string | null;
  pdf_url: string | null;
  sent_to_family_at: string | null;
  viewed_by_family_at: string | null;
}

export default function ReportCards() {
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Filtros
  const [studentFilter] = useState<string>('all');
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  const [bimesterFilter, setBimesterFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Form states
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formBimester, setFormBimester] = useState<string>('');
  
  const { toast } = useToast();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (tenantId || schoolId) {
      loadData();
      loadStudents();
    }
  }, [tenantId, schoolId, studentFilter, academicYear, bimesterFilter]);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, school_id, id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id);
      } else {
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

      if (profile?.id) {
        setUserId(profile.id);
      }
    } catch (error) {
      console.error('Erro ao inicializar:', error);
    }
  }

  async function loadStudents() {
    try {
      if (!schoolId && !tenantId) return;

      const query = supabase
        .from('students')
        .select('id, name')
        .eq('is_active', true);

      if (schoolId) {
        query.eq('school_id', schoolId);
      } else if (tenantId) {
        query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query.order('name').limit(100);

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      if (!tenantId && !schoolId) return;

      let query = supabase
        .from('report_cards')
        .select(`
          *,
          students!report_cards_student_id_fkey(name),
          generated_by_profile:generated_by(full_name)
        `)
        .eq('academic_year', academicYear);

      if (studentFilter !== 'all') {
        query = query.eq('student_id', studentFilter);
      }

      if (bimesterFilter !== 'all') {
        query = query.eq('bimester', parseInt(bimesterFilter));
      }

      const { data, error } = await query.order('generated_at', { ascending: false });

      if (error) {
        // Fallback: buscar sem join se a relação não existir
        console.warn('Erro ao buscar com join, tentando sem relação:', error);
        let fallbackQuery = supabase
          .from('report_cards')
          .select('*')
          .eq('academic_year', academicYear);
        
        if (studentFilter !== 'all') {
          fallbackQuery = fallbackQuery.eq('student_id', studentFilter);
        }
        if (bimesterFilter !== 'all') {
          fallbackQuery = fallbackQuery.eq('bimester', parseInt(bimesterFilter));
        }
        
        const { data: fallbackData, error: fallbackError } = await fallbackQuery.order('generated_at', { ascending: false });
        if (fallbackError) throw fallbackError;
        
        // Buscar nomes separadamente
        const studentIds = [...new Set((fallbackData || []).map((rc: any) => rc.student_id))];
        const { data: studentsData } = await supabase
          .from('students')
          .select('id, name')
          .in('id', studentIds);
        
        const studentsMap = new Map((studentsData || []).map((s: any) => [s.id, s.name]));
        
        setReportCards(
          ((fallbackData || []) as any[]).map(rc => ({
            ...rc,
            student_name: studentsMap.get(rc.student_id) || 'N/A',
            generated_by_name: null, // Buscar separadamente se necessário
          }))
        );
        return;
      }

      setReportCards(
        ((data || []) as any[]).map(rc => ({
          ...rc,
          student_name: (rc.students as any)?.name || 'N/A',
          generated_by_name: (rc.generated_by_profile as any)?.full_name || null,
        }))
      );
    } catch (error: any) {
      console.error('Erro ao carregar boletins:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar boletins',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!formStudentId || !formBimester || !academicYear) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      // Buscar enrollment_id do aluno
      const { data: enrollmentData } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_id', formStudentId)
        .eq('academic_year', academicYear)
        .eq('status', 'active')
        .maybeSingle();

      const { error } = await supabase.rpc('generate_report_card', {
        p_student_id: formStudentId,
        p_academic_year: academicYear,
        p_bimester: parseInt(formBimester),
        p_enrollment_id: enrollmentData?.id || null,
        p_generated_by: userId,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Boletim gerado com sucesso',
      });

      setGenerateDialogOpen(false);
      setFormStudentId('');
      setFormBimester('');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao gerar boletim:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao gerar boletim',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  const filteredReports = reportCards.filter(rc => {
    const matchesSearch = !search || 
      rc.student_name?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Boletins Digitais</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setGenerateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Gerar Boletim
            </Button>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por aluno..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="academicYear">Ano Letivo</Label>
                <Input
                  id="academicYear"
                  type="number"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="bimester">Bimestre</Label>
                <Select value={bimesterFilter} onValueChange={setBimesterFilter}>
                  <SelectTrigger id="bimester">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="1">1º Bimestre</SelectItem>
                    <SelectItem value="2">2º Bimestre</SelectItem>
                    <SelectItem value="3">3º Bimestre</SelectItem>
                    <SelectItem value="4">4º Bimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Boletins */}
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum boletim encontrado
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReports.map(report => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{report.student_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ano Letivo {report.academic_year} • {report.bimester}º Bimestre
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Gerado em {format(new Date(report.generated_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        {report.generated_by_name && ` por ${report.generated_by_name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.sent_to_family_at && (
                        <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          Enviado
                        </Badge>
                      )}
                      {report.viewed_by_family_at && (
                        <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          Visualizado
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      {report.pdf_url ? (
                        <Button
                          variant="outline"
                          onClick={() => window.open(report.pdf_url!, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar PDF
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          PDF ainda não gerado
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setDetailDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Gerar Boletim */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Boletim</DialogTitle>
            <DialogDescription>
              Gere um boletim digital para um aluno
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="formStudent">Aluno *</Label>
              <Select value={formStudentId} onValueChange={setFormStudentId}>
                <SelectTrigger id="formStudent">
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="formAcademicYear">Ano Letivo</Label>
                <Input
                  id="formAcademicYear"
                  type="number"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
                  required
                />
              </div>

              <div>
                <Label htmlFor="formBimester">Bimestre *</Label>
                <Select value={formBimester} onValueChange={setFormBimester}>
                  <SelectTrigger id="formBimester">
                    <SelectValue placeholder="Selecione o bimestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1º Bimestre</SelectItem>
                    <SelectItem value="2">2º Bimestre</SelectItem>
                    <SelectItem value="3">3º Bimestre</SelectItem>
                    <SelectItem value="4">4º Bimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={processing}>
                {processing ? 'Gerando...' : 'Gerar Boletim'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Boletim</DialogTitle>
            <DialogDescription>
              Informações completas do boletim
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Aluno</Label>
                  <p className="text-sm font-medium text-foreground">{selectedReport.student_name}</p>
                </div>
                <div>
                  <Label>Ano Letivo</Label>
                  <p className="text-sm font-medium text-foreground">{selectedReport.academic_year}</p>
                </div>
                <div>
                  <Label>Bimestre</Label>
                  <p className="text-sm font-medium text-foreground">{selectedReport.bimester}º Bimestre</p>
                </div>
                <div>
                  <Label>Gerado em</Label>
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(selectedReport.generated_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {selectedReport.sent_to_family_at && (
                <div>
                  <Label>Enviado para família</Label>
                  <p className="text-sm text-foreground">
                    {format(new Date(selectedReport.sent_to_family_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}

              {selectedReport.viewed_by_family_at && (
                <div>
                  <Label>Visualizado pela família</Label>
                  <p className="text-sm text-foreground">
                    {format(new Date(selectedReport.viewed_by_family_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}

              {selectedReport.pdf_url && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedReport.pdf_url!, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                  <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                    Fechar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

