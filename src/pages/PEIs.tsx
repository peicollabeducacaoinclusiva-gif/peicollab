import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  GraduationCap, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Eye,
  FileText,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface PEI {
  id: string;
  student_id: string;
  status: 'draft' | 'pending' | 'approved' | 'returned';
  version_number: number;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  school_id: string | null;
}

interface Student {
  id: string;
  name: string;
  student_id: string | null;
  class_name: string | null;
}

interface School {
  id: string;
  school_name: string;
  tenant_id: string;
}

interface Tenant {
  id: string;
  network_name: string;
}

export default function PEIs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [peis, setPeis] = useState<PEI[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  
  // Estados para modal de detalhes
  const [selectedPEI, setSelectedPEI] = useState<PEI | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar PEIs
      const { data: peisData, error: peisError } = await supabase
        .from('peis')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (peisError) throw peisError;
      setPeis(peisData || []);

      // Carregar estudantes
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, student_id, class_name')
        .eq('is_active', true);
      
      if (studentsError) {
        console.warn('Erro ao carregar estudantes:', studentsError);
        setStudents([]);
      } else {
        setStudents(studentsData || []);
      }

      // Carregar escolas
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('id, school_name, tenant_id')
        .eq('is_active', true);
      
      if (schoolsError) {
        console.warn('Erro ao carregar escolas:', schoolsError);
        setSchools([]);
      } else {
        setSchools(schoolsData || []);
      }

      // Carregar redes
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, network_name')
        .eq('is_active', true);
      
      if (tenantsError) {
        console.warn('Erro ao carregar redes:', tenantsError);
        setTenants([]);
      } else {
        setTenants(tenantsData || []);
      }

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

  const getFilteredPEIs = () => {
    return peis.filter(pei => {
      const student = students.find(s => s.id === pei.student_id);
      const matchesSearch = !searchTerm || 
                           (student && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (student && student.student_id && student.student_id.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = selectedStatus === 'all' || pei.status === selectedStatus;
      const matchesTenant = selectedTenant === 'all' || pei.tenant_id === selectedTenant;
      const matchesSchool = selectedSchool === 'all' || pei.school_id === selectedSchool;
      
      return matchesSearch && matchesStatus && matchesTenant && matchesSchool;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'returned':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Rascunho</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendente</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Aprovado</Badge>;
      case 'returned':
        return <Badge variant="destructive">Retornado</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Aluno não encontrado';
  };

  const getStudentId = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.student_id || '-';
  };

  const getSchoolName = (schoolId: string | null) => {
    if (!schoolId) return 'Não definida';
    const school = schools.find(s => s.id === schoolId);
    return school?.school_name || 'Escola não encontrada';
  };

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant?.network_name || 'Rede não encontrada';
  };

  const openDetailsModal = (pei: PEI) => {
    setSelectedPEI(pei);
    setIsDetailsModalOpen(true);
  };

  const getStatusStats = () => {
    const total = peis.length;
    const draft = peis.filter(p => p.status === 'draft').length;
    const pending = peis.filter(p => p.status === 'pending').length;
    const approved = peis.filter(p => p.status === 'approved').length;
    const returned = peis.filter(p => p.status === 'returned').length;

    return { total, draft, pending, approved, returned };
  };

  const stats = getStatusStats();
  const filteredPEIs = getFilteredPEIs();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando PEIs...</p>
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
            <GraduationCap className="h-8 w-8" />
            Gerenciamento de PEIs
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os Planos Educacionais Individuais do sistema
          </p>
        </div>
        <Button onClick={() => navigate('/pei/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo PEI
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de PEIs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retornados</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.returned}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou ID do aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="returned">Retornado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tenant">Rede de Ensino</Label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as redes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as redes</SelectItem>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.network_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="school">Escola</Label>
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as escolas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as escolas</SelectItem>
                  {schools.map(school => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.school_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de PEIs */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de PEIs ({filteredPEIs.length})</CardTitle>
          <CardDescription>
            {filteredPEIs.length === peis.length 
              ? 'Todos os PEIs do sistema'
              : `${filteredPEIs.length} de ${peis.length} PEIs`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPEIs.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum PEI encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedStatus !== 'all' || selectedTenant !== 'all' || selectedSchool !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando um novo PEI'
                }
              </p>
              {!searchTerm && selectedStatus === 'all' && selectedTenant === 'all' && selectedSchool === 'all' && (
                <Button onClick={() => navigate('/pei/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro PEI
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>ID do Aluno</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Escola</TableHead>
                    <TableHead>Rede</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Atualizado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPEIs.map((pei) => (
                    <TableRow key={pei.id}>
                      <TableCell className="font-medium">
                        {getStudentName(pei.student_id)}
                      </TableCell>
                      <TableCell>{getStudentId(pei.student_id)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(pei.status)}
                          {getStatusBadge(pei.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">v{pei.version_number}</Badge>
                      </TableCell>
                      <TableCell>{getSchoolName(pei.school_id)}</TableCell>
                      <TableCell>{getTenantName(pei.tenant_id)}</TableCell>
                      <TableCell>
                        {new Date(pei.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {new Date(pei.updated_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailsModal(pei)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/pei/edit?peiId=${pei.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPEI && getStatusIcon(selectedPEI.status)}
              Detalhes do PEI
            </DialogTitle>
            <DialogDescription>
              Informações completas do Plano Educacional Individual
            </DialogDescription>
          </DialogHeader>
          
          {selectedPEI && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Aluno</Label>
                  <p className="text-lg font-semibold">{getStudentName(selectedPEI.student_id)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">ID do Aluno</Label>
                  <p className="text-lg">{getStudentId(selectedPEI.student_id)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedPEI.status)}
                    {getStatusBadge(selectedPEI.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Versão</Label>
                  <p className="text-lg">v{selectedPEI.version_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Escola</Label>
                  <p className="text-lg">{getSchoolName(selectedPEI.school_id)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Rede de Ensino</Label>
                  <p className="text-lg">{getTenantName(selectedPEI.tenant_id)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Criado em</Label>
                  <p className="text-lg">{new Date(selectedPEI.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Atualizado em</Label>
                  <p className="text-lg">{new Date(selectedPEI.updated_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                    Fechar
                  </Button>
                  <Button onClick={() => {
                    setIsDetailsModalOpen(false);
                    navigate(`/pei/edit?peiId=${selectedPEI.id}`);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar PEI
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
