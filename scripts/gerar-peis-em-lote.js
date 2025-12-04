// Script para Gerar PEIs em Lote (PDF)
// Rede: São Gonçalo dos Campos
// Data: 06/11/2024

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

// ====================================
// CONFIGURAÇÕES
// ====================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fximylewmvsllkdczovj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY0NzIsImV4cCI6MjA3NzI3MjQ3Mn0.3FqQqUfVgD3hIh1daa3R1JjouGZ4D4ONR6SmcL9Qids';

const OUTPUT_DIR = './peis-gerados-sao-goncalo';
const NETWORK_NAME = 'São Gonçalo dos Campos';
const GENERATE_AI_PLANNING = true; // Gerar planejamento com IA se não existir
const BATCH_SIZE = 5; // Processar 5 alunos por vez para não sobrecarregar

// ====================================
// INICIALIZAÇÃO
// ====================================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Criar diretório de saída
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Diretório criado: ${OUTPUT_DIR}`);
}

// ====================================
// FUNÇÕES AUXILIARES
// ====================================

function sanitizeFilename(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9]/g, '_')    // Substitui caracteres especiais por _
    .replace(/_+/g, '_')              // Remove _ duplicados
    .toLowerCase();
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

async function generateAIPlanningIfNeeded(pei) {
  // Verificar se já tem planejamento
  if (pei.planning_data?.goals && pei.planning_data.goals.length > 0) {
    console.log('  ✅ PEI já tem planejamento, pulando IA');
    return pei;
  }

  if (!GENERATE_AI_PLANNING) {
    console.log('  ⏭️  Geração de IA desabilitada');
    return pei;
  }

  console.log('  🤖 Gerando planejamento com IA...');

  try {
    const { data, error } = await supabase.functions.invoke('generate-pei-planning', {
      body: {
        diagnosisData: pei.diagnosis_data || {},
      },
    });

    if (error) {
      console.error('  ❌ Erro ao gerar planejamento com IA:', error);
      return pei;
    }

    // Atualizar PEI com planejamento gerado
    const { error: updateError } = await supabase
      .from('peis')
      .update({
        planning_data: data.planningData,
      })
      .eq('id', pei.id);

    if (updateError) {
      console.error('  ❌ Erro ao salvar planejamento:', updateError);
      return pei;
    }

    console.log('  ✅ Planejamento gerado e salvo com sucesso!');
    return { ...pei, planning_data: data.planningData };
  } catch (error) {
    console.error('  ❌ Erro na geração com IA:', error.message);
    return pei;
  }
}

function generatePDF(pei, student, school, tenant, outputPath) {
  const doc = new jsPDF();
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - (margin * 2);

  // ====================================
  // CABEÇALHO INSTITUCIONAL
  // ====================================
  
  // Fundo azul
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Texto do cabeçalho
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(tenant.network_name || NETWORK_NAME, pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Secretaria de Educação - Setor Educação Inclusiva', pageWidth / 2, 19, { align: 'center' });

  doc.setFontSize(9);
  doc.text(school.school_name || 'Escola', pageWidth / 2, 26, { align: 'center' });

  doc.setFontSize(7);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 31, { align: 'center' });

  // Voltar para cor preta
  doc.setTextColor(0, 0, 0);
  yPos = 42;

  // ====================================
  // TÍTULO DO DOCUMENTO
  // ====================================
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('PLANO EDUCACIONAL INDIVIDUALIZADO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // ====================================
  // 1. IDENTIFICAÇÃO DO ALUNO
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

  doc.text(`Data de Criação do PEI: ${formatDate(pei.created_at)}`, margin, yPos);
  yPos += 5;

  doc.text(`Status: ${getStatusLabel(pei.status)}`, margin, yPos);
  yPos += 8;

  // ====================================
  // 2. DIAGNÓSTICO
  // ====================================
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('2. DIAGNÓSTICO', margin, yPos);
  yPos += 6;

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');

  const diagnosis = pei.diagnosis_data || {};

  if (diagnosis.specialNeeds) {
    doc.setFont(undefined, 'bold');
    doc.text('Necessidades Educacionais Especiais:', margin, yPos);
    yPos += 5;
    doc.setFont(undefined, 'normal');
    const needsLines = doc.splitTextToSize(diagnosis.specialNeeds, maxWidth);
    doc.text(needsLines, margin, yPos);
    yPos += (needsLines.length * 5) + 3;
  }

  if (diagnosis.interests) {
    doc.setFont(undefined, 'bold');
    doc.text('Interesses e Potencialidades:', margin, yPos);
    yPos += 5;
    doc.setFont(undefined, 'normal');
    const interestsLines = doc.splitTextToSize(diagnosis.interests, maxWidth);
    doc.text(interestsLines, margin, yPos);
    yPos += (interestsLines.length * 5) + 3;
  }

  if (diagnosis.history) {
    doc.setFont(undefined, 'bold');
    doc.text('Histórico:', margin, yPos);
    yPos += 5;
    doc.setFont(undefined, 'normal');
    const historyLines = doc.splitTextToSize(diagnosis.history, maxWidth);
    doc.text(historyLines, margin, yPos);
    yPos += (historyLines.length * 5) + 3;
  }

  yPos += 5;

  // Verificar se precisa de nova página
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // ====================================
  // 3. PLANEJAMENTO (METAS)
  // ====================================
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('3. PLANEJAMENTO - METAS E ESTRATÉGIAS', margin, yPos);
  yPos += 6;

  const goals = pei.planning_data?.goals || [];

  if (goals.length === 0) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.text('Nenhuma meta definida ainda.', margin, yPos);
    yPos += 8;
  } else {
    goals.forEach((goal, index) => {
      // Verificar espaço na página
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`Meta ${index + 1}:`, margin, yPos);
      yPos += 5;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');

      // Título ou descrição
      const metaText = goal.title || goal.description || 'Meta sem descrição';
      const metaLines = doc.splitTextToSize(metaText, maxWidth - 5);
      doc.text(metaLines, margin + 3, yPos);
      yPos += (metaLines.length * 5) + 3;

      // Tipo e BNCC
      if (goal.type) {
        doc.setFont(undefined, 'italic');
        let typeText = `Tipo: ${goal.type === 'academica' ? 'Acadêmica' : 'Funcional'}`;
        if (goal.bnccCode) {
          typeText += ` | BNCC: ${goal.bnccCode}`;
        }
        doc.text(typeText, margin + 3, yPos);
        yPos += 5;
        doc.setFont(undefined, 'normal');
      }

      // Estratégias
      if (goal.strategies && Array.isArray(goal.strategies) && goal.strategies.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.text('Estratégias:', margin + 3, yPos);
        yPos += 5;
        doc.setFont(undefined, 'normal');

        goal.strategies.forEach((strategy, idx) => {
          const strategyLines = doc.splitTextToSize(`• ${strategy}`, maxWidth - 10);
          doc.text(strategyLines, margin + 6, yPos);
          yPos += (strategyLines.length * 5);
        });
        yPos += 2;
      }

      // Critérios de Avaliação
      if (goal.evaluationCriteria) {
        doc.setFont(undefined, 'bold');
        doc.text('Avaliação:', margin + 3, yPos);
        yPos += 5;
        doc.setFont(undefined, 'normal');
        const evalLines = doc.splitTextToSize(goal.evaluationCriteria, maxWidth - 10);
        doc.text(evalLines, margin + 6, yPos);
        yPos += (evalLines.length * 5) + 2;
      }

      // Recursos
      if (goal.resources) {
        doc.setFont(undefined, 'bold');
        doc.text('Recursos:', margin + 3, yPos);
        yPos += 5;
        doc.setFont(undefined, 'normal');
        const resourceLines = doc.splitTextToSize(goal.resources, maxWidth - 10);
        doc.text(resourceLines, margin + 6, yPos);
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
      `Página ${i} de ${totalPages} | PEI Collab - ${NETWORK_NAME}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Salvar PDF
  doc.save(outputPath);
  console.log(`  ✅ PDF gerado: ${outputPath}`);
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

async function generatePEIsInBatch() {
  console.log('🚀 Iniciando geração de PEIs em lote...');
  console.log(`📍 Rede: ${NETWORK_NAME}`);
  console.log(`📁 Diretório de saída: ${OUTPUT_DIR}`);
  console.log(`🤖 Gerar planejamento com IA: ${GENERATE_AI_PLANNING ? 'Sim' : 'Não'}`);
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Buscar tenant da rede
    console.log('🔍 Buscando informações da rede...');
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, network_name')
      .ilike('network_name', `%${NETWORK_NAME}%`)
      .limit(1);

    if (tenantError || !tenants || tenants.length === 0) {
      throw new Error(`Rede "${NETWORK_NAME}" não encontrada no banco de dados`);
    }

    const tenant = tenants[0];
    console.log(`✅ Rede encontrada: ${tenant.network_name} (ID: ${tenant.id})\n`);

    // 2. Buscar escolas da rede
    console.log('🏫 Buscando escolas da rede...');
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_name')
      .eq('tenant_id', tenant.id);

    if (schoolError || !schools || schools.length === 0) {
      throw new Error('Nenhuma escola encontrada para esta rede');
    }

    console.log(`✅ ${schools.length} escola(s) encontrada(s)\n`);

    // 3. Buscar PEIs ativos das escolas
    console.log('📚 Buscando PEIs ativos...');
    const schoolIds = schools.map((s) => s.id);

    const { data: peis, error: peiError } = await supabase
      .from('peis')
      .select(`
        id,
        student_id,
        school_id,
        status,
        diagnosis_data,
        planning_data,
        created_at,
        updated_at
      `)
      .in('school_id', schoolIds)
      .eq('is_active_version', true)
      .order('created_at', { ascending: false });

    if (peiError) {
      throw new Error(`Erro ao buscar PEIs: ${peiError.message}`);
    }

    if (!peis || peis.length === 0) {
      console.log('⚠️  Nenhum PEI ativo encontrado para esta rede');
      return;
    }

    console.log(`✅ ${peis.length} PEI(s) ativo(s) encontrado(s)\n`);

    // 4. Processar cada PEI
    console.log('🔄 Processando PEIs...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < peis.length; i++) {
      const pei = peis[i];
      console.log(`[${i + 1}/${peis.length}] Processando PEI ${pei.id}...`);

      try {
        // Buscar dados do aluno
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('id, name, date_of_birth')
          .eq('id', pei.student_id)
          .single();

        if (studentError || !student) {
          throw new Error('Aluno não encontrado');
        }

        console.log(`  👤 Aluno: ${student.name}`);

        // Buscar dados da escola
        const school = schools.find((s) => s.id === pei.school_id) || { school_name: 'Escola não identificada' };
        console.log(`  🏫 Escola: ${school.school_name}`);

        // Gerar planejamento com IA se necessário
        const peiWithPlanning = await generateAIPlanningIfNeeded(pei);

        // Gerar PDF
        const filename = `PEI_${sanitizeFilename(student.name)}_${pei.id.substring(0, 8)}.pdf`;
        const outputPath = path.join(OUTPUT_DIR, filename);

        generatePDF(peiWithPlanning, student, school, tenant, outputPath);

        successCount++;
        console.log(`  ✅ Sucesso!\n`);

        // Pausa pequena entre cada processamento para não sobrecarregar
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Erro: ${error.message}\n`);
      }
    }

    // 5. Relatório final
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RELATÓRIO FINAL');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ PEIs processados com sucesso: ${successCount}`);
    console.log(`❌ PEIs com erro: ${errorCount}`);
    console.log(`📁 PDFs salvos em: ${path.resolve(OUTPUT_DIR)}`);
    console.log('═══════════════════════════════════════════════════\n');

    console.log('🎉 Geração em lote concluída!');
  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// ====================================
// EXECUTAR
// ====================================

generatePEIsInBatch()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado com erro:', error);
    process.exit(1);
  });

