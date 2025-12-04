import { useState, useEffect } from 'react';
import { Download, TrendingUp, BarChart3, School } from 'lucide-react';
import { AppHeader, UserProfile as AppUserProfile } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSchools } from '../hooks/useStudents';
import { governmentReportsService, type IDEBIndicators, type SAEBReport, type SEDUCReport } from '../services/governmentReportsService';
import { IDEBReport } from '../components/IDEBReport';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GRADE_LEVELS = [
  { value: '1º Ano EF', label: '1º Ano EF' },
  { value: '2º Ano EF', label: '2º Ano EF' },
  { value: '3º Ano EF', label: '3º Ano EF' },
  { value: '4º Ano EF', label: '4º Ano EF' },
  { value: '5º Ano EF', label: '5º Ano EF' },
  { value: '6º Ano EF', label: '6º Ano EF' },
  { value: '7º Ano EF', label: '7º Ano EF' },
  { value: '8º Ano EF', label: '8º Ano EF' },
  { value: '9º Ano EF', label: '9º Ano EF' },
  { value: '1º Ano EM', label: '1º Ano EM' },
  { value: '2º Ano EM', label: '2º Ano EM' },
  { value: '3º Ano EM', label: '3º Ano EM' },
];

export default function GovernmentReports() {
  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');

  const [idebData, setIdebData] = useState<IDEBIndicators | null>(null);
  const [saebData, setSaebData] = useState<SAEBReport | null>(null);
  const [seducData, setSeducData] = useState<SEDUCReport | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('5º Ano EF');
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [reportPeriod, setReportPeriod] = useState<string>(format(new Date(), 'yyyy-MM', { locale: ptBR }));

  const [_idebDialogOpen, _setIdebDialogOpen] = useState(false);
  const [_saebDialogOpen, _setSaebDialogOpen] = useState(false);
  const [_seducDialogOpen, _setSeducDialogOpen] = useState(false);

  useEffect(() => {
    if (userProfile?.school_id) {
      setSelectedSchool(userProfile.school_id);
    }
  }, [userProfile]);

  async function handleCalculateIDEB() {
    if (!selectedSchool) {
      toast.error('Selecione uma escola');
      return;
    }

    try {
      setLoading(true);
      const data = await governmentReportsService.calculateIDEB(
        selectedSchool,
        academicYear,
        selectedGradeLevel
      );
      setIdebData(data);
      _setIdebDialogOpen(true);
    } catch (error: any) {
      console.error('Erro ao calcular IDEB:', error);
      toast.error(error.message || 'Erro ao calcular IDEB');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSAEB() {
    if (!selectedSchool) {
      toast.error('Selecione uma escola');
      return;
    }

    try {
      setLoading(true);
      const data = await governmentReportsService.generateSAEBReport(
        selectedSchool,
        academicYear,
        selectedGradeLevel
      );
      setSaebData(data);
      _setSaebDialogOpen(true);
    } catch (error: any) {
      console.error('Erro ao gerar relatório SAEB:', error);
      toast.error(error.message || 'Erro ao gerar relatório SAEB');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSEDUC() {
    if (!userProfile?.tenant_id) {
      toast.error('Tenant ID não encontrado');
      return;
    }

    try {
      setLoading(true);
      const data = await governmentReportsService.generateSEDUCReport(
        userProfile.tenant_id,
        reportType,
        reportPeriod
      );
      setSeducData(data);
      _setSeducDialogOpen(true);
    } catch (error: any) {
      console.error('Erro ao gerar relatório SEDUC:', error);
      toast.error(error.message || 'Erro ao gerar relatório SEDUC');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(exportFormat: 'xml' | 'txt', reportType: 'ideb' | 'saeb' | 'seduc') {
    try {
      let data: any;
      let content: string;

      if (reportType === 'ideb' && idebData) {
        data = idebData;
        content = exportFormat === 'xml'
          ? await governmentReportsService.exportToXML(data, 'ideb')
          : await governmentReportsService.exportToTXT(data, 'ideb');
      } else if (reportType === 'saeb' && saebData) {
        data = saebData;
        content = exportFormat === 'xml'
          ? await governmentReportsService.exportToXML(data, 'saeb')
          : await governmentReportsService.exportToTXT(data, 'saeb');
      } else if (reportType === 'seduc' && seducData) {
        data = seducData;
        content = exportFormat === 'xml'
          ? await governmentReportsService.exportToXML(data, 'seduc')
          : await governmentReportsService.exportToTXT(data, 'seduc');
      } else {
        toast.error('Gere o relatório primeiro');
        return;
      }

      const blob = new Blob([content], { type: exportFormat === 'xml' ? 'application/xml' : 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = format(new Date(), 'yyyyMMdd');
      link.download = `relatorio_${reportType}_${dateStr}.${exportFormat === 'xml' ? 'xml' : 'txt'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Relatório exportado com sucesso');
    } catch (error: any) {
      console.error('Erro ao exportar relatório:', error);
      toast.error(error.message || 'Erro ao exportar relatório');
    }
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
            <h1 className="text-3xl font-bold text-foreground">Relatórios Governamentais</h1>
            <p className="text-muted-foreground mt-1">
              Gere relatórios oficiais para órgãos governamentais
            </p>
          </div>
        </div>

        <Tabs defaultValue="ideb" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ideb">
              <TrendingUp className="h-4 w-4 mr-2" />
              IDEB
            </TabsTrigger>
            <TabsTrigger value="saeb">
              <BarChart3 className="h-4 w-4 mr-2" />
              SAEB
            </TabsTrigger>
            <TabsTrigger value="seduc">
              <School className="h-4 w-4 mr-2" />
              SEDUC
            </TabsTrigger>
          </TabsList>

          {/* Aba: IDEB */}
          <TabsContent value="ideb">
            <Card>
              <CardHeader>
                <CardTitle>Indicadores IDEB</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="idebSchool">Escola *</Label>
                    <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                      <SelectTrigger id="idebSchool">
                        <SelectValue placeholder="Selecione uma escola" />
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
                    <Label htmlFor="idebGrade">Série *</Label>
                    <Select value={selectedGradeLevel} onValueChange={setSelectedGradeLevel}>
                      <SelectTrigger id="idebGrade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADE_LEVELS.map((grade) => (
                          <SelectItem key={grade.value} value={grade.value}>
                            {grade.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="idebYear">Ano Letivo *</Label>
                    <Input
                      id="idebYear"
                      type="number"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCalculateIDEB} disabled={loading || !selectedSchool}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Calcular IDEB
                  </Button>
                  {idebData && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleExport('xml', 'ideb')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar XML
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleExport('txt', 'ideb')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar TXT
                      </Button>
                    </>
                  )}
                </div>

                {idebData && (
                  <IDEBReport data={idebData} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: SAEB */}
          <TabsContent value="saeb">
            <Card>
              <CardHeader>
                <CardTitle>Relatório SAEB</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="saebSchool">Escola *</Label>
                    <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                      <SelectTrigger id="saebSchool">
                        <SelectValue placeholder="Selecione uma escola" />
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
                    <Label htmlFor="saebGrade">Série *</Label>
                    <Select value={selectedGradeLevel} onValueChange={setSelectedGradeLevel}>
                      <SelectTrigger id="saebGrade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADE_LEVELS.map((grade) => (
                          <SelectItem key={grade.value} value={grade.value}>
                            {grade.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="saebYear">Ano Letivo *</Label>
                    <Input
                      id="saebYear"
                      type="number"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleGenerateSAEB} disabled={loading || !selectedSchool}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Gerar Relatório SAEB
                  </Button>
                  {saebData && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleExport('xml', 'saeb')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar XML
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleExport('txt', 'saeb')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar TXT
                      </Button>
                    </>
                  )}
                </div>

                {saebData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Resultados SAEB</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Média Português</p>
                          <p className="text-2xl font-bold">{saebData.portuguese_average.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Média Matemática</p>
                          <p className="text-2xl font-bold">{saebData.mathematics_average.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Alunos Participantes</p>
                          <p className="text-xl font-semibold">{saebData.students_participated}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: SEDUC */}
          <TabsContent value="seduc">
            <Card>
              <CardHeader>
                <CardTitle>Relatório SEDUC</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="seducType">Tipo de Relatório *</Label>
                    <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                      <SelectTrigger id="seducType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="seducPeriod">Período *</Label>
                    <Input
                      id="seducPeriod"
                      type={reportType === 'monthly' ? 'month' : reportType === 'quarterly' ? 'text' : 'number'}
                      value={reportPeriod}
                      onChange={(e) => setReportPeriod(e.target.value)}
                      placeholder={reportType === 'monthly' ? 'YYYY-MM' : reportType === 'quarterly' ? 'YYYY-Q' : 'YYYY'}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleGenerateSEDUC} disabled={loading || !userProfile?.tenant_id}>
                    <School className="h-4 w-4 mr-2" />
                    Gerar Relatório SEDUC
                  </Button>
                  {seducData && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleExport('xml', 'seduc')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar XML
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleExport('txt', 'seduc')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar TXT
                      </Button>
                    </>
                  )}
                </div>

                {seducData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumo da Rede</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total de Alunos</p>
                          <p className="text-2xl font-bold">{seducData.summary.total_students}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total de Profissionais</p>
                          <p className="text-2xl font-bold">{seducData.summary.total_professionals}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total de Turmas</p>
                          <p className="text-2xl font-bold">{seducData.summary.total_classes}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Média de Frequência</p>
                          <p className="text-2xl font-bold">{seducData.summary.network_average_attendance.toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h3 className="font-semibold mb-2">Por Escola</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Escola</TableHead>
                              <TableHead>Alunos</TableHead>
                              <TableHead>Profissionais</TableHead>
                              <TableHead>Turmas</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {seducData.schools.map((school) => (
                              <TableRow key={school.school_id}>
                                <TableCell>{school.school_name}</TableCell>
                                <TableCell>{school.students_count}</TableCell>
                                <TableCell>{school.professionals_count}</TableCell>
                                <TableCell>{school.classes_count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}



