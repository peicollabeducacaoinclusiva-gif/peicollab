import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Search, Filter, ChevronRight, Building2, Users, Target } from 'lucide-react';
import { inclusionIndicatorsService, SchoolIndicators, DrilldownData } from '@/services/inclusionIndicatorsService';
import { toast } from 'sonner';

interface MultiSchoolDashboardProps {
  tenantId: string;
}

export function MultiSchoolDashboard({ tenantId }: MultiSchoolDashboardProps) {
  const [schools, setSchools] = useState<SchoolIndicators[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [drilldownData, setDrilldownData] = useState<DrilldownData | null>(null);
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');

  useEffect(() => {
    loadSchools();
  }, [tenantId]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const data = await inclusionIndicatorsService.getSchoolIndicators(tenantId);
      setSchools(data);
    } catch (error) {
      toast.error('Erro ao carregar escolas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrilldown = async (schoolId: string) => {
    try {
      const data = await inclusionIndicatorsService.getDrilldownData(tenantId, schoolId);
      setDrilldownData(data);
      setSelectedSchool(schoolId);
      setDrilldownOpen(true);
    } catch (error) {
      toast.error('Erro ao carregar detalhes');
      console.error(error);
    }
  };

  const handleExport = async () => {
    try {
      const data = await inclusionIndicatorsService.exportInclusionData(
        tenantId,
        undefined,
        exportFormat,
        true
      );
      
      // Converter para CSV/Excel (simplificado)
      const csv = convertToCSV(data.data || []);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `indicadores_inclusao_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Exportação realizada com sucesso');
    } catch (error) {
      toast.error('Erro ao exportar dados');
      console.error(error);
    }
  };

  const convertToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(item => 
      headers.map(header => {
        const value = item[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  };

  const filteredSchools = schools.filter(school =>
    school.school_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Painel Multi-Escola</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Painel Multi-Escola
            </CardTitle>
            <CardDescription>
              Visão consolidada de todas as escolas da rede
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'excel')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar escola..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Tabela de Escolas */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Escola</TableHead>
                <TableHead className="text-right">Estudantes</TableHead>
                <TableHead className="text-right">Com PEI</TableHead>
                <TableHead className="text-right">Com AEE</TableHead>
                <TableHead className="text-right">Frequência Média</TableHead>
                <TableHead className="text-right">Frequência Baixa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma escola encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchools.map((school) => (
                  <TableRow key={school.school_id}>
                    <TableCell className="font-medium">{school.school_name}</TableCell>
                    <TableCell className="text-right">{school.total_students}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{school.students_with_pei}</span>
                        <Badge variant="outline" className="text-xs">
                          {school.total_students > 0
                            ? Math.round((school.students_with_pei / school.total_students) * 100)
                            : 0}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{school.students_with_aee}</span>
                        <Badge variant="outline" className="text-xs">
                          {school.total_students > 0
                            ? Math.round((school.students_with_aee / school.total_students) * 100)
                            : 0}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          school.average_attendance_rate >= 90
                            ? 'default'
                            : school.average_attendance_rate >= 75
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {school.average_attendance_rate?.toFixed(1) || 0}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {school.students_low_attendance > 0 ? (
                        <Badge variant="destructive">{school.students_low_attendance}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDrilldown(school.school_id)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dialog de Drilldown */}
        <Dialog open={drilldownOpen} onOpenChange={setDrilldownOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Escola</DialogTitle>
              <DialogDescription>
                Informações detalhadas e drilldown até aluno/turma
              </DialogDescription>
            </DialogHeader>
            {drilldownData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-xs text-muted-foreground mb-1">Estudantes</p>
                    <p className="text-xl font-bold">{drilldownData.students_count || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-xs text-muted-foreground mb-1">Com PEI</p>
                    <p className="text-xl font-bold">{drilldownData.students_with_pei || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-xs text-muted-foreground mb-1">Com AEE</p>
                    <p className="text-xl font-bold">{drilldownData.students_with_aee || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-xs text-muted-foreground mb-1">Cobertura PEI</p>
                    <p className="text-xl font-bold">{drilldownData.pei_coverage?.toFixed(1) || 0}%</p>
                  </div>
                </div>

                {drilldownData.classes && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Turmas</h4>
                    <p className="text-sm text-muted-foreground">
                      {drilldownData.classes_count || 0} turmas cadastradas
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

