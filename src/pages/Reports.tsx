import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  Download, 
  Calendar,
  Users,
  GraduationCap,
  School,
  TrendingUp,
  FileText,
  Filter,
  RefreshCw,
  Eye,
  Printer
} from 'lucide-react';

interface ReportData {
  id: string;
  name: string;
  description: string;
  type: 'students' | 'peis' | 'schools' | 'networks' | 'general';
  generated_at: string;
  generated_by: string;
  status: 'completed' | 'processing' | 'failed';
  file_url?: string;
  data?: any;
}

interface NetworkStats {
  tenant_id: string;
  network_name: string;
  total_schools: number;
  total_students: number;
  total_peis: number;
  peis_approved: number;
  peis_pending: number;
  peis_draft: number;
  approval_rate: number;
}

interface GlobalStats {
  totalNetworks: number;
  totalSchools: number;
  totalStudents: number;
  totalPEIs: number;
  totalUsers: number;
  activeUsers: number;
  studentsWithPEI: number;
  studentsWithoutPEI: number;
  coveragePercentage: number;
  approvalRate: number;
  peisThisMonth: number;
  peisLastMonth: number;
  growthPercentage: string;
}

export default function Reports() {
  const { toast } = useToast();
  
  const [reports, setReports] = useState<ReportData[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Estados para filtros
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  
  // Estados para modal de geração
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState<string>('general');
  const [reportDescription, setReportDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas das redes
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, network_name, is_active')
        .eq('is_active', true);
      
      if (tenantsError) throw tenantsError;

      const networkStatsData: NetworkStats[] = [];
      
      for (const tenant of tenants || []) {
        // Buscar dados da rede
        const [studentsRes, peisRes, schoolsRes] = await Promise.all([
          supabase.from('students').select('id').eq('tenant_id', tenant.id),
          supabase.from('peis').select('status').eq('tenant_id', tenant.id),
          supabase.from('schools').select('id').eq('tenant_id', tenant.id).eq('is_active', true)
        ]);

        const students = studentsRes.data || [];
        const peis = peisRes.data || [];
        const schools = schoolsRes.data || [];

        const peisApproved = peis.filter(p => p.status === 'approved').length;
        const peisPending = peis.filter(p => p.status === 'pending').length;
        const peisDraft = peis.filter(p => p.status === 'draft').length;
        const approvalRate = peis.length > 0 ? (peisApproved / peis.length) * 100 : 0;

        networkStatsData.push({
          tenant_id: tenant.id,
          network_name: tenant.network_name,
          total_schools: schools.length,
          total_students: students.length,
          total_peis: peis.length,
          peis_approved: peisApproved,
          peis_pending: peisPending,
          peis_draft: peisDraft,
          approval_rate: approvalRate
        });
      }

      setNetworkStats(networkStatsData);

      // Carregar estatísticas globais
      const [totalStudents, totalPEIs, totalUsers, peisRes, studentsRes] = await Promise.all([
        supabase.from('students').select('id').eq('is_active', true),
        supabase.from('peis').select('id, status, created_at'),
        supabase.from('profiles').select('id, is_active, created_at'),
        supabase.from('peis').select('status, created_at'),
        supabase.from('students').select('id').eq('is_active', true)
      ]);

      const students = studentsRes.data || [];
      const peis = peisRes.data || [];
      const users = totalUsers.data || [];
      const allPeis = peisRes.data || [];

      const peisApproved = allPeis.filter(p => p.status === 'approved').length;
      const studentsWithPEI = new Set(peis.map(p => p.student_id)).size;
      const studentsWithoutPEI = students.length - studentsWithPEI;
      const coveragePercentage = students.length > 0 ? (studentsWithPEI / students.length) * 100 : 0;
      const approvalRate = allPeis.length > 0 ? (peisApproved / allPeis.length) * 100 : 0;

      // PEIs deste mês
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const peisThisMonth = allPeis.filter(p => new Date(p.created_at) >= thisMonth).length;
      
      // PEIs do mês passado
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      const nextMonth = new Date();
      nextMonth.setDate(1);
      const peisLastMonth = allPeis.filter(p => {
        const created = new Date(p.created_at);
        return created >= lastMonth && created < nextMonth;
      }).length;

      const growthPercentage = peisLastMonth > 0 
        ? (((peisThisMonth - peisLastMonth) / peisLastMonth) * 100).toFixed(1)
        : '0.0';

      setGlobalStats({
        totalNetworks: networkStatsData.length,
        totalSchools: networkStatsData.reduce((sum, n) => sum + n.total_schools, 0),
        totalStudents: students.length,
        totalPEIs: allPeis.length,
        totalUsers: users.length,
        activeUsers: users.filter(u => u.is_active).length,
        studentsWithPEI,
        studentsWithoutPEI,
        coveragePercentage,
        approvalRate,
        peisThisMonth,
        peisLastMonth: peisLastMonth,
        growthPercentage: `${growthPercentage}%`
      });

      // Simular relatórios existentes
      setReports([
        {
          id: '1',
          name: 'Relatório Geral do Sistema',
          description: 'Visão geral de todos os indicadores do sistema',
          type: 'general',
          generated_at: new Date().toISOString(),
          generated_by: 'Sistema',
          status: 'completed'
        },
        {
          id: '2',
          name: 'Relatório de PEIs por Rede',
          description: 'Distribuição de PEIs por rede de ensino',
          type: 'peis',
          generated_at: new Date(Date.now() - 86400000).toISOString(),
          generated_by: 'Sistema',
          status: 'completed'
        }
      ]);

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      
      if (!reportName.trim()) {
        toast({
          title: "Erro",
          description: "Nome do relatório é obrigatório",
          variant: "destructive",
        });
        return;
      }

      // Simular geração de relatório
      const newReport: ReportData = {
        id: Date.now().toString(),
        name: reportName,
        description: reportDescription,
        type: reportType as any,
        generated_at: new Date().toISOString(),
        generated_by: 'Usuário Atual',
        status: 'processing'
      };

      setReports(prev => [newReport, ...prev]);
      setIsGenerateModalOpen(false);
      setReportName('');
      setReportDescription('');

      // Simular processamento
      setTimeout(() => {
        setReports(prev => prev.map(r => 
          r.id === newReport.id 
            ? { ...r, status: 'completed' as const }
            : r
        ));
        
        toast({
          title: "Relatório gerado com sucesso",
          description: `${newReport.name} foi criado`,
        });
      }, 3000);

      toast({
        title: "Gerando relatório...",
        description: "O relatório está sendo processado",
      });

    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = (report: ReportData) => {
    // Simular download
    const data = {
      report: report,
      generated_at: new Date().toISOString(),
      data: reportType === 'general' ? globalStats : networkStats
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
      case 'processing':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Processando</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'students':
        return <Users className="h-4 w-4" />;
      case 'peis':
        return <GraduationCap className="h-4 w-4" />;
      case 'schools':
        return <School className="h-4 w-4" />;
      case 'networks':
        return <BarChart3 className="h-4 w-4" />;
      case 'general':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'students':
        return 'Alunos';
      case 'peis':
        return 'PEIs';
      case 'schools':
        return 'Escolas';
      case 'networks':
        return 'Redes';
      case 'general':
        return 'Geral';
      default:
        return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando relatórios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Relatórios e Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize e gere relatórios detalhados do sistema PEI Collab
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setIsGenerateModalOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {/* Estatísticas Globais */}
      {globalStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Redes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.totalNetworks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.totalStudents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de PEIs</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.totalPEIs}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.approvalRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estatísticas por Rede */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas por Rede de Ensino</CardTitle>
          <CardDescription>
            Indicadores detalhados de cada rede municipal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rede</TableHead>
                  <TableHead>Escolas</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead>PEIs</TableHead>
                  <TableHead>Aprovados</TableHead>
                  <TableHead>Pendentes</TableHead>
                  <TableHead>Rascunhos</TableHead>
                  <TableHead>Taxa de Aprovação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networkStats.map((network) => (
                  <TableRow key={network.tenant_id}>
                    <TableCell className="font-medium">{network.network_name}</TableCell>
                    <TableCell>{network.total_schools}</TableCell>
                    <TableCell>{network.total_students}</TableCell>
                    <TableCell>{network.total_peis}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-500">
                        {network.peis_approved}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        {network.peis_pending}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {network.peis_draft}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${network.approval_rate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {network.approval_rate.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Relatórios Gerados */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Gerados</CardTitle>
          <CardDescription>
            Histórico de relatórios criados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum relatório encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece gerando seu primeiro relatório
              </p>
              <Button onClick={() => setIsGenerateModalOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Primeiro Relatório
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getTypeIcon(report.type)}
                    <div>
                      <h3 className="font-medium">{report.name}</h3>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                        {getStatusBadge(report.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.generated_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {report.status === 'completed' && (
                      <Button variant="ghost" size="sm" onClick={() => downloadReport(report)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Geração de Relatório */}
      <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Novo Relatório</DialogTitle>
            <DialogDescription>
              Configure os parâmetros do relatório a ser gerado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-name">Nome do Relatório *</Label>
              <Input
                id="report-name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Ex: Relatório Mensal de PEIs"
              />
            </div>
            
            <div>
              <Label htmlFor="report-type">Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Geral</SelectItem>
                  <SelectItem value="students">Alunos</SelectItem>
                  <SelectItem value="peis">PEIs</SelectItem>
                  <SelectItem value="schools">Escolas</SelectItem>
                  <SelectItem value="networks">Redes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="report-description">Descrição</Label>
              <Input
                id="report-description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Descrição opcional do relatório"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={generateReport} disabled={generating}>
              {generating ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
