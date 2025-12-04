import { createClient } from '@supabase/supabase-js';

// ====================================
// CONFIGURAÇÕES
// ====================================
// ⚠️ SEGURANÇA: Use variáveis de ambiente para credenciais
// Configure as variáveis antes de executar este script:
// export SUPABASE_URL="https://your-project.supabase.co"
// export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('❌ SUPABASE_URL não configurada. Configure a variável de ambiente SUPABASE_URL ou VITE_SUPABASE_URL');
}
if (!supabaseServiceKey) {
  throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada. Configure a variável de ambiente SUPABASE_SERVICE_ROLE_KEY');
}

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('\n🤖 COMPLETANDO PEIs COM IA');
console.log('═══════════════════════════════════════════════════\n');

async function generateWithAI(diagnosisData) {
  try {
    console.log('  🤖 Chamando IA para gerar planejamento...');
    
    const { data, error } = await supabase.functions.invoke('generate-pei-planning', {
      body: { diagnosisData }
    });

    if (error) {
      console.error('  ❌ Erro na IA:', error);
      return null;
    }

    return data?.planningData;
  } catch (error) {
    console.error('  ❌ Erro ao chamar IA:', error);
    return null;
  }
}

function mapAIResponseToPEI(aiResponse) {
  if (!aiResponse) return {};

  const mapped = {};

  // Metas
  if (aiResponse.goals && Array.isArray(aiResponse.goals)) {
    mapped.goals = aiResponse.goals.map(goal => ({
      category: goal.category || 'functional',
      description: goal.description || goal.title || '',
      target_date: goal.target_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      timeline: goal.timeline || 'medium_term',
      specific_objectives: goal.specific_objectives || (goal.theoreticalBasis ? [goal.theoreticalBasis] : []),
      measurement_criteria: goal.measurement_criteria || goal.evaluationCriteria || '',
      expected_outcomes: goal.expected_outcomes || goal.expectedProgress || '',
      strategies: goal.strategies || [],
      notes: goal.teamInvolvement || '',
      bncc_code: goal.bncc_code || goal.bnccCode || null,
    }));
  }

  // Recursos de acessibilidade
  if (aiResponse.accessibilityResources && Array.isArray(aiResponse.accessibilityResources)) {
    mapped.accessibility_resources = aiResponse.accessibilityResources.map(resource => ({
      type: resource.type || resource.resource_type || 'Outro',
      description: resource.description || '',
      frequency: resource.frequency || 'quando necessário',
    }));
  }

  // 🆕 RC - Relatório Circunstanciado
  if (aiResponse.circumstantialReport) {
    mapped.circumstantial_report = {
      how_student_learns: aiResponse.circumstantialReport.howStudentLearns,
      learning_barriers: aiResponse.circumstantialReport.learningBarriers,
      social_interaction: aiResponse.circumstantialReport.socialInteraction,
      communication: aiResponse.circumstantialReport.communication,
      attention: aiResponse.circumstantialReport.attention,
      autonomy: aiResponse.circumstantialReport.autonomy,
      behavior: aiResponse.circumstantialReport.behavior,
      emotional_context: aiResponse.circumstantialReport.emotionalContext,
    };
  }

  // 🆕 Nível de Desenvolvimento
  if (aiResponse.developmentLevel) {
    mapped.development_level = {
      language: aiResponse.developmentLevel.language || {},
      reading: aiResponse.developmentLevel.reading || {},
      writing: aiResponse.developmentLevel.writing || {},
      logical_reasoning: aiResponse.developmentLevel.logicalReasoning || {},
      motor_coordination: aiResponse.developmentLevel.motorCoordination || {},
      social_skills: aiResponse.developmentLevel.socialSkills || {},
    };
  }

  // 🆕 Adequações Curriculares
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

  // 🆕 Cronograma de Intervenção
  if (aiResponse.interventionSchedule && Array.isArray(aiResponse.interventionSchedule)) {
    mapped.intervention_schedule = aiResponse.interventionSchedule.map(item => ({
      period: item.period || '',
      actions: item.actions || [],
      responsible: item.responsible || '',
      expected_results: item.expectedResults || item.expected_results || '',
    }));
  }

  // 🆕 Critérios de Avaliação (vai para evaluation_data)
  if (aiResponse.evaluationCriteria) {
    mapped.evaluation_criteria = {
      progress_indicators: aiResponse.evaluationCriteria.progressIndicators || [],
      examples: aiResponse.evaluationCriteria.examples || [],
      measurement_methods: aiResponse.evaluationCriteria.measurementMethods || [],
    };
  }

  return mapped;
}

async function processPEI(pei) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[${pei.index}/${pei.total}] ${pei.students.name}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  try {
    // Verificar se já tem planejamento completo
    const hasGoals = pei.planning_data?.goals && pei.planning_data.goals.length >= 3;
    const hasRC = pei.diagnosis_data?.circumstantial_report;
    const hasDevelopment = pei.diagnosis_data?.development_level;
    const hasCurriculum = pei.planning_data?.curriculum_adaptations;
    const hasSchedule = pei.planning_data?.intervention_schedule;

    console.log('  📊 Status atual:');
    console.log(`     Metas: ${hasGoals ? '✅' : '❌'} (${pei.planning_data?.goals?.length || 0})`);
    console.log(`     RC: ${hasRC ? '✅' : '❌'}`);
    console.log(`     Desenvolvimento: ${hasDevelopment ? '✅' : '❌'}`);
    console.log(`     Adequações: ${hasCurriculum ? '✅' : '❌'}`);
    console.log(`     Cronograma: ${hasSchedule ? '✅' : '❌'}`);

    // Se já está completo, pular
    if (hasGoals && hasRC && hasDevelopment && hasCurriculum && hasSchedule) {
      console.log('  ✅ PEI já está completo. Pulando...');
      return { success: true, skipped: true };
    }

    // Gerar com IA
    console.log('  🤖 Gerando planejamento completo com IA...');
    const aiResponse = await generateWithAI(pei.diagnosis_data);

    if (!aiResponse) {
      console.log('  ⚠️ IA não retornou dados. Mantendo PEI atual.');
      return { success: false, error: 'IA sem resposta' };
    }

    // Mapear resposta da IA
    const aiMapped = mapAIResponseToPEI(aiResponse);

    // Mesclar com dados existentes (preservar o que já existe)
    const updatedDiagnosisData = {
      ...pei.diagnosis_data,
      ...(aiMapped.circumstantial_report && !hasRC ? { circumstantial_report: aiMapped.circumstantial_report } : {}),
      ...(aiMapped.development_level && !hasDevelopment ? { development_level: aiMapped.development_level } : {}),
    };

    const updatedPlanningData = {
      ...pei.planning_data,
      goals: hasGoals ? pei.planning_data.goals : (aiMapped.goals || []),
      accessibility_resources: pei.planning_data?.accessibility_resources?.length > 0 
        ? pei.planning_data.accessibility_resources 
        : (aiMapped.accessibility_resources || []),
      ...(aiMapped.curriculum_adaptations && !hasCurriculum ? { curriculum_adaptations: aiMapped.curriculum_adaptations } : {}),
      ...(aiMapped.intervention_schedule && !hasSchedule ? { intervention_schedule: aiMapped.intervention_schedule } : {}),
    };

    const updatedEvaluationData = {
      ...pei.evaluation_data,
      ...(aiMapped.evaluation_criteria ? { evaluation_criteria: aiMapped.evaluation_criteria } : {}),
      // Definir frequência padrão de avaliação
      progress_recording: pei.evaluation_data?.progress_recording || {
        frequency: 'trimestral',
        format: 'mixed',
        responsible: pei.profiles?.full_name || 'Professor responsável',
      },
      // Definir próxima revisão (6 meses)
      next_review_date: pei.evaluation_data?.next_review_date || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pei_review: pei.evaluation_data?.pei_review || {
        review_frequency: 'Semestral',
        review_process: 'Reunião com equipe escolar e família para avaliação do progresso e ajustes necessários',
        participants: ['Professor regente', 'Coordenador', 'Família', 'AEE'],
      },
    };

    console.log('  📝 Dados gerados:');
    console.log(`     Metas: ${aiMapped.goals?.length || 0}`);
    console.log(`     Recursos: ${aiMapped.accessibility_resources?.length || 0}`);
    console.log(`     RC: ${aiMapped.circumstantial_report ? 'Sim' : 'Não'}`);
    console.log(`     Desenvolvimento: ${aiMapped.development_level ? 'Sim' : 'Não'}`);
    console.log(`     Adequações: ${aiMapped.curriculum_adaptations ? 'Sim' : 'Não'}`);
    console.log(`     Cronograma: ${aiMapped.intervention_schedule?.length || 0} períodos`);

    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('peis')
      .update({
        diagnosis_data: updatedDiagnosisData,
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
    console.error('  ❌ Erro:', error);
    return { success: false, error: error.message };
  }
}

async function main() {
  try {
    // Teste de conexão
    console.log('🔍 Testando conexão com Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('peis')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro de conexão:', testError);
      throw testError;
    }
    
    console.log('✅ Conexão estabelecida\n');
    
    // Buscar todos os PEIs draft da rede São Gonçalo dos Campos
    const { data: peis, error } = await supabase
      .from('peis')
      .select(`
        id,
        student_id,
        diagnosis_data,
        planning_data,
        evaluation_data,
        students(name),
        profiles(full_name)
      `)
      .eq('status', 'draft')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!peis || peis.length === 0) {
      console.log('❌ Nenhum PEI draft encontrado');
      return;
    }

    console.log(`✅ ${peis.length} PEIs encontrados`);
    console.log('\n🔄 PROCESSANDO...\n');

    const results = {
      total: peis.length,
      completed: 0,
      skipped: 0,
      errors: 0,
    };

    // Processar cada PEI
    for (let i = 0; i < peis.length; i++) {
      const pei = { ...peis[i], index: i + 1, total: peis.length };
      const result = await processPEI(pei);

      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.completed++;
        }
      } else {
        results.errors++;
      }

      // Delay entre chamadas para evitar rate limit
      if (i < peis.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
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

