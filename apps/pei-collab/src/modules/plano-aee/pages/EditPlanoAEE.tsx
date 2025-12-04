import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@pei/database';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';;
import { Save, ArrowLeft, Eye, Target, Calendar, Users, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoalsList } from '../components/aee/Goals/GoalsList';
import { QuickRecord } from '../components/aee/Attendance/QuickRecord';
import { CoTeachingSessionsList } from '../components/aee/CoTeaching/CoTeachingSessionsList';
import { MaterialProductionList } from '../components/aee/Materials/MaterialProductionList';
import { MaterialUsageLogs } from '../components/aee/Materials/MaterialUsageLogs';
import { ThemeToggle } from '../components/ThemeToggle';

export default function EditPlanoAEE() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plano, setPlano] = useState<any>(null);

  useEffect(() => {
    if (id) loadPlano();
  }, [id]);

  const loadPlano = async () => {
    try {
      const { data, error } = await supabase
        .from('plano_aee')
        .select(`
          *,
          student:students(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPlano(data);
    } catch (error) {
      console.error('Erro ao carregar plano:', error);
      alert('Erro ao carregar plano');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('plano_aee')
        .update({
          anamnesis_data: plano.anamnesis_data,
          school_complaint: plano.school_complaint,
          family_complaint: plano.family_complaint,
          learning_barriers: plano.learning_barriers,
          resources: plano.resources,
          adaptations: plano.adaptations,
          teaching_objectives: plano.teaching_objectives,
          evaluation_methodology: plano.evaluation_methodology,
          follow_ups: plano.follow_ups,
          referrals: plano.referrals,
          family_guidance: plano.family_guidance,
          school_guidance: plano.school_guidance,
          other_guidance: plano.other_guidance,
        })
        .eq('id', id);

      if (error) throw error;
      alert('Plano salvo com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!plano) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Plano não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Editar Plano de AEE
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Aluno: {plano.student.full_name}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <ThemeToggle />
              <Link to={`/view/${id}`}>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
              </Link>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Sistema de Tabs */}
        <Tabs defaultValue="dados-basicos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dados-basicos">Dados Básicos</TabsTrigger>
            <TabsTrigger value="metas-atendimentos">
              <Target className="mr-2 h-4 w-4" />
              Metas e Atendimentos
            </TabsTrigger>
            <TabsTrigger value="co-ensino">
              <Users className="mr-2 h-4 w-4" />
              Co-ensino
            </TabsTrigger>
            <TabsTrigger value="materiais">
              <FileText className="mr-2 h-4 w-4" />
              Materiais
            </TabsTrigger>
            <TabsTrigger value="avaliacoes">
              <Calendar className="mr-2 h-4 w-4" />
              Avaliações
            </TabsTrigger>
          </TabsList>

          {/* Aba 1: Dados Básicos (formulário original) */}
          <TabsContent value="dados-basicos" className="space-y-6">
            {/* 1. Anamnese */}
            <Card>
            <CardHeader>
              <CardTitle>1. Anamnese</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Histórico Médico
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    rows={4}
                    placeholder="Histórico médico do aluno..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Histórico de Desenvolvimento
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    rows={4}
                    placeholder="Desenvolvimento motor, cognitivo, social..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Queixas */}
          <Card>
            <CardHeader>
              <CardTitle>2. Queixas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Queixa da Escola
                  </label>
                  <textarea
                    value={plano.school_complaint || ''}
                    onChange={(e) =>
                      setPlano({ ...plano, school_complaint: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Queixa da Família
                  </label>
                  <textarea
                    value={plano.family_complaint || ''}
                    onChange={(e) =>
                      setPlano({ ...plano, family_complaint: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Barreiras de Aprendizagem */}
          <Card>
            <CardHeader>
              <CardTitle>3. Barreiras de Aprendizagem</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                placeholder="Identifique as principais barreiras que o aluno enfrenta..."
              />
            </CardContent>
          </Card>

          {/* 4. Recursos e Adaptações */}
          <Card>
            <CardHeader>
              <CardTitle>4. Recursos e Adaptações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Recursos Necessários
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    placeholder="Materiais, tecnologias assistivas, etc..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Adaptações Curriculares
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    placeholder="Adaptações necessárias no currículo..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Objetivos de Ensino */}
          <Card>
            <CardHeader>
              <CardTitle>5. Objetivos de Ensino</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={6}
                placeholder="Liste os objetivos a serem alcançados com o aluno..."
              />
            </CardContent>
          </Card>

          {/* 6. Orientações */}
          <Card>
            <CardHeader>
              <CardTitle>6. Orientações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Orientações para a Família
                  </label>
                  <textarea
                    value={plano.family_guidance || ''}
                    onChange={(e) =>
                      setPlano({ ...plano, family_guidance: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Orientações para a Escola
                  </label>
                  <textarea
                    value={plano.school_guidance || ''}
                    onChange={(e) =>
                      setPlano({ ...plano, school_guidance: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

            {/* Fixed Save Button para dados básicos */}
            <div className="sticky bottom-0 bg-white border-t p-4 mt-6 rounded-lg shadow-lg">
              <div className="flex justify-end gap-4">
                <Link to="/">
                  <Button variant="outline">Cancelar</Button>
                </Link>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Dados Básicos'}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Aba 2: Metas e Atendimentos (NOVO - V2.0) */}
          <TabsContent value="metas-atendimentos" className="space-y-6">
            {/* Registro Rápido de Atendimento */}
            <QuickRecord
              planId={id!}
              studentId={plano.student_id}
              studentName={plano.student.full_name}
            />

            {/* Lista de Metas SMART */}
            <GoalsList planId={id!} />
          </TabsContent>

          {/* Aba 3: Co-ensino (NOVO - V2.1) */}
          <TabsContent value="co-ensino" className="space-y-6">
            <CoTeachingSessionsList
              planId={id!}
              studentId={plano.student_id}
            />
          </TabsContent>

          {/* Aba 3.5: Materiais (NOVO - V2.1) */}
          <TabsContent value="materiais" className="space-y-6">
            <MaterialProductionList
              planId={id!}
              studentId={plano.student_id}
            />
            <MaterialUsageLogs
              planId={id!}
              studentId={plano.student_id}
            />
          </TabsContent>

          {/* Aba 4: Avaliações (Ciclos - existente) */}
          <TabsContent value="avaliacoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Avaliações Cíclicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* I Ciclo */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">I Ciclo</h3>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md"
                      rows={4}
                      placeholder="Avaliação do I Ciclo..."
                    />
                  </div>

                  {/* II Ciclo */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">II Ciclo</h3>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md"
                      rows={4}
                      placeholder="Avaliação do II Ciclo..."
                    />
                  </div>

                  {/* III Ciclo */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">III Ciclo</h3>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md"
                      rows={4}
                      placeholder="Avaliação do III Ciclo..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}


