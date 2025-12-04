// Script para Gerar PEIs de São Gonçalo com Layout Correto
// Usa o mesmo layout HTML do PrintPEIDialog
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

const OUTPUT_DIR = './peis-sao-goncalo-html';
const LOGO_PATH = path.join(__dirname, '..', 'public', 'logo_sgc.png');

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Criar diretório
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ====================================
// CONVERSÃO DE LOGO PARA BASE64
// ====================================

function getLogoBase64() {
  try {
    if (fs.existsSync(LOGO_PATH)) {
      const logoBuffer = fs.readFileSync(LOGO_PATH);
      return `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
  } catch (error) {
    console.log('⚠️  Logo não encontrada em:', LOGO_PATH);
  }
  return null;
}

// ====================================
// GERAÇÃO DE HTML
// ====================================

function generateHTML(pei, student, school, tenant, logoBase64) {
  const diagnosisData = pei.diagnosis_data || {};
  const planningData = pei.planning_data || {};
  const evaluationData = pei.evaluation_data || {};
  const goals = planningData.goals || [];

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
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.4;
      color: #000;
      padding: 15px;
    }
    .header {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #000;
    }
    .header img {
      width: 80px;
      height: 80px;
      object-fit: contain;
    }
    .header-text {
      flex: 1;
      text-align: center;
    }
    .header-text h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 5px;
      text-transform: uppercase;
      color: #003366;
    }
    .header-text h2 {
      font-size: 11pt;
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
    }
    .header-text h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 5px;
      color: #000;
    }
    .header-text .date {
      font-size: 8pt;
      color: #666;
    }
    .title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin: 15px 0;
      text-transform: uppercase;
    }
    .section {
      margin-bottom: 15px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 8px;
      padding-bottom: 3px;
      border-bottom: 1px solid #000;
    }
    .subsection {
      margin-bottom: 8px;
    }
    .subsection-title {
      font-weight: bold;
      margin-bottom: 3px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
      font-size: 8pt;
    }
    .goal {
      border-left: 3px solid #333;
      padding-left: 10px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .goal-title {
      font-weight: bold;
      font-size: 10pt;
      margin-bottom: 5px;
    }
    .goal-meta {
      font-size: 8pt;
      color: #666;
      font-style: italic;
      margin-bottom: 5px;
    }
    .goal-section {
      margin: 5px 0;
      font-size: 8pt;
    }
    .goal-section-title {
      font-weight: bold;
      display: inline;
    }
    .strategies {
      margin-left: 15px;
    }
    .strategies li {
      margin: 3px 0;
      list-style-type: disc;
    }
    .signatures {
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      font-size: 8pt;
    }
    .signature-line {
      text-align: center;
      margin-top: 40px;
      border-top: 1px solid #000;
      padding-top: 5px;
    }
    .footer {
      position: fixed;
      bottom: 10px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 8pt;
      color: #666;
    }
    @media print {
      .footer {
        position: fixed;
        bottom: 0;
      }
    }
  </style>
</head>
<body>
  <!-- CABEÇALHO -->
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Logo São Gonçalo dos Campos">` : ''}
    <div class="header-text">
      <h1>${tenant?.network_name || 'São Gonçalo dos Campos'}</h1>
      <h2>Secretaria de Educação - Setor Educação Inclusiva</h2>
      <h3>${school?.school_name || 'Escola'}</h3>
      <p class="date">Emissão: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  </div>

  <!-- TÍTULO -->
  <div class="title">Plano Educacional Individualizado</div>

  <!-- 1. IDENTIFICAÇÃO -->
  <div class="section">
    <div class="section-title">1. Identificação do Aluno</div>
    <div class="info-grid">
      <p><strong>Nome:</strong> ${student.name}</p>
      ${student.date_of_birth ? `<p><strong>Nascimento:</strong> ${new Date(student.date_of_birth).toLocaleDateString('pt-BR')}</p>` : ''}
      ${student.class_name ? `<p><strong>Turma:</strong> ${student.class_name}</p>` : ''}
      <p><strong>Criação:</strong> ${new Date(pei.created_at).toLocaleDateString('pt-BR')}</p>
    </div>
  </div>

  <!-- 2. DIAGNÓSTICO -->
  <div class="section">
    <div class="section-title">2. Diagnóstico</div>
    
    ${diagnosisData.specialNeeds ? `
    <div class="subsection">
      <p class="subsection-title">Necessidades Educacionais Especiais:</p>
      <p>${diagnosisData.specialNeeds}</p>
    </div>` : ''}
    
    ${diagnosisData.interests ? `
    <div class="subsection">
      <p class="subsection-title">Interesses e Potencialidades:</p>
      <p>${diagnosisData.interests}</p>
    </div>` : ''}
    
    ${diagnosisData.strengths ? `
    <div class="subsection">
      <p class="subsection-title">Pontos Fortes:</p>
      <p>${diagnosisData.strengths}</p>
    </div>` : ''}
    
    ${diagnosisData.challenges ? `
    <div class="subsection">
      <p class="subsection-title">Desafios:</p>
      <p>${diagnosisData.challenges}</p>
    </div>` : ''}
    
    ${diagnosisData.history ? `
    <div class="subsection">
      <p class="subsection-title">Histórico:</p>
      <p>${diagnosisData.history}</p>
    </div>` : ''}
  </div>

  <!-- 3. PLANEJAMENTO -->
  <div class="section">
    <div class="section-title">3. Planejamento - Metas e Estratégias</div>
    
    ${goals.length === 0 ? '<p style="font-style: italic; color: #666;">Planejamento a ser elaborado pela equipe pedagógica.</p>' : ''}
    
    ${goals.map((goal, index) => `
      <div class="goal">
        <div class="goal-title">Meta ${index + 1}: ${goal.title || goal.description || 'Meta'}</div>
        
        ${goal.type || goal.bnccCode ? `
        <div class="goal-meta">
          ${goal.type ? `Tipo: ${goal.type === 'academica' ? 'Acadêmica' : 'Funcional'}` : ''}
          ${goal.type && goal.bnccCode ? ' | ' : ''}
          ${goal.bnccCode ? `BNCC: ${goal.bnccCode}` : ''}
          ${goal.timeline ? ` | Prazo: ${goal.timeline.replace('_', ' ')}` : ''}
        </div>` : ''}
        
        ${goal.description && goal.description !== goal.title ? `
        <div class="goal-section">
          <p>${goal.description}</p>
        </div>` : ''}
        
        ${goal.theoreticalBasis ? `
        <div class="goal-section" style="font-size: 7.5pt; font-style: italic; color: #444;">
          <span class="goal-section-title">Fundamentação:</span> ${goal.theoreticalBasis}
        </div>` : ''}
        
        ${goal.duaPrinciples ? `
        <div class="goal-section" style="font-size: 7.5pt;">
          <span class="goal-section-title">DUA:</span>
          ${goal.duaPrinciples.representation ? `Representação: ${goal.duaPrinciples.representation}. ` : ''}
          ${goal.duaPrinciples.actionExpression ? `Ação/Expressão: ${goal.duaPrinciples.actionExpression}. ` : ''}
          ${goal.duaPrinciples.engagement ? `Engajamento: ${goal.duaPrinciples.engagement}` : ''}
        </div>` : ''}
        
        ${goal.strategies && Array.isArray(goal.strategies) && goal.strategies.length > 0 ? `
        <div class="goal-section">
          <span class="goal-section-title">Estratégias:</span>
          <ul class="strategies">
            ${goal.strategies.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>` : ''}
        
        ${goal.evaluationCriteria ? `
        <div class="goal-section">
          <span class="goal-section-title">Avaliação:</span> ${goal.evaluationCriteria}
        </div>` : ''}
        
        ${goal.resources ? `
        <div class="goal-section">
          <span class="goal-section-title">Recursos:</span> ${goal.resources}
        </div>` : ''}
        
        ${goal.teamInvolvement ? `
        <div class="goal-section" style="font-size: 7.5pt;">
          <span class="goal-section-title">Equipe:</span> ${goal.teamInvolvement}
        </div>` : ''}
        
        ${goal.expectedProgress ? `
        <div class="goal-section" style="font-size: 7.5pt; color: #006600;">
          <span class="goal-section-title">Progresso Esperado:</span> ${goal.expectedProgress}
        </div>` : ''}
      </div>
    `).join('')}
  </div>

  <!-- 4. ENCAMINHAMENTOS -->
  ${evaluationData.referrals || evaluationData.observations ? `
  <div class="section">
    <div class="section-title">4. Encaminhamentos e Observações</div>
    
    ${evaluationData.referrals && Array.isArray(evaluationData.referrals) && evaluationData.referrals.length > 0 ? `
    <div class="subsection">
      <p class="subsection-title">Encaminhamentos:</p>
      <p>${evaluationData.referrals.join(', ')}</p>
    </div>` : ''}
    
    ${evaluationData.observations ? `
    <div class="subsection">
      <p class="subsection-title">Observações:</p>
      <p>${evaluationData.observations}</p>
    </div>` : ''}
  </div>` : ''}

  <!-- ASSINATURAS -->
  <div class="signatures">
    <div class="section-title">Assinaturas</div>
    <div class="signatures-grid">
      <div class="signature-line">Professor(a) Responsável</div>
      <div class="signature-line">Coordenador(a) Pedagógico(a)</div>
      <div class="signature-line">Diretor(a) Escolar</div>
      <div class="signature-line">Responsável Legal / Família</div>
    </div>
    <div style="text-align: center; margin-top: 20px; font-size: 8pt;">
      Data: _____/_____/__________
    </div>
  </div>

  <div class="footer">
    PEI Collab - São Gonçalo dos Campos
  </div>
</body>
</html>`;
}

// ====================================
// FUNÇÃO PRINCIPAL
// ====================================

async function gerarPEIsHTML() {
  console.log('🚀 GERAÇÃO DE PEIs - SÃO GONÇALO DOS CAMPOS (HTML)');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Carregar logo
    console.log('🖼️  Carregando logo...');
    const logoBase64 = getLogoBase64();
    if (logoBase64) {
      console.log('✅ Logo carregada com sucesso\n');
    } else {
      console.log('⚠️  Logo não encontrada - continuando sem logo\n');
      console.log(`💡 Para incluir a logo, salve o brasão como:\n   ${LOGO_PATH}\n`);
    }

    // Buscar rede
    console.log('🔍 Buscando rede...');
    const { data: tenants } = await supabaseAdmin
      .from('tenants')
      .select('id, network_name')
      .ilike('network_name', '%São Gonçalo%');

    if (!tenants || tenants.length === 0) {
      throw new Error('Rede não encontrada');
    }

    const tenant = tenants[0];
    console.log(`✅ ${tenant.network_name}\n`);

    // Buscar escolas
    const { data: schools } = await supabaseAdmin
      .from('schools')
      .select('id, school_name')
      .eq('tenant_id', tenant.id);

    console.log(`🏫 ${schools?.length || 0} escolas\n`);

    // Buscar PEIs
    const schoolIds = schools.map((s) => s.id);
    const { data: peis } = await supabaseAdmin
      .from('peis')
      .select('*')
      .in('school_id', schoolIds)
      .in('status', ['draft', 'pending']);

    console.log(`📚 ${peis?.length || 0} PEIs\n`);
    console.log('🔄 Gerando HTMLs...\n');

    let successCount = 0;

    for (let i = 0; i < peis.length; i++) {
      const pei = peis[i];
      
      try {
        // Buscar aluno
        const { data: student } = await supabaseAdmin
          .from('students')
          .select('*')
          .eq('id', pei.student_id)
          .single();

        if (!student) continue;

        console.log(`[${i + 1}/${peis.length}] ${student.name}`);

        // Buscar escola
        const school = schools.find((s) => s.id === pei.school_id);

        // Gerar HTML
        const html = generateHTML(pei, student, school, tenant, logoBase64);
        
        // Salvar HTML
        const filename = `PEI_${student.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.html`;
        const outputPath = path.join(OUTPUT_DIR, filename);
        
        fs.writeFileSync(outputPath, html, 'utf8');
        
        console.log(`  ✅ ${filename}\n`);
        successCount++;

      } catch (error) {
        console.error(`  ❌ Erro: ${error.message}\n`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RELATÓRIO FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ HTMLs gerados: ${successCount}`);
    console.log(`📁 Pasta: ${path.resolve(OUTPUT_DIR)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('💡 PRÓXIMO PASSO: Abra os HTMLs no navegador e imprima como PDF');
    console.log('   Ou use Chrome headless para conversão automática\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

gerarPEIsHTML();

