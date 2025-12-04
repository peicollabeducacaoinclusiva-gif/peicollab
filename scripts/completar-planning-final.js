// Script para Completar Planejamento e Avaliação (SIMPLIFICADO)
// Baseado no script funcional enriquecer-peis-com-formularios.js
// Adiciona: Metas (mín. 3), Adequações, Cronograma, Critérios

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ⚠️ SEGURANÇA: Use variáveis de ambiente para credenciais
// Configure as variáveis antes de executar este script:
// export SUPABASE_URL="https://your-project.supabase.co"
// export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
// export OPENAI_API_KEY="your-openai-api-key"

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL) {
  throw new Error('❌ SUPABASE_URL não configurada. Configure a variável de ambiente SUPABASE_URL ou VITE_SUPABASE_URL');
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada. Configure a variável de ambiente SUPABASE_SERVICE_ROLE_KEY');
}
if (!OPENAI_API_KEY) {
  throw new Error('❌ OPENAI_API_KEY não configurada. Configure a variável de ambiente OPENAI_API_KEY');
}

const MAPEAMENTO_PATH = path.join(__dirname, '..', 'mapeamento-formularios.json');

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ 
  apiKey: OPENAI_API_KEY
});

console.log('\n🔄 COMPLETAR PLANEJAMENTO E AVALIAÇÃO COM OPENAI');
console.log('═══════════════════════════════════════════════════\n');

async function gerarComOpenAI(aluno) {
  const prompt = `Gere um PLANEJAMENTO PEDAGÓGICO para o aluno ${aluno.name}.

DIAGNÓSTICO:
- Histórico: ${aluno.diagnosis_data?.history || 'A completar'}
- Interesses: ${aluno.diagnosis_data?.interests || 'A identificar'}
- Necessidades: ${aluno.diagnosis_data?.specialNeeds || 'A avaliar'}
- Habilidades: ${aluno.diagnosis_data?.abilities || 'A observar'}

GERE JSON com:
{
  "goals": [{"category": "academic", "description": "Meta SMART", "targetDate": "2025-MM-DD", "timeline": "medium_term", "specificObjectives": [], "measurementCriteria": "", "expectedOutcomes": "", "strategies": [], "bnccCode": null}],
  "accessibilityResources": [{"type": "", "description": "", "frequency": "diária"}],
  "curriculumAdaptations": {"priorityContents": [], "priorityCompetencies": [], "differentiatedMethodologies": [], "adaptedAssessments": [], "contentFlexibilization": "", "sequenceReorganization": ""},
  "interventionSchedule": [{"period": "", "actions": [], "responsible": "", "expectedResults": ""}],
  "evaluationCriteria": {"progressIndicators": [], "examples": [], "measurementMethods": []}
}

OBRIGATÓRIO: NO MÍNIMO 3 METAS. Retorne APENAS JSON.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Retorne APENAS JSON válido." },
      { role: "user", content: prompt }
    ],
    temperature: 0.8,
  });

  const content = completion.choices[0].message.content.trim();
  const match = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
  return JSON.parse(match ? match[1] : content);
}

async function main() {
  try {
    // Carregar mapeamento
    console.log('📂 Carregando mapeamento...');
    const mapeamento = JSON.parse(fs.readFileSync(MAPEAMENTO_PATH, 'utf-8'));
    console.log(`✅ ${mapeamento.length} alunos mapeados\n`);

    console.log('🔄 PROCESSANDO ALUNOS...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const [i, item] of mapeamento.entries()) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`[${i + 1}/${mapeamento.length}] ${item.name}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      try {
        // Buscar PEI do aluno
        const { data: peis, error: peiError } = await supabaseAdmin
          .from('peis')
          .select('id, diagnosis_data, planning_data, evaluation_data')
          .eq('student_id', item.id)
          .in('status', ['draft', 'pending'])
          .limit(1);

        if (peiError) throw peiError;

        if (!peis || peis.length === 0) {
          console.log('  ⏭️  Sem PEI. Pulando...\n');
          continue;
        }

        const pei = peis[0];

        // Verificar se já tem planejamento completo
        const hasGoals = pei.planning_data?.goals && pei.planning_data.goals.length >= 3;
        const hasCurriculum = pei.planning_data?.curriculum_adaptations;
        
        if (hasGoals && hasCurriculum) {
          console.log('  ✅ Já tem planejamento completo. Pulando...\n');
          continue;
        }

        // Gerar com OpenAI
        console.log('  🤖 Gerando com OpenAI...');
        const aiData = await gerarComOpenAI(item);

        const newGoals = aiData.goals?.map(g => ({
          category: g.category || 'functional',
          description: g.description || '',
          target_date: g.targetDate || g.target_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          timeline: g.timeline || 'medium_term',
          specific_objectives: g.specificObjectives || [],
          measurement_criteria: g.measurementCriteria || '',
          expected_outcomes: g.expectedOutcomes || '',
          strategies: g.strategies || [],
          bncc_code: g.bnccCode || null,
        })) || [];

        const newResources = aiData.accessibilityResources?.map(r => ({
          type: r.type || 'Outro',
          description: r.description || '',
          frequency: r.frequency || 'quando necessário',
        })) || [];

        console.log(`  ✅ Gerado: ${newGoals.length} metas, ${newResources.length} recursos`);

        // Atualizar
        const { error: updateError } = await supabaseAdmin
          .from('peis')
          .update({
            planning_data: {
              ...pei.planning_data,
              goals: hasGoals ? pei.planning_data.goals : newGoals,
              accessibility_resources: pei.planning_data?.accessibility_resources?.length > 0
                ? pei.planning_data.accessibility_resources
                : newResources,
              curriculum_adaptations: hasCurriculum ? pei.planning_data.curriculum_adaptations : aiData.curriculumAdaptations,
              intervention_schedule: pei.planning_data?.intervention_schedule || aiData.interventionSchedule,
            },
            evaluation_data: {
              ...pei.evaluation_data,
              evaluation_criteria: aiData.evaluationCriteria,
            },
          })
          .eq('id', pei.id);

        if (updateError) throw updateError;

        console.log('  ✅ PEI atualizado com sucesso!\n');
        successCount++;

        // Delay
        if (i < mapeamento.length - 1) {
          await new Promise(r => setTimeout(r, 3000));
        }

      } catch (error) {
        errorCount++;
        console.error(`  ❌ Erro: ${error.message}\n`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RELATÓRIO FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ PEIs completados: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (successCount > 0) {
      console.log('\n🎉 Concluído!');
      console.log('\n💡 PRÓXIMO PASSO:');
      console.log('   npm run generate:sao-goncalo-final\n');
    }

  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

main();

