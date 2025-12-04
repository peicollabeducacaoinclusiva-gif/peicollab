import { useState } from 'react';
import { Plus, Users, Edit, Trash2, MapPin, Calendar } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { Button } from '@pei/ui';
import { Badge } from '@pei/ui';
import { AccessibleSelect } from '@pei/ui';
import { useStudentTransport, useUpdateStudentTransport } from '../hooks/useStudentTransport';
import { useUserProfile } from '../hooks/useUserProfile';
import type { StudentTransport } from '../types';
import { StudentAssignmentForm } from '../components/StudentAssignmentForm';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SHIFT_LABELS: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  integral: 'Integral',
};

export default function Students() {
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentTransport | null>(null);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear());

  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: assignments = [], isLoading: assignmentsLoading } = useStudentTransport({
    schoolId: userProfile?.school_id || undefined,
    academicYear,
    activeOnly: false,
  });
  const updateAssignment = useUpdateStudentTransport();

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Tem certeza que deseja desativar este vínculo?')) return;

    updateAssignment.mutate(
      { assignmentId, updates: { is_active: false } },
      {
        onSuccess: () => {
          toast.success('Vínculo desativado com sucesso');
        },
      }
    );
  };

  const appUserProfile = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: userProfile.tenant?.network_name,
    school_name: userProfile.school?.school_name,
  } : undefined;

  const loading = profileLoading || assignmentsLoading;

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => ({
    value: year.toString(),
    label: year.toString(),
  }));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        appName="Transporte Escolar"
        appLogo="/logo.png"
        currentApp="transporte-escolar"
        userProfile={appUserProfile}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vínculos Aluno-Rota</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os vínculos entre alunos e rotas
            </p>
          </div>
          <div className="flex gap-2">
            <AccessibleSelect
              label=""
              value={academicYear.toString()}
              onValueChange={(value) => setAcademicYear(Number(value))}
              options={yearOptions}
              aria-label="Selecione o ano letivo"
              className="w-32"
            />
            <Button
              onClick={() => {
                setSelectedAssignment(null);
                setAssignmentFormOpen(true);
              }}
              aria-label="Criar novo vínculo aluno-rota"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Novo Vínculo
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-muted-foreground">Carregando vínculos...</p>
          </div>
        ) : assignments.length === 0 ? (
          <Card role="region" aria-label="Lista de vínculos vazia">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <p className="text-muted-foreground mb-4">
                Nenhum vínculo cadastrado ainda
              </p>
              <Button
                onClick={() => {
                  setSelectedAssignment(null);
                  setAssignmentFormOpen(true);
                }}
                aria-label="Criar primeiro vínculo"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Criar Primeiro Vínculo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" role="list" aria-label="Lista de vínculos aluno-rota">
            {assignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="hover:shadow-lg transition-shadow"
                role="listitem"
                aria-label={`Vínculo do aluno ${(assignment as any).student?.name || 'N/A'} com a rota ${(assignment as any).route?.route_name || 'N/A'}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {(assignment as any).student?.name || 'Aluno não encontrado'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Rota: {(assignment as any).route?.route_name || assignment.route_name || 'N/A'}
                      </p>
                      <div className="flex gap-2 mt-2" role="group" aria-label="Status e turno do vínculo">
                        <Badge
                          className={`${assignment.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}
                          aria-label={assignment.is_active ? 'Vínculo ativo' : 'Vínculo inativo'}
                        >
                          {assignment.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {assignment.shift && (
                          <Badge variant="outline" aria-label={`Turno: ${SHIFT_LABELS[assignment.shift] || assignment.shift}`}>
                            {SHIFT_LABELS[assignment.shift] || assignment.shift}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2" role="group" aria-label="Ações do vínculo">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setAssignmentFormOpen(true);
                        }}
                        aria-label={`Editar vínculo do aluno ${(assignment as any).student?.name}`}
                      >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(assignment.id)}
                        aria-label={`Desativar vínculo do aluno ${(assignment as any).student?.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                        <span className="sr-only">Desativar</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {assignment.boarding_stop && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        <div>
                          <p className="font-medium">Embarque:</p>
                          <p>{assignment.boarding_stop}</p>
                        </div>
                      </div>
                    )}
                    {assignment.disembarkation_stop && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        <div>
                          <p className="font-medium">Desembarque:</p>
                          <p>{assignment.disembarkation_stop}</p>
                        </div>
                      </div>
                    )}
                    {assignment.start_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                        <div>
                          <p className="font-medium">Início:</p>
                          <p>{format(new Date(assignment.start_date), 'dd/MM/yyyy')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <StudentAssignmentForm
          open={assignmentFormOpen}
          onOpenChange={setAssignmentFormOpen}
          assignment={selectedAssignment}
          schoolId={userProfile?.school_id || ''}
          tenantId={userProfile?.tenant_id || ''}
          academicYear={academicYear}
          onSuccess={() => {
            setSelectedAssignment(null);
          }}
        />
      </div>
    </div>
  );
}
