import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Filter, X } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { AccessibleTable, Pagination } from '@pei/ui';
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useProfessionals, useDeleteProfessional } from '../hooks/useProfessionals';
import { useSchools } from '../hooks/useStudents';
import { useUserProfile } from '../hooks/useUserProfile';
import { CreateProfessionalDialog } from '@pei/ui';
import { EditProfessionalDialog } from '@/components/EditProfessionalDialog';
import { formatTimestampForFilename, downloadTextFile } from '@pei/ui';
import { toast } from 'sonner';
import type { Professional } from '../services/professionalsService';

const roleLabels: Record<string, string> = {
  professor: 'Professor',
  professor_aee: 'Professor AEE',
  coordenador: 'Coordenador',
  diretor: 'Diretor',
  secretario_educacao: 'Secretário de Educação',
  profissional_apoio: 'Profissional de Apoio',
  psicologo: 'Psicólogo',
  fonoaudiologo: 'Fonoaudiólogo',
  terapeuta_ocupacional: 'Terapeuta Ocupacional',
  assistente_social: 'Assistente Social',
  outros: 'Outros',
};

export default function Professionals() {
  const [search, setSearch] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<'full_name' | 'professional_role' | 'school'>('full_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [professionalToDelete, setProfessionalToDelete] = useState<Professional | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');
  const deleteProfessional = useDeleteProfessional();

  const filters = useMemo(() => ({
    tenantId: userProfile?.tenant_id || '',
    schoolId: userProfile?.school_id || undefined,
    search: search || undefined,
    selectedSchoolFilter: selectedSchoolFilter !== 'all' ? selectedSchoolFilter : undefined,
    selectedRoleFilter: selectedRoleFilter !== 'all' ? selectedRoleFilter : undefined,
    sortKey,
    sortDir,
    page: currentPage,
    pageSize,
  }), [userProfile, search, selectedSchoolFilter, selectedRoleFilter, sortKey, sortDir, currentPage, pageSize]);

  const { data: professionalsData, isLoading: professionalsLoading } = useProfessionals(filters);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedSchoolFilter, selectedRoleFilter]);

  const handleEdit = (prof: Professional) => {
    setEditingProfessional(prof);
  };

  const handleDelete = (prof: Professional) => {
    setProfessionalToDelete(prof);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!professionalToDelete) return;

    deleteProfessional.mutate(professionalToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setProfessionalToDelete(null);
        toast.success(`${professionalToDelete.full_name} foi removido com sucesso`);
      },
    });
  };

  const exportCSV = () => {
    if (!professionalsData?.data) return;

    try {
      const ts = formatTimestampForFilename();
      const headers = ['Nome', 'Função', 'Matrícula', 'Escola', 'Email', 'Telefone', 'Status'];
      const rows = professionalsData.data.map(p => [
        p.full_name,
        roleLabels[p.professional_role] || p.professional_role,
        p.registration_number || '',
        p.school?.school_name || '',
        p.email || '',
        p.phone || '',
        p.is_active ? 'Ativo' : 'Inativo'
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v)).join(',')).join('\n');
      downloadTextFile(`profissionais-${ts}.csv`, csv, 'text/csv;charset=utf-8');
      toast.success(`Arquivo profissionais-${ts}.csv foi baixado`);
    } catch {
      toast.error('Não foi possível gerar o CSV');
    }
  };

  const _toggleSort = (_key: typeof sortKey) => {
    if (sortKey === _key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(_key);
      setSortDir('asc');
    }
  };

  const appUserProfile = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: (userProfile.tenant as any)?.network_name || null,
    school_name: (userProfile.school as any)?.school_name || null,
  } : undefined;

  const loading = professionalsLoading;
  const professionals = professionalsData?.data || [];
  const totalCount = professionalsData?.count || 0;
  const totalPages = professionalsData?.totalPages || 1;

  const tableData = professionals.map((prof) => ({
    name: (
      <div>
        <div className="text-sm font-medium text-foreground">
          {prof.full_name}
        </div>
        {prof.specialization && (
          <div className="text-xs text-muted-foreground">
            {prof.specialization}
          </div>
        )}
      </div>
    ),
    role: roleLabels[prof.professional_role] || prof.professional_role,
    registration: prof.registration_number || '-',
    school: prof.school?.school_name || 'Sem escola',
    contact: (
      <div>
        <div className="text-sm text-foreground">
          {prof.email || '-'}
        </div>
        <div className="text-xs text-muted-foreground">
          {prof.phone || '-'}
        </div>
      </div>
    ),
    status: (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          prof.is_active
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}
      >
        {prof.is_active ? 'Ativo' : 'Inativo'}
      </span>
    ),
    actions: (
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEdit(prof)}
          aria-label={`Editar profissional ${prof.full_name}`}
        >
          <Edit className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Editar</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(prof)}
          aria-label={`Excluir profissional ${prof.full_name}`}
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
        userProfile={appUserProfile as any}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profissionais</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os profissionais da escola
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            aria-label="Criar novo profissional"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Novo Profissional
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6" role="region" aria-label="Filtros de profissionais">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" aria-hidden="true" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar por nome</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Nome do profissional..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    aria-label="Buscar profissional por nome"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="filter-school">Escola</Label>
                <Select value={selectedSchoolFilter} onValueChange={setSelectedSchoolFilter}>
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
                <Label htmlFor="filter-role">Função</Label>
                <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
                  <SelectTrigger id="filter-role" aria-label="Filtrar por função">
                    <SelectValue placeholder="Todas as Funções" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Funções</SelectItem>
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(selectedSchoolFilter !== 'all' || selectedRoleFilter !== 'all' || search) && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSchoolFilter('all');
                      setSelectedRoleFilter('all');
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

        {/* Tabela de Profissionais */}
        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-muted-foreground">Carregando profissionais...</p>
          </div>
        ) : professionals.length === 0 ? (
          <Card role="region" aria-label="Lista de profissionais vazia">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {search || selectedSchoolFilter !== 'all'
                  ? 'Nenhum profissional encontrado com os filtros selecionados'
                  : 'Nenhum profissional cadastrado ainda'}
              </p>
              {!search && selectedSchoolFilter === 'all' && (
                <Button onClick={() => setCreateDialogOpen(true)} aria-label="Cadastrar primeiro profissional">
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Cadastrar Primeiro Profissional
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card role="region" aria-label="Lista de profissionais">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle>Lista de Profissionais</CardTitle>
              <Button variant="outline" onClick={exportCSV} aria-label="Exportar lista de profissionais para CSV">
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <AccessibleTable
                columns={[
                  { key: 'name', label: 'Nome', 'aria-label': 'Nome do profissional' },
                  { key: 'role', label: 'Função', 'aria-label': 'Função do profissional' },
                  { key: 'registration', label: 'Matrícula', 'aria-label': 'Número de matrícula' },
                  { key: 'school', label: 'Escola', 'aria-label': 'Escola do profissional' },
                  { key: 'contact', label: 'Contato', 'aria-label': 'Informações de contato' },
                  { key: 'status', label: 'Status', 'aria-label': 'Status do profissional' },
                  { key: 'actions', label: 'Ações', 'aria-label': 'Ações disponíveis' },
                ]}
                data={tableData}
                aria-label="Tabela de profissionais cadastrados"
              />

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    pageSize={pageSize}
                    totalItems={Number(totalCount) || 0}
                    onPageSizeChange={setPageSize}
                    aria-label="Navegação de páginas de profissionais"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Criação */}
      <CreateProfessionalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        tenantId={userProfile?.tenant_id || ''}
        onCreated={() => {
          setCreateDialogOpen(false);
        }}
      />

      {/* Dialog de Edição */}
      <EditProfessionalDialog
        professional={editingProfessional}
        open={!!editingProfessional}
        onOpenChange={(open) => !open && setEditingProfessional(null)}
        tenantId={userProfile?.tenant_id || ''}
        onUpdated={() => {
          setEditingProfessional(null);
        }}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o profissional <strong>{professionalToDelete?.full_name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProfessional.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteProfessional.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteProfessional.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
