// Script Simplificado: Completar APENAS Planejamento e Avaliação
// Gera: Metas (mín. 3), Adequações, Cronograma, Critérios
// Data: 07/11/2025

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// ====================================
// CONFIGURAÇÕES
// ====================================
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

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ 
  apiKey: OPENAI_API_KEY
});

console.log('\n🤖 COMPLETANDO PLANEJAMENTO E AVALIAÇÃO COM OPENAI');
console.log('═══════════════════════════════════════════════════\n');

// ====================================
// FUNÇÃO PARA GERAR COM OPENAI
// ====================================

async function gerarPlanejamentoComOpenAI(diagnosisData, studentName) {
  try {
    console.log('  🤖 Gerando planejamento com OpenAI...');
    
    const prompt = `Você é um Pedagogo Especialista em Educação Inclusiva. Gere um PLANEJAMENTO PEDAGÓGICO E CRITÉRIOS DE AVALIAÇÃO para o aluno.

ALUNO: ${studentName}

DIAGNÓSTICO:
- Histórico: ${diagnosisData.history || 'A completar'}
- Interesses: ${diagnosisData.interests || 'A identificar'}
- Necessidades: ${diagnosisData.specialNeeds || 'A avaliar'}
- Habilidades: ${diagnosisData.abilities || 'A observar'}
- Aversões: ${diagnosisData.aversions || 'A observar'}

GERE um JSON com:

{
  "goals": [
    {
      "category": "academic" ou "functional",
      "description": "Meta SMART completa",
      "targetDate": "2025-MM-DD",
      "timeline": "short_term" | "medium_term" | "long_term",
      "specificObjectives": ["Objetivo 1", "Objetivo 2"],
      "measurementCriteria": "Como medir",
      "expectedOutcomes": "Resultados esperados",
      "strategies": ["Estratégia 1", "Estratégia 2"],
      "bnccCode": "EF15LP01" ou null
    }
  ],
  "accessibilityResources": [
    {
      "type": "Material Adaptado",
      "description": "Descrição",
      "frequency": "diária"
    }
  ],
  "curriculumAdaptations": {
    "priorityContents": ["Conteúdo 1", "Conteúdo 2"],
    "priorityCompetencies": ["Competência 1"],
    "differentiatedMethodologies": ["Metodologia 1", "Metodologia 2"],
    "adaptedAssessments": ["Avaliação 1"],
    "contentFlexibilization": "Como flexibilizar",
    "sequenceReorganization": "Como reorganizar"
  },
  "interventionSchedule": [
    {
      "period": "Janeiro-Abril 2025",
      "actions": ["Ação 1", "Ação 2"],
      "responsible": "Professor regente",
      "expectedResults": "Resultados esperados"
    }
  ],
  "evaluationCriteria": {
    "progressIndicators": ["Indicador 1", "Indicador 2"],
    "examples": ["Exemplo 1"],
    "measurementMethods": ["Método 1", "Método 2"]
  }
}

OBRIGATÓRIO:
- NO MÍNIMO 3 METAS (equilibre 2 acadêmicas + 2 funcionais)
- Use os INTERESSES do aluno
- Metas SMART detalhadas
- Datas: curto prazo = +3 meses, médio = +6 meses, longo = +12 meses
- RETORNE APENAS JSON, sem markdown`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Você é um especialista em Educação Inclusiva. Retorne APENAS JSON válido." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 3000,
    });

    const content = completion.choices[0].message.content;
    let jsonString = content.trim();
    
    // Remover markdown se houver
    if (jsonString.includes('```')) {
      const match = jsonString.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (match) {
        jsonString = match[1];
      }
    }
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('  ❌ Erro OpenAI:', error.message);
    return null;
  }
}

// ====================================
// PROCESSAR PEI
// ====================================

async function processarPEI(pei, index, total) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[${index}/${total}]`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  try {
    // Buscar nome do aluno
    const { data: studentData } = await supabaseAdmin
      .from('students')
      .select('name')
      .eq('id', pei.student_id)
      .single();

    const studentName = studentData?.name || 'Aluno';
    console.log(`  Aluno: ${studentName}`);

    // Verificar o que já tem
    const hasGoals = pei.planning_data?.goals && pei.planning_data.goals.length >= 3;
    const hasCurriculum = pei.planning_data?.curriculum_adaptations;
    const hasSchedule = pei.planning_data?.intervention_schedule;

    console.log('  📊 Status:');
    console.log(`     Metas: ${hasGoals ? '✅' : '❌'} (${pei.planning_data?.goals?.length || 0})`);
    console.log(`     Adequações: ${hasCurriculum ? '✅' : '❌'}`);
    console.log(`     Cronograma: ${hasSchedule ? '✅' : '❌'}`);

    if (hasGoals && hasCurriculum && hasSchedule) {
      console.log('  ✅ Já completo. Pulando...');
      return { success: true, skipped: true };
    }

    // Gerar com OpenAI
    const aiData = await gerarPlanejamentoComOpenAI(pei.diagnosis_data, studentName);

    if (!aiData) {
      console.log('  ⚠️ OpenAI não retornou dados');
      return { success: false };
    }

    // Mapear dados
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

    const newCurriculum = aiData.curriculumAdaptations || null;
    const newSchedule = aiData.interventionSchedule || [];
    const newEvalCriteria = aiData.evaluationCriteria || null;

    console.log('  📝 Gerado:');
    console.log(`     Metas: ${newGoals.length}`);
    console.log(`     Recursos: ${newResources.length}`);
    console.log(`     Adequações: ${newCurriculum ? '✅' : '❌'}`);
    console.log(`     Cronograma: ${newSchedule.length} períodos`);

    // Atualizar PEI
    const updatedPlanningData = {
      ...pei.planning_data,
      goals: hasGoals ? pei.planning_data.goals : newGoals,
      accessibility_resources: pei.planning_data?.accessibility_resources?.length > 0
        ? pei.planning_data.accessibility_resources
        : newResources,
      curriculum_adaptations: hasCurriculum ? pei.planning_data.curriculum_adaptations : newCurriculum,
      intervention_schedule: hasSchedule ? pei.planning_data.intervention_schedule : newSchedule,
    };

    const updatedEvaluationData = {
      ...pei.evaluation_data,
      evaluation_criteria: newEvalCriteria,
      progress_recording: pei.evaluation_data?.progress_recording || {
        frequency: 'trimestral',
        format: 'mixed',
      },
      pei_review: pei.evaluation_data?.pei_review || {
        review_frequency: 'Semestral',
        participants: ['Professor', 'Coordenador', 'Família'],
      },
    };

    const { error } = await supabaseAdmin
      .from('peis')
      .update({
        planning_data: updatedPlanningData,
        evaluation_data: updatedEvaluationData,
      })
      .eq('id', pei.id);

    if (error) {
      console.error('  ❌ Erro ao atualizar:', error);
      return { success: false };
    }

    console.log('  ✅ PEI atualizado!');
    return { success: true, completed: true };

  } catch (error) {
    console.error('  ❌ Erro:', error.message);
    return { success: false };
  }
}

// ====================================
// MAIN
// ====================================

async function main() {
  try {
    console.log('📚 Testando conexão...\n');
    
    // Teste 1: Count
    console.log('Test 1: Count de tenants');
    const { count, error: countError } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Erro:', countError);
    } else {
      console.log(`✅ ${count} tenants encontrados`);
    }

    // Teste 2: Select simples
    console.log('\nTest 2: Select de tenants');
    const { data: tenants, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, network_name')
      .limit(1);
    
    if (tenantError) {
      console.error('Erro:', tenantError);
    } else {
      console.log(`✅ Tenant: ${tenants[0]?.network_name}`);
    }

    // Teste 3: Count de PEIs
    console.log('\nTest 3: Count de PEIs');
    const { count: peiCount, error: peiCountError } = await supabaseAdmin
      .from('peis')
      .select('*', { count: 'exact', head: true });
    
    if (peiCountError) {
      console.error('Erro:', peiCountError);
      throw peiCountError;
    } else {
      console.log(`✅ ${peiCount} PEIs no banco`);
    }

    console.log('\n📚 Buscando PEIs draft...\n');

    const { data: peis, error } = await supabaseAdmin
      .from('peis')
      .select('id, student_id, diagnosis_data, planning_data, evaluation_data')
      .eq('status', 'draft')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro detalhado:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log(`✅ ${peis.length} PEIs encontrados\n`);
    console.log('🔄 PROCESSANDO...');

    const results = { total: peis.length, completed: 0, skipped: 0, errors: 0 };

    for (let i = 0; i < peis.length; i++) {
      const result = await processarPEI(peis[i], i + 1, peis.length);

      if (result.success) {
        result.skipped ? results.skipped++ : results.completed++;
      } else {
        results.errors++;
      }

      // Delay entre chamadas
      if (i < peis.length - 1) {
        console.log('  ⏳ Aguardando 3s...');
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RELATÓRIO FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Completados: ${results.completed}`);
    console.log(`⏭️  Pulados: ${results.skipped}`);
    console.log(`❌ Erros: ${results.errors}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (results.completed > 0) {
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

