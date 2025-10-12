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
    const { diagnosisData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const prompt = `Com base no diagnóstico do aluno abaixo, gere um plano de acessibilidade educacional estruturado.

DIAGNÓSTICO:
Interesses: ${diagnosisData.interests || 'Não informado'}
Necessidades Educacionais Especiais: ${diagnosisData.specialNeeds || 'Não informado'}
Barreiras: ${diagnosisData.barriers || 'Não informado'}

Gere 3-5 metas SMART (Específicas, Mensuráveis, Atingíveis, Relevantes, Temporais) para este aluno.
Para cada meta, forneça:
1. Descrição clara da meta
2. 2-3 estratégias práticas para alcançá-la
3. Critérios objetivos de avaliação
4. Recursos de acessibilidade/tecnologia assistiva necessários

Responda em formato JSON seguindo esta estrutura:
{
  "goals": [
    {
      "description": "descrição da meta",
      "strategies": ["estratégia 1", "estratégia 2"],
      "evaluationCriteria": "critérios de avaliação",
      "resources": "recursos necessários"
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em educação inclusiva e Planos Educacionais Individualizados. Responda sempre em português brasileiro e em formato JSON válido.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
