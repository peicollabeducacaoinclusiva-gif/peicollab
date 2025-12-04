import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Filter, X } from 'lucide-react';
import { AppHeader, UserProfile as AppUserProfile } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { AccessibleTable, Pagination } from '@pei/ui';
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClasses, useCreateClass, useUpdateClass, useDeleteClass } from '../hooks/useClasses';
import { useSchools } from '../hooks/useStudents';
import { useUserProfile } from '../hooks/useUserProfile';
import { formatTimestampForFilename, downloadTextFile } from '@pei/ui';
import { toast } from 'sonner';
import type { Class } from '../services/classesService';

const levelLabels: Record<string, string> = {
  educacao_infantil: 'Educação Infantil',
  ensino_fundamental_1: 'Ensino Fundamental I',
  ensino_fundamental_2: 'Ensino Fundamental II',
  ensino_medio: 'Ensino Médio',
  eja: 'EJA',
};

export default function Classes() {
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [sortKey, _setSortKey] = useState<'class_name' | 'grade' | 'school'>('class_name');
  const [sortDir, _setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, _setPageSize] = useState(12);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [form, setForm] = useState<{
    class_name: string;
    grade: string;
    education_level: string;
    shift: string;
    academic_year: string;
    school_id: string | null;
  }>({
    class_name: '',
    grade: '',
    education_level: 'ensino_fundamental_1',
    shift: '',
    academic_year: new Date().getFullYear().toString(),
    school_id: null,
  });

  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const filters = useMemo(() => ({
    tenantId: userProfile?.tenant_id || '',
    schoolId: userProfile?.school_id || undefined,
    search: search || undefined,
    schoolFilter: schoolFilter !== 'all' ? schoolFilter : undefined,
    sortKey,
    sortDir,
    page: currentPage,
    pageSize,
  }), [userProfile, search, schoolFilter, sortKey, sortDir, currentPage, pageSize]);

  const { data: classesData, isLoading: classesLoading } = useClasses(filters);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, schoolFilter]);

  const handleCreate = async () => {
    if (!form.class_name || !form.school_id || !userProfile?.tenant_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    createClass.mutate(
      {
        class_name: form.class_name,
        grade: form.grade || undefined,
        education_level: form.education_level,
        shift: form.shift || undefined,
        academic_year: form.academic_year,
        school_id: form.school_id,
        tenant_id: userProfile.tenant_id,
        is_active: true,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setForm({
            class_name: '',
            grade: '',
            education_level: 'ensino_fundamental_1',
            shift: '',
            academic_year: new Date().getFullYear().toString(),
            school_id: null,
          });
        },
      }
    );
  };

  const handleUpdate = async () => {
    if (!editingClass || !form.class_name || !form.school_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    updateClass.mutate(
      {
        classId: editingClass.id,
        updates: {
          class_name: form.class_name,
          grade: form.grade || undefined,
          education_level: form.education_level,
          shift: form.shift || undefined,
          academic_year: form.academic_year,
          school_id: form.school_id,
        },
      },
      {
        onSuccess: () => {
          setEditingClass(null);
          setForm({
            class_name: '',
            grade: '',
            education_level: 'ensino_fundamental_1',
            shift: '',
            academic_year: new Date().getFullYear().toString(),
            school_id: null,
          });
        },
      }
    );
  };

  const handleDelete = async (classId: string, className: string) => {
    if (!confirm(`Tem certeza que deseja excluir a turma "${className}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    deleteClass.mutate(classId, {
      onSuccess: () => {
        toast.success(`Turma "${className}" foi removida`);
      },
    });
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setForm({
      class_name: classItem.class_name,
      grade: classItem.grade || '',
      education_level: classItem.education_level,
      shift: classItem.shift || '',
      academic_year: classItem.academic_year,
      school_id: classItem.school_id || null,
    });
  };

  const exportCSV = () => {
    if (!classesData?.data) return;

    try {
      const ts = formatTimestampForFilename();
      const headers = ['Nome da Turma', 'Nível', 'Série', 'Turno', 'Ano Letivo', 'Escola', 'Status'];
      const rows = classesData.data.map(c => [
        c.class_name,
        levelLabels[c.education_level] || c.education_level,
        c.grade || '',
        c.shift || '',
        c.academic_year,
        c.school?.school_name || '',
        c.is_active ? 'Ativa' : 'Inativa',
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v)).join(',')).join('\n');
      downloadTextFile(`turmas-${ts}.csv`, csv, 'text/csv;charset=utf-8');
      toast.success(`Arquivo turmas-${ts}.csv foi baixado`);
    } catch {
      toast.error('Não foi possível gerar o CSV');
    }
  };



  const appUserProfile: AppUserProfile | undefined = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: (typeof userProfile.tenant === 'object' && userProfile.tenant !== null && 'network_name' in userProfile.tenant) ? (userProfile.tenant as any).network_name : null,
    school_name: (typeof userProfile.school === 'object' && userProfile.school !== null && 'school_name' in userProfile.school) ? (userProfile.school as any).school_name : null,
  } as AppUserProfile : undefined;

  const loading = classesLoading;
  const classes = classesData?.data || [];
  const totalCount = classesData?.count || 0;
  const totalPages = classesData?.totalPages || 1;

  const tableData = classes.map((classItem) => ({
    name: classItem.class_name,
    level: levelLabels[classItem.education_level] || classItem.education_level,
    grade: classItem.grade || '-',
    shift: classItem.shift || '-',
    academicYear: classItem.academic_year,
    school: classItem.school?.school_name || 'Sem escola',
    students: `${classItem.current_students}/${classItem.max_students || 'N/A'}`,
    status: (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${classItem.is_active
          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}
      >
        {classItem.is_active ? 'Ativa' : 'Inativa'}
      </span>
    ),
    actions: (
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEdit(classItem)}
          aria-label={`Editar turma ${classItem.class_name}`}
        >
          <Edit className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Editar</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(classItem.id, classItem.class_name)}
          aria-label={`Excluir turma ${classItem.class_name}`}
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
            <h1 className="text-3xl font-bold text-foreground">Turmas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as turmas da escola
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            aria-label="Criar nova turma"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Nova Turma
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6" role="region" aria-label="Filtros de turmas">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" aria-hidden="true" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Buscar por nome</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Nome da turma..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    aria-label="Buscar turma por nome"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="filter-school">Escola</Label>
                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
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

              {(schoolFilter !== 'all' || search) && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSchoolFilter('all');
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

        {/* Tabela de Turmas */}
        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-muted-foreground">Carregando turmas...</p>
          </div>
        ) : classes.length === 0 ? (
          <Card role="region" aria-label="Lista de turmas vazia">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {search || schoolFilter !== 'all'
                  ? 'Nenhuma turma encontrada com os filtros selecionados'
                  : 'Nenhuma turma cadastrada ainda'}
              </p>
              {!search && schoolFilter === 'all' && (
                <Button onClick={() => setCreateOpen(true)} aria-label="Cadastrar primeira turma">
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Cadastrar Primeira Turma
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card role="region" aria-label="Lista de turmas">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle>Lista de Turmas</CardTitle>
              <Button variant="outline" onClick={exportCSV} aria-label="Exportar lista de turmas para CSV">
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <AccessibleTable
                columns={[
                  { key: 'name', label: 'Nome da Turma', 'aria-label': 'Nome da turma' },
                  { key: 'level', label: 'Nível', 'aria-label': 'Nível de ensino' },
                  { key: 'grade', label: 'Série', 'aria-label': 'Série/ano' },
                  { key: 'shift', label: 'Turno', 'aria-label': 'Turno da turma' },
                  { key: 'academicYear', label: 'Ano Letivo', 'aria-label': 'Ano letivo' },
                  { key: 'school', label: 'Escola', 'aria-label': 'Escola da turma' },
                  { key: 'students', label: 'Alunos', 'aria-label': 'Número de alunos' },
                  { key: 'status', label: 'Status', 'aria-label': 'Status da turma' },
                  { key: 'actions', label: 'Ações', 'aria-label': 'Ações disponíveis' },
                ]}
                data={tableData}
                aria-label="Tabela de turmas cadastradas"
              />

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    pageSize={pageSize}
                    totalItems={Number(totalCount) || 0}
                    aria-label="Navegação de páginas de turmas"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Criação/Edição */}
      <Dialog open={createOpen || !!editingClass} onOpenChange={(open) => {
        if (!open) {
          setCreateOpen(false);
          setEditingClass(null);
          setForm({
            class_name: '',
            grade: '',
            education_level: 'ensino_fundamental_1',
            shift: '',
            academic_year: new Date().getFullYear().toString(),
            school_id: null,
          });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="md:col-span-2">
              <Label htmlFor="class_name">Nome da Turma *</Label>
              <Input
                id="class_name"
                value={form.class_name}
                onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                placeholder="Ex: 1º Ano A"
                aria-required="true"
              />
            </div>
            <div>
              <Label htmlFor="education_level">Nível de Ensino *</Label>
              <Select value={form.education_level} onValueChange={(v) => setForm({ ...form, education_level: v })}>
                <SelectTrigger id="education_level" aria-required="true">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(levelLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="grade">Série/Ano</Label>
              <Input
                id="grade"
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                placeholder="Ex: 1º Ano"
              />
            </div>
            <div>
              <Label htmlFor="shift">Turno</Label>
              <Input
                id="shift"
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
                placeholder="Ex: Manhã"
              />
            </div>
            <div>
              <Label htmlFor="academic_year">Ano Letivo *</Label>
              <Input
                id="academic_year"
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                placeholder="Ex: 2024"
                aria-required="true"
              />
            </div>
            <div>
              <Label htmlFor="school_id">Escola *</Label>
              <Select
                value={form.school_id || ''}
                onValueChange={(v) => setForm({ ...form, school_id: v })}
              >
                <SelectTrigger id="school_id" aria-required="true">
                  <SelectValue placeholder="Selecione a escola" />
                </SelectTrigger>
                <SelectContent>
                  {schoolsData.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.school_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setEditingClass(null);
                setForm({
                  class_name: '',
                  grade: '',
                  education_level: 'ensino_fundamental_1',
                  shift: '',
                  academic_year: new Date().getFullYear().toString(),
                  school_id: null,
                });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={editingClass ? handleUpdate : handleCreate}
              disabled={createClass.isPending || updateClass.isPending}
            >
              {editingClass ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
