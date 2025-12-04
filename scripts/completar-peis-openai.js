// Script para Completar PEIs com OpenAI
// Gera todas as estruturas expandidas: RC, Desenvolvimento, Adequações, Cronograma, etc.

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
const supabase = supabaseAdmin;
const openai = new OpenAI({ 
  apiKey: OPENAI_API_KEY
});

console.log('\n🤖 COMPLETANDO PEIs COM OPENAI');
console.log('═══════════════════════════════════════════════════\n');

async function generateWithOpenAI(diagnosisData, studentName) {
  try {
    const prompt = `Você é um Pedagogo Especialista em Educação Inclusiva. Com base no diagnóstico abaixo, gere um PLANEJAMENTO E AVALIAÇÃO completos para um PEI.

ALUNO: ${studentName || 'Não informado'}

DIAGNÓSTICO:
- Histórico: ${diagnosisData.history || 'A completar'}
- Interesses: ${diagnosisData.interests || 'A identificar'}
- Necessidades: ${diagnosisData.specialNeeds || 'A avaliar'}
- Habilidades: ${diagnosisData.abilities || 'A observar'}
- Aversões: ${diagnosisData.aversions || 'A observar'}
- Barreiras: ${diagnosisData.barriers?.map(b => b.barrier_type).join(', ') || 'Nenhuma'}

FOCO: PLANEJAMENTO e AVALIAÇÃO

GERE UM JSON com estas estruturas:

{
  "goals": [
    {
      "category": "academic",
      "description": "Meta SMART detalhada (Específica, Mensurável, Atingível, Relevante, Temporal)",
      "targetDate": "2025-08-31",
      "timeline": "medium_term",
      "specificObjectives": ["Objetivo específico 1", "Objetivo 2"],
      "measurementCriteria": "Como será medido o progresso",
      "expectedOutcomes": "Resultados esperados ao alcançar a meta",
      "strategies": ["Estratégia 1", "Estratégia 2"],
      "bnccCode": "EF15LP01"
    }
  ],
  "accessibilityResources": [
    {
      "type": "Material Adaptado",
      "description": "Descrição detalhada do recurso",
      "frequency": "diária"
    }
  ],
  "curriculumAdaptations": {
    "priorityContents": ["Conteúdo prioritário 1", "Conteúdo 2"],
    "priorityCompetencies": ["Competência prioritária 1"],
    "differentiatedMethodologies": ["Metodologia diferenciada 1", "Metodologia 2"],
    "adaptedAssessments": ["Avaliação adaptada 1", "Avaliação 2"],
    "contentFlexibilization": "Como os conteúdos serão flexibilizados",
    "sequenceReorganization": "Como a sequência didática será reorganizada"
  },
  "interventionSchedule": [
    {
      "period": "Janeiro-Abril 2025",
      "actions": ["Ação 1", "Ação 2", "Ação 3"],
      "responsible": "Professor regente",
      "expectedResults": "Resultados esperados no período"
    }
  ],
  "evaluationCriteria": {
    "progressIndicators": ["Indicador 1", "Indicador 2"],
    "examples": ["Exemplo de progresso 1"],
    "measurementMethods": ["Observação direta", "Portfólio"]
  }
}

IMPORTANTE:
- **OBRIGATÓRIO: Gere NO MÍNIMO 3 METAS** (equilibre 2 acadêmicas + 2 funcionais)
- Seja DETALHADO e ESPECÍFICO em metas e estratégias
- Use os INTERESSES do aluno para engajamento
- Fundamente em DUA, BNCC (acadêmicas) e AEE (funcionais)
- TODAS as listas devem ter pelo menos 2-3 itens
- Datas no formato YYYY-MM-DD (distribuir em 3, 6 e 12 meses)
- Para adequações e cronograma: seja prático e aplicável
- Retorne APENAS o JSON válido, sem markdown ou explicações`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em Educação Inclusiva. Retorne APENAS JSON válido, sem explicações ou markdown."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content;
    
    // Limpar markdown se houver
    let jsonString = content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('  ❌ Erro na OpenAI:', error.message);
    return null;
  }
}

function mapAIResponseToPEI(aiResponse) {
  if (!aiResponse) return {};

  const mapped = {};

  // Metas (PRINCIPAL)
  if (aiResponse.goals && Array.isArray(aiResponse.goals)) {
    mapped.goals = aiResponse.goals.map(goal => ({
      category: goal.category || 'functional',
      description: goal.description || '',
      target_date: goal.targetDate || goal.target_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      timeline: goal.timeline || 'medium_term',
      specific_objectives: goal.specificObjectives || goal.specific_objectives || [],
      measurement_criteria: goal.measurementCriteria || goal.measurement_criteria || '',
      expected_outcomes: goal.expectedOutcomes || goal.expected_outcomes || '',
      strategies: goal.strategies || [],
      notes: goal.notes || '',
      bncc_code: goal.bnccCode || goal.bncc_code || null,
    }));
  }

  // Recursos de acessibilidade
  if (aiResponse.accessibilityResources && Array.isArray(aiResponse.accessibilityResources)) {
    mapped.accessibility_resources = aiResponse.accessibilityResources.map(resource => ({
      type: resource.type || 'Outro',
      description: resource.description || '',
      frequency: resource.frequency || 'quando necessário',
    }));
  }

  // Adequações Curriculares
  if (aiResponse.curriculumAdaptations) {
    mapped.curriculum_adaptations = {
      priority_contents: aiResponse.curriculumAdaptations.priorityContents || [],
      priority_competencies: aiResponse.curriculumAdaptations.priorityCompetencies || [],
      differentiated_methodologies: aiResponse.curriculumAdaptations.differentiatedMethodologies || [],
      adapted_assessments: aiResponse.curriculumAdaptations.adaptedAssessments || [],
      content_flexibilization: aiResponse.curriculumAdaptations.contentFlexibilization || '',
      sequence_reorganization: aiResponse.curriculumAdaptations.sequenceReorganization || '',
    };
  }

  // Cronograma de Intervenção
  if (aiResponse.interventionSchedule && Array.isArray(aiResponse.interventionSchedule)) {
    mapped.intervention_schedule = aiResponse.interventionSchedule.map(item => ({
      period: item.period || '',
      actions: item.actions || [],
      responsible: item.responsible || '',
      expected_results: item.expectedResults || item.expected_results || '',
    }));
  }

  // Critérios de Avaliação
  if (aiResponse.evaluationCriteria) {
    mapped.evaluation_criteria = {
      progress_indicators: aiResponse.evaluationCriteria.progressIndicators || [],
      examples: aiResponse.evaluationCriteria.examples || [],
      measurement_methods: aiResponse.evaluationCriteria.measurementMethods || [],
    };
  }

  return mapped;
}

async function processPEI(pei, peiIndex, total) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[${peiIndex}/${total}] PEI ID: ${pei.id.substring(0, 8)}...`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  try {
    // Verificar status atual
    const hasGoals = pei.planning_data?.goals && pei.planning_data.goals.length >= 3;
    const hasCurriculum = pei.planning_data?.curriculum_adaptations;
    const hasSchedule = pei.planning_data?.intervention_schedule;
    const hasEvalCriteria = pei.evaluation_data?.evaluation_criteria;

    console.log('  📊 Status atual:');
    console.log(`     Metas: ${hasGoals ? '✅' : '❌'} (${pei.planning_data?.goals?.length || 0})`);
    console.log(`     Adequações: ${hasCurriculum ? '✅' : '❌'}`);
    console.log(`     Cronograma: ${hasSchedule ? '✅' : '❌'}`);
    console.log(`     Critérios Avaliação: ${hasEvalCriteria ? '✅' : '❌'}`);

    // Verificar se precisa completar
    const needsCompletion = !hasGoals || !hasCurriculum || !hasSchedule || !hasEvalCriteria;

    if (!needsCompletion) {
      console.log('  ✅ PEI já está completo. Pulando...');
      return { success: true, skipped: true };
    }

    // Buscar nome do aluno
    let studentName = 'Aluno';
    if (pei.student_id) {
      const { data: studentData } = await supabaseAdmin
        .from('students')
        .select('name')
        .eq('id', pei.student_id)
        .single();
      if (studentData) {
        studentName = studentData.name;
      }
    }

    // Gerar com OpenAI
    console.log(`  🤖 Gerando com OpenAI para ${studentName}...`);
    const aiResponse = await generateWithOpenAI(pei.diagnosis_data, studentName);

    if (!aiResponse) {
      console.log('  ⚠️ OpenAI não retornou dados. Mantendo PEI atual.');
      return { success: false, error: 'OpenAI sem resposta' };
    }

    // Mapear resposta
    const aiMapped = mapAIResponseToPEI(aiResponse);

    // Atualizar planning_data (FOCO PRINCIPAL)
    const updatedPlanningData = {
      ...pei.planning_data,
      goals: hasGoals ? pei.planning_data.goals : (aiMapped.goals || []),
      accessibility_resources: pei.planning_data?.accessibility_resources?.length > 0 
        ? pei.planning_data.accessibility_resources 
        : (aiMapped.accessibility_resources || []),
      curriculum_adaptations: hasCurriculum ? pei.planning_data.curriculum_adaptations : aiMapped.curriculum_adaptations,
      intervention_schedule: hasSchedule ? pei.planning_data.intervention_schedule : aiMapped.intervention_schedule,
    };

    // Atualizar evaluation_data
    const updatedEvaluationData = {
      ...pei.evaluation_data,
      evaluation_criteria: aiMapped.evaluation_criteria,
      progress_recording: pei.evaluation_data?.progress_recording || {
        frequency: 'trimestral',
        format: 'mixed',
        responsible: pei.profiles?.full_name || 'Professor responsável',
      },
      next_review_date: pei.evaluation_data?.next_review_date || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pei_review: pei.evaluation_data?.pei_review || {
        review_frequency: 'Semestral',
        review_process: 'Reunião com equipe escolar e família',
        participants: ['Professor regente', 'Coordenador', 'Família', 'AEE'],
      },
    };

    console.log('  📝 Dados gerados:');
    console.log(`     Metas: ${aiMapped.goals?.length || 0}`);
    console.log(`     Adequações: ${aiMapped.curriculum_adaptations ? '✅' : '❌'}`);
    console.log(`     Cronograma: ${aiMapped.intervention_schedule?.length || 0} períodos`);
    console.log(`     Critérios: ${aiMapped.evaluation_criteria ? '✅' : '❌'}`);

    // Atualizar no banco (SÓ planning_data e evaluation_data)
    const { error: updateError } = await supabaseAdmin
      .from('peis')
      .update({
        planning_data: updatedPlanningData,
        evaluation_data: updatedEvaluationData,
      })
      .eq('id', pei.id);

    if (updateError) {
      console.error('  ❌ Erro ao atualizar:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('  ✅ PEI completado com sucesso!');
    return { success: true, completed: true };

  } catch (error) {
    console.error('  ❌ Erro:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  try {
    console.log('🔍 Buscando informações...');
    
    // Buscar rede São Gonçalo dos Campos
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, network_name')
      .ilike('network_name', '%São Gonçalo%')
      .single();

    if (!tenant) {
      console.log('⚠️ Rede não encontrada. Buscando todos os PEIs draft...');
    } else {
      console.log(`✅ Rede: ${tenant.network_name}`);
    }
    
    console.log('\n📚 Buscando PEIs draft...');
    
    let query = supabaseAdmin
      .from('peis')
      .select('*')
      .eq('status', 'draft');

    if (tenant) {
      query = query.eq('tenant_id', tenant.id);
    }

    const { data: peis, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar PEIs:', error);
      throw error;
    }

    if (!peis || peis.length === 0) {
      console.log('❌ Nenhum PEI draft encontrado');
      return;
    }

    console.log(`✅ ${peis.length} PEIs encontrados\n`);
    console.log('🔄 PROCESSANDO...');

    const results = {
      total: peis.length,
      completed: 0,
      skipped: 0,
      errors: 0,
    };

    // Processar cada PEI
    for (let i = 0; i < peis.length; i++) {
      const pei = peis[i];
      const result = await processPEI(pei, i + 1, peis.length);

      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.completed++;
        }
      } else {
        results.errors++;
      }

      // Delay entre chamadas
      if (i < peis.length - 1) {
        console.log('  ⏳ Aguardando 3 segundos...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RELATÓRIO FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ PEIs completados: ${results.completed}`);
    console.log(`⏭️  PEIs pulados (já completos): ${results.skipped}`);
    console.log(`❌ Erros: ${results.errors}`);
    console.log(`📊 Total processado: ${results.total}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (results.completed > 0 || results.skipped > 0) {
      console.log('\n🎉 Processamento concluído!');
      console.log('\n💡 PRÓXIMO PASSO:');
      console.log('   Gerar PDFs com dados completos:');
      console.log('   npm run generate:sao-goncalo-final\n');
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

main();

