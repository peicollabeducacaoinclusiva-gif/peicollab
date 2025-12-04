import { useState, useMemo } from 'react';
import { StandardListPage } from '@/components/templates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { ProfessionalCard } from '@/components/ProfessionalCard';
import { EmptyState } from '@/components/ui/microinteractions';
import { useProfessionals, useDeleteProfessional } from '../hooks/useProfessionals';
import { useSchools } from '../hooks/useStudents';
import { useUserProfile } from '../hooks/useUserProfile';
import { UserCheck, Plus } from 'lucide-react';
import { CreateProfessionalDialog } from '@pei/ui';
import { EditProfessionalDialog } from '@/components/EditProfessionalDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Professional } from '../services/professionalsService';
import { toast } from 'sonner';

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

export default function ProfessionalsRefactored() {
  const [search, setSearch] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
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
    sortKey: 'full_name' as const,
    sortDir: 'asc' as const,
    page: currentPage,
    pageSize: 12,
  }), [userProfile, search, selectedSchoolFilter, selectedRoleFilter, currentPage]);

  const { data: professionalsData, isLoading } = useProfessionals(filters);

  const professionals = professionalsData?.data || [];

  const filtersComponent = (
    <>
      <Select value={selectedSchoolFilter} onValueChange={setSelectedSchoolFilter}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Escola" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as escolas</SelectItem>
          {schoolsData.map((school) => (
            <SelectItem key={school.id} value={school.id}>
              {school.school_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Função" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as funções</SelectItem>
          {Object.entries(roleLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  const handleDelete = (prof: Professional) => {
    setProfessionalToDelete(prof);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!professionalToDelete) return;

    try {
      await deleteProfessional.mutateAsync(professionalToDelete.id);
      toast.success('Profissional excluído com sucesso');
      setDeleteDialogOpen(false);
      setProfessionalToDelete(null);
    } catch (error) {
      toast.error('Erro ao excluir profissional');
    }
  };

  return (
    <>
      <StandardListPage
        title="Profissionais"
        description="Gerencie todos os profissionais da rede"
        searchPlaceholder="Buscar por nome ou função..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filtersComponent}
        onCreate={() => setCreateDialogOpen(true)}
        loading={isLoading}
        showExport={false}
        showRefresh={true}
        emptyState={
          !isLoading && professionals.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="Nenhum profissional encontrado"
              description={search || selectedSchoolFilter !== 'all' || selectedRoleFilter !== 'all'
                ? "Tente ajustar os filtros de busca"
                : "Comece criando seu primeiro profissional"}
              action={
                <button
                  onClick={() => setCreateDialogOpen(true)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Profissional
                </button>
              }
            />
          ) : undefined
        }
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map((professional) => (
            <ProfessionalCard
              key={professional.id}
              professional={professional}
              onEdit={(p) => setEditingProfessional(p)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </StandardListPage>

      <CreateProfessionalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        tenantId={userProfile?.tenant_id || ''}
        onCreated={() => {
          setCreateDialogOpen(false);
        }}
      />

      <EditProfessionalDialog
        professional={editingProfessional}
        open={!!editingProfessional}
        onOpenChange={(open) => !open && setEditingProfessional(null)}
        tenantId={userProfile?.tenant_id || ''}
        onUpdated={() => {
          setEditingProfessional(null);
        }}
      />

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
    </>
  );
}
