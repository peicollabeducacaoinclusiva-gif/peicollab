import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const aiContext = body.aiContext || {};
    const diagnosisData = aiContext.diagnosis || body.diagnosisData || {};
    const studentInfo = aiContext.student || {};
    const familyInfo = aiContext.family || {};
    const contextInfo = aiContext.context || {};
    const barriersInput = Array.isArray(diagnosisData?.barriers) && diagnosisData.barriers.length > 0
      ? diagnosisData.barriers
      : (body.barriers || []);

    const mapBarrierCategory = (type: string) => {
      const normalized = (type || "").toLowerCase();
      if (normalized.includes("arquit") || normalized.includes("ambient")) return "arquitetonicas";
      if (normalized.includes("comunic")) return "comunicacionais";
      if (normalized.includes("atitud")) return "atitudinais";
      if (normalized.includes("tecnolog") || normalized.includes("assistiv")) return "tecnologicas";
      if (normalized.includes("pedag") || normalized.includes("acad")) return "pedagogicas";
      return "outras";
    };

    const barrierBuckets: Record<string, string[]> = {
      arquitetonicas: [],
      comunicacionais: [],
      atitudinais: [],
      tecnologicas: [],
      pedagogicas: [],
      outras: [],
    };

    const barriersList = Array.isArray(barriersInput) ? barriersInput : [];
    barriersList.forEach((item: any) => {
      const key = mapBarrierCategory(item?.barrier_type || item?.type || "");
      const severity = item?.severity ? ` (Gravidade: ${item.severity})` : "";
      const description = item?.description || item?.details || "Descrição não informada";
      const typeLabel = item?.barrier_type || item?.type || "Barreira";
      barrierBuckets[key].push(`- ${typeLabel}: ${description}${severity}`);
    });

    const barrierSummary = Object.fromEntries(
      Object.entries(barrierBuckets).map(([key, entries]) => [
        key,
        entries.length ? entries.join("\n") : "Não informado",
      ]),
    ) as Record<string, string>;

    barrierSummary.comentarios =
      diagnosisData?.barriersComments ||
      aiContext?.diagnosis?.barriersComments ||
      "";

    const studentName = studentInfo?.name || "Não informado";
    const schoolName =
      studentInfo?.school ||
      contextInfo?.school_name ||
      "Não informado";
    const grade = studentInfo?.grade || "Não informado";
    const shift = studentInfo?.shift || "Não informado";
    const historico = diagnosisData?.history || "Não informado";
    const interesses = diagnosisData?.interests || "Não informado";
    const desinteresses =
      diagnosisData?.aversions ||
      diagnosisData?.challenges ||
      "Não informado";
    const habilidades =
      diagnosisData?.abilities ||
      diagnosisData?.strengths ||
      "Não informado";
    const necessidades = diagnosisData?.specialNeeds || "Não informado";
    const familiaNecessidades = familyInfo?.needs || "Não informado";
    const familiaAcoes = familyInfo?.expectedActions || "Não informado";
    const familiaContexto = familyInfo?.dynamics || "";
    const circumstantialExtra = diagnosisData?.circumstantial_report
      ? `\nRelatório circunstanciado (resumo): ${
          diagnosisData?.circumstantial_report?.observations ||
          diagnosisData?.circumstantial_report?.how_student_learns ||
          "Não informado"
        }`
      : "";

    const barriersOverview = barriersList.length
      ? barriersList
          .map((item: any) => {
            const label = item?.barrier_type || item?.type || "Barreira";
            const details = item?.description || "Sem descrição";
            const severity = item?.severity ? ` (Gravidade: ${item.severity})` : "";
            return `- ${label}: ${details}${severity}`;
          })
          .join("\n")
      : "Não informado";
    
    // ⚠️ SEGURANÇA: OpenAI API Key deve ser configurada como variável de ambiente
    // Configure no dashboard do Supabase: Project Settings > Edge Functions > Secrets
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada. Configure a secret no dashboard do Supabase.');
    }

    const prompt = `Você é um(a) pedagogo(a) especialista em Educação Inclusiva, com expertise em elaboração de Planos Educacionais Individualizados (PEI) conforme a Lei Brasileira de Inclusão (Lei 13.146/2015) e a PNEEPEI.

CONTEXTO DO ESTUDANTE:

📌 Identificação:

Nome: ${studentName}
Escola: ${schoolName}
Série/Ano: ${grade}
Turno: ${shift}
📖 Diagnóstico e Contexto: ${historico}${circumstantialExtra}

💡 Perfil de Aprendizagem:

Interesses/Hiperfocos: ${interesses}
Aversões/Desinteresses: ${desinteresses}
Habilidades Atuais: ${habilidades}
Necessidades Identificadas: ${necessidades}
🚧 Barreiras para Aprendizagem:

Arquitetônicas: ${barrierSummary.arquitetonicas}
Comunicacionais: ${barrierSummary.comunicacionais}
Atitudinais: ${barrierSummary.atitudinais}
Tecnológicas: ${barrierSummary.tecnologicas}
Pedagógicas: ${barrierSummary.pedagogicas}
Outras: ${barrierSummary.outras}
Observações: ${barrierSummary.comentarios || "Não informado"}
Visão Geral das Barreiras Registradas:
${barriersOverview}

👨‍👩‍👧 Perspectiva Familiar:
Necessidades percebidas: ${familiaNecessidades}
Ações esperadas da escola: ${familiaAcoes}
${familiaContexto ? `Contexto familiar adicional: ${familiaContexto}` : ""}

TAREFA:

Gere as seguintes seções do PEI de forma detalhada, prática e personalizada:

📚 PARTE II – Planejamento de Acessibilidade
2.1 Metas Educacionais (formato SMART)

Para cada área, defina 2-3 metas com:

O quê: objetivo específico
Como: estratégia principal
Quando: prazo (curto/médio/longo)
Indicador: como medir progresso
Áreas obrigatórias:

Cognitiva e Acadêmica (leitura, escrita, matemática, raciocínio)
Comunicação e Linguagem (expressão oral/escrita, compreensão, CAA se necessário)
Socioemocional (regulação emocional, interação social, autonomia emocional)
Motora (coordenação fina/ampla, locomoção, uso de ferramentas)
Autonomia e Vida Diária (autocuidado, organização, rotinas)
2.2 Recursos de Acessibilidade

Liste recursos concretos como:

Comunicação Aumentativa Alternativa (CAA): (se aplicável)
Tecnologia Assistiva: apps, equipamentos, softwares
Adaptações Curriculares: simplificação de textos, uso de imagens, material manipulável
Adaptações de Mobiliário/Ambiente: (se necessário)
Apoio Humano: auxiliar de sala, professor de AEE, mediador
Materiais Pedagógicos: jogos, fichas, recursos visuais
2.3 Estratégias Metodológicas

Descreva como o professor deve:

Apresentar conteúdos (ex: uso de rotinas visuais, pausas sensoriais)
Avaliar (ex: provas orais, portfólios, observação contínua)
Engajar o estudante (ex: partir dos interesses, gamificação)
Lidar com desafios (ex: crises, recusas, sobrecarga sensorial)
2.4 Cronograma Básico

Acompanhamento semanal/quinzenal pelo professor regente
Reuniões mensais com AEE e coordenação
Revisão trimestral do PEI com a família
📊 PARTE III – Encaminhamentos e Observações
3.1 Encaminhamentos Profissionais

Sugira encaminhamentos necessários:

 Fonoaudiologia (se dificuldades de fala/linguagem)
 Terapia Ocupacional (se déficits motores/sensoriais)
 Psicologia Escolar (se questões emocionais/comportamentais)
 Neurologia/Psiquiatria (se necessário avaliação/acompanhamento médico)
 Serviço Social (se vulnerabilidade familiar)
 Professor de AEE (Atendimento Educacional Especializado)
 Outros: (especifique)
3.2 Observações Gerais

Inclua:

Recomendações para comunicação escola-família
Pontos de atenção para professores substitutos
Estratégias para momentos críticos (recreio, transições, avaliações)
Observações sobre medicação (se aplicável e informado pela família)

═══════════════════════════════════════════════════════════
FORMATO DE RESPOSTA (JSON ESTRUTURADO):
═══════════════════════════════════════════════════════════

{
  "goals": [
    {
      "title": "Título conciso da meta (máx 80 caracteres)",
      "category": "academic" ou "functional",
      "target_date": "YYYY-MM-DD",
      "description": "Descrição completa da meta em formato SMART (2-3 linhas)",
      "bncc_code": "Código BNCC (apenas para metas acadêmicas) ou null",
      "theoreticalBasis": "Fundamentação teórica breve (1-2 linhas)",
      "duaPrinciples": {
        "representation": "Como apresentar o conteúdo de múltiplas formas",
        "actionExpression": "Como o aluno pode demonstrar aprendizado",
        "engagement": "Como engajar e motivar o aluno"
      },
      "strategies": [
        "Estratégia detalhada 1 (2-3 linhas, com passos práticos)",
        "Estratégia detalhada 2 (2-3 linhas, com passos práticos)",
        "Estratégia detalhada 3 (2-3 linhas, com passos práticos)"
      ],
      "evaluationCriteria": "Critérios objetivos e mensuráveis (2-3 linhas, com indicadores de progresso)",
      "resources": "Lista detalhada de recursos, tecnologias assistivas e materiais necessários (2-3 linhas)",
      "teamInvolvement": "Papéis do professor, AEE, família e outros profissionais (1-2 linhas)",
      "timeline": "curto_prazo" ou "medio_prazo" ou "longo_prazo",
      "expectedProgress": "Descrição do progresso esperado ao final do prazo (1 linha)"
    }
  ],
  "accessibilityResources": [
    {
      "type": "Tipo do recurso (ex: Tecnologia Assistiva, Material Adaptado)",
      "description": "Descrição detalhada do recurso",
      "frequency": "diária" ou "semanal" ou "quinzenal" ou "mensal" ou "quando necessário"
    }
  ],
  "methodological_strategies": {
    "content_presentation": "Como apresentar os conteúdos (rotinas visuais, pistas, material concreto, etc.)",
    "assessment": "Formas de avaliação adaptadas (prova oral, portfólio, rubrica, etc.)",
    "engagement": "Estratégias de engajamento vinculadas aos interesses do aluno",
    "challenge_management": "Como lidar com crises, recusas ou sobrecarga sensorial"
  },
  "support_services": [
    {
      "service_type": "Tipo de serviço (ex: AEE, tutor, psicopedagoga)",
      "frequency": "Frequência do atendimento",
      "duration": "Duração média da sessão",
      "provider": "Profissional ou setor responsável",
      "location": "Local do atendimento",
      "observations": "Observações importantes"
    }
  ],
  "intervention_schedule": [
    {
      "period": "Período (ex: Janeiro-Março 2025)",
      "actions": ["Ação 1", "Ação 2"],
      "responsible": "Responsável pela ação",
      "expected_results": "Resultados esperados"
    }
  ],
  "referrals": [
    {
      "service": "Fonoaudiologia",
      "reason": "Motivo do encaminhamento",
      "priority": "baixa" ou "média" ou "alta",
      "follow_up": "Próximos passos ou monitoramento",
      "recommended_professional": "Profissional sugerido ou referência"
    }
  ],
  "general_observations": [
    "Recomendações detalhadas para comunicação escola-família",
    "Pontos de atenção para professores substitutos",
    "Estratégias para momentos críticos (recreio, transições, avaliações)"
  ],
  "communication_guidelines": [
    "Orientações práticas para manter a família informada"
  ],
  "crisis_strategies": [
    "Estratégias objetivas para lidar com crises ou sobrecarga sensorial"
  ],
  "medication_notes": "Observações sobre medicação quando informado (caso não haja, retornar 'Não informado')",
  "family_communication": "Resumo das ações para garantir comunicação contínua com a família"
}

REQUISITOS:
- Retorne apenas JSON válido (sem markdown).
- Gere no mínimo 3 metas e garanta equilíbrio entre acadêmicas (BNCC) e funcionais (AEE).
- Utilize linguagem profissional, técnica e alinhada às normas brasileiras.
- Fundamente estratégias em metodologias reconhecidas (DUA, ABA, TEACCH, PECS, etc.) sempre que possível.
- Não deixe campos obrigatórios vazios; use 'Não informado' quando não houver dados.`;*** End Patch

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `Você é um Pedagogo Especialista em Educação Inclusiva com formação avançada em:
- Design Universal para Aprendizagem (DUA) e seus três princípios fundamentais
- Base Nacional Comum Curricular (BNCC) - todas as etapas e componentes curriculares
- Atendimento Educacional Especializado (AEE) e suas modalidades
- Práticas Baseadas em Evidências em Educação Especial
- Tecnologias Assistivas, Comunicação Alternativa e Recursos de Acessibilidade
- Avaliação formativa e desenvolvimento de metas SMART
- Metodologias ativas e diferenciadas de ensino

Sua missão é elaborar Planos Educacionais Individualizados (PEI) de alta qualidade, tecnicamente fundamentados e pedagogicamente robustos.

DIRETRIZES DE RESPOSTA:
- Escreva em português brasileiro formal e técnico
- Seja extremamente detalhado e específico
- Fundamente todas as estratégias em evidências científicas quando possível
- Equilibre rigor técnico com aplicabilidade prática
- Sempre retorne JSON válido e bem formatado
- Cite códigos BNCC quando aplicável
- Mencione metodologias e abordagens reconhecidas (ABA, TEACCH, PECS, etc.)
- Considere a diversidade de contextos escolares brasileiros
- Retorne APENAS o JSON, sem markdown` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Erro ao gerar planejamento');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    let planningData;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      planningData = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse JSON:', content);
      throw new Error('Erro ao processar resposta da IA');
    }

    return new Response(
      JSON.stringify({ planningData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-pei-planning:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error stack:', errorStack);
    console.error('Error type:', typeof error);
    console.error('Error object:', JSON.stringify(error, null, 2));
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorStack,
        type: typeof error
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
