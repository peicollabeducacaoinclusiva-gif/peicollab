// Script para Completar e Gerar PDFs dos PEIs de São Gonçalo dos Campos
// Processa PEIs em rascunho, completa com IA e gera PDFs
// Data: 06/11/2024

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
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

const OUTPUT_DIR = './peis-sao-goncalo-dos-campos';
const NETWORK_NAME_FILTER = 'São Gonçalo'; // Busca parcial no nome
const GENERATE_AI_PLANNING = true; // Completar com IA

// ====================================
// INICIALIZAÇÃO
// ====================================

// Cliente com Service Role (bypass RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// Cliente para chamar Edge Functions
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Criar diretório de saída
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Diretório criado: ${OUTPUT_DIR}\n`);
}

// ====================================
// FUNÇÕES AUXILIARES
// ====================================

function sanitizeFilename(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

async function completeDiagnosisIfNeeded(pei, student) {
  const diagnosis = pei.diagnosis_data || {};
  
  // Se já tem diagnóstico completo, retornar
  if (diagnosis.specialNeeds && diagnosis.interests) {
    return pei;
  }

  console.log('  📝 Completando diagnóstico básico...');

  // Criar diagnóstico básico para permitir geração de IA
  const basicDiagnosis = {
    specialNeeds: diagnosis.specialNeeds || 'Necessidades educacionais especiais a serem detalhadas pela equipe pedagógica',
    interests: diagnosis.interests || 'Interesses e potencialidades a serem identificados durante o acompanhamento',
    strengths: diagnosis.strengths || 'Pontos fortes a serem observados',
    challenges: diagnosis.challenges || 'Desafios a serem trabalhados',
    history: diagnosis.history || `Aluno matriculado em ${new Date().getFullYear()}`
  };

  // Atualizar no banco
  const { error } = await supabaseAdmin
    .from('peis')
    .update({ diagnosis_data: basicDiagnosis })
    .eq('id', pei.id);

  if (error) {
    console.error('  ⚠️  Erro ao atualizar diagnóstico:', error.message);
  }

  return { ...pei, diagnosis_data: basicDiagnosis };
}

async function generateAIPlanning(pei) {
  console.log('  🤖 Gerando planejamento com IA...');

  try {
    const { data, error } = await supabaseClient.functions.invoke('generate-pei-planning', {
      body: {
        diagnosisData: pei.diagnosis_data || {},
      },
    });

    if (error) {
      console.error('  ❌ Erro IA:', error.message);
      return null;
    }

    if (!data?.planningData?.goals || data.planningData.goals.length === 0) {
      console.error('  ❌ IA não retornou metas');
      return null;
    }

    console.log(`  ✅ IA gerou ${data.planningData.goals.length} metas!`);
    return data.planningData;
  } catch (error) {
    console.error('  ❌ Erro ao chamar IA:', error.message);
    return null;
  }
}

async function updatePEIWithPlanning(peiId, planningData) {
  const { error } = await supabaseAdmin
    .from('peis')
    .update({
      planning_data: planningData,
      status: 'pending', // Mudar de draft para pending
      updated_at: new Date().toISOString()
    })
    .eq('id', peiId);

  if (error) {
    console.error('  ⚠️  Erro ao salvar planejamento:', error.message);
    return false;
  }

  return true;
}

function generatePDF(pei, student, school, tenant, outputPath) {
  const doc = new jsPDF();
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - (margin * 2);

  // ====================================
  // CABEÇALHO INSTITUCIONAL
  // ====================================
  
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(tenant?.network_name || 'Rede de Ensino', pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Secretaria de Educação - Setor Educação Inclusiva', pageWidth / 2, 21, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(school?.school_name || 'Escola', pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  const dataHora = new Date().toLocaleString('pt-BR');
  doc.text(`Gerado em: ${dataHora}`, pageWidth / 2, 37, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  yPos = 50;

  // ====================================
  // TÍTULO
  // ====================================
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('PLANO EDUCACIONAL INDIVIDUALIZADO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // ====================================
  // IDENTIFICAÇÃO
  // ====================================
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('1. IDENTIFICAÇÃO DO ALUNO', margin, yPos);
  yPos += 6;

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(`Nome: ${student.name}`, margin, yPos);
  yPos += 5;
  
  if (student.date_of_birth) {
    doc.text(`Data de Nascimento: ${formatDate(student.date_of_birth)}`, margin, yPos);
    yPos += 5;
  }

  if (student.class_name) {
    doc.text(`Turma: ${student.class_name}`, margin, yPos);
    yPos += 5;
  }

  doc.text(`Status: ${getStatusLabel(pei.status)}`, margin, yPos);
  yPos += 8;

  // ====================================
  // DIAGNÓSTICO
  // ====================================
  
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('2. DIAGNÓSTICO', margin, yPos);
  yPos += 6;

  const diagnosis = pei.diagnosis_data || {};

  if (diagnosis.specialNeeds) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Necessidades Educacionais Especiais:', margin, yPos);
    yPos += 5;
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(diagnosis.specialNeeds, maxWidth);
    doc.text(lines, margin, yPos);
    yPos += (lines.length * 5) + 3;
  }

  if (diagnosis.interests) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Interesses e Potencialidades:', margin, yPos);
    yPos += 5;
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(diagnosis.interests, maxWidth);
    doc.text(lines, margin, yPos);
    yPos += (lines.length * 5) + 3;
  }

  yPos += 5;

  // ====================================
  // PLANEJAMENTO
  // ====================================
  
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('3. PLANEJAMENTO - METAS E ESTRATÉGIAS', margin, yPos);
  yPos += 6;

  const goals = pei.planning_data?.goals || [];

  if (goals.length === 0) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.text('Planejamento a ser elaborado pela equipe pedagógica.', margin, yPos);
    yPos += 8;
  } else {
    goals.forEach((goal, index) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`Meta ${index + 1}: ${goal.title || 'Meta'}`, margin, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');

      // Tipo e BNCC
      if (goal.type || goal.bnccCode) {
        doc.setFont(undefined, 'italic');
        let info = goal.type ? `Tipo: ${goal.type === 'academica' ? 'Acadêmica' : 'Funcional'}` : '';
        if (goal.bnccCode) {
          info += (info ? ' | ' : '') + `BNCC: ${goal.bnccCode}`;
        }
        doc.text(info, margin + 3, yPos);
        yPos += 5;
        doc.setFont(undefined, 'normal');
      }

      // Descrição
      if (goal.description) {
        const descLines = doc.splitTextToSize(goal.description, maxWidth - 5);
        doc.text(descLines, margin + 3, yPos);
        yPos += (descLines.length * 5) + 3;
      }

      // Fundamentação
      if (goal.theoreticalBasis) {
        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        const basisLines = doc.splitTextToSize(`Fundamentação: ${goal.theoreticalBasis}`, maxWidth - 5);
        doc.text(basisLines, margin + 3, yPos);
        yPos += (basisLines.length * 4) + 3;
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
      }

      // Estratégias
      if (goal.strategies && Array.isArray(goal.strategies) && goal.strategies.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.text('Estratégias:', margin + 3, yPos);
        yPos += 5;
        doc.setFont(undefined, 'normal');

        goal.strategies.slice(0, 4).forEach((strategy) => {
          const strategyLines = doc.splitTextToSize(`• ${strategy}`, maxWidth - 8);
          doc.text(strategyLines, margin + 5, yPos);
          yPos += (strategyLines.length * 5);
          
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
        });
        yPos += 2;
      }

      // Avaliação
      if (goal.evaluationCriteria) {
        doc.setFont(undefined, 'bold');
        doc.text('Avaliação:', margin + 3, yPos);
        yPos += 5;
        doc.setFont(undefined, 'normal');
        const evalLines = doc.splitTextToSize(goal.evaluationCriteria, maxWidth - 8);
        doc.text(evalLines, margin + 5, yPos);
        yPos += (evalLines.length * 5) + 2;
      }

      // Recursos
      if (goal.resources) {
        doc.setFont(undefined, 'bold');
        doc.text('Recursos:', margin + 3, yPos);
        yPos += 5;
        doc.setFont(undefined, 'normal');
        const resourceLines = doc.splitTextToSize(goal.resources, maxWidth - 8);
        doc.text(resourceLines, margin + 5, yPos);
        yPos += (resourceLines.length * 5) + 2;
      }

      yPos += 5;
    });
  }

  // ====================================
  // RODAPÉ
  // ====================================
  
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Página ${i} de ${totalPages} | PEI Collab - São Gonçalo dos Campos`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  doc.save(outputPath);
}

function getStatusLabel(status) {
  const labels = {
    draft: 'Rascunho',
    pending: 'Pendente',
    approved: 'Aprovado',
    returned: 'Devolvido',
    validated: 'Validado',
  };
  return labels[status] || status;
}

// ====================================
// FUNÇÃO PRINCIPAL
// ====================================

async function processarPEIsSaoGoncalo() {
  console.log('🚀 PROCESSAMENTO DE PEIs - SÃO GONÇALO DOS CAMPOS');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Buscar rede
    console.log('🔍 Buscando rede...');
    const { data: tenants, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, network_name')
      .ilike('network_name', `%${NETWORK_NAME_FILTER}%`);

    if (tenantError) throw tenantError;

    if (!tenants || tenants.length === 0) {
      console.log(`❌ Rede "${NETWORK_NAME_FILTER}" não encontrada`);
      console.log('\n💡 Listando todas as redes disponíveis:');
      
      const { data: allTenants } = await supabaseAdmin
        .from('tenants')
        .select('network_name');
      
      if (allTenants && allTenants.length > 0) {
        allTenants.forEach((t, i) => console.log(`   ${i + 1}. ${t.network_name}`));
      } else {
        console.log('   (Nenhuma rede cadastrada)');
      }
      return;
    }

    const tenant = tenants[0];
    console.log(`✅ Rede: ${tenant.network_name}`);
    console.log(`   ID: ${tenant.id}\n`);

    // 2. Buscar escolas
    console.log('🏫 Buscando escolas...');
    const { data: schools, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('id, school_name')
      .eq('tenant_id', tenant.id);

    if (schoolError) throw schoolError;

    console.log(`✅ ${schools?.length || 0} escola(s) encontrada(s)\n`);

    if (!schools || schools.length === 0) {
      console.log('❌ Nenhuma escola encontrada para esta rede');
      return;
    }

    // 3. Buscar PEIs em rascunho/pendente
    console.log('📚 Buscando PEIs em rascunho...');
    const schoolIds = schools.map((s) => s.id);

    const { data: peis, error: peiError } = await supabaseAdmin
      .from('peis')
      .select('id, student_id, school_id, tenant_id, status, diagnosis_data, planning_data, created_at')
      .in('school_id', schoolIds)
      .in('status', ['draft', 'pending'])
      .order('created_at', { ascending: false });

    if (peiError) throw peiError;

    if (!peis || peis.length === 0) {
      console.log('⚠️  Nenhum PEI em rascunho encontrado');
      console.log('\n💡 Buscando PEIs com qualquer status...');
      
      const { data: anyPeis } = await supabaseAdmin
        .from('peis')
        .select('status')
        .in('school_id', schoolIds);
      
      if (anyPeis && anyPeis.length > 0) {
        const byStatus = anyPeis.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {});
        
        console.log('   Status encontrados:');
        Object.entries(byStatus).forEach(([status, count]) => {
          console.log(`   • ${getStatusLabel(status)}: ${count}`);
        });
      }
      return;
    }

    console.log(`✅ ${peis.length} PEI(s) em rascunho encontrado(s)\n`);

    // 4. Processar cada PEI
    console.log('🔄 PROCESSANDO PEIs...\n');

    let successCount = 0;
    let errorCount = 0;
    let aiGeneratedCount = 0;
    let aiErrorCount = 0;

    for (let i = 0; i < peis.length; i++) {
      const pei = peis[i];
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`[${i + 1}/${peis.length}] Processando PEI`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      try {
        // Buscar aluno
        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .select('*')
          .eq('id', pei.student_id)
          .single();

        if (studentError || !student) {
          throw new Error('Aluno não encontrado');
        }

        console.log(`👤 Aluno: ${student.name}`);

        // Buscar escola
        const school = schools.find((s) => s.id === pei.school_id);
        console.log(`🏫 Escola: ${school?.school_name || 'N/A'}`);
        console.log(`📋 Status: ${getStatusLabel(pei.status)}`);

        // Completar diagnóstico se necessário
        let peiAtualizado = await completeDiagnosisIfNeeded(pei, student);

        // Gerar planejamento com IA se necessário e habilitado
        const needsPlanning = !peiAtualizado.planning_data?.goals || peiAtualizado.planning_data.goals.length === 0;
        
        if (needsPlanning && GENERATE_AI_PLANNING) {
          const planningData = await generateAIPlanning(peiAtualizado);
          
          if (planningData) {
            const saved = await updatePEIWithPlanning(pei.id, planningData);
            if (saved) {
              peiAtualizado = { ...peiAtualizado, planning_data: planningData };
              aiGeneratedCount++;
            } else {
              aiErrorCount++;
            }
          } else {
            aiErrorCount++;
          }

          // Pausa após geração de IA
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else if (needsPlanning) {
          console.log('  ⏭️  Sem planejamento (IA desabilitada)');
        } else {
          console.log('  ✅ Planejamento já existe');
        }

        // Gerar PDF
        const filename = `PEI_${sanitizeFilename(student.name)}.pdf`;
        const outputPath = path.join(OUTPUT_DIR, filename);

        generatePDF(peiAtualizado, student, school, tenant, outputPath);

        successCount++;
        console.log(`✅ PDF gerado: ${filename}\n`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Erro: ${error.message}\n`);
      }
    }

    // 5. Relatório Final
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RELATÓRIO FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ PDFs gerados: ${successCount}`);
    console.log(`🤖 Planejamentos gerados com IA: ${aiGeneratedCount}`);
    console.log(`⚠️  Erros na IA: ${aiErrorCount}`);
    console.log(`❌ Erros totais: ${errorCount}`);
    console.log(`📁 Pasta de saída: ${path.resolve(OUTPUT_DIR)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (successCount > 0) {
      console.log('🎉 Processamento concluído com sucesso!');
      console.log(`\n📂 Acesse a pasta para ver os PDFs:\n`);
      console.log(`   ${path.resolve(OUTPUT_DIR)}\n`);
    }

  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// ====================================
// EXECUTAR
// ====================================

console.log('═══════════════════════════════════════════════════');
console.log('   GERAÇÃO DE PEIs - SÃO GONÇALO DOS CAMPOS');
console.log('═══════════════════════════════════════════════════\n');

processarPEIsSaoGoncalo()
  .then(() => {
    console.log('✅ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error.message);
    process.exit(1);
  });

