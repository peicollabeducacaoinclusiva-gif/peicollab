// src/pages/EvaluationSchedule.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/shared/PageLayout";
import { CalendarIcon, Plus, Edit2, Trash2, Save, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EvaluationSchedule {
  id: string;
  cycle_number: number;
  cycle_name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  evaluation_deadline: string;
  is_active: boolean;
  auto_schedule: boolean;
  notification_days_before: number;
}

export default function EvaluationSchedule() {
  const [schedules, setSchedules] = useState<EvaluationSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<EvaluationSchedule | null>(null);
  const { toast } = useToast();

  // Form state
  const [cycleNumber, setCycleNumber] = useState(1);
  const [cycleName, setCycleName] = useState("I Ciclo");
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [evaluationDeadline, setEvaluationDeadline] = useState<Date>();
  const [notificationDays, setNotificationDays] = useState(7);

  useEffect(() => {
    console.log('🎯 EvaluationSchedule montado');
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    console.log('📥 Carregando cronogramas...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ Usuário não autenticado');
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        console.log('❌ Perfil não encontrado');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('evaluation_schedules')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .order('academic_year', { ascending: false })
        .order('cycle_number', { ascending: true });

      console.log('📊 Cronogramas recebidos:', data);
      console.log('❌ Erro:', error);

      if (error) {
        console.error('Erro ao carregar cronogramas:', error);
      }
      
      setSchedules(data || []);
    } catch (error: any) {
      console.error('Exceção ao carregar cronogramas:', error);
    } finally {
      setIsLoading(false);
      console.log('✅ Carregamento finalizado');
    }
  };

  const handleSaveSchedule = async () => {
    if (!startDate || !endDate || !evaluationDeadline) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todas as datas.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, school_id')
        .eq('id', user.id)
        .single();

      const scheduleData = {
        tenant_id: profile?.tenant_id,
        school_id: profile?.school_id,
        cycle_number: cycleNumber,
        cycle_name: cycleName,
        academic_year: academicYear,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        evaluation_deadline: format(evaluationDeadline, 'yyyy-MM-dd'),
        is_active: true,
        auto_schedule: true,
        notification_days_before: notificationDays,
        created_by: user.id,
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('evaluation_schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id);

        if (error) throw error;

        toast({
          title: "Cronograma atualizado",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('evaluation_schedules')
          .insert([scheduleData]);

        if (error) throw error;

        toast({
          title: "Cronograma criado",
          description: "O cronograma de avaliações foi configurado.",
        });
      }

      loadSchedules();
      resetForm();
      setIsCreating(false);
      setEditingSchedule(null);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar cronograma",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (schedule: EvaluationSchedule) => {
    setEditingSchedule(schedule);
    setCycleNumber(schedule.cycle_number);
    setCycleName(schedule.cycle_name);
    setAcademicYear(schedule.academic_year);
    setStartDate(new Date(schedule.start_date));
    setEndDate(new Date(schedule.end_date));
    setEvaluationDeadline(new Date(schedule.evaluation_deadline));
    setNotificationDays(schedule.notification_days_before);
    setIsCreating(true);
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cronograma?')) return;

    try {
      const { error } = await supabase
        .from('evaluation_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Cronograma excluído",
        description: "O cronograma foi removido.",
      });

      loadSchedules();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCycleNumber(1);
    setCycleName("I Ciclo");
    setAcademicYear(new Date().getFullYear().toString());
    setStartDate(undefined);
    setEndDate(undefined);
    setEvaluationDeadline(undefined);
    setNotificationDays(7);
  };

  const getCycleNames = (num: number) => {
    const names: Record<number, string> = {
      1: "I Ciclo",
      2: "II Ciclo",
      3: "III Ciclo",
    };
    return names[num] || `${num}º Ciclo`;
  };

  console.log('🖥️ Renderizando EvaluationSchedule', { isLoading, schedules: schedules.length });

  if (isLoading) {
    return (
      <PageLayout title="Cronograma de Avaliações">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Cronograma de Avaliações">
      <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cronograma de Avaliações</h1>
          <p className="text-muted-foreground">
            Configure os ciclos de avaliação dos PEIs
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ciclo
        </Button>
      </div>

      {/* Formulário de Criação/Edição */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSchedule ? 'Editar Cronograma' : 'Novo Cronograma'}
            </CardTitle>
            <CardDescription>
              Configure o período e prazos de avaliação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cycleNumber">Número do Ciclo</Label>
                <Input
                  id="cycleNumber"
                  type="number"
                  min="1"
                  max="3"
                  value={cycleNumber}
                  onChange={(e) => {
                    const num = parseInt(e.target.value);
                    setCycleNumber(num);
                    setCycleName(getCycleNames(num));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycleName">Nome do Ciclo</Label>
                <Input
                  id="cycleName"
                  value={cycleName}
                  onChange={(e) => setCycleName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicYear">Ano Letivo</Label>
              <Input
                id="academicYear"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Término</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Prazo de Avaliação</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {evaluationDeadline
                        ? format(evaluationDeadline, "dd/MM/yyyy", { locale: ptBR })
                        : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={evaluationDeadline}
                      onSelect={setEvaluationDeadline}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notificationDays">
                Notificar professores (dias antes)
              </Label>
              <Input
                id="notificationDays"
                type="number"
                min="1"
                max="30"
                value={notificationDays}
                onChange={(e) => setNotificationDays(parseInt(e.target.value))}
              />
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setEditingSchedule(null);
                  resetForm();
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveSchedule} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Cronogramas */}
      <Card>
        <CardHeader>
          <CardTitle>Cronogramas Configurados</CardTitle>
          <CardDescription>
            Ciclos de avaliação por ano letivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum cronograma configurado</p>
              <p className="text-sm mt-2">
                Clique em "Novo Ciclo" para criar o primeiro cronograma de avaliações.
              </p>
              <Button 
                className="mt-4"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Cronograma
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 border rounded-lg flex items-center justify-between hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">{schedule.cycle_name}</Badge>
                      <Badge variant="outline">{schedule.academic_year}</Badge>
                      {schedule.is_active && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Início</p>
                        <p className="font-medium">
                          {format(new Date(schedule.start_date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Término</p>
                        <p className="font-medium">
                          {format(new Date(schedule.end_date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prazo Avaliação</p>
                        <p className="font-medium">
                          {format(new Date(schedule.evaluation_deadline), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(schedule)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </PageLayout>
  );
}
