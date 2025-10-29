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
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  GraduationCap,
  Calendar,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  UserX
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  student_id: string | null;
  class_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  school_id: string | null;
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

export default function Students() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Estados para modal de criação/edição
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    class_name: '',
    school_id: '',
    tenant_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar estudantes
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

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

  const getFilteredStudents = () => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (student.student_id && student.student_id.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTenant = selectedTenant === 'all' || student.tenant_id === selectedTenant;
      const matchesSchool = selectedSchool === 'all' || student.school_id === selectedSchool;
      const matchesStatus = selectedStatus === 'all' || 
                           (selectedStatus === 'active' && student.is_active) ||
                           (selectedStatus === 'inactive' && !student.is_active);
      
      return matchesSearch && matchesTenant && matchesSchool && matchesStatus;
    });
  };

  const handleCreateStudent = async () => {
    try {
      setCreating(true);
      
      if (!formData.name.trim()) {
        toast({
          title: "Erro",
          description: "Nome do aluno é obrigatório",
          variant: "destructive",
        });
        return;
      }

      if (!formData.tenant_id) {
        toast({
          title: "Erro",
          description: "Rede de ensino é obrigatória",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('students')
        .insert({
          name: formData.name.trim(),
          student_id: formData.student_id.trim() || null,
          class_name: formData.class_name.trim() || null,
          school_id: formData.school_id || null,
          tenant_id: formData.tenant_id,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => [data, ...prev]);
      setIsCreateModalOpen(false);
      resetForm();
      
      toast({
        title: "Aluno criado com sucesso",
        description: `${data.name} foi adicionado ao sistema`,
      });

    } catch (error: any) {
      console.error('Erro ao criar aluno:', error);
      toast({
        title: "Erro ao criar aluno",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditStudent = async () => {
    if (!selectedStudent) return;

    try {
      setEditing(true);
      
      const { data, error } = await supabase
        .from('students')
        .update({
          name: formData.name.trim(),
          student_id: formData.student_id.trim() || null,
          class_name: formData.class_name.trim() || null,
          school_id: formData.school_id || null,
          tenant_id: formData.tenant_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStudent.id)
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? data : s));
      setIsEditModalOpen(false);
      setSelectedStudent(null);
      resetForm();
      
      toast({
        title: "Aluno atualizado com sucesso",
        description: `${data.name} foi atualizado`,
      });

    } catch (error: any) {
      console.error('Erro ao atualizar aluno:', error);
      toast({
        title: "Erro ao atualizar aluno",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEditing(false);
    }
  };

  const handleToggleStatus = async (student: Student) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .update({
          is_active: !student.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id)
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => prev.map(s => s.id === student.id ? data : s));
      
      toast({
        title: "Status atualizado",
        description: `${student.name} foi ${data.is_active ? 'ativado' : 'desativado'}`,
      });

    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      student_id: '',
      class_name: '',
      school_id: '',
      tenant_id: ''
    });
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      student_id: student.student_id || '',
      class_name: student.class_name || '',
      school_id: student.school_id || '',
      tenant_id: student.tenant_id
    });
    setIsEditModalOpen(true);
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

  const filteredStudents = getFilteredStudents();
  const activeStudents = students.filter(s => s.is_active).length;
  const inactiveStudents = students.filter(s => !s.is_active).length;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando alunos...</p>
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
            <Users className="h-8 w-8" />
            Gerenciamento de Alunos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os alunos do sistema PEI Collab
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Aluno
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeStudents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Inativos</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveStudents}</div>
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
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Alunos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos ({filteredStudents.length})</CardTitle>
          <CardDescription>
            {filteredStudents.length === students.length 
              ? 'Todos os alunos do sistema'
              : `${filteredStudents.length} de ${students.length} alunos`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum aluno encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedTenant !== 'all' || selectedSchool !== 'all' || selectedStatus !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece adicionando um novo aluno'
                }
              </p>
              {!searchTerm && selectedTenant === 'all' && selectedSchool === 'all' && selectedStatus === 'all' && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Aluno
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>ID do Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Escola</TableHead>
                    <TableHead>Rede</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.student_id || '-'}</TableCell>
                      <TableCell>{student.class_name || '-'}</TableCell>
                      <TableCell>{getSchoolName(student.school_id)}</TableCell>
                      <TableCell>{getTenantName(student.tenant_id)}</TableCell>
                      <TableCell>
                        <Badge variant={student.is_active ? "default" : "secondary"}>
                          {student.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(student.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(student)}
                          >
                            {student.is_active ? (
                              <UserX className="h-4 w-4 text-red-600" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            )}
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

      {/* Modal de Criação */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Aluno</DialogTitle>
            <DialogDescription>
              Adicione um novo aluno ao sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name">Nome Completo *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do aluno"
              />
            </div>
            
            <div>
              <Label htmlFor="create-student-id">ID do Aluno</Label>
              <Input
                id="create-student-id"
                value={formData.student_id}
                onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
                placeholder="ID único do aluno (opcional)"
              />
            </div>
            
            <div>
              <Label htmlFor="create-class">Turma</Label>
              <Input
                id="create-class"
                value={formData.class_name}
                onChange={(e) => setFormData(prev => ({ ...prev, class_name: e.target.value }))}
                placeholder="Nome da turma (opcional)"
              />
            </div>
            
            <div>
              <Label htmlFor="create-tenant">Rede de Ensino *</Label>
              <Select value={formData.tenant_id} onValueChange={(value) => setFormData(prev => ({ ...prev, tenant_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma rede" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.network_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="create-school">Escola</Label>
              <Select value={formData.school_id} onValueChange={(value) => setFormData(prev => ({ ...prev, school_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma escola" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma escola</SelectItem>
                  {schools
                    .filter(school => school.tenant_id === formData.tenant_id)
                    .map(school => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.school_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateStudent} disabled={creating}>
              {creating ? 'Criando...' : 'Criar Aluno'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
            <DialogDescription>
              Atualize as informações do aluno
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome Completo *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do aluno"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-student-id">ID do Aluno</Label>
              <Input
                id="edit-student-id"
                value={formData.student_id}
                onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
                placeholder="ID único do aluno (opcional)"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-class">Turma</Label>
              <Input
                id="edit-class"
                value={formData.class_name}
                onChange={(e) => setFormData(prev => ({ ...prev, class_name: e.target.value }))}
                placeholder="Nome da turma (opcional)"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-tenant">Rede de Ensino *</Label>
              <Select value={formData.tenant_id} onValueChange={(value) => setFormData(prev => ({ ...prev, tenant_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma rede" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.network_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-school">Escola</Label>
              <Select value={formData.school_id} onValueChange={(value) => setFormData(prev => ({ ...prev, school_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma escola" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma escola</SelectItem>
                  {schools
                    .filter(school => school.tenant_id === formData.tenant_id)
                    .map(school => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.school_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditStudent} disabled={editing}>
              {editing ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
