import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

// Tipos baseados no schema do banco de dados e em CreatePEI.tsx
interface Barrier {
  id?: string;
  barrier_type: string;
  description: string;
  severity?: 'leve' | 'moderada' | 'severa';
}

interface PEIGoal {
  id?: string;
  barrier_id?: string;
  category?: 'academic' | 'functional';
  description: string;
  target_date?: string;
  progress_level?: 'não iniciada' | 'em andamento' | 'parcialmente alcançada' | 'alcançada';
  progress_score?: number;
  notes?: string;
  strategies?: string[];
  evaluationCriteria?: string;
  resources?: string;
}

interface AccessibilityResource {
  id?: string;
  resource_type: 'Libras' | 'Braille' | 'Tecnologia assistiva' | 'Material adaptado' | 'Apoio visual' | 'Tutor' | 'Outro';
  description: string;
  usage_frequency?: 'Diário' | 'Semanal' | 'Sob demanda' | 'Outro';
}

interface PEIReferral {
  id?: string;
  referred_to: string;
  reason?: string;
  date?: string;
  follow_up?: string;
}

interface StudentData {
  name: string;
  date_of_birth: string;
  father_name?: string;
  mother_name?: string;
  phone?: string;
  email?: string;
}

interface DiagnosisData {
  interests: string;
  specialNeeds: string;
  barriers: Barrier[];
  history: string;
  cid10?: string;
  description?: string;
  abilities?: string;
  aversions?: string;
  barriersComments?: string;
  circumstantial_report?: {
    how_student_learns?: string;
    learning_barriers?: string;
    social_interaction?: string;
    communication?: string;
    attention?: string;
    autonomy?: string;
    behavior?: string;
    emotional_context?: string;
  };
  development_level?: {
    language?: { autonomous?: string[]; with_help?: string[]; not_yet?: string[] };
    reading?: { autonomous?: string[]; with_help?: string[]; not_yet?: string[] };
    writing?: { autonomous?: string[]; with_help?: string[]; not_yet?: string[] };
    logical_reasoning?: { autonomous?: string[]; with_help?: string[]; not_yet?: string[] };
    motor_coordination?: { autonomous?: string[]; with_help?: string[]; not_yet?: string[] };
    social_skills?: { autonomous?: string[]; with_help?: string[]; not_yet?: string[] };
  };
  health_info?: {
    condition_impact?: string;
    curriculum_adaptations?: string[];
    behavioral_adaptations?: string[];
    examples?: string;
  };
}

interface PlanningData {
  goals: PEIGoal[];
  accessibilityResources: AccessibilityResource[];
  curriculum_adaptations?: {
    priority_contents?: string[];
    priority_competencies?: string[];
    differentiated_methodologies?: string[];
    adapted_assessments?: string[];
    content_flexibilization?: string;
    sequence_reorganization?: string;
  };
  intervention_schedule?: Array<{
    period: string;
    actions: string[];
    responsible: string;
    expected_results?: string;
  }>;
}

interface ReferralsData {
  referrals: PEIReferral[];
  observations: string;
}

interface EvaluationData {
  observations?: string;
  progress?: string;
  review_date?: string;
  last_review_date?: string;
  next_review_date?: string;
  overall_progress?: "insatisfatório" | "regular" | "bom" | "excelente";
  goals_evaluation?: string;
  family_feedback?: string;
  adjustments_needed?: string;
  evaluation_criteria?: {
    progress_indicators?: string[];
    examples?: string[];
    measurement_methods?: string[];
  };
  progress_recording?: {
    frequency?: string;
    format?: string;
    responsible?: string;
    next_report_date?: string;
    last_report_date?: string;
  };
  pei_review?: {
    review_frequency?: string;
    review_process?: string;
    participants?: string[];
    last_review_meeting?: string;
    next_review_meeting?: string;
    reformulation_needed?: boolean;
    reformulation_reason?: string;
  };
  signatures?: Array<{
    name: string;
    role: string;
    signature_date?: string;
    cpf?: string;
    registration?: string;
  }>;
}

interface ReportViewProps {
  studentData: StudentData | null;
  diagnosisData: DiagnosisData;
  planningData: PlanningData;
  referralsData: ReferralsData;
  evaluationData?: EvaluationData;
  userRole?: string | null;
  tenantId?: string | null;
  schoolId?: string | null;
}

interface ReportIdentification {
  networkName: string;
  schoolName: string;
  logoUrl: string;
}

const ReportView = ({
  studentData,
  diagnosisData,
  planningData,
  referralsData,
  evaluationData,
  userRole,
  tenantId,
  schoolId,
}: ReportViewProps) => {
  const [identification, setIdentification] = useState<ReportIdentification>({
    networkName: "",
    schoolName: "",
    logoUrl: ""
  });
  const [loadingInstitution, setLoadingInstitution] = useState(true);

  // Buscar dados da instituição automaticamente
  useEffect(() => {
    const loadInstitutionData = async () => {
      try {
        setLoadingInstitution(true);
        
        // Buscar dados da rede (tenant)
        if (tenantId) {
          const { data: tenant, error: tenantError } = await supabase
            .from("tenants")
            .select("network_name")
            .eq("id", tenantId)
            .single();
          
          if (tenant && !tenantError) {
            setIdentification(prev => ({ ...prev, networkName: tenant.network_name }));
          }
        }
        
        // Buscar dados da escola
        if (schoolId) {
          const { data: school, error: schoolError } = await supabase
            .from("schools")
            .select("school_name")
            .eq("id", schoolId)
            .single();
          
          if (school && !schoolError) {
            setIdentification(prev => ({ ...prev, schoolName: school.school_name }));
          }
        }
        
        // Buscar logo da escola
        if (tenantId) {
          const { data: files } = await supabase.storage
            .from("school-logos")
            .list(tenantId);

          if (files && files.length > 0) {
            const { data: urlData } = supabase.storage
              .from("school-logos")
              .getPublicUrl(`${tenantId}/${files[0].name}`);
            
            setIdentification(prev => ({ ...prev, logoUrl: urlData.publicUrl }));
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados da instituição:", error);
      } finally {
        setLoadingInstitution(false);
      }
    };

    if (tenantId || schoolId) {
      loadInstitutionData();
    } else {
      setLoadingInstitution(false);
    }
  }, [tenantId, schoolId]);

  const handlePrint = () => {
    window.print();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdentification({ ...identification, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const shouldShowWatermark = userRole !== 'coordinator' && userRole !== 'superadmin';

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6 relative">
      {/* Marca d'água RASCUNHO */}
      {shouldShowWatermark && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 print:block md:block">
          <div className="text-[200px] font-bold text-gray-300/20 rotate-[-45deg] select-none print:text-gray-400/30">
            RASCUNHO
          </div>
        </div>
      )}
      
      {/* Cabeçalho e botão - oculto na impressão */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h3 className="text-lg font-semibold">Relatório Completo do PEI</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Visualização consolidada de todas as seções
          </p>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Card de identificação institucional - oculto na impressão */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Cabeçalho do Documento</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Configure como aparecerá no cabeçalho impresso
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {/* Preview da Logo */}
            <div className="flex-shrink-0">
              <Label htmlFor="logo" className="cursor-pointer">
                <div className="relative h-24 w-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-primary transition-colors overflow-hidden group bg-gray-50 dark:bg-gray-800">
                  {identification.logoUrl ? (
                    <>
                      <img 
                        src={identification.logoUrl} 
                        alt="Logo" 
                        className="h-full w-full object-contain p-1"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Alterar</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <div className="text-gray-400 mb-1">📷</div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Clique para adicionar logo</span>
                    </div>
                  )}
                </div>
              </Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>

            {/* Campos de Texto */}
            <div className="flex-1 space-y-4">
              <div>
                <Label htmlFor="networkName">Nome da Rede</Label>
                <Input
                  id="networkName"
                  value={identification.networkName || "Carregando..."}
                  readOnly
                  className="mt-1.5 font-medium bg-gray-50 dark:bg-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="schoolName">Nome da Escola</Label>
                <Input
                  id="schoolName"
                  value={identification.schoolName || "Carregando..."}
                  readOnly
                  className="mt-1.5 bg-gray-50 dark:bg-gray-900"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cabeçalho Institucional - Visível apenas na impressão */}
      <div className="hidden print:block mb-6">
        <div className="flex items-start gap-4 pb-4 border-b-2 border-black">
          {identification.logoUrl && (
            <div className="flex-shrink-0">
              <img src={identification.logoUrl} alt="Logo" className="h-20 w-20 object-contain border border-gray-300 rounded" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-0.5">{identification.networkName || "Nome da Rede"}</h2>
            <p className="text-base font-medium text-gray-700 mb-2">{identification.schoolName || "Nome da Escola"}</p>
            <p className="text-xs text-gray-600">
              Data de Emissão: {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        
        {/* Título do Documento */}
        <h1 className="text-2xl font-bold text-center my-6">
          Plano Educacional Individualizado
        </h1>
      </div>

      {/* Seção de Identificação do Aluno */}
      <Card className="print:border print:border-gray-300">
        <CardHeader>
          <CardTitle className="text-xl print:text-lg">1. Identificação do Aluno</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Nome Completo:</strong> {studentData?.name || "Não informado"}</p>
          <p><strong>Data de Nascimento:</strong> {studentData?.date_of_birth ? format(new Date(studentData.date_of_birth), "dd/MM/yyyy", { locale: ptBR }) : "Não informado"}</p>
          <p><strong>Idade:</strong> {studentData?.date_of_birth ? `${calculateAge(studentData.date_of_birth)} anos` : "Não informado"}</p>
          <p><strong>Nome do Pai:</strong> {studentData?.father_name || "Não informado"}</p>
          <p><strong>Nome da Mãe:</strong> {studentData?.mother_name || "Não informado"}</p>
          <p><strong>Telefone:</strong> {studentData?.phone || "Não informado"}</p>
          <p><strong>Email:</strong> {studentData?.email || "Não informado"}</p>
        </CardContent>
      </Card>

      <Separator className="print:hidden" />

      {/* Seção de Diagnóstico */}
      <Card className="print:border print:border-gray-300">
        <CardHeader>
          <CardTitle className="text-xl print:text-lg">2. Diagnóstico e Necessidades Educacionais Especiais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-1">Histórico do Estudante:</p>
            <p className="whitespace-pre-wrap">{diagnosisData.history || "Não informado"}</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Interesses do Aluno:</p>
            <p className="whitespace-pre-wrap">{diagnosisData.interests || "Não informado"}</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Necessidades Educacionais Especiais:</p>
            <p className="whitespace-pre-wrap">{diagnosisData.specialNeeds || "Não informado"}</p>
          </div>
          {diagnosisData.cid10 && (
            <div>
              <p className="font-semibold mb-1">CID-10:</p>
              <p className="whitespace-pre-wrap">{diagnosisData.cid10}</p>
            </div>
          )}
          {diagnosisData.description && (
            <div>
              <p className="font-semibold mb-1">Descrição Detalhada do Diagnóstico:</p>
              <p className="whitespace-pre-wrap">{diagnosisData.description}</p>
            </div>
          )}
          <div>
            <p className="font-semibold mb-1">Barreiras Identificadas:</p>
            {diagnosisData.barriers && diagnosisData.barriers.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {diagnosisData.barriers.map((barrier, index) => (
                  <li key={index}>{barrier.barrier_type}: {barrier.description} ({barrier.severity})</li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma barreira identificada.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 🆕 2.1 Relatório Circunstanciado */}
      {diagnosisData.circumstantial_report && Object.values(diagnosisData.circumstantial_report).some(v => v) && (
        <Card className="print:border print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-xl print:text-lg">2.1 Relatório Circunstanciado (RC)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {diagnosisData.circumstantial_report.how_student_learns && (
              <div>
                <p className="font-semibold">Como o Aluno Aprende:</p>
                <p className="whitespace-pre-wrap text-gray-700">{diagnosisData.circumstantial_report.how_student_learns}</p>
              </div>
            )}
            {diagnosisData.circumstantial_report.learning_barriers && (
              <div>
                <p className="font-semibold">Barreiras no Aprendizado:</p>
                <p className="whitespace-pre-wrap text-gray-700">{diagnosisData.circumstantial_report.learning_barriers}</p>
              </div>
            )}
            {diagnosisData.circumstantial_report.social_interaction && (
              <div>
                <p className="font-semibold">Interação Social:</p>
                <p className="whitespace-pre-wrap text-gray-700">{diagnosisData.circumstantial_report.social_interaction}</p>
              </div>
            )}
            {diagnosisData.circumstantial_report.communication && (
              <div>
                <p className="font-semibold">Comunicação:</p>
                <p className="whitespace-pre-wrap text-gray-700">{diagnosisData.circumstantial_report.communication}</p>
              </div>
            )}
            {diagnosisData.circumstantial_report.attention && (
              <div>
                <p className="font-semibold">Atenção e Concentração:</p>
                <p className="whitespace-pre-wrap text-gray-700">{diagnosisData.circumstantial_report.attention}</p>
              </div>
            )}
            {diagnosisData.circumstantial_report.autonomy && (
              <div>
                <p className="font-semibold">Autonomia:</p>
                <p className="whitespace-pre-wrap text-gray-700">{diagnosisData.circumstantial_report.autonomy}</p>
              </div>
            )}
            {diagnosisData.circumstantial_report.behavior && (
              <div>
                <p className="font-semibold">Comportamento:</p>
                <p className="whitespace-pre-wrap text-gray-700">{diagnosisData.circumstantial_report.behavior}</p>
              </div>
            )}
            {diagnosisData.circumstantial_report.emotional_context && (
              <div>
                <p className="font-semibold">Contexto Emocional:</p>
                <p className="whitespace-pre-wrap text-gray-700">{diagnosisData.circumstantial_report.emotional_context}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 🆕 2.2 Nível de Desenvolvimento */}
      {diagnosisData.development_level && (
        <Card className="print:border print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-xl print:text-lg">2.2 Nível de Desenvolvimento e Desempenho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {Object.entries(diagnosisData.development_level).map(([area, data]) => {
              const areaLabels: Record<string, string> = {
                language: 'Linguagem',
                reading: 'Leitura',
                writing: 'Escrita',
                logical_reasoning: 'Raciocínio Lógico',
                motor_coordination: 'Coordenação Motora',
                social_skills: 'Habilidades Sociais',
              };
              
              const hasContent = data && (
                (data.autonomous && data.autonomous.length > 0) ||
                (data.with_help && data.with_help.length > 0) ||
                (data.not_yet && data.not_yet.length > 0)
              );

              if (!hasContent) return null;

              return (
                <div key={area} className="border-l-4 border-primary/60 pl-3">
                  <p className="font-semibold text-primary mb-2">{areaLabels[area]}</p>
                  {data.autonomous && data.autonomous.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-green-700">✅ Com Autonomia:</p>
                      <ul className="list-disc pl-5 text-gray-700">
                        {data.autonomous.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {data.with_help && data.with_help.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-yellow-700">🟡 Com Ajuda:</p>
                      <ul className="list-disc pl-5 text-gray-700">
                        {data.with_help.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {data.not_yet && data.not_yet.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-700">❌ Ainda Não Realiza:</p>
                      <ul className="list-disc pl-5 text-gray-700">
                        {data.not_yet.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 🆕 2.3 Informações de Saúde */}
      {diagnosisData.health_info && Object.values(diagnosisData.health_info).some(v => v && (Array.isArray(v) ? v.length > 0 : true)) && (
        <Card className="print:border print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-xl print:text-lg">2.3 Informações de Saúde e Implicações Curriculares</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {diagnosisData.health_info.condition_impact && (
              <div>
                <p className="font-semibold">Impacto da Condição no Aprendizado:</p>
                <p className="whitespace-pre-wrap text-gray-700">{diagnosisData.health_info.condition_impact}</p>
              </div>
            )}
            {diagnosisData.health_info.curriculum_adaptations && diagnosisData.health_info.curriculum_adaptations.length > 0 && (
              <div>
                <p className="font-semibold">Adaptações Curriculares Necessárias:</p>
                <ul className="list-disc pl-5 text-gray-700">
                  {diagnosisData.health_info.curriculum_adaptations.map((adapt, idx) => (
                    <li key={idx}>{adapt}</li>
                  ))}
                </ul>
              </div>
            )}
            {diagnosisData.health_info.behavioral_adaptations && diagnosisData.health_info.behavioral_adaptations.length > 0 && (
              <div>
                <p className="font-semibold">Adaptações Comportamentais:</p>
                <ul className="list-disc pl-5 text-gray-700">
                  {diagnosisData.health_info.behavioral_adaptations.map((adapt, idx) => (
                    <li key={idx}>{adapt}</li>
                  ))}
                </ul>
              </div>
            )}
            {diagnosisData.health_info.examples && (
              <div>
                <p className="font-semibold">Exemplos Práticos:</p>
                <p className="whitespace-pre-wrap text-gray-700">{diagnosisData.health_info.examples}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator className="print:hidden" />

      {/* Seção de Planejamento */}
      <Card className="print:border print:border-gray-300">
        <CardHeader>
          <CardTitle className="text-xl print:text-lg">3. Planejamento de Acessibilidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-2">Metas Educacionais:</p>
            {planningData.goals && planningData.goals.length > 0 ? (
              <div className="space-y-3">
                {planningData.goals.map((goal, index) => (
                  <div key={index} className="border-l-4 border-l-primary pl-3 py-1">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm flex-1">{index + 1}. {goal.description}</p>
                      {goal.category && (
                        <Badge variant="outline" className="ml-2 text-xs print:bg-white">
                          {goal.category === 'academic' ? '📚 Acadêmica' : '🛠️ Funcional'}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                      {goal.target_date && (
                        <p><strong>Prazo:</strong> {format(new Date(goal.target_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                      )}
                      {goal.progress_level && (
                        <p><strong>Progresso:</strong> {goal.progress_level} ({goal.progress_score || 0}%)</p>
                      )}
                    </div>
                    {goal.strategies && goal.strategies.length > 0 && (
                      <p className="text-xs mt-1"><strong>Estratégias:</strong> {goal.strategies.join('; ')}</p>
                    )}
                    {goal.notes && (
                      <p className="text-xs mt-1 whitespace-pre-wrap"><strong>Observações:</strong> {goal.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma meta definida.</p>
            )}
          </div>
          <div>
            <p className="font-semibold mb-1">Recursos de Acessibilidade:</p>
            {planningData.accessibilityResources && planningData.accessibilityResources.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {planningData.accessibilityResources.map((resource, index) => (
                  <li key={index}>{resource.resource_type}: {resource.description} (Frequência: {resource.usage_frequency})</li>
                ))}
              </ul>
            ) : (
              <p>Nenhum recurso de acessibilidade especificado.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 🆕 3.1 Adequações Curriculares */}
      {planningData.curriculum_adaptations && Object.values(planningData.curriculum_adaptations).some(v => v && (Array.isArray(v) ? v.length > 0 : true)) && (
        <Card className="print:border print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-xl print:text-lg">3.1 Adequações Curriculares Detalhadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {planningData.curriculum_adaptations.priority_contents && planningData.curriculum_adaptations.priority_contents.length > 0 && (
              <div>
                <p className="font-semibold">Conteúdos Prioritários:</p>
                <ul className="list-disc pl-5 text-gray-700">
                  {planningData.curriculum_adaptations.priority_contents.map((content, idx) => (
                    <li key={idx}>{content}</li>
                  ))}
                </ul>
              </div>
            )}
            {planningData.curriculum_adaptations.priority_competencies && planningData.curriculum_adaptations.priority_competencies.length > 0 && (
              <div>
                <p className="font-semibold">Competências Prioritárias:</p>
                <ul className="list-disc pl-5 text-gray-700">
                  {planningData.curriculum_adaptations.priority_competencies.map((comp, idx) => (
                    <li key={idx}>{comp}</li>
                  ))}
                </ul>
              </div>
            )}
            {planningData.curriculum_adaptations.differentiated_methodologies && planningData.curriculum_adaptations.differentiated_methodologies.length > 0 && (
              <div>
                <p className="font-semibold">Metodologias Diferenciadas:</p>
                <ul className="list-disc pl-5 text-gray-700">
                  {planningData.curriculum_adaptations.differentiated_methodologies.map((method, idx) => (
                    <li key={idx}>{method}</li>
                  ))}
                </ul>
              </div>
            )}
            {planningData.curriculum_adaptations.adapted_assessments && planningData.curriculum_adaptations.adapted_assessments.length > 0 && (
              <div>
                <p className="font-semibold">Avaliações Adaptadas:</p>
                <ul className="list-disc pl-5 text-gray-700">
                  {planningData.curriculum_adaptations.adapted_assessments.map((assess, idx) => (
                    <li key={idx}>{assess}</li>
                  ))}
                </ul>
              </div>
            )}
            {planningData.curriculum_adaptations.content_flexibilization && (
              <div>
                <p className="font-semibold">Flexibilização de Conteúdos:</p>
                <p className="whitespace-pre-wrap text-gray-700">{planningData.curriculum_adaptations.content_flexibilization}</p>
              </div>
            )}
            {planningData.curriculum_adaptations.sequence_reorganization && (
              <div>
                <p className="font-semibold">Reorganização da Sequência Didática:</p>
                <p className="whitespace-pre-wrap text-gray-700">{planningData.curriculum_adaptations.sequence_reorganization}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 🆕 3.2 Cronograma de Intervenção */}
      {planningData.intervention_schedule && planningData.intervention_schedule.length > 0 && (
        <Card className="print:border print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-xl print:text-lg">3.2 Cronograma de Intervenção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {planningData.intervention_schedule.map((item, idx) => (
              <div key={idx} className="border-l-4 border-primary/60 pl-3">
                <p className="font-semibold text-primary">{item.period}</p>
                {item.actions && item.actions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-800">Ações:</p>
                    <ul className="list-disc pl-5 text-gray-700">
                      {item.actions.map((action, actionIdx) => (
                        <li key={actionIdx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.responsible && (
                  <p className="mt-2 text-xs"><strong>Responsável:</strong> {item.responsible}</p>
                )}
                {item.expected_results && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-800">Resultados Esperados:</p>
                    <p className="text-gray-700">{item.expected_results}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator className="print:hidden" />

      {/* Seção de Encaminhamentos e Observações */}
      <Card className="print:border print:border-gray-300">
        <CardHeader>
          <CardTitle className="text-xl print:text-lg">4. Encaminhamentos e Observações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-1">Encaminhamentos Profissionais:</p>
            {referralsData.referrals && referralsData.referrals.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {referralsData.referrals.map((referral, index) => (
                  <li key={index}>
                    <p className="font-medium">Para: {referral.referred_to}</p>
                    {referral.reason && <p className="text-xs text-muted-foreground">Motivo: {referral.reason}</p>}
                    {referral.date && <p className="text-xs text-muted-foreground">Data: {format(new Date(referral.date), "dd/MM/yyyy", { locale: ptBR })}</p>}
                    {referral.follow_up && <p className="text-xs text-muted-foreground whitespace-pre-wrap">Acompanhamento: {referral.follow_up}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum encaminhamento profissional registrado.</p>
            )}
          </div>
          <div>
            <p className="font-semibold mb-1">Observações Gerais:</p>
            <p className="whitespace-pre-wrap">{referralsData.observations || "Nenhuma observação geral."}</p>
          </div>
        </CardContent>
      </Card>

      <Separator className="print:hidden" />

      {/* Seção de Comentários da Família */}
      {evaluationData?.family_feedback && (
        <Card className="print:border print:border-gray-300 bg-blue-50/50 print:bg-blue-50">
          <CardHeader>
            <CardTitle className="text-xl print:text-lg flex items-center gap-2">
              <span>👨‍👩‍👧‍👦</span> 5. Comentários da Família
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
              <p className="font-semibold mb-2 text-blue-900">Feedback dos Responsáveis:</p>
              <p className="whitespace-pre-wrap text-gray-700 italic">
                "{evaluationData.family_feedback}"
              </p>
            </div>
            
            {evaluationData.review_date && (
              <div className="text-xs text-muted-foreground text-right">
                Registrado em: {format(new Date(evaluationData.review_date), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 🆕 6. Critérios de Avaliação e Registro de Progresso */}
      {(evaluationData?.evaluation_criteria || evaluationData?.progress_recording) && (
        <Card className="print:border print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-xl print:text-lg">6. Critérios de Avaliação e Registro de Progresso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {evaluationData.evaluation_criteria && (
              <div className="space-y-3">
                {evaluationData.evaluation_criteria.progress_indicators && evaluationData.evaluation_criteria.progress_indicators.length > 0 && (
                  <div>
                    <p className="font-semibold">Indicadores de Progresso:</p>
                    <ul className="list-disc pl-5 text-gray-700">
                      {evaluationData.evaluation_criteria.progress_indicators.map((indicator, idx) => (
                        <li key={idx}>{indicator}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {evaluationData.evaluation_criteria.examples && evaluationData.evaluation_criteria.examples.length > 0 && (
                  <div>
                    <p className="font-semibold">Exemplos de Progresso:</p>
                    <ul className="list-disc pl-5 text-gray-700">
                      {evaluationData.evaluation_criteria.examples.map((example, idx) => (
                        <li key={idx}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {evaluationData.evaluation_criteria.measurement_methods && evaluationData.evaluation_criteria.measurement_methods.length > 0 && (
                  <div>
                    <p className="font-semibold">Métodos de Mensuração:</p>
                    <ul className="list-disc pl-5 text-gray-700">
                      {evaluationData.evaluation_criteria.measurement_methods.map((method, idx) => (
                        <li key={idx}>{method}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {evaluationData.progress_recording && (
              <div className="mt-4 border-t pt-3 space-y-2">
                <p className="font-semibold">Registro de Progresso:</p>
                {evaluationData.progress_recording.frequency && (
                  <p><strong>Frequência:</strong> {evaluationData.progress_recording.frequency}</p>
                )}
                {evaluationData.progress_recording.format && (
                  <p><strong>Formato:</strong> {evaluationData.progress_recording.format === 'descriptive' ? 'Descritivo' : evaluationData.progress_recording.format === 'quantitative' ? 'Quantitativo' : 'Misto'}</p>
                )}
                {evaluationData.progress_recording.responsible && (
                  <p><strong>Responsável:</strong> {evaluationData.progress_recording.responsible}</p>
                )}
                {evaluationData.progress_recording.last_report_date && (
                  <p><strong>Último Relatório:</strong> {format(new Date(evaluationData.progress_recording.last_report_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                )}
                {evaluationData.progress_recording.next_report_date && (
                  <p><strong>Próximo Relatório:</strong> {format(new Date(evaluationData.progress_recording.next_report_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 🆕 7. Revisão e Reformulação do PEI */}
      {evaluationData?.pei_review && (
        <Card className="print:border print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-xl print:text-lg">7. Revisão e Reformulação do PEI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {evaluationData.pei_review.review_frequency && (
              <p><strong>Frequência de Revisão:</strong> {evaluationData.pei_review.review_frequency}</p>
            )}
            {evaluationData.pei_review.review_process && (
              <div>
                <p className="font-semibold">Processo de Revisão:</p>
                <p className="whitespace-pre-wrap text-gray-700">{evaluationData.pei_review.review_process}</p>
              </div>
            )}
            {evaluationData.pei_review.participants && evaluationData.pei_review.participants.length > 0 && (
              <div>
                <p className="font-semibold">Participantes:</p>
                <ul className="list-disc pl-5 text-gray-700">
                  {evaluationData.pei_review.participants.map((participant, idx) => (
                    <li key={idx}>{participant}</li>
                  ))}
                </ul>
              </div>
            )}
            {evaluationData.pei_review.last_review_meeting && (
              <p><strong>Última Reunião:</strong> {format(new Date(evaluationData.pei_review.last_review_meeting), "dd/MM/yyyy", { locale: ptBR })}</p>
            )}
            {evaluationData.pei_review.next_review_meeting && (
              <p><strong>Próxima Reunião:</strong> {format(new Date(evaluationData.pei_review.next_review_meeting), "dd/MM/yyyy", { locale: ptBR })}</p>
            )}
            {evaluationData.pei_review.reformulation_needed && (
              <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <p className="font-semibold text-yellow-900">⚠️ Reformulação Necessária</p>
                {evaluationData.pei_review.reformulation_reason && (
                  <p className="mt-2 text-gray-700">{evaluationData.pei_review.reformulation_reason}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 🆕 8. Assinaturas */}
      {evaluationData?.signatures && evaluationData.signatures.length > 0 && (
        <Card className="print:border print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-xl print:text-lg">8. Assinaturas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluationData.signatures.map((signature, idx) => (
                <div key={idx} className="border p-3 rounded">
                  <p className="font-semibold">{signature.name}</p>
                  <p className="text-xs text-gray-600">{signature.role}</p>
                  {signature.signature_date && (
                    <p className="text-xs text-gray-600 mt-1">
                      Data: {format(new Date(signature.signature_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                  {signature.cpf && (
                    <p className="text-xs text-gray-600">CPF: {signature.cpf}</p>
                  )}
                  {signature.registration && (
                    <p className="text-xs text-gray-600">Registro: {signature.registration}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-xs text-gray-500">_______________________</p>
                    <p className="text-xs text-gray-500 text-center">Assinatura</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assinaturas */}
      <Card className="print:border-2 print:border-gray-800 print:page-break-before-always">
        <CardHeader>
          <CardTitle>Assinaturas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
            <div className="space-y-2">
              <div className="border-t-2 border-gray-400 pt-2">
                <p className="text-center text-sm font-medium">Professor(a) Responsável</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="border-t-2 border-gray-400 pt-2">
                <p className="text-center text-sm font-medium">Coordenador(a) Pedagógico(a)</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="border-t-2 border-gray-400 pt-2">
                <p className="text-center text-sm font-medium">Diretor(a) Escolar</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="border-t-2 border-gray-400 pt-2">
                <p className="text-center text-sm font-medium">Responsável Legal / Família</p>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-6">
            <p>Data: _____/_____/__________</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportView;