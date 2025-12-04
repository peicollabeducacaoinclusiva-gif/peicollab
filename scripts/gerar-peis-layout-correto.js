// Script para Gerar PEIs com Layout Correto e Logo
// Usa o mesmo layout do PrintPEIDialog.tsx
// Data: 06/11/2024

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ====================================
// CONFIGURAÇÕES
// ====================================

const SUPABASE_URL = 'https://fximylewmvsllkdczovj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY5NjQ3MiwiZXhwIjoyMDc3MjcyNDcyfQ.ezYPOGMO2ik-VaiNoBrJ7cKivms3SiZsJ5zN0Fhm3Fg';

const OUTPUT_DIR = './peis-sao-goncalo-final';
const TEMP_HTML_DIR = './temp-html-peis';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Criar diretórios
[OUTPUT_DIR, TEMP_HTML_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ====================================
// GERAÇÃO DE HTML (Layout PrintPEIDialog)
// ====================================

function generateHTML(pei, student, school, tenant, logoUrl) {
  const diagnosis = pei.diagnosis_data || {};
  const planning = pei.planning_data || {};
  const evaluation = pei.evaluation_data || {};
  const goals = planning.goals || [];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PEI - ${student.name}</title>
  <style>
    @page {
      size: A4;
      margin: 1cm 1.5cm;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.3;
      color: #000;
      padding: 0;
      margin: 0;
    }
    .print-content {
      padding: 15px;
    }
    .header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #000;
    }
    .header img {
      width: 80px;
      height: 80px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .header-text {
      flex: 1;
      text-align: center;
    }
    .header-text h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 4px;
      line-height: 1.2;
      text-transform: uppercase;
    }
    .header-text .subtitle {
      font-size: 12pt;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      line-height: 1.2;
    }
    .header-text .school {
      font-size: 12pt;
      font-weight: bold;
      line-height: 1.2;
    }
    .title {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      margin: 12px 0;
    }
    .section {
      margin-bottom: 12px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 6px;
      padding-bottom: 2px;
      border-bottom: 1px solid #000;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px;
      font-size: 8pt;
    }
    .subsection {
      margin-bottom: 5px;
      font-size: 8pt;
    }
    .subsection-title {
      font-weight: bold;
      display: block;
      margin-bottom: 2px;
    }
    .goal {
      border-left: 2px solid #374151;
      padding-left: 8px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .goal-title {
      font-size: 9pt;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .goal-meta {
      font-size: 7pt;
      color: #666;
      font-style: italic;
      margin-bottom: 4px;
      padding: 2px 6px;
      background-color: #f3f4f6;
      display: inline-block;
      border-radius: 3px;
    }
    .goal-content {
      font-size: 8pt;
      margin: 3px 0;
    }
    .goal-label {
      font-weight: bold;
    }
    .strategies {
      margin: 3px 0;
      padding-left: 15px;
    }
    .strategies li {
      margin: 2px 0;
      line-height: 1.3;
    }
    .signatures {
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .signatures-title {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 10px;
      padding-bottom: 2px;
      border-bottom: 1px solid #000;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px 40px;
      font-size: 8pt;
    }
    .signature-box {
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #000;
      padding-top: 5px;
      margin-top: 40px;
      font-weight: 500;
    }
    .date-box {
      text-align: center;
      margin-top: 15px;
      font-size: 8pt;
    }
  </style>
</head>
<body>
  <div class="print-content">
    <!-- CABEÇALHO -->
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo São Gonçalo dos Campos" />` : ''}
      <div class="header-text">
        <h1>${(tenant?.network_name || 'São Gonçalo dos Campos').toUpperCase()}</h1>
        <div class="subtitle">Secretaria de Educação - Setor Educação Inclusiva</div>
        <div class="school">${school?.school_name || 'Escola'}</div>
      </div>
    </div>

    <!-- TÍTULO -->
    <div class="title">PLANO EDUCACIONAL INDIVIDUALIZADO</div>

    <!-- 1. IDENTIFICAÇÃO -->
    <div class="section">
      <div class="section-title">1. Identificação do Aluno</div>
      <div class="info-grid">
        <p><strong>Nome:</strong> ${student.name}</p>
        ${student.date_of_birth ? `<p><strong>Nascimento:</strong> ${new Date(student.date_of_birth).toLocaleDateString('pt-BR')}</p>` : '<p></p>'}
        ${student.class_name ? `<p><strong>Turma:</strong> ${student.class_name}</p>` : '<p></p>'}
        <p><strong>Criação:</strong> ${new Date(pei.created_at).toLocaleDateString('pt-BR')}</p>
      </div>
    </div>

    <!-- 2. DIAGNÓSTICO -->
    <div class="section">
      <div class="section-title">2. Diagnóstico</div>
      
      ${diagnosis.history ? `
      <div class="subsection">
        <span class="subsection-title">Histórico:</span>
        <p>${diagnosis.history}</p>
      </div>` : ''}
      
      ${diagnosis.interests ? `
      <div class="subsection">
        <span class="subsection-title">Interesses:</span>
        <p>${diagnosis.interests}</p>
      </div>` : ''}
      
      ${diagnosis.specialNeeds ? `
      <div class="subsection">
        <span class="subsection-title">Necessidades Especiais:</span>
        <p>${diagnosis.specialNeeds}</p>
      </div>` : ''}
      
      ${(diagnosis.abilities || diagnosis.strengths) ? `
      <div class="subsection">
        <span class="subsection-title">💪 Habilidades (O que já consegue fazer):</span>
        <p>${diagnosis.abilities || diagnosis.strengths}</p>
      </div>` : ''}
      
      ${(diagnosis.aversions || diagnosis.challenges) ? `
      <div class="subsection">
        <span class="subsection-title">⚠️ Desinteresses / Aversões:</span>
        <p>${diagnosis.aversions || diagnosis.challenges}</p>
      </div>` : ''}
      
      ${diagnosis.barriersComments ? `
      <div class="subsection">
        <span class="subsection-title">💬 Observações sobre Barreiras:</span>
        <p>${diagnosis.barriersComments}</p>
      </div>` : ''}
    </div>

    <!-- 3. PLANEJAMENTO -->
    <div class="section">
      <div class="section-title">3. Planejamento - Metas e Estratégias</div>
      
      ${goals.length === 0 ? '<p style="font-style: italic; color: #666;">Nenhuma meta definida ainda.</p>' : ''}
      
      ${goals.map((goal, index) => `
        <div class="goal">
          <div class="goal-title">${index + 1}. ${goal.title || goal.description || 'Meta'}</div>
          
          ${goal.type || goal.bnccCode || goal.timeline ? `
          <div class="goal-meta">
            ${goal.type ? (goal.type === 'academica' ? '📚 Acadêmica' : '🎯 Funcional') : ''}
            ${goal.type && goal.bnccCode ? ' | ' : ''}
            ${goal.bnccCode ? `BNCC: ${goal.bnccCode}` : ''}
            ${(goal.type || goal.bnccCode) && goal.timeline ? ' | ' : ''}
            ${goal.timeline ? `Prazo: ${goal.timeline.replace('_', ' ')}` : ''}
          </div>` : ''}
          
          ${goal.description && goal.description !== goal.title ? `
          <div class="goal-content">
            ${goal.description}
          </div>` : ''}
          
          ${goal.theoreticalBasis ? `
          <div class="goal-content" style="font-style: italic; font-size: 7.5pt; color: #555;">
            <span class="goal-label">Fundamentação:</span> ${goal.theoreticalBasis}
          </div>` : ''}
          
          ${goal.duaPrinciples ? `
          <div class="goal-content" style="font-size: 7.5pt; background: #f9fafb; padding: 4px; margin: 3px 0; border-radius: 3px;">
            <span class="goal-label">DUA:</span><br/>
            ${goal.duaPrinciples.representation ? `• Representação: ${goal.duaPrinciples.representation}<br/>` : ''}
            ${goal.duaPrinciples.actionExpression ? `• Ação/Expressão: ${goal.duaPrinciples.actionExpression}<br/>` : ''}
            ${goal.duaPrinciples.engagement ? `• Engajamento: ${goal.duaPrinciples.engagement}` : ''}
          </div>` : ''}
          
          ${goal.strategies && Array.isArray(goal.strategies) && goal.strategies.length > 0 ? `
          <div class="goal-content">
            <span class="goal-label">Estratégias:</span>
            <ul class="strategies">
              ${goal.strategies.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>` : ''}
          
          ${goal.evaluationCriteria ? `
          <div class="goal-content">
            <span class="goal-label">Avaliação:</span> ${goal.evaluationCriteria}
          </div>` : ''}
          
          ${goal.resources ? `
          <div class="goal-content">
            <span class="goal-label">Recursos:</span> ${goal.resources}
          </div>` : ''}
          
          ${goal.teamInvolvement ? `
          <div class="goal-content" style="font-size: 7.5pt;">
            <span class="goal-label">Equipe:</span> ${goal.teamInvolvement}
          </div>` : ''}
          
          ${goal.expectedProgress ? `
          <div class="goal-content" style="font-size: 7.5pt; color: #059669;">
            <span class="goal-label">Progresso Esperado:</span> ${goal.expectedProgress}
          </div>` : ''}
        </div>
      `).join('')}
    </div>

    <!-- 4. ENCAMINHAMENTOS -->
    ${evaluation.referrals || evaluation.observations ? `
    <div class="section">
      <div class="section-title">4. Encaminhamentos e Observações</div>
      
      ${evaluation.referrals && Array.isArray(evaluation.referrals) && evaluation.referrals.length > 0 ? `
      <div class="subsection">
        <span class="subsection-title">Encaminhamentos:</span>
        <p>${evaluation.referrals.join(', ')}</p>
      </div>` : ''}
      
      ${evaluation.observations ? `
      <div class="subsection">
        <span class="subsection-title">Observações:</span>
        <p>${evaluation.observations}</p>
      </div>` : ''}
    </div>` : ''}

    <!-- ASSINATURAS -->
    <div class="signatures">
      <div class="signatures-title">Assinaturas</div>
      <div class="signatures-grid">
        <div class="signature-box">
          <div class="signature-line">Professor(a) Responsável</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Coordenador(a) Pedagógico(a)</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Diretor(a) Escolar</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Responsável Legal / Família</div>
        </div>
      </div>
      <div class="date-box">
        Data: _____/_____/__________
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ====================================
// CONVERSÃO HTML PARA PDF COM PUPPETEER
// ====================================

async function convertHTMLToPDF(htmlPath, pdfPath) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
      waitUntil: 'networkidle0'
    });

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1.5cm',
        bottom: '1cm',
        left: '1.5cm'
      }
    });
  } finally {
    await browser.close();
  }
}

// ====================================
// FUNÇÃO PRINCIPAL
// ====================================

async function gerarPEIsComLayoutCorreto() {
  console.log('🎨 GERAÇÃO DE PEIs COM LAYOUT CORRETO');
  console.log('═══════════════════════════════════════════════════\n');

  let browser = null;

  try {
    // 1. Buscar rede e logo
    console.log('🔍 Buscando informações...');
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, network_name')
      .ilike('network_name', '%São Gonçalo%');

    if (!tenants || tenants.length === 0) {
      throw new Error('Rede não encontrada');
    }

    const tenant = tenants[0];
    console.log(`✅ Rede: ${tenant.network_name}`);

    // Buscar logo
    const { data: logoData } = supabase.storage
      .from('school-logos')
      .getPublicUrl(`${tenant.id}/logo.png`);

    const logoUrl = logoData.publicUrl;
    console.log(`✅ Logo: ${logoUrl.substring(0, 50)}...\n`);

    // 2. Buscar escolas e PEIs
    const { data: schools } = await supabase
      .from('schools')
      .select('id, school_name')
      .eq('tenant_id', tenant.id);

    const schoolIds = schools.map((s) => s.id);
    const { data: peis } = await supabase
      .from('peis')
      .select('*')
      .in('school_id', schoolIds)
      .in('status', ['draft', 'pending']);

    console.log(`📚 ${peis?.length || 0} PEIs para processar\n`);

    // 3. Iniciar navegador
    console.log('🌐 Iniciando navegador...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Navegador iniciado\n');

    console.log('🔄 Gerando PDFs...\n');

    let successCount = 0;

    for (let i = 0; i < peis.length; i++) {
      const pei = peis[i];

      try {
        // Buscar aluno
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('id', pei.student_id)
          .single();

        if (!student) continue;

        console.log(`[${i + 1}/${peis.length}] ${student.name}`);

        const school = schools.find((s) => s.id === pei.school_id);

        // Gerar HTML
        const html = generateHTML(pei, student, school, tenant, logoUrl);
        const htmlFilename = `temp_${student.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_')}.html`;
        const htmlPath = path.resolve(TEMP_HTML_DIR, htmlFilename);
        fs.writeFileSync(htmlPath, html, 'utf8');

        // Converter para PDF
        const pdfFilename = `PEI_${student.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.pdf`;
        const pdfPath = path.resolve(OUTPUT_DIR, pdfFilename);

        const page = await browser.newPage();
        await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
          waitUntil: 'networkidle0'
        });

        await page.pdf({
          path: pdfPath,
          format: 'A4',
          printBackground: true,
          margin: {
            top: '1cm',
            right: '1.5cm',
            bottom: '1cm',
            left: '1.5cm'
          }
        });

        await page.close();

        console.log(`  ✅ PDF gerado\n`);
        successCount++;

      } catch (error) {
        console.error(`  ❌ Erro: ${error.message}\n`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RELATÓRIO FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ PDFs gerados: ${successCount}`);
    console.log(`🏛️  Logo incluída: Sim`);
    console.log(`📁 Pasta: ${path.resolve(OUTPUT_DIR)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Limpar HTMLs temporários
    console.log('🧹 Limpando arquivos temporários...');
    fs.readdirSync(TEMP_HTML_DIR).forEach(file => {
      fs.unlinkSync(path.join(TEMP_HTML_DIR, file));
    });
    fs.rmdirSync(TEMP_HTML_DIR);
    console.log('✅ Temporários removidos\n');

    console.log('🎉 Processamento concluído!');
    console.log(`\n📂 PDFs com logo e layout correto em:\n   ${path.resolve(OUTPUT_DIR)}\n`);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

gerarPEIsComLayoutCorreto();

