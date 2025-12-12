import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Plus } from 'lucide-react';
import { AppHeader } from '@pei/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSchools } from '../hooks/useStudents';
import { useClasses } from '../hooks/useClasses';
import { supabase } from '@pei/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Allocation {
  id: string;
  professional_id: string;
  professional_name: string;
  class_id: string;
  class_name: string;
  subject_id: string | null;
  subject_name: string | null;
  academic_year: number;
  weekly_hours: number;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

interface Absence {
  id: string;
  professional_id: string;
  professional_name: string;
  absence_type: 'license' | 'vacation' | 'sick_leave' | 'other';
  start_date: string;
  end_date: string;
  reason: string;
  document_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface Substitution {
  id: string;
  original_professional_id: string;
  original_professional_name: string;
  substitute_professional_id: string;
  substitute_professional_name: string;
  class_id: string;
  class_name: string;
  start_date: string;
  end_date: string | null;
  reason: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

const ABSENCE_TYPES = {
  license: 'Licença',
  vacation: 'Férias',
  sick_leave: 'Atestado Médico',
  other: 'Outro',
};

export default function StaffManagement() {
  const { data: userProfile } = useUserProfile();
  useSchools(userProfile?.tenant_id || ''); // Dados de escolas não usados diretamente
  const { data: classesData } = useClasses({
    tenantId: userProfile?.tenant_id || '',
    page: 1,
    pageSize: 1000,
  });

  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());

  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [substitutionDialogOpen, setSubstitutionDialogOpen] = useState(false);

  const [formProfessionalId, setFormProfessionalId] = useState<string>('');
  const [formClassId, setFormClassId] = useState<string>('');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formWeeklyHours, setFormWeeklyHours] = useState<string>('');
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');

  const [formAbsenceType, setFormAbsenceType] = useState<string>('sick_leave');
  const [formAbsenceReason, setFormAbsenceReason] = useState<string>('');
  const [formAbsenceStartDate, setFormAbsenceStartDate] = useState<string>('');
  const [formAbsenceEndDate, setFormAbsenceEndDate] = useState<string>('');

  const [formOriginalProfessionalId, setFormOriginalProfessionalId] = useState<string>('');
  const [formSubstituteProfessionalId, setFormSubstituteProfessionalId] = useState<string>('');
  const [formSubstitutionClassId, setFormSubstitutionClassId] = useState<string>('');
  const [formSubstitutionReason, setFormSubstitutionReason] = useState<string>('');
  const [formSubstitutionStartDate, setFormSubstitutionStartDate] = useState<string>('');
  const [formSubstitutionEndDate, setFormSubstitutionEndDate] = useState<string>('');

  const [professionals, setProfessionals] = useState<Array<{ id: string; full_name: string; professional_role: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; subject_name: string }>>([]);

  useEffect(() => {
    if (userProfile?.tenant_id) {
      loadData();
      loadProfessionals();
      loadSubjects();
    }
  }, [userProfile, academicYear]);

  async function loadProfessionals() {
    if (!userProfile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, full_name, professional_role')
        .eq('tenant_id', userProfile.tenant_id)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar profissionais:', error);
    }
  }

  async function loadSubjects() {
    if (!userProfile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, subject_name')
        .eq('tenant_id', userProfile.tenant_id)
        .eq('is_active', true)
        .order('subject_name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar disciplinas:', error);
    }
  }

  async function loadData() {
    if (!userProfile?.tenant_id) return;

    try {
      setLoading(true);

      // Buscar alocações
      const { data: allocationsData, error: allocationsError } = await supabase
        .from('professional_allocations')
        .select(`
          id,
          professional_id,
          class_id,
          subject_id,
          academic_year,
          weekly_hours,
          start_date,
          end_date,
          status,
          professionals:professional_id(full_name),
          classes:class_id(class_name),
          subjects:subject_id(subject_name)
        `)
        .eq('academic_year', academicYear)
        .order('start_date', { ascending: false });

      if (allocationsError) throw allocationsError;

      setAllocations(
        (allocationsData || []).map((a: any) => ({
          id: a.id,
          professional_id: a.professional_id,
          professional_name: (a.professionals as any)?.full_name || 'N/A',
          class_id: a.class_id,
          class_name: (a.classes as any)?.class_name || 'N/A',
          subject_id: a.subject_id,
          subject_name: (a.subjects as any)?.subject_name || null,
          academic_year: a.academic_year,
          weekly_hours: a.weekly_hours,
          start_date: a.start_date,
          end_date: a.end_date,
          status: a.status,
          created_at: a.created_at,
        }))
      );

      // Buscar afastamentos
      const { data: absencesData, error: absencesError } = await supabase
        .from('professional_absences')
        .select(`
          id,
          professional_id,
          absence_type,
          start_date,
          end_date,
          reason,
          document_url,
          status,
          professionals:professional_id(full_name)
        `)
        .order('start_date', { ascending: false })
        .limit(100);

      if (absencesError) throw absencesError;

      setAbsences(
        (absencesData || []).map((a: any) => ({
          id: a.id,
          professional_id: a.professional_id,
          professional_name: (a.professionals as any)?.full_name || 'N/A',
          absence_type: a.absence_type,
          start_date: a.start_date,
          end_date: a.end_date,
          reason: a.reason,
          document_url: a.document_url,
          status: a.status,
          created_at: a.created_at,
        }))
      );

      // Buscar substituições
      const { data: substitutionsData, error: substitutionsError } = await supabase
        .from('professional_substitutions')
        .select(`
          id,
          original_professional_id,
          substitute_professional_id,
          class_id,
          start_date,
          end_date,
          reason,
          status,
          original_professional:original_professional_id(full_name),
          substitute_professional:substitute_professional_id(full_name),
          classes:class_id(class_name)
        `)
        .order('start_date', { ascending: false })
        .limit(100);

      if (substitutionsError) throw substitutionsError;

      setSubstitutions(
        (substitutionsData || []).map((s: any) => ({
          id: s.id,
          original_professional_id: s.original_professional_id,
          original_professional_name: (s.original_professional as any)?.full_name || 'N/A',
          substitute_professional_id: s.substitute_professional_id,
          substitute_professional_name: (s.substitute_professional as any)?.full_name || 'N/A',
          class_id: s.class_id,
          class_name: (s.classes as any)?.class_name || 'N/A',
          start_date: s.start_date,
          end_date: s.end_date,
          reason: s.reason,
          status: s.status,
          created_at: s.created_at,
        }))
      );
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados de gestão de pessoal');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAllocation() {
    if (!formProfessionalId || !formClassId || !formWeeklyHours || !formStartDate || !userProfile?.tenant_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('professional_allocations')
        .insert({
          professional_id: formProfessionalId,
          class_id: formClassId,
          subject_id: formSubjectId || null,
          academic_year: academicYear,
          weekly_hours: parseFloat(formWeeklyHours),
          start_date: formStartDate,
          end_date: formEndDate || null,
          status: 'active',
          tenant_id: userProfile.tenant_id,
        });

      if (error) throw error;

      toast.success('Alocação criada com sucesso');
      setAllocationDialogOpen(false);
      resetAllocationForm();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar alocação');
    }
  }

  async function handleCreateAbsence() {
    if (!formProfessionalId || !formAbsenceStartDate || !formAbsenceEndDate || !formAbsenceReason || !userProfile?.tenant_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('professional_absences')
        .insert({
          professional_id: formProfessionalId,
          absence_type: formAbsenceType,
          start_date: formAbsenceStartDate,
          end_date: formAbsenceEndDate,
          reason: formAbsenceReason,
          status: 'pending',
          tenant_id: userProfile.tenant_id,
        });

      if (error) throw error;

      toast.success('Afastamento registrado com sucesso');
      setAbsenceDialogOpen(false);
      resetAbsenceForm();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar afastamento');
    }
  }

  async function handleCreateSubstitution() {
    if (!formOriginalProfessionalId || !formSubstituteProfessionalId || !formSubstitutionClassId || !formSubstitutionStartDate || !formSubstitutionReason || !userProfile?.tenant_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('professional_substitutions')
        .insert({
          original_professional_id: formOriginalProfessionalId,
          substitute_professional_id: formSubstituteProfessionalId,
          class_id: formSubstitutionClassId,
          start_date: formSubstitutionStartDate,
          end_date: formSubstitutionEndDate || null,
          reason: formSubstitutionReason,
          status: 'active',
          tenant_id: userProfile.tenant_id,
        });

      if (error) throw error;

      toast.success('Substituição criada com sucesso');
      setSubstitutionDialogOpen(false);
      resetSubstitutionForm();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar substituição');
    }
  }

  function resetAllocationForm() {
    setFormProfessionalId('');
    setFormClassId('');
    setFormSubjectId('');
    setFormWeeklyHours('');
    setFormStartDate('');
    setFormEndDate('');
  }

  function resetAbsenceForm() {
    setFormProfessionalId('');
    setFormAbsenceType('sick_leave');
    setFormAbsenceReason('');
    setFormAbsenceStartDate('');
    setFormAbsenceEndDate('');
  }

  function resetSubstitutionForm() {
    setFormOriginalProfessionalId('');
    setFormSubstituteProfessionalId('');
    setFormSubstitutionClassId('');
    setFormSubstitutionReason('');
    setFormSubstitutionStartDate('');
    setFormSubstitutionEndDate('');
  }

  const filteredClasses = classesData?.data || [];
  const teachers = professionals.filter(p => 
    p.professional_role === 'professor' || p.professional_role === 'professor_aee'
  );

  const appUserProfile = userProfile ? {
    id: userProfile.tenant_id || '',
    full_name: userProfile.full_name,
    email: userProfile.email,
    role: userProfile.role || 'teacher',
    tenant_id: userProfile.tenant_id,
    network_name: (userProfile.tenant as any)?.network_name || null,
    school_name: (userProfile.school as any)?.school_name || null,
  } : undefined;

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
            <h1 className="text-3xl font-bold text-foreground">Gestão de Servidores</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie alocações, afastamentos e substituições de profissionais
            </p>
          </div>
          <div>
            <Label htmlFor="academicYear" className="mr-2">Ano Letivo:</Label>
            <Input
              id="academicYear"
              type="number"
              value={academicYear}
              onChange={(e) => setAcademicYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="w-32 inline-block"
            />
          </div>
        </div>

        <Tabs defaultValue="allocations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="allocations">
              <Users className="h-4 w-4 mr-2" />
              Alocações
            </TabsTrigger>
            <TabsTrigger value="absences">
              <Calendar className="h-4 w-4 mr-2" />
              Afastamentos
            </TabsTrigger>
            <TabsTrigger value="substitutions">
              <Clock className="h-4 w-4 mr-2" />
              Substituições
            </TabsTrigger>
          </TabsList>

          {/* Alocações */}
          <TabsContent value="allocations">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Alocações de Professores</CardTitle>
                <Button onClick={() => setAllocationDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Alocação
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Carregando...</p>
                ) : allocations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma alocação encontrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {allocations.map((allocation) => (
                      <div key={allocation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{allocation.professional_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {allocation.class_name}
                            {allocation.subject_name && ` • ${allocation.subject_name}`}
                            {` • ${allocation.weekly_hours}h semanais`}
                          </p>
                        </div>
                        <Badge
                          className={
                            allocation.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }
                        >
                          {allocation.status === 'active' ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Afastamentos */}
          <TabsContent value="absences">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Afastamentos</CardTitle>
                <Button onClick={() => setAbsenceDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Afastamento
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Carregando...</p>
                ) : absences.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum afastamento registrado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {absences.map((absence) => (
                      <div key={absence.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{absence.professional_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {ABSENCE_TYPES[absence.absence_type as keyof typeof ABSENCE_TYPES]} • 
                            {` ${format(new Date(absence.start_date), "dd/MM/yyyy", { locale: ptBR })} - ${format(new Date(absence.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                          </p>
                          {absence.reason && (
                            <p className="text-xs text-muted-foreground mt-1">{absence.reason}</p>
                          )}
                        </div>
                        <Badge
                          className={
                            absence.status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : absence.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }
                        >
                          {absence.status === 'approved' ? 'Aprovado' : absence.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Substituições */}
          <TabsContent value="substitutions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Substituições</CardTitle>
                <Button onClick={() => setSubstitutionDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Substituição
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Carregando...</p>
                ) : substitutions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma substituição registrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {substitutions.map((substitution) => (
                      <div key={substitution.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {substitution.original_professional_name} → {substitution.substitute_professional_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {substitution.class_name} • 
                            {` ${format(new Date(substitution.start_date), "dd/MM/yyyy", { locale: ptBR })}`}
                            {substitution.end_date && ` - ${format(new Date(substitution.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                          </p>
                          {substitution.reason && (
                            <p className="text-xs text-muted-foreground mt-1">{substitution.reason}</p>
                          )}
                        </div>
                        <Badge
                          className={
                            substitution.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : substitution.status === 'completed'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }
                        >
                          {substitution.status === 'active' ? 'Ativa' : substitution.status === 'completed' ? 'Concluída' : 'Cancelada'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Alocação */}
      <Dialog open={allocationDialogOpen} onOpenChange={setAllocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Alocação</DialogTitle>
            <DialogDescription>
              Aloque um profissional a uma turma/disciplina
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="professional">Profissional *</Label>
              <Select value={formProfessionalId} onValueChange={setFormProfessionalId}>
                <SelectTrigger id="professional">
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.full_name} ({prof.professional_role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="class">Turma *</Label>
              <Select value={formClassId} onValueChange={setFormClassId}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject">Disciplina (Opcional)</Label>
              <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem disciplina específica</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weeklyHours">Carga Horária Semanal (h) *</Label>
                <Input
                  id="weeklyHours"
                  type="number"
                  step="0.5"
                  value={formWeeklyHours}
                  onChange={(e) => setFormWeeklyHours(e.target.value)}
                  placeholder="Ex: 20"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Data Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="endDate">Data Fim (Opcional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setAllocationDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAllocation}>
                Criar Alocação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Afastamento */}
      <Dialog open={absenceDialogOpen} onOpenChange={setAbsenceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Afastamento</DialogTitle>
            <DialogDescription>
              Registre um afastamento de profissional
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="absenceProfessional">Profissional *</Label>
              <Select value={formProfessionalId} onValueChange={setFormProfessionalId}>
                <SelectTrigger id="absenceProfessional">
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="absenceType">Tipo de Afastamento *</Label>
              <Select value={formAbsenceType} onValueChange={setFormAbsenceType}>
                <SelectTrigger id="absenceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ABSENCE_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="absenceStartDate">Data Início *</Label>
                <Input
                  id="absenceStartDate"
                  type="date"
                  value={formAbsenceStartDate}
                  onChange={(e) => setFormAbsenceStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="absenceEndDate">Data Fim *</Label>
                <Input
                  id="absenceEndDate"
                  type="date"
                  value={formAbsenceEndDate}
                  onChange={(e) => setFormAbsenceEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="absenceReason">Motivo *</Label>
              <Textarea
                id="absenceReason"
                value={formAbsenceReason}
                onChange={(e) => setFormAbsenceReason(e.target.value)}
                rows={3}
                placeholder="Descreva o motivo do afastamento..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setAbsenceDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAbsence}>
                Registrar Afastamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Substituição */}
      <Dialog open={substitutionDialogOpen} onOpenChange={setSubstitutionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Substituição</DialogTitle>
            <DialogDescription>
              Registre uma substituição de professor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="originalProfessional">Professor Original *</Label>
              <Select value={formOriginalProfessionalId} onValueChange={setFormOriginalProfessionalId}>
                <SelectTrigger id="originalProfessional">
                  <SelectValue placeholder="Selecione o professor" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="substituteProfessional">Professor Substituto *</Label>
              <Select value={formSubstituteProfessionalId} onValueChange={setFormSubstituteProfessionalId}>
                <SelectTrigger id="substituteProfessional">
                  <SelectValue placeholder="Selecione o substituto" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.filter(p => p.id !== formOriginalProfessionalId).map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="substitutionClass">Turma *</Label>
              <Select value={formSubstitutionClassId} onValueChange={setFormSubstitutionClassId}>
                <SelectTrigger id="substitutionClass">
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="substitutionStartDate">Data Início *</Label>
                <Input
                  id="substitutionStartDate"
                  type="date"
                  value={formSubstitutionStartDate}
                  onChange={(e) => setFormSubstitutionStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="substitutionEndDate">Data Fim (Opcional)</Label>
                <Input
                  id="substitutionEndDate"
                  type="date"
                  value={formSubstitutionEndDate}
                  onChange={(e) => setFormSubstitutionEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="substitutionReason">Motivo *</Label>
              <Textarea
                id="substitutionReason"
                value={formSubstitutionReason}
                onChange={(e) => setFormSubstitutionReason(e.target.value)}
                rows={3}
                placeholder="Descreva o motivo da substituição..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setSubstitutionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateSubstitution}>
                Criar Substituição
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

