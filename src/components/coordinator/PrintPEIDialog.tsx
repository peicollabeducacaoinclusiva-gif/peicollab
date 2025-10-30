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
          tenants(name)
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
                margin: 1.5cm 2cm;
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
                padding: 0 !important;
              }
            }
            @media screen {
              .print-only-content {
                display: none !important;
              }
            }
          `}</style>

          <div className="print-only-content">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between mb-6 pb-3 border-b-2 border-black">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">
                  Plano Educacional Individualizado
                </h1>
                <p className="text-lg font-semibold">{pei.tenants?.name}</p>
                <p className="text-sm mt-1">
                  Data de Emissão: {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              {logoUrl && (
                <div className="ml-4">
                  <img src={logoUrl} alt="Logo da escola" className="h-16 w-16 object-contain" />
                </div>
              )}
            </div>

            {/* Identificação do Aluno */}
            <div className="mb-5">
              <h2 className="text-lg font-bold mb-3 pb-1 border-b border-black">
                Identificação do Aluno
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold mb-1">Nome:</p>
                  <p className="text-sm">{pei.students?.name}</p>
                </div>
                {pei.students?.date_of_birth && (
                  <div>
                    <p className="text-xs font-semibold mb-1">Data de Nascimento:</p>
                    <p className="text-sm">
                      {format(new Date(pei.students.date_of_birth), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold mb-1">Professor Responsável:</p>
                  <p className="text-sm">{pei.profiles?.full_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Data de Criação:</p>
                  <p className="text-sm">
                    {format(new Date(pei.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>

            {/* Diagnóstico */}
            <div className="mb-5">
              <h2 className="text-lg font-bold mb-3 pb-1 border-b border-black">Diagnóstico</h2>
              
              {pei.diagnosis_data?.history && (
                <div className="mb-3">
                  <p className="text-xs font-semibold mb-1">Histórico do Estudante:</p>
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">{pei.diagnosis_data.history}</p>
                </div>
              )}

              {pei.diagnosis_data?.interests && (
                <div className="mb-3">
                  <p className="text-xs font-semibold mb-1">Interesses do Aluno:</p>
                  <p className="text-xs leading-relaxed">{pei.diagnosis_data.interests}</p>
                </div>
              )}

              {pei.diagnosis_data?.specialNeeds && (
                <div className="mb-3">
                  <p className="text-xs font-semibold mb-1">Necessidades Educacionais Especiais:</p>
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">{pei.diagnosis_data.specialNeeds}</p>
                </div>
              )}

              {pei.diagnosis_data?.barriers && (
                <div className="mb-3">
                  <p className="text-xs font-semibold mb-1">Barreiras Identificadas:</p>
                  <div className="space-y-1">
                    {Object.entries(pei.diagnosis_data.barriers).map(([category, items]: [string, any]) => {
                      if (!Array.isArray(items) || items.length === 0) return null;
                      return (
                        <div key={category} className="ml-1">
                          <p className="font-semibold text-xs">{barrierCategoryLabels[category]}</p>
                          <ul className="list-disc list-inside ml-3 text-xs leading-relaxed">
                            {items.map((item: string) => (
                              <li key={item}>{barrierItemLabels[category]?.[item] || item}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                    {pei.diagnosis_data.otherBarrier && (
                      <div className="ml-1">
                        <p className="font-semibold text-xs">Outras:</p>
                        <p className="ml-3 text-xs leading-relaxed">{pei.diagnosis_data.otherBarrier}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Planejamento */}
            {pei.planning_data?.goals && pei.planning_data.goals.length > 0 && (
              <div className="mb-5">
                <h2 className="text-lg font-bold mb-3 pb-1 border-b border-black">
                  Planejamento Pedagógico
                </h2>
                {pei.planning_data.goals.map((goal: any, index: number) => (
                  <div key={index} className="mb-3 p-2 border border-gray-400 rounded">
                    <h3 className="font-bold text-sm mb-2">Meta {index + 1}</h3>
                    
                    {goal.description && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold mb-1">Descrição:</p>
                        <p className="text-xs leading-relaxed">{goal.description}</p>
                      </div>
                    )}
                    
                    {goal.strategies && Array.isArray(goal.strategies) && goal.strategies.length > 0 && goal.strategies[0] && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold mb-1">Estratégias:</p>
                        <ul className="list-disc list-inside ml-2 text-xs leading-relaxed">
                          {goal.strategies.map((strategy: string, idx: number) => (
                            strategy && <li key={idx}>{strategy}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {goal.evaluationCriteria && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold mb-1">Critérios de Avaliação:</p>
                        <p className="text-xs leading-relaxed">{goal.evaluationCriteria}</p>
                      </div>
                    )}
                    
                    {goal.resources && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold mb-1">Recursos:</p>
                        <p className="text-xs leading-relaxed">{goal.resources}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Encaminhamentos */}
            <div className="mb-5">
              <h2 className="text-lg font-bold mb-3 pb-1 border-b border-black">
                Encaminhamentos e Observações
              </h2>
              
              {pei.evaluation_data?.referrals && Array.isArray(pei.evaluation_data.referrals) && pei.evaluation_data.referrals.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold mb-1">Encaminhamentos Profissionais:</p>
                  <ul className="list-disc list-inside ml-2 text-xs leading-relaxed">
                    {pei.evaluation_data.referrals.map((referral: string) => (
                      <li key={referral}>{referralLabels[referral] || referral}</li>
                    ))}
                  </ul>
                  {pei.evaluation_data.otherReferral && (
                    <div className="mt-2 ml-1">
                      <p className="text-xs font-semibold mb-1">Outros:</p>
                      <p className="text-xs leading-relaxed">{pei.evaluation_data.otherReferral}</p>
                    </div>
                  )}
                </div>
              )}

              {pei.evaluation_data?.observations && (
                <div className="mb-3">
                  <p className="text-xs font-semibold mb-1">Observações Gerais:</p>
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">{pei.evaluation_data.observations}</p>
                </div>
              )}
            </div>

            {/* Assinaturas */}
            <div className="mt-8">
              <h2 className="text-lg font-bold mb-4 pb-1 border-b border-black">Assinaturas</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="border-t-2 border-black pt-1 mt-12">
                    <p className="text-center text-xs font-medium">Professor(a) Responsável</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="border-t-2 border-black pt-1 mt-12">
                    <p className="text-center text-xs font-medium">Coordenador(a) Pedagógico(a)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="border-t-2 border-black pt-1 mt-12">
                    <p className="text-center text-xs font-medium">Diretor(a) Escolar</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="border-t-2 border-black pt-1 mt-12">
                    <p className="text-center text-xs font-medium">Responsável Legal / Família</p>
                  </div>
                </div>
              </div>
              <div className="text-center text-xs mt-6">
                <p>Data: _____/_____/__________</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default PrintPEIDialog;
