import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PEIPrintTemplateProps {
  pei: any;
  logoUrl?: string | null;
}

const barrierCategoryLabels: Record<string, string> = {
  arquitetonica: "Arquitetônica",
  atitudinal: "Atitudinal",
  comunicacional: "Comunicacional",
  tecnologica: "Tecnológica",
  metodologica: "Metodológica",
};

const barrierItemLabels: Record<string, Record<string, string>> = {
  arquitetonica: {
    escadas: "Escadas sem rampa",
    banheiros: "Banheiros não adaptados",
    portas: "Portas estreitas",
    mobiliario: "Mobiliário inadequado",
    iluminacao: "Iluminação insuficiente",
  },
  atitudinal: {
    preconceito: "Preconceito",
    baixa_expectativa: "Baixas expectativas",
    superprotecao: "Superproteção",
    bullying: "Bullying",
    exclusao: "Exclusão social",
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

const PEIPrintTemplate = ({ pei, logoUrl }: PEIPrintTemplateProps) => {
  return (
    <div className="print-content page-break">
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

      {/* Planejamento */}
      {pei.planning_data?.goals && pei.planning_data.goals.length > 0 && (
        <div className="mb-3">
          <h2 className="text-base font-bold mb-2 pb-1 border-b border-black">
            3. Planejamento Pedagógico
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
  );
};

export default PEIPrintTemplate;

