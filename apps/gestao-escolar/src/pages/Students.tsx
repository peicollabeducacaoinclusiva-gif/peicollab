import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Filter, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { AccessibleTable, Pagination } from '@pei/ui';
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { useStudents, useUpdateStudent, useDeleteStudent, useSchools, useCreateStudent } from '../hooks/useStudents';
import { useUserProfile } from '../hooks/useUserProfile';
import { StudentFormDialog } from '../components/StudentFormDialog';
import type { Student } from '../services/studentsService';
import { formatTimestampForFilename, downloadTextFile } from '@pei/ui';
import { toast } from 'sonner';
import { EDUCATIONAL_LEVELS, SHIFTS, NEE_TYPES } from '../lib/constants';

export default function Students() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [filterEducationLevel, setFilterEducationLevel] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [filterWithDisability, setFilterWithDisability] = useState<string>('all');
  const [filterNEE, setFilterNEE] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<'name' | 'class' | 'school'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const createStudent = useCreateStudent();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filters = useMemo(() => ({
    tenantId: userProfile?.tenant_id || '',
    schoolId: userProfile?.school_id || undefined,
    search: search || undefined,
    filterSchool: filterSchool !== 'all' ? filterSchool : undefined,
    filterEducationLevel: filterEducationLevel !== 'all' ? filterEducationLevel : undefined,
    filterGrade: filterGrade !== 'all' ? filterGrade : undefined,
    filterShift: filterShift !== 'all' ? filterShift : undefined,
    filterWithDisability: filterWithDisability !== 'all' ? filterWithDisability : undefined,
    filterNEE: filterNEE !== 'all' ? filterNEE : undefined,
    sortKey,
    sortDir,
    page: currentPage,
    pageSize: 30,
  }), [userProfile, search, filterSchool, filterEducationLevel, filterGrade, filterShift, filterWithDisability, filterNEE, sortKey, sortDir, currentPage]);

  const { data: studentsData, isLoading: studentsLoading } = useStudents(filters);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterSchool, filterEducationLevel, filterGrade, filterShift, filterWithDisability, filterNEE]);

  // Client-side filtering removido - agora é feito no backend
  const filteredStudents = studentsData?.data || [];

  const handleToggleStatus = async (studentId: string, currentStatus: boolean) => {
    updateStudent.mutate(
      { studentId, updates: { is_active: !currentStatus } },
      {
        onSuccess: () => {
          toast.success(`Aluno ${!currentStatus ? 'ativado' : 'desativado'}`);
        },
      }
    );
  };

  const handleDelete = async (studentId: string, studentName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o aluno "${studentName}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    deleteStudent.mutate(studentId, {
      onSuccess: () => {
        toast.success(`Aluno "${studentName}" foi removido`);
      },
    });
  };


  const getInitials = (schoolName?: string) => {
    if (!schoolName) return '-';
    return schoolName
      .split(' ')
      .filter(word => word.length > 2)
      .map(word => word[0].toUpperCase())
      .join('');
  };

  const handleExport = () => {
    try {
      const ts = formatTimestampForFilename();
      const headers = ['Nome', 'Turma', 'Escola', 'Status'];
      const rows = filteredStudents.map(s => [
        s.name,
        s.class_name || '',
        s.school?.school_name || '',
        s.is_active ? 'Ativo' : 'Inativo'
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v)).join(',')).join('\n');
      downloadTextFile(`alunos-${ts}.csv`, csv, 'text/csv;charset=utf-8');
      toast.success(`Arquivo alunos-${ts}.csv foi baixado`);
    } catch {
      toast.error('Não foi possível gerar o CSV');
    }
  };

  const appUserProfile = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: (userProfile.tenant as any)?.network_name || undefined,
    school_name: (userProfile.school as any)?.school_name || undefined,
  } : undefined;

  const loading = profileLoading || studentsLoading;
  const totalPages = studentsData?.totalPages || 1;
  const totalCount = studentsData?.count || 0;

  const tableData = filteredStudents.map((student) => ({
    name: (
      <div>
        <div className="text-sm font-semibold text-foreground">
          {student.name}
        </div>
        {student.necessidades_especiais && student.tipo_necessidade && student.tipo_necessidade.length > 0 && (
          <div className="text-xs text-blue-500 dark:text-blue-400 font-medium mt-1">
            PcD: {student.tipo_necessidade.join(', ')}
          </div>
        )}
      </div>
    ),
    class: student.class_name || '-',
    school: (
      <div
        className="text-sm font-bold text-foreground tracking-wide"
        title={student.school?.school_name || 'Sem escola'}
      >
        {getInitials(student.school?.school_name)}
      </div>
    ),
    status: (
      <button
        onClick={() => handleToggleStatus(student.id, student.is_active)}
        className={`px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-all hover:scale-105 ${student.is_active
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
          }`}
        aria-label={`${student.is_active ? 'Desativar' : 'Ativar'} aluno ${student.name}`}
      >
        {student.is_active ? 'Ativo' : 'Inativo'}
      </button>
    ),
    actions: (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => navigate(`/students/${student.id}/profile`)}
          aria-label={`Ver ficha completa de ${student.name}`}
          title="Ver Ficha Completa"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Ver Ficha Completa</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setEditingStudent(student)}
          aria-label={`Editar aluno ${student.name}`}
        >
          <Edit className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Editar</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handleDelete(student.id, student.name)}
          aria-label={`Excluir aluno ${student.name}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
          <span className="sr-only">Excluir</span>
        </Button>
      </div>
    ),
  }));

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
            <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os alunos da escola
            </p>
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                Responsabilidade dos Diretores e Gestores Escolares
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Os diretores e gestores escolares são responsáveis por cadastrar e manter atualizados os dados dos alunos e seus responsáveis legais.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            aria-label="Criar novo aluno"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Novo Aluno
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6" role="region" aria-label="Filtros de alunos">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" aria-hidden="true" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar por nome</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Nome do aluno..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    aria-label="Buscar aluno por nome"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="filter-school">Escola</Label>
                <Select value={filterSchool} onValueChange={setFilterSchool}>
                  <SelectTrigger id="filter-school" aria-label="Filtrar por escola">
                    <SelectValue placeholder="Todas as Escolas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Escolas</SelectItem>
                    {schoolsData.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.school_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-education-level">Etapa da Educação</Label>
                <Select
                  value={filterEducationLevel}
                  onValueChange={(value) => {
                    setFilterEducationLevel(value);
                    setFilterGrade('all');
                  }}
                >
                  <SelectTrigger id="filter-education-level" aria-label="Filtrar por etapa da educação">
                    <SelectValue placeholder="Todas as Etapas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Etapas</SelectItem>
                    {Object.entries(EDUCATIONAL_LEVELS).map(([key, level]) => (
                      <SelectItem key={key} value={key}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-grade">Série/Ano</Label>
                <Select
                  value={filterGrade}
                  onValueChange={setFilterGrade}
                  disabled={filterEducationLevel === 'all'}
                >
                  <SelectTrigger id="filter-grade" aria-label="Filtrar por série/ano">
                    <SelectValue placeholder={filterEducationLevel === 'all' ? 'Selecione a etapa primeiro' : 'Todas as Séries'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Séries</SelectItem>
                    {filterEducationLevel !== 'all' && EDUCATIONAL_LEVELS[filterEducationLevel as keyof typeof EDUCATIONAL_LEVELS]?.grades.map((grade) => (
                      <SelectItem key={grade.value} value={grade.value}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-shift">Turno</Label>
                <Select value={filterShift} onValueChange={setFilterShift}>
                  <SelectTrigger id="filter-shift" aria-label="Filtrar por turno">
                    <SelectValue placeholder="Todos os Turnos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Turnos</SelectItem>
                    {SHIFTS.map((shift) => (
                      <SelectItem key={shift.value} value={shift.value}>
                        {shift.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-disability">Com Deficiência</Label>
                <Select value={filterWithDisability} onValueChange={setFilterWithDisability}>
                  <SelectTrigger id="filter-disability" aria-label="Filtrar por deficiência">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Sim</SelectItem>
                    <SelectItem value="no">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-nee">Com NEE</Label>
                <Select value={filterNEE} onValueChange={setFilterNEE}>
                  <SelectTrigger id="filter-nee" aria-label="Filtrar por tipo de necessidade educacional especial">
                    <SelectValue placeholder="Todas as NEE" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as NEE</SelectItem>
                    {NEE_TYPES.map((nee) => (
                      <SelectItem key={nee.value} value={nee.value}>
                        {nee.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(filterEducationLevel !== 'all' || filterGrade !== 'all' || filterShift !== 'all' || filterSchool !== 'all' || filterWithDisability !== 'all' || filterNEE !== 'all' || search) && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterEducationLevel('all');
                      setFilterGrade('all');
                      setFilterShift('all');
                      setFilterSchool('all');
                      setFilterWithDisability('all');
                      setFilterNEE('all');
                      setSearch('');
                    }}
                    aria-label="Limpar todos os filtros"
                  >
                    <X className="h-4 w-4 mr-2" aria-hidden="true" />
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Alunos */}
        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-muted-foreground">Carregando alunos...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card role="region" aria-label="Lista de alunos vazia">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {search || filterSchool !== 'all'
                  ? 'Nenhum aluno encontrado com os filtros selecionados'
                  : 'Nenhum aluno cadastrado ainda'}
              </p>
              {!search && filterSchool === 'all' && (
                <Button onClick={() => setCreateDialogOpen(true)} aria-label="Cadastrar primeiro aluno">
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Cadastrar Primeiro Aluno
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card role="region" aria-label="Lista de alunos">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle>Lista de Alunos</CardTitle>
              <Button variant="outline" onClick={handleExport} aria-label="Exportar lista de alunos para CSV">
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <AccessibleTable
                columns={[
                  {
                    key: 'name',
                    label: 'Nome',
                    'aria-label': 'Nome do aluno',
                  },
                  {
                    key: 'class',
                    label: 'Turma',
                    'aria-label': 'Turma do aluno',
                  },
                  {
                    key: 'school',
                    label: 'Escola',
                    'aria-label': 'Escola do aluno',
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    'aria-label': 'Status do aluno',
                  },
                  {
                    key: 'actions',
                    label: 'Ações',
                    'aria-label': 'Ações disponíveis',
                  },
                ]}
                data={tableData}
                aria-label="Tabela de alunos cadastrados"
              />

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    pageSize={30}
                    totalItems={totalCount}
                    aria-label="Navegação de páginas de alunos"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Criação/Edição */}
      <StudentFormDialog
        open={createDialogOpen || !!editingStudent}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditingStudent(null);
          }
        }}
        student={editingStudent}
        onSave={async (studentData) => {
          if (editingStudent) {
            await updateStudent.mutateAsync({ studentId: editingStudent.id, updates: studentData });
          } else {
            await createStudent.mutateAsync(studentData);
          }
        }}
      />
    </div>
  );
}
