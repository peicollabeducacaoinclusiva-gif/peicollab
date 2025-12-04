// Script para Enriquecer PEIs com Dados dos Formulários
// Atualiza diagnosis_data, gera metas com IA, adiciona recursos e encaminhamentos
// Data: 06/11/2024

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ====================================
// CONFIGURAÇÕES
// ====================================

const SUPABASE_URL = 'https://fximylewmvsllkdczovj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY5NjQ3MiwiZXhwIjoyMDc3MjcyNDcyfQ.ezYPOGMO2ik-VaiNoBrJ7cKivms3SiZsJ5zN0Fhm3Fg';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY0NzIsImV4cCI6MjA3NzI3MjQ3Mn0.3FqQqUfVgD3hIh1daa3R1JjouGZ4D4ONR6SmcL9Qids';

const MAPEAMENTO_PATH = path.join(__dirname, '..', 'mapeamento-formularios.json');
const GENERATE_AI = true; // Gerar metas com IA baseadas nos dados ricos
const DELAY_BETWEEN_AI = 3000; // 3 segundos entre cada chamada de IA

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====================================
// FUNÇÕES DE MAPEAMENTO
// ====================================

function mapearBarreiras(dadosCoord) {
  const barreiras = {};
  
  const arquitetonicas = dadosCoord['Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [🏗️ Arquitetônicas (mobiliário inadequado, banheiros não adaptados...)]'];
  const comunicacionais = dadosCoord['Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [💬 Comunicacionais (ausência de Libras, braile, CAA...)]'];
  const atitudinais = dadosCoord['Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [🤝 Atitudinais (falta de acolhimento, capacitismo, bullying...)]'];
  const tecnologicas = dadosCoord['Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [💻 Tecnológicas (falta de computadores, tablets, softwares acessíveis...)]'];
  const pedagogicas = dadosCoord['Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [📚 Pedagógicas (atividades sem adaptação, provas inflexíveis, metodologias únicas...)]'];
  const outras = dadosCoord['Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [⚙️ Outras (ex: emocionais, familiares, sensoriais...)]'];

  if (arquitetonicas && arquitetonicas !== 'Nenhum') barreiras.arquitetonicas = arquitetonicas;
  if (comunicacionais && comunicacionais !== 'Nenhum') barreiras.comunicacionais = comunicacionais;
  if (atitudinais && atitudinais !== 'Nenhum') barreiras.atitudinais = atitudinais;
  if (tecnologicas && tecnologicas !== 'Nenhum') barreiras.tecnologicas = tecnologicas;
  if (pedagogicas && pedagogicas !== 'Nenhum') barreiras.pedagogicas = pedagogicas;
  if (outras && outras !== 'Nenhum') barreiras.outras = outras;

  return barreiras;
}

function construirDiagnosticoCompleto(aluno, dadosCoord, dadosMae) {
  const diagnosis = {
    // Histórico completo e contextualizado
    history: dadosCoord['Histórico resumido (Relato familiar, escolar e do próprio estudante. Inclua informações sobre convivência, saúde, frequência e rotina.)'] || 'Histórico a ser completado',
    
    // Necessidades especiais identificadas
    specialNeeds: dadosCoord['O que precisa de mais ajuda - necessidades (Exemplo: leitura de palavras, organização de materiais, manter a atenção, coordenação motora fina, compreensão oral etc.)'] || 'A identificar',
    
    // Interesses e hiperfoco
    interests: dadosCoord['Interesses / Hiperfoco (Exemplo: música, animais, desenhos, jogos, números, personagens, cores, temas específicos etc.)'] || 'A identificar',
    
    // ✅ CAMPOS ESTENDIDOS (Nomes corretos do schema)
    // O que já consegue fazer - habilidades
    abilities: dadosCoord['O que a criança já consegue fazer - habilidades (Exemplo: reconhece letras, escreve o nome, interage com colegas, segue instruções simples, identifica moedas etc.)'] || 'A avaliar',
    strengths: dadosCoord['O que a criança já consegue fazer - habilidades (Exemplo: reconhece letras, escreve o nome, interage com colegas, segue instruções simples, identifica moedas etc.)'] || 'A avaliar', // Alias
    
    // Desinteresses / Aversão
    aversions: dadosCoord['Desinteresses / Aversão (Exemplo: barulho alto, determinadas atividades, contato físico, mudanças de rotina, alguns temas ou matérias etc.)'] || 'A observar',
    challenges: dadosCoord['Desinteresses / Aversão (Exemplo: barulho alto, determinadas atividades, contato físico, mudanças de rotina, alguns temas ou matérias etc.)'] || 'A observar', // Alias
    
    // Barreiras identificadas
    barriers: mapearBarreiras(dadosCoord),
    
    // Comentários sobre barreiras
    barriersComments: dadosCoord['Comentários ou observações sobre barreiras  (Descreva situações ou exemplos práticos dessas barreiras no ambiente escolar. ex: falta de sinalização tátil, ausência de intérprete, ruídos, resistência docente etc.) '] || '',
    
    // Perspectiva familiar (MÃE)
    familyNeeds: dadosMae['Quais as necessidades do seu filho(a)?'] || '',
    familyExpectations: dadosMae['Quais ações você espera da escola para incluir seu filho(a)?'] || '',
  };

  return diagnosis;
}

function identificarEncaminhamentos(dadosCoord, diagnosis) {
  const encaminhamentos = [];
  
  // Baseado nas barreiras e necessidades
  const barreiras = diagnosis.barriers || {};
  
  if (barreiras.comunicacionais) {
    if (barreiras.comunicacionais.includes('Libras') || barreiras.comunicacionais.includes('Alto')) {
      encaminhamentos.push('Fonoaudiólogo');
    }
  }
  
  if (barreiras.arquitetonicas && barreiras.arquitetonicas !== 'Nenhum') {
    encaminhamentos.push('Terapeuta Ocupacional');
  }
  
  // Baseado no diagnóstico
  const historico = (dadosCoord['Histórico resumido (Relato familiar, escolar e do próprio estudante. Inclua informações sobre convivência, saúde, frequência e rotina.)'] || '').toLowerCase();
  
  if (historico.includes('autista') || historico.includes('tea')) {
    if (!encaminhamentos.includes('Psicólogo')) encaminhamentos.push('Psicólogo');
  }
  
  if (historico.includes('paralisia') || historico.includes('motora')) {
    if (!encaminhamentos.includes('Fisioterapeuta')) encaminhamentos.push('Fisioterapeuta');
  }
  
  if (historico.includes('sementinha') || historico.includes('aee')) {
    encaminhamentos.push('AEE - Sala de Recursos Multifuncionais');
  }
  
  // Baseado nas necessidades das mães
  const necessidadesMae = diagnosis.familyNeeds || '';
  if (necessidadesMae.includes('psicólogo') || necessidadesMae.includes('psicologo')) {
    if (!encaminhamentos.includes('Psicólogo')) encaminhamentos.push('Psicólogo');
  }
  
  if (necessidadesMae.includes('cuidadora') || necessidadesMae.includes('auxiliar')) {
    encaminhamentos.push('Auxiliar de Sala / Cuidador');
  }
  
  return encaminhamentos;
}

function gerarRecursosAdaptacao(dadosCoord, diagnosis) {
  const recursos = [];
  
  const barreiras = diagnosis.barriers || {};
  
  // Recursos baseados nas barreiras
  if (barreiras.tecnologicas && barreiras.tecnologicas !== 'Nenhum') {
    recursos.push('Tablets ou computadores com softwares educativos acessíveis');
    recursos.push('Aplicativos de apoio à alfabetização e matemática');
  }
  
  if (barreiras.comunicacionais && barreiras.comunicacionais !== 'Nenhum') {
    recursos.push('Materiais visuais: pictogramas, cartões de comunicação alternativa');
    recursos.push('Recursos de CAA (Comunicação Aumentativa e Alternativa)');
  }
  
  if (barreiras.pedagogicas && barreiras.pedagogicas !== 'Nenhum') {
    recursos.push('Atividades adaptadas e personalizadas');
    recursos.push('Avaliação diferenciada com critérios flexíveis');
    recursos.push('Tempo estendido para realização de atividades');
  }
  
  // Recursos baseados em interesses
  const interesses = diagnosis.interests || '';
  if (interesses) {
    recursos.push(`Materiais relacionados aos interesses do aluno: ${interesses.toLowerCase()}`);
  }
  
  // Recursos baseados nas necessidades
  const necessidades = diagnosis.specialNeeds || '';
  if (necessidades.includes('leitura')) {
    recursos.push('Livros nivelados, leitores graduados, áudio-livros');
  }
  
  if (necessidades.includes('atenção') || necessidades.includes('concentração')) {
    recursos.push('Ambiente tranquilo, redução de estímulos visuais, pausas programadas');
  }
  
  if (necessidades.includes('coordenação motora')) {
    recursos.push('Materiais manipulativos, jogos de encaixe, atividades práticas');
  }
  
  return recursos;
}

// ====================================
// GERAÇÃO COM IA MELHORADA
// ====================================

async function gerarMetasComIA(diagnosisCompleto, nomeAluno) {
  console.log('    🤖 Gerando metas com IA (dados enriquecidos)...');
  
  try {
    const { data, error } = await supabaseClient.functions.invoke('generate-pei-planning', {
      body: { diagnosisData: diagnosisCompleto },
    });

    if (error) {
      console.error(`    ❌ Erro IA: ${error.message}`);
      return null;
    }

    if (!data?.planningData?.goals || data.planningData.goals.length === 0) {
      console.error('    ❌ IA não retornou metas');
      return null;
    }

    console.log(`    ✅ ${data.planningData.goals.length} metas geradas!`);
    return data.planningData;
  } catch (error) {
    console.error(`    ❌ Erro: ${error.message}`);
    return null;
  }
}

// ====================================
// FUNÇÃO PRINCIPAL
// ====================================

async function enriquecerPEIs() {
  console.log('🔄 ENRIQUECIMENTO DE PEIs COM FORMULÁRIOS');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Carregar mapeamento
    console.log('📂 Carregando mapeamento...');
    const mapeamento = JSON.parse(fs.readFileSync(MAPEAMENTO_PATH, 'utf8'));
    console.log(`✅ ${mapeamento.length} alunos mapeados\n`);

    // 2. Processar cada aluno
    console.log('🔄 PROCESSANDO ALUNOS...\n');

    let successCount = 0;
    let aiGeneratedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < mapeamento.length; i++) {
      const item = mapeamento[i];
      
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`[${i + 1}/${mapeamento.length}] ${item.nome}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      try {
        // Buscar PEI do aluno
        const { data: peis, error: peiError } = await supabaseAdmin
          .from('peis')
          .select('id, diagnosis_data, planning_data, evaluation_data')
          .eq('student_id', item.id)
          .in('status', ['draft', 'pending'])
          .limit(1);

        if (peiError || !peis || peis.length === 0) {
          console.log('  ⚠️  PEI não encontrado\n');
          continue;
        }

        const pei = peis[0];

        // Construir diagnóstico completo
        const diagnosisCompleto = construirDiagnosticoCompleto(
          item.nome,
          item.dadosCoord || {},
          item.dadosMae || {}
        );

        console.log('  📝 Diagnóstico enriquecido:');
        console.log(`     Histórico: ${diagnosisCompleto.history.substring(0, 60)}...`);
        console.log(`     Interesses: ${diagnosisCompleto.interests.substring(0, 50)}...`);
        console.log(`     Necessidades: ${diagnosisCompleto.specialNeeds.substring(0, 50)}...`);

        // Identificar encaminhamentos
        const encaminhamentos = identificarEncaminhamentos(item.dadosCoord || {}, diagnosisCompleto);
        console.log(`  📤 Encaminhamentos: ${encaminhamentos.join(', ')}`);

        // Gerar recursos de adaptação
        const recursos = gerarRecursosAdaptacao(item.dadosCoord || {}, diagnosisCompleto);
        console.log(`  🛠️  Recursos: ${recursos.length} identificados`);

        // Gerar metas com IA (se habilitado)
        let planningData = pei.planning_data;
        
        if (GENERATE_AI && (!planningData?.goals || planningData.goals.length === 0)) {
          planningData = await gerarMetasComIA(diagnosisCompleto, item.nome);
          
          if (planningData) {
            aiGeneratedCount++;
          } else {
            planningData = { goals: [] };
          }
          
          // Delay para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_AI));
        } else {
          console.log('    ✅ Planejamento existente mantido');
        }

        // Construir evaluation_data completo
        const evaluationData = {
          ...(pei.evaluation_data || {}),
          referrals: encaminhamentos,
          accessibilityResources: recursos,
          reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 dias
          observations: item.dadosCoord?.['Comentários ou observações sobre barreiras  (Descreva situações ou exemplos práticos dessas barreiras no ambiente escolar. ex: falta de sinalização tátil, ausência de intérprete, ruídos, resistência docente etc.) '] || '',
        };

        // Atualizar PEI no banco
        const { error: updateError } = await supabaseAdmin
          .from('peis')
          .update({
            diagnosis_data: diagnosisCompleto,
            planning_data: planningData,
            evaluation_data: evaluationData,
            updated_at: new Date().toISOString()
          })
          .eq('id', pei.id);

        if (updateError) {
          throw updateError;
        }

        console.log('  ✅ PEI atualizado com sucesso!\n');
        successCount++;

      } catch (error) {
        errorCount++;
        console.error(`  ❌ Erro: ${error.message}\n`);
      }
    }

    // 3. Relatório Final
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RELATÓRIO FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ PEIs enriquecidos: ${successCount}`);
    console.log(`🤖 Metas geradas com IA: ${aiGeneratedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 Enriquecimento concluído!');
    console.log('\n💡 PRÓXIMO PASSO:');
    console.log('   Regerar PDFs com dados completos:');
    console.log('   npm run generate:sao-goncalo-final\n');

  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    console.error(error);
    process.exit(1);
  }
}

enriquecerPEIs();

