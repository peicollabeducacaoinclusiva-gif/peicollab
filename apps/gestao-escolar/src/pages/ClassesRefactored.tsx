import { useState, useMemo } from 'react';
import { StandardListPage } from '@/components/templates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { ClassCard } from '@/components/ClassCard';
import { EmptyState } from '@/components/ui/microinteractions';
import { LoadingSkeleton } from '@/components/ui/microinteractions';
import { useClasses, useDeleteClass } from '../hooks/useClasses';
import { useSchools } from '../hooks/useStudents';
import { useUserProfile } from '../hooks/useUserProfile';
import { GraduationCap, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui';
import { Input, Label } from '@/components/ui';
import type { Class } from '../services/classesService';
import { toast } from 'sonner';

const levelLabels: Record<string, string> = {
  educacao_infantil: 'Educação Infantil',
  ensino_fundamental_1: 'Ensino Fundamental I',
  ensino_fundamental_2: 'Ensino Fundamental II',
  ensino_medio: 'Ensino Médio',
  eja: 'EJA',
};

export default function ClassesRefactored() {
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');
  const deleteClass = useDeleteClass();

  const filters = useMemo(() => ({
    tenantId: userProfile?.tenant_id || '',
    schoolId: userProfile?.school_id || undefined,
    search: search || undefined,
    schoolFilter: schoolFilter !== 'all' ? schoolFilter : undefined,
    sortKey: 'class_name' as const,
    sortDir: 'asc' as const,
    page: currentPage,
    pageSize: 12,
  }), [userProfile, search, schoolFilter, currentPage]);

  const { data: classesData, isLoading } = useClasses(filters);

  const classes = classesData?.data || [];

  const filtersComponent = (
    <Select value={schoolFilter} onValueChange={setSchoolFilter}>
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
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a turma "${name}"?`)) {
      return;
    }

    try {
      await deleteClass.mutateAsync(id);
      toast.success('Turma excluída com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir turma');
    }
  };

  return (
    <>
      <StandardListPage
        title="Turmas"
        description="Gerencie todas as turmas da rede"
        searchPlaceholder="Buscar por nome da turma..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filtersComponent}
        onCreate={() => setCreateOpen(true)}
        loading={isLoading}
        showExport={false}
        showRefresh={true}
        emptyState={
          !isLoading && classes.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Nenhuma turma encontrada"
              description={search || schoolFilter !== 'all'
                ? "Tente ajustar os filtros de busca"
                : "Comece criando sua primeira turma"}
              action={
                <button
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Turma
                </button>
              }
            />
          ) : undefined
        }
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              onEdit={(c) => setEditingClass(c)}
              onDelete={(id, name) => handleDelete(id, name)}
            />
          ))}
        </div>
      </StandardListPage>

      {/* Dialog simplificado - em produção, mover para componente separado */}
      <Dialog open={createOpen || !!editingClass} onOpenChange={(open) => {
        if (!open) {
          setCreateOpen(false);
          setEditingClass(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Formulário de criação/edição de turma. 
              Em produção, este deve ser um componente separado.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
