import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandardListPage } from '@/components/templates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { HoverCard } from '@/components/ui/microinteractions';
import { LoadingSkeleton } from '@/components/ui/microinteractions';
import { EmptyState } from '@/components/ui/microinteractions';
import { useStudents, useSchools } from '../hooks/useStudents';
import { useUserProfile } from '../hooks/useUserProfile';
import { StudentFormDialog } from '../components/StudentFormDialog';
import { Edit, Eye, Users } from 'lucide-react';
import type { Student } from '../services/studentsService';

export default function StudentsRefactored() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: userProfile } = useUserProfile();
  const { data: schoolsData = [] } = useSchools(userProfile?.tenant_id || '');

  const filters = useMemo(() => ({
    tenantId: userProfile?.tenant_id || '',
    schoolId: userProfile?.school_id || undefined,
    search: search || undefined,
    page: currentPage,
    pageSize: 12,
  }), [userProfile, search, currentPage]);

  const { data: studentsData, isLoading } = useStudents(filters);

  const filteredStudents = useMemo(() => {
    if (!studentsData?.data) return [];
    let result = [...studentsData.data];

    if (filterSchool !== 'all') {
      result = result.filter(s => s.school_id === filterSchool);
    }

    if (filterGrade !== 'all') {
      result = result.filter(s => s.grade === filterGrade);
    }

    return result;
  }, [studentsData?.data, filterSchool, filterGrade]);

  const filtersComponent = (
    <>
      <Select value={filterSchool} onValueChange={setFilterSchool}>
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
      <Select value={filterGrade} onValueChange={setFilterGrade}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Série" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as séries</SelectItem>
          <SelectItem value="1º Ano EF">1º Ano EF</SelectItem>
          <SelectItem value="2º Ano EF">2º Ano EF</SelectItem>
          <SelectItem value="3º Ano EF">3º Ano EF</SelectItem>
          <SelectItem value="4º Ano EF">4º Ano EF</SelectItem>
          <SelectItem value="5º Ano EF">5º Ano EF</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <>
      <StandardListPage
        title="Alunos"
        description="Gerencie todos os alunos da rede"
        searchPlaceholder="Buscar por nome, RA ou CPF..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filtersComponent}
        onCreate={() => setCreateDialogOpen(true)}
        loading={isLoading}
        showExport={true}
        showRefresh={true}
        emptyState={
          !isLoading && filteredStudents.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum aluno encontrado"
              description={search || filterSchool !== 'all' || filterGrade !== 'all' 
                ? "Tente ajustar os filtros de busca"
                : "Comece criando seu primeiro aluno"}
              action={
                <Button onClick={() => setCreateDialogOpen(true)}>
                  Criar Aluno
                </Button>
              }
            />
          ) : undefined
        }
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <HoverCard key={student.id}>
              <Card className="transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{student.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        RA: {student.enrollment_number || 'N/A'}
                      </p>
                    </div>
                    {student.has_disability && (
                      <Badge variant="secondary">NEE</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Turma:</span>{' '}
                      <span className="font-medium">{student.class_name || 'Sem turma'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Série:</span>{' '}
                      <span className="font-medium">{student.grade || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Escola:</span>{' '}
                      <span className="font-medium">{student.school_name || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/students/${student.id}/profile`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/students/${student.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </HoverCard>
          ))}
        </div>
      </StandardListPage>

      <StudentFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
