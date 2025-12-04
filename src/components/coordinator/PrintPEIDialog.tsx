import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PrintPEIDialogProps {
  peiId: string;
  open: boolean;
  onClose: () => void;
}

const PrintPEIDialog = ({ peiId, open, onClose }: PrintPEIDialogProps) => {
  const [pei, setPei] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && peiId) {
      loadPEI();
    }
  }, [open, peiId]);

  const loadPEI = async () => {
    try {
      setLoading(true);
      const { data: peiData, error: peiError } = await supabase
        .from("peis")
        .select(`
          *,
          students(name, date_of_birth),
          tenants(network_name),
          schools(school_name)
        `)
        .eq("id", peiId)
        .single();

      if (peiError) throw peiError;
      
      // Buscar nome do professor atribuído
      let teacherData = null;
      if (peiData.assigned_teacher_id) {
        const { data: teacherProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", peiData.assigned_teacher_id)
          .single();
        
        if (teacherProfile) {
          teacherData = { full_name: teacherProfile.full_name };
        }
      }
      
      // Adicionar dados do professor ao objeto PEI
      const peiWithTeacher = {
        ...peiData,
        profiles: teacherData,
      };
      
      setPei(peiWithTeacher);

      // Carregar logo da escola
      if (peiData.tenant_id) {
        const { data: files } = await supabase.storage
          .from("school-logos")
          .list(peiData.tenant_id);

        if (files && files.length > 0) {
          const { data: urlData } = supabase.storage
            .from("school-logos")
            .getPublicUrl(`${peiData.tenant_id}/${files[0].name}`);
          
          setLogoUrl(urlData.publicUrl);
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar PEI",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const barrierCategoryLabels: Record<string, string> = {
    arquitetonica: "🏛️ Arquitetônica",
    atitudinal: "🤝 Atitudinal",
    pedagogica: "📚 Pedagógica",
    comunicacional: "💬 Comunicacional",
    tecnologica: "💻 Tecnológica",
    metodologica: "📋 Metodológica",
  };

  const barrierItemLabels: Record<string, Record<string, string>> = {
    arquitetonica: {
      falta_rampa: "Falta de rampas de acesso",
      escadas: "Escadas sem corrimão adequado",
      portas_estreitas: "Portas estreitas",
      banheiro_inadequado: "Banheiro não adaptado",
      mobiliario: "Mobiliário inadequado",
    },
    atitudinal: {
      preconceito_colegas: "Preconceito dos colegas",
      resistencia_professores: "Resistência de professores",
      falta_sensibilizacao: "Falta de sensibilização da comunidade escolar",
      baixas_expectativas: "Baixas expectativas em relação ao aluno",
      isolamento_social: "Isolamento nas atividades sociais",
    },
    pedagogica: {
      material_nao_adaptado: "Material didático não adaptado",
      curriculo_rigido: "Currículo pouco flexível",
      avaliacao_inadequada: "Métodos de avaliação inadequados",
      falta_diferenciacao: "Falta de diferenciação pedagógica",
      ritmo_ensino: "Ritmo de ensino incompatível",
    },
    comunicacional: {
      falta_libras: "Falta de intérprete de Libras",
      material_visual: "Ausência de materiais visuais",
      linguagem_complexa: "Linguagem muito complexa",
      falta_caa: "Falta de comunicação alternativa (CAA)",
      sinalizacao: "Sinalização inadequada",
    },
    tecnologica: {
      falta_tecnologia_assistiva: "Falta de tecnologia assistiva",
      computadores_inadequados: "Computadores não adaptados",
      software_inacessivel: "Software inacessível",
      internet_limitada: "Acesso limitado à internet",
      falta_treinamento: "Falta de treinamento em tecnologias",
    },
    metodologica: {
      aulas_expositivas: "Excesso de aulas expositivas",
      falta_pratica: "Falta de atividades práticas",
      tempo_insuficiente: "Tempo insuficiente para atividades",
      grupos_grandes: "Grupos muito grandes",
      falta_individualizacao: "Falta de atendimento individualizado",
    },
  };

  const referralLabels: Record<string, string> = {
    psicologo: "👨‍⚕️ Psicólogo",
    fonoaudiologo: "🗣️ Fonoaudiólogo",
    terapeuta_ocupacional: "🤲 Terapeuta Ocupacional",
    neurologista: "🧠 Neurologista",
    psicopedagogo: "📚 Psicopedagogo",
    fisioterapeuta: "🏃 Fisioterapeuta",
    assistente_social: "🤝 Assistente Social",
    nutricionista: "🥗 Nutricionista",
  };

  if (loading || !pei) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização para Impressão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button onClick={handlePrint} className="w-full">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir PEI
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conteúdo para impressão */}
      {open && (
        <>
          <style>{`
            @media print {
              @page {
                size: A4;
                margin: 1cm 1.5cm;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * {
                visibility: hidden !important;
              }
              .print-only-content,
              .print-only-content * {
                visibility: visible !important;
              }
              .print-only-content {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 15px !important;
                font-size: 9pt !important;
                line-height: 1.3 !important;
              }
              .print-only-content h1 {
                font-size: 16pt !important;
                margin: 8px 0 !important;
              }
              .print-only-content h2 {
                font-size: 11pt !important;
                margin: 6px 0 3px 0 !important;
                padding-bottom: 2px !important;
              }
              .print-only-content h3 {
                font-size: 10pt !important;
                margin: 4px 0 2px 0 !important;
              }
              .print-only-content p {
                margin: 2px 0 !important;
              }
              .print-only-content .mb-5 {
                margin-bottom: 8px !important;
              }
              .print-only-content .mb-6 {
                margin-bottom: 10px !important;
              }
              .print-only-content img {
                max-width: 100px !important;
                max-height: 100px !important;
              }
            }
            @media screen {
              .print-only-content {
                display: none !important;
              }
            }
          `}</style>

          <div className="print-only-content">
            {/* Cabeçalho Institucional */}
            <div className="flex items-start gap-4 mb-4 pb-3 border-b-2 border-black">
              {logoUrl && (
                <div className="flex-shrink-0">
                  <img src={logoUrl} alt="Logo da Rede" className="h-20 w-20 object-contain" />
                </div>
              )}
              <div className="flex-1 text-center">
                <h2 className="text-lg font-bold mb-1 leading-tight uppercase">{pei.tenants?.network_name || "Nome da Rede"}</h2>
                <p className="text-sm font-semibold text-gray-800 mb-2 leading-tight">Secretaria de Educação - Setor Educação Inclusiva</p>
                <p className="text-sm font-bold text-gray-900 leading-tight">{pei.schools?.school_name || "Nome da Escola"}</p>
              </div>
            </div>
            
            {/* Título do Documento */}
            <h1 className="text-lg font-bold text-center mb-3">
              PLANO EDUCACIONAL INDIVIDUALIZADO
            </h1>

            {/* Identificação do Aluno */}
            <div className="mb-3">
              <h2 className="text-sm font-bold mb-1.5 pb-0.5 border-b border-black">
                1. Identificação do Aluno
              </h2>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[8pt]">
                <p><strong>Nome:</strong> {pei.students?.name}</p>
                {pei.students?.date_of_birth && (
                  <p><strong>Nascimento:</strong> {format(new Date(pei.students.date_of_birth), "dd/MM/yyyy", { locale: ptBR })}</p>
                )}
                <p><strong>Professor:</strong> {pei.profiles?.full_name || "Não atribuído"}</p>
                <p><strong>Criação:</strong> {format(new Date(pei.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
            </div>

            {/* Diagnóstico */}
            <div className="mb-3">
              <h2 className="text-sm font-bold mb-1.5 pb-0.5 border-b border-black">2. Diagnóstico</h2>
              
              <div className="space-y-1 text-[8pt]">
                {pei.diagnosis_data?.history && (
                  <div>
                    <p className="font-semibold">Histórico:</p>
                    <p className="whitespace-pre-wrap leading-tight text-gray-700">{pei.diagnosis_data.history}</p>
                  </div>
                )}

                {pei.diagnosis_data?.interests && (
                  <div>
                    <p className="font-semibold">Interesses:</p>
                    <p className="leading-tight text-gray-700">{pei.diagnosis_data.interests}</p>
                  </div>
                )}

                {pei.diagnosis_data?.specialNeeds && (
                  <div>
                    <p className="font-semibold">Necessidades Especiais:</p>
                    <p className="whitespace-pre-wrap leading-tight text-gray-700">{pei.diagnosis_data.specialNeeds}</p>
                  </div>
                )}

                {(pei.diagnosis_data?.abilities || pei.diagnosis_data?.strengths) && (
                  <div>
                    <p className="font-semibold">Habilidades (O que já consegue fazer):</p>
                    <p className="whitespace-pre-wrap leading-tight text-gray-700">{pei.diagnosis_data.abilities || pei.diagnosis_data.strengths}</p>
                  </div>
                )}

                {(pei.diagnosis_data?.aversions || pei.diagnosis_data?.challenges) && (
                  <div>
                    <p className="font-semibold">Desinteresses / Aversões:</p>
                    <p className="whitespace-pre-wrap leading-tight text-gray-700">{pei.diagnosis_data.aversions || pei.diagnosis_data.challenges}</p>
                  </div>
                )}

                {pei.diagnosis_data?.barriers && (
                  <div>
                    <p className="font-semibold">Barreiras:</p>
                    <div className="ml-2 space-y-0.5 text-[7.5pt]">
                      {Object.entries(pei.diagnosis_data.barriers).map(([category, items]: [string, any]) => {
                        if (!Array.isArray(items) || items.length === 0) return null;
                        return (
                          <p key={category} className="leading-tight">
                            <strong>{barrierCategoryLabels[category]}:</strong>{' '}
                            {items.map((item: string) => barrierItemLabels[category]?.[item] || item).join(', ')}
                          </p>
                        );
                      })}
                      {pei.diagnosis_data.otherBarrier && (
                        <p className="leading-tight">
                          <strong>Outras:</strong> {pei.diagnosis_data.otherBarrier}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {pei.diagnosis_data?.barriersComments && (
                  <div>
                    <p className="font-semibold">Observações sobre as Barreiras:</p>
                    <p className="whitespace-pre-wrap leading-tight text-gray-700">{pei.diagnosis_data.barriersComments}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 🆕 2.1 Relatório Circunstanciado */}
            {pei.diagnosis_data?.circumstantial_report && Object.values(pei.diagnosis_data.circumstantial_report).some((v: any) => v) && (
              <div className="mb-3">
                <h2 className="text-sm font-bold mb-1.5 pb-0.5 border-b border-black">2.1 Relatório Circunstanciado (RC)</h2>
                <div className="space-y-1 text-[8pt]">
                  {pei.diagnosis_data.circumstantial_report.how_student_learns && (
                    <div>
                      <p className="font-semibold">Como o Aluno Aprende:</p>
                      <p className="whitespace-pre-wrap leading-tight text-gray-700">{pei.diagnosis_data.circumstantial_report.how_student_learns}</p>
                    </div>
                  )}
                  {pei.diagnosis_data.circumstantial_report.social_interaction && (
                    <div>
                      <p className="font-semibold">Interação Social:</p>
                      <p className="whitespace-pre-wrap leading-tight text-gray-700">{pei.diagnosis_data.circumstantial_report.social_interaction}</p>
                    </div>
                  )}
                  {pei.diagnosis_data.circumstantial_report.communication && (
                    <div>
                      <p className="font-semibold">Comunicação:</p>
                      <p className="whitespace-pre-wrap leading-tight text-gray-700">{pei.diagnosis_data.circumstantial_report.communication}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🆕 2.2 Nível de Desenvolvimento */}
            {pei.diagnosis_data?.development_level && (
              <div className="mb-3">
                <h2 className="text-sm font-bold mb-1.5 pb-0.5 border-b border-black">2.2 Nível de Desenvolvimento</h2>
                <div className="space-y-1.5 text-[8pt]">
                  {Object.entries(pei.diagnosis_data.development_level).map(([area, data]: [string, any]) => {
                    const areaLabels: Record<string, string> = {
                      language: 'Linguagem',
                      reading: 'Leitura',
                      writing: 'Escrita',
                      logical_reasoning: 'Raciocínio',
                      motor_coordination: 'Coordenação',
                      social_skills: 'Social',
                    };
                    
                    const hasContent = data && (
                      (data.autonomous && data.autonomous.length > 0) ||
                      (data.with_help && data.with_help.length > 0) ||
                      (data.not_yet && data.not_yet.length > 0)
                    );

                    if (!hasContent) return null;

                    return (
                      <div key={area} className="text-[7.5pt]">
                        <p className="font-semibold text-[8pt]">{areaLabels[area]}</p>
                        {data.autonomous && data.autonomous.length > 0 && (
                          <p className="text-gray-700">✅ {data.autonomous.join('; ')}</p>
                        )}
                        {data.with_help && data.with_help.length > 0 && (
                          <p className="text-gray-700">🟡 {data.with_help.join('; ')}</p>
                        )}
                        {data.not_yet && data.not_yet.length > 0 && (
                          <p className="text-gray-700">❌ {data.not_yet.join('; ')}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Planejamento */}
            {pei.planning_data?.goals && pei.planning_data.goals.length > 0 && (
              <div className="mb-3">
                <h2 className="text-base font-bold mb-2 pb-1 border-b border-black">
                  Planejamento Pedagógico
                </h2>
                <div className="space-y-1.5">
                  {pei.planning_data.goals.map((goal: any, index: number) => (
                    <div key={index} className="border-l-2 border-gray-700 pl-2 py-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[9pt] font-semibold flex-1 leading-tight">
                          {index + 1}. {goal.description}
                        </p>
                        {goal.category && (
                          <span className="text-[7pt] px-1.5 py-0.5 border border-gray-400 rounded whitespace-nowrap">
                            {goal.category === 'academic' ? '📚 Acadêmica' : '🛠️ Funcional'}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-2 text-[8pt] text-gray-700 mt-0.5">
                        {goal.target_date && (
                          <p><strong>Prazo:</strong> {format(new Date(goal.target_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                        )}
                        {goal.progress_level && (
                          <p><strong>Status:</strong> {goal.progress_level}</p>
                        )}
                      </div>
                      
                      {goal.strategies && Array.isArray(goal.strategies) && goal.strategies.length > 0 && goal.strategies.filter(Boolean).length > 0 && (
                        <p className="text-[8pt] text-gray-700 mt-0.5 leading-tight">
                          <strong>Estratégias:</strong> {goal.strategies.filter(Boolean).join('; ')}
                        </p>
                      )}
                      
                      {goal.notes && (
                        <p className="text-[8pt] text-gray-700 mt-0.5 leading-tight">
                          <strong>Obs:</strong> {goal.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🆕 3.1 Adequações Curriculares */}
            {pei.planning_data?.curriculum_adaptations && Object.values(pei.planning_data.curriculum_adaptations).some((v: any) => v && (Array.isArray(v) ? v.length > 0 : true)) && (
              <div className="mb-3">
                <h2 className="text-sm font-bold mb-1.5 pb-0.5 border-b border-black">3.1 Adequações Curriculares</h2>
                <div className="space-y-1 text-[8pt]">
                  {pei.planning_data.curriculum_adaptations.priority_contents && pei.planning_data.curriculum_adaptations.priority_contents.length > 0 && (
                    <div>
                      <p className="font-semibold">Conteúdos Prioritários:</p>
                      <p className="text-[7.5pt] text-gray-700">{pei.planning_data.curriculum_adaptations.priority_contents.join('; ')}</p>
                    </div>
                  )}
                  {pei.planning_data.curriculum_adaptations.differentiated_methodologies && pei.planning_data.curriculum_adaptations.differentiated_methodologies.length > 0 && (
                    <div>
                      <p className="font-semibold">Metodologias Diferenciadas:</p>
                      <p className="text-[7.5pt] text-gray-700">{pei.planning_data.curriculum_adaptations.differentiated_methodologies.join('; ')}</p>
                    </div>
                  )}
                  {pei.planning_data.curriculum_adaptations.adapted_assessments && pei.planning_data.curriculum_adaptations.adapted_assessments.length > 0 && (
                    <div>
                      <p className="font-semibold">Avaliações Adaptadas:</p>
                      <p className="text-[7.5pt] text-gray-700">{pei.planning_data.curriculum_adaptations.adapted_assessments.join('; ')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🆕 3.2 Cronograma de Intervenção */}
            {pei.planning_data?.intervention_schedule && pei.planning_data.intervention_schedule.length > 0 && (
              <div className="mb-3">
                <h2 className="text-sm font-bold mb-1.5 pb-0.5 border-b border-black">3.2 Cronograma de Intervenção</h2>
                <div className="space-y-1.5 text-[8pt]">
                  {pei.planning_data.intervention_schedule.map((item: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-gray-400 pl-2">
                      <p className="font-semibold text-[9pt]">{item.period}</p>
                      {item.actions && item.actions.length > 0 && (
                        <p className="text-[7.5pt] text-gray-700">{item.actions.join('; ')}</p>
                      )}
                      {item.responsible && (
                        <p className="text-[7.5pt] text-gray-600"><strong>Responsável:</strong> {item.responsible}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Encaminhamentos */}
            <div className="mb-3">
              <h2 className="text-sm font-bold mb-1.5 pb-0.5 border-b border-black">
                4. Encaminhamentos e Observações
              </h2>
              
              <div className="space-y-1 text-[8pt]">
                {pei.evaluation_data?.referrals && Array.isArray(pei.evaluation_data.referrals) && pei.evaluation_data.referrals.length > 0 && (
                  <div>
                    <p className="font-semibold">Encaminhamentos:</p>
                    <p className="text-[7.5pt] leading-tight text-gray-700">
                      {pei.evaluation_data.referrals.map((ref: string) => referralLabels[ref] || ref).join(', ')}
                      {pei.evaluation_data.otherReferral && `, ${pei.evaluation_data.otherReferral}`}
                    </p>
                  </div>
                )}

                {pei.evaluation_data?.observations && (
                  <div>
                    <p className="font-semibold">Observações:</p>
                    <p className="whitespace-pre-wrap leading-tight text-gray-700">{pei.evaluation_data.observations}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 🆕 5. Comentários da Família */}
            {pei.evaluation_data?.family_feedback && (
              <div className="mb-3">
                <h2 className="text-sm font-bold mb-1.5 pb-0.5 border-b border-black">5. Comentários da Família</h2>
                <div className="bg-blue-50 p-2 rounded text-[8pt] border-l-4 border-blue-500">
                  <p className="italic text-gray-700">"{pei.evaluation_data.family_feedback}"</p>
                </div>
              </div>
            )}

            {/* 🆕 6. Critérios de Avaliação */}
            {pei.evaluation_data?.evaluation_criteria && (
              <div className="mb-3">
                <h2 className="text-sm font-bold mb-1.5 pb-0.5 border-b border-black">6. Critérios de Avaliação</h2>
                <div className="space-y-1 text-[8pt]">
                  {pei.evaluation_data.evaluation_criteria.progress_indicators && pei.evaluation_data.evaluation_criteria.progress_indicators.length > 0 && (
                    <div>
                      <p className="font-semibold">Indicadores de Progresso:</p>
                      <p className="text-[7.5pt] text-gray-700">{pei.evaluation_data.evaluation_criteria.progress_indicators.join('; ')}</p>
                    </div>
                  )}
                  {pei.evaluation_data.evaluation_criteria.measurement_methods && pei.evaluation_data.evaluation_criteria.measurement_methods.length > 0 && (
                    <div>
                      <p className="font-semibold">Métodos de Mensuração:</p>
                      <p className="text-[7.5pt] text-gray-700">{pei.evaluation_data.evaluation_criteria.measurement_methods.join('; ')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🆕 7. Revisão do PEI */}
            {pei.evaluation_data?.pei_review && (
              <div className="mb-3">
                <h2 className="text-sm font-bold mb-1.5 pb-0.5 border-b border-black">7. Revisão do PEI</h2>
                <div className="space-y-1 text-[8pt]">
                  {pei.evaluation_data.pei_review.review_frequency && (
                    <p><strong>Frequência:</strong> {pei.evaluation_data.pei_review.review_frequency}</p>
                  )}
                  {pei.evaluation_data.pei_review.next_review_meeting && (
                    <p><strong>Próxima Reunião:</strong> {format(new Date(pei.evaluation_data.pei_review.next_review_meeting), "dd/MM/yyyy", { locale: ptBR })}</p>
                  )}
                </div>
              </div>
            )}

            {/* Assinaturas */}
            {pei.evaluation_data?.signatures && pei.evaluation_data.signatures.length > 0 ? (
              <div className="mt-4">
                <h2 className="text-sm font-bold mb-2 pb-0.5 border-b border-black">Assinaturas</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[8pt]">
                  {pei.evaluation_data.signatures.map((signature: any, idx: number) => (
                    <div key={idx} className="text-center">
                      <div className="border-t border-gray-700 pt-1 mt-6">
                        <p className="font-medium">{signature.name}</p>
                        <p className="text-[7pt] text-gray-600">{signature.role}</p>
                        {signature.signature_date && (
                          <p className="text-[7pt] text-gray-500">
                            {format(new Date(signature.signature_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <h2 className="text-sm font-bold mb-2 pb-0.5 border-b border-black">Assinaturas</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[8pt]">
                  <div className="text-center">
                    <div className="border-t border-gray-700 pt-1 mt-6">
                      <p className="font-medium">Professor(a) Responsável</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-700 pt-1 mt-6">
                      <p className="font-medium">Coordenador(a) Pedagógico(a)</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-700 pt-1 mt-6">
                      <p className="font-medium">Diretor(a) Escolar</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-700 pt-1 mt-6">
                      <p className="font-medium">Responsável Legal / Família</p>
                    </div>
                  </div>
                </div>
                <div className="text-center text-[8pt] mt-3">
                  <p>Data: _____/_____/__________</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default PrintPEIDialog;
