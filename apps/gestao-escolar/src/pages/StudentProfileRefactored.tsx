import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppHeader } from '@pei/ui';
import { useCompleteProfile, useRiskIndicators, useSuggestions, useActivityTimeline } from '../hooks/useSuperficha';
import { IntelligentSummary } from '../components/superficha/IntelligentSummary';
import { ConsolidatedStudentForm } from '../components/superficha/ConsolidatedStudentForm';
import { StudentAcademicHistory } from '../components/student/StudentAcademicHistory';
import { StudentDocuments } from '../components/student/StudentDocuments';
import { StudentAccessibility } from '../components/student/StudentAccessibility';
import { QuickPEIAccess } from '../components/student/QuickPEIAccess';
import { QuickAEEAccess } from '../components/student/QuickAEEAccess';
import { StudentBreadcrumb } from '../components/superficha/BreadcrumbNav';
import { ActivityTimeline } from '../components/superficha/ActivityTimeline';
import { SkeletonLoader } from '../components/superficha/SkeletonLoader';
import { toast } from 'sonner';
import { useState } from 'react';

export default function StudentProfileRefactored() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  const { data: profile, isLoading: profileLoading, error: profileError } = useCompleteProfile(studentId || null);
  const { data: risks, isLoading: risksLoading } = useRiskIndicators(studentId || null);
  const { data: suggestions, isLoading: suggestionsLoading } = useSuggestions(studentId || null);
  const { data: timeline, isLoading: timelineLoading } = useActivityTimeline(studentId || null, 20);

  if (!studentId) {
    toast.error('ID do estudante não fornecido');
    navigate('/students');
    return null;
  }

  const isLoading = profileLoading || risksLoading || suggestionsLoading || timelineLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <SkeletonLoader variant="profile" />
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-destructive mb-4">Erro ao carregar dados do estudante</p>
              <Button onClick={() => navigate('/students')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Lista
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 space-y-4">
          <StudentBreadcrumb
            studentName={profile?.student?.name || 'Estudante'}
            schoolName={profile?.school?.school_name}
          />
        </div>

        {/* Modo Resumo Inteligente */}
        {viewMode === 'summary' && (
          <IntelligentSummary
            profile={profile}
            risks={risks || undefined}
            suggestions={suggestions || undefined}
            studentId={studentId}
          />
        )}

        {/* Modo Detalhado */}
        {viewMode === 'detailed' && (
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList>
              <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="history">Histórico Escolar</TabsTrigger>
              <TabsTrigger value="nee">Necessidades Especiais</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="accessibility">Acessibilidade</TabsTrigger>
              <TabsTrigger value="pei">PEI</TabsTrigger>
              <TabsTrigger value="aee">AEE</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <ConsolidatedStudentForm profile={profile} studentId={studentId} />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {/* Usar enrollments_history do profile */}
              <div className="space-y-4">
                {profile.enrollments_history && profile.enrollments_history.length > 0 ? (
                  profile.enrollments_history.map((enrollment, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <p><strong>Ano Letivo:</strong> {enrollment.academic_year}</p>
                      {enrollment.grade && <p><strong>Série:</strong> {enrollment.grade}</p>}
                      {enrollment.shift && <p><strong>Turno:</strong> {enrollment.shift}</p>}
                      <p><strong>Status:</strong> {enrollment.status}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Nenhum histórico encontrado</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="nee" className="space-y-4">
              {/* Renderizar NEE do profile */}
              <div className="space-y-4">
                {profile.student.necessidades_especiais && (
                  <div>
                    <p><strong>Necessidades Especiais:</strong> Sim</p>
                    {profile.student.tipo_necessidade && (
                      <p><strong>Tipos:</strong> {profile.student.tipo_necessidade.join(', ')}</p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              {/* Usar documents do profile */}
              <div className="space-y-4">
                {profile.documents && profile.documents.length > 0 ? (
                  profile.documents.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <p><strong>Título:</strong> {doc.title}</p>
                      <p><strong>Tipo:</strong> {doc.document_type}</p>
                      <p><strong>Data:</strong> {new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Nenhum documento encontrado</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="accessibility" className="space-y-4">
              {/* Renderizar accessibility_indicators do profile */}
              <div className="space-y-4">
                <div>
                  <p><strong>Possui PEI:</strong> {profile.accessibility_indicators.has_pei ? 'Sim' : 'Não'}</p>
                  <p><strong>Possui AEE:</strong> {profile.accessibility_indicators.has_aee ? 'Sim' : 'Não'}</p>
                  <p><strong>Possui Adaptações:</strong> {profile.accessibility_indicators.has_adaptations ? 'Sim' : 'Não'}</p>
                  <p><strong>Necessita Atenção Especial:</strong> {profile.accessibility_indicators.needs_special_attention ? 'Sim' : 'Não'}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pei" className="space-y-4">
              {profile.active_pei ? (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <p><strong>Status:</strong> {profile.active_pei.status}</p>
                    <p><strong>Versão:</strong> {profile.active_pei.version_number}</p>
                    {profile.active_pei.goals && (
                      <p><strong>Objetivos:</strong> {profile.active_pei.goals.length}</p>
                    )}
                    {profile.active_pei.barriers && (
                      <p><strong>Barreiras:</strong> {profile.active_pei.barriers.length}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum PEI ativo encontrado</p>
              )}
            </TabsContent>

            <TabsContent value="aee" className="space-y-4">
              {profile.active_aee ? (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <p><strong>Status:</strong> {profile.active_aee.status}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum AEE ativo encontrado</p>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <ActivityTimeline activities={timeline || []} />
            </TabsContent>
          </Tabs>
        )}

        {/* Botões para alternar modo */}
        <div className="mt-6 flex gap-2">
          <Button
            variant={viewMode === 'summary' ? 'default' : 'outline'}
            onClick={() => setViewMode('summary')}
          >
            Resumo Inteligente
          </Button>
          <Button
            variant={viewMode === 'detailed' ? 'default' : 'outline'}
            onClick={() => setViewMode('detailed')}
          >
            Visualização Detalhada
          </Button>
        </div>
      </div>
    </div>
  );
}

