'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';

import { StudentDocuments } from '@/components/students/StudentDocuments';
import { StudentMeetings } from '@/components/students/StudentMeetings';
import { StudentTimeline } from '@/components/students/StudentTimeline';
import { StudentBarriers } from '@/components/students/StudentBarriers';
import { StudentNee } from '@/components/students/StudentNee';
import { StudentRestrictions } from '@/components/students/StudentRestrictions';
import { StudentAuthorizations } from '@/components/students/StudentAuthorizations';
import { useStudentDocuments } from '@/hooks/useStudentDocuments';
import { useMeetings } from '@/hooks/useMeetings';
import { useStudentTimeline } from '@/hooks/useStudentTimeline';
import { useStudentBarriers } from '@/hooks/useStudentBarriers';
import { useStudentNee } from '@/hooks/useStudentNee';
import { useStudentRestrictions } from '@/hooks/useStudentRestrictions';
import { useStudentAuthorizations } from '@/hooks/useStudentAuthorizations';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useTemplates } from '@/hooks/useTemplates';
import { useGoals, Goal } from '@/hooks/useGoals';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const studentId = params?.id ?? '';

  const { profile, loading: profileLoading, error: profileError } = useStudentProfile(studentId);
  const { documents, loading: docsLoading, error: docsError } = useStudentDocuments(studentId);
  const {
    events: timelineEvents,
    loading: timelineLoading,
    error: timelineError,
  } = useStudentTimeline(studentId);
  const {
    meetings,
    loading: meetingsLoading,
    error: meetingsError,
    createMeeting,
  } = useMeetings(studentId);
  const {
    barriers,
    loading: barriersLoading,
    error: barriersError,
    createBarrier,
    deleteBarrier,
  } = useStudentBarriers(studentId);
  const { nee, loading: neeLoading, error: neeError, createNee, deleteNee } = useStudentNee(studentId);
  const {
    restrictions,
    loading: restrictionsLoading,
    error: restrictionsError,
    createRestriction,
  } = useStudentRestrictions(studentId);
  const {
    authorizations,
    loading: authLoading,
    error: authError,
    upsertAuthorization,
  } = useStudentAuthorizations(studentId);
  const {
    goals,
    loading: goalsLoading,
    error: goalsError,
    createGoal,
    updateGoal,
    deleteGoal,
  } = useGoals(studentId);
  const { templates } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalStatus, setGoalStatus] = useState<Goal['status']>('ativa');
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalSaving, setGoalSaving] = useState(false);

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });
  }, [goals]);

  const statusLabel = (status: Goal['status']) => {
    if (status === 'ativa') return 'Ativa';
    if (status === 'concluida') return 'Concluida';
    return 'Arquivada';
  };

  const openCreateGoal = () => {
    setEditingGoal(null);
    setGoalTitle('');
    setGoalDescription('');
    setGoalStatus('ativa');
    setGoalError(null);
    setGoalDialogOpen(true);
  };

  const openEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.titulo);
    setGoalDescription(goal.descricao ?? '');
    setGoalStatus(goal.status);
    setGoalError(null);
    setGoalDialogOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!goalTitle.trim()) {
      setGoalError('Informe um titulo para a meta.');
      return;
    }

    setGoalSaving(true);
    setGoalError(null);

    try {
      if (editingGoal) {
        await updateGoal({
          id: editingGoal.id,
          titulo: goalTitle.trim(),
          descricao: goalDescription.trim() || null,
          status: goalStatus,
        });
      } else {
        await createGoal({
          titulo: goalTitle.trim(),
          descricao: goalDescription.trim() || null,
        });
      }
      setGoalDialogOpen(false);
    } catch (err) {
      setGoalError(err instanceof Error ? err.message : 'Erro ao salvar a meta.');
    } finally {
      setGoalSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    setGoalSaving(true);
    setGoalError(null);
    try {
      await deleteGoal(goalId);
    } catch (err) {
      setGoalError(err instanceof Error ? err.message : 'Erro ao remover a meta.');
    } finally {
      setGoalSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return <p className="text-sm text-destructive">Perfil não encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Alunos', href: '/dashboard/students' },
          { label: profile.nome },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{profile.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {profile.school_nome ?? 'Escola não informada'}
          </p>
        </div>
        <PermissionGate permission="canCreateDocument">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome_template}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild disabled={!selectedTemplate}>
              <Link
                href={`/dashboard/students/${studentId}/documents/new?templateId=${selectedTemplate}`}
              >
                Novo documento
              </Link>
            </Button>
          </div>
        </PermissionGate>
      </div>

      <div className="flex flex-wrap gap-2">
        {profile.serie ? <Badge variant="secondary">Série {profile.serie}</Badge> : null}
        {profile.turno ? <Badge variant="outline">{profile.turno}</Badge> : null}
        {profile.categoria_necessidade ? (
          <Badge variant="outline">{profile.categoria_necessidade}</Badge>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-2">
          <h2 className="text-lg font-semibold">Documentos</h2>
          {docsLoading ? <p>Carregando documentos...</p> : null}
          {docsError ? <p className="text-sm text-destructive">{docsError}</p> : null}
          {!docsLoading && !docsError ? (
            <StudentDocuments studentId={studentId} documents={documents} />
          ) : null}
        </div>
        <div className="space-y-6">
          <StudentTimeline
            studentId={studentId}
            events={timelineEvents}
            loading={timelineLoading}
            error={timelineError}
          />
          <StudentMeetings
            studentId={studentId}
            meetings={meetings}
            loading={meetingsLoading}
            error={meetingsError}
            onCreateMeeting={createMeeting}
          />
          <StudentBarriers
            studentId={studentId}
            barriers={barriers}
            loading={barriersLoading}
            error={barriersError}
            onCreateBarrier={createBarrier}
            onDeleteBarrier={deleteBarrier}
          />
          <StudentNee
            studentId={studentId}
            nee={nee}
            loading={neeLoading}
            error={neeError}
            onCreateNee={createNee}
            onDeleteNee={deleteNee}
          />
          <StudentRestrictions
            studentId={studentId}
            restrictions={restrictions}
            loading={restrictionsLoading}
            error={restrictionsError}
            onCreateRestriction={createRestriction}
          />
          <StudentAuthorizations
            studentId={studentId}
            authorizations={authorizations}
            loading={authLoading}
            error={authError}
            onUpsertAuthorization={upsertAuthorization}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Metas</h2>
          <PermissionGate permission="canCreateDocument">
            <Button size="sm" onClick={openCreateGoal}>
              Nova meta
            </Button>
          </PermissionGate>
        </div>
        {goalsLoading ? <p>Carregando metas...</p> : null}
        {goalsError ? <p className="text-sm text-destructive">{goalsError}</p> : null}
        {goalError ? <p className="text-sm text-destructive">{goalError}</p> : null}
        {!goalsLoading && !goalsError ? (
          <Card>
            <CardHeader className="pb-2 text-sm text-muted-foreground">
              Metas vinculadas ao aluno.
            </CardHeader>
            <CardContent>
              {sortedGoals.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedGoals.map((goal) => (
                      <TableRow key={goal.id}>
                        <TableCell>
                          <div className="font-medium">{goal.titulo}</div>
                          {goal.descricao ? (
                            <div className="text-xs text-muted-foreground">{goal.descricao}</div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant={goal.status === 'ativa' ? 'secondary' : 'outline'}>
                            {statusLabel(goal.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <PermissionGate permission="canCreateDocument">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditGoal(goal)}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteGoal(goal.id)}
                                disabled={goalSaving}
                              >
                                Remover
                              </Button>
                            </PermissionGate>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada.</p>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Editar meta' : 'Nova meta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal-title">Título</Label>
              <Input
                id="goal-title"
                value={goalTitle}
                onChange={(event) => setGoalTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-description">Descrição</Label>
              <Textarea
                id="goal-description"
                value={goalDescription}
                onChange={(event) => setGoalDescription(event.target.value)}
              />
            </div>
            {editingGoal ? (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={goalStatus}
                  onValueChange={(value) => setGoalStatus(value as Goal['status'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="concluida">Concluida</SelectItem>
                    <SelectItem value="arquivada">Arquivada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {goalError ? <p className="text-sm text-destructive">{goalError}</p> : null}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveGoal} disabled={goalSaving}>
                {goalSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
