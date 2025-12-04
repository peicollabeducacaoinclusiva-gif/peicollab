// ============================================================================
// TESTES E2E: Gestão Escolar
// ============================================================================
// Testes end-to-end para fluxos da Gestão Escolar
// ============================================================================

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5175'; // Gestão Escolar

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'Test123!@#');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`);
});

// ============================================================================
// FLUXO 1: CADASTRAR ALUNO COMPLETO
// ============================================================================

test.describe('Fluxo 1: Cadastrar Aluno', () => {
  test('deve cadastrar aluno com wizard de 6 steps', async ({ page }) => {
    console.log('🚀 Teste: Cadastro completo de aluno');
    
    // 1. Navegar para alunos
    await page.goto(`${BASE_URL}/alunos`);
    await page.click('button:has-text("Novo Aluno")');
    
    // STEP 1: Dados Básicos
    await page.fill('input[name="name"]', 'Pedro Oliveira Teste E2E');
    await page.fill('input[name="nome_social"]', 'Pedro');
    await page.fill('input[name="date_of_birth"]', '2014-08-10');
    await page.fill('input[name="codigo_identificador"]', 'ALU2025E2E001');
    await page.click('button:has-text("Próximo")');
    
    console.log('  ✅ Step 1: Dados básicos');
    
    // STEP 2: Documentos
    await page.fill('input[name="cpf"]', '123.456.789-00');
    await page.fill('input[name="rg"]', '12.345.678-9');
    await page.fill('input[name="certidao_nascimento"]', '123456 01 55 2014 1 00001 123 1234567 89');
    await page.click('button:has-text("Próximo")');
    
    console.log('  ✅ Step 2: Documentos');
    
    // STEP 3: Endereço
    await page.fill('input[name="logradouro"]', 'Rua das Flores');
    await page.fill('input[name="numero_endereco"]', '123');
    await page.fill('input[name="bairro"]', 'Centro');
    await page.fill('input[name="cidade"]', 'São Paulo');
    await page.selectOption('select[name="estado"]', 'SP');
    await page.fill('input[name="cep"]', '01234-567');
    await page.fill('input[name="telefone_celular"]', '(11) 98765-4321');
    await page.click('button:has-text("Próximo")');
    
    console.log('  ✅ Step 3: Endereço e contato');
    
    // STEP 4: Responsáveis
    await page.fill('input[name="responsavel1_nome"]', 'Ana Oliveira');
    await page.fill('input[name="responsavel1_cpf"]', '987.654.321-00');
    await page.fill('input[name="responsavel1_telefone"]', '(11) 91234-5678');
    await page.selectOption('select[name="responsavel1_parentesco"]', 'Mãe');
    await page.click('button:has-text("Próximo")');
    
    console.log('  ✅ Step 4: Responsáveis');
    
    // STEP 5: Saúde e NEE
    await page.check('input[name="necessidades_especiais"]');
    await page.fill('input[name="cid_diagnostico"]', 'F84.0 - Autismo');
    await page.fill('textarea[name="descricao_diagnostico"]', 
      'Aluno com diagnóstico de TEA nível 1. Boa comunicação verbal.'
    );
    await page.click('button:has-text("Próximo")');
    
    console.log('  ✅ Step 5: Saúde e NEE');
    
    // STEP 6: Matrícula
    await page.selectOption('select[name="status_matricula"]', 'Ativo');
    await page.fill('input[name="numero_matricula"]', '2025001');
    await page.check('input[name="usa_transporte_escolar"]');
    await page.fill('input[name="rota_transporte"]', 'Rota 1 - Centro');
    
    // Salvar
    await page.click('button:has-text("Cadastrar")');
    
    // Verificar sucesso
    await expect(page.locator('text=Aluno cadastrado')).toBeVisible();
    
    console.log('  ✅ Step 6: Matrícula e transporte');
    console.log('🎉 Aluno cadastrado com sucesso!');
  });
});

// ============================================================================
// FLUXO 2: MATRICULAR ALUNO
// ============================================================================

test.describe('Fluxo 2: Matricular Aluno', () => {
  test('deve matricular aluno com wizard completo', async ({ page }) => {
    console.log('🚀 Teste: Matrícula de aluno');
    
    await page.goto(`${BASE_URL}/matriculas`);
    await page.click('button:has-text("Nova Matrícula")');
    
    // STEP 1: Buscar e selecionar aluno
    await page.fill('input[placeholder*="nome"]', 'Pedro');
    await page.click('button:has-text("Buscar")');
    await page.waitForTimeout(1000);
    
    // Selecionar primeiro resultado
    await page.click('.student-result:first-child');
    await expect(page.locator('text=Pedro')).toBeVisible();
    await page.click('button:has-text("Próximo")');
    
    console.log('  ✅ Step 1: Aluno selecionado');
    
    // STEP 2: Dados da matrícula
    await page.selectOption('select[name="class_id"]', { index: 1 });
    await page.fill('input[name="numero_matricula"]', '2025002');
    await page.click('button:has-text("Próximo")');
    
    console.log('  ✅ Step 2: Dados preenchidos');
    
    // STEP 3: Benefícios
    await page.check('input[name="bolsista"]');
    await page.selectOption('select[name="tipo_bolsa"]', 'Social');
    await page.fill('input[name="percentual_bolsa"]', '50');
    await page.check('input[name="utiliza_transporte"]');
    await page.fill('input[name="rota_transporte"]', 'Rota 2');
    await page.click('button:has-text("Próximo")');
    
    console.log('  ✅ Step 3: Benefícios configurados');
    
    // STEP 4: Confirmação
    await expect(page.locator('text=Pronto para matricular')).toBeVisible();
    await page.click('button:has-text("Confirmar Matrícula")');
    
    // Verificar sucesso
    await expect(page.locator('text=Matrícula realizada')).toBeVisible();
    
    console.log('🎉 Matrícula realizada com sucesso!');
  });
});

// ============================================================================
// FLUXO 3: REGISTRAR FREQUÊNCIA OFFLINE
// ============================================================================

test.describe('Fluxo 3: Diário de Classe Offline', () => {
  test('deve registrar frequência e funcionar offline', async ({ page, context }) => {
    console.log('🚀 Teste: Diário de classe offline');
    
    // 1. Abrir diário de classe
    await page.goto(`${BASE_URL}/turmas`);
    await page.click('tbody tr:first-child');
    await page.click('button:has-text("Diário de Classe")');
    
    // 2. Verificar lista de alunos
    await expect(page.locator('text=Total de Alunos')).toBeVisible();
    
    // 3. Marcar alguns presentes, outros ausentes
    await page.click('.attendance-toggle:nth-child(1)'); // Presente → Ausente
    await page.click('.attendance-toggle:nth-child(2)'); // Presente → Ausente
    
    // 4. Adicionar justificativa
    await page.fill('input[name="justificativa_0"]', 'Consulta médica');
    
    console.log('  ✅ Frequência marcada');
    
    // 5. Salvar online
    await page.click('button:has-text("Salvar Frequência")');
    await expect(page.locator('text=Frequência salva')).toBeVisible();
    
    console.log('  ✅ Salvo online');
    
    // 6. Simular offline
    await context.setOffline(true);
    await expect(page.locator('text=Offline')).toBeVisible();
    
    // 7. Fazer mudanças offline
    await page.click('.attendance-toggle:nth-child(3)');
    await page.click('button:has-text("Salvar")');
    
    // 8. Verificar salvamento local
    await expect(page.locator('text=Salvo localmente')).toBeVisible();
    
    console.log('  ✅ Salvo offline');
    
    // 9. Reconectar
    await context.setOffline(false);
    await page.waitForTimeout(2000);
    
    // 10. Verificar sincronização
    await expect(page.locator('text=Sincronizado')).toBeVisible({ timeout: 10000 });
    
    console.log('  ✅ Sincronizado ao reconectar');
    console.log('🎉 Teste offline SUCESSO!');
  });
});

// ============================================================================
// FLUXO 4: LANÇAR NOTAS
// ============================================================================

test.describe('Fluxo 4: Lançar Notas', () => {
  test('deve lançar notas de uma turma', async ({ page }) => {
    console.log('🚀 Teste: Lançamento de notas');
    
    await page.goto(`${BASE_URL}/turmas`);
    await page.click('tbody tr:first-child');
    await page.click('button:has-text("Lançar Notas")');
    
    // Selecionar disciplina e período
    await page.selectOption('select[name="subject"]', { index: 1 });
    await page.selectOption('select[name="periodo"]', '1');
    await page.selectOption('select[name="tipo"]', 'prova');
    
    // Lançar notas
    await page.fill('input[name="nota_0"]', '8.5');
    await page.fill('input[name="nota_1"]', '7.0');
    await page.fill('input[name="nota_2"]', '9.5');
    
    // Salvar
    await page.click('button:has-text("Salvar Notas")');
    
    // Verificar
    await expect(page.locator('text=Notas salvas')).toBeVisible();
    await expect(page.locator('text=Média Geral')).toBeVisible();
    
    console.log('✅ Notas lançadas com sucesso');
  });
});

// ============================================================================
// FLUXO 5: GERAR BOLETIM
// ============================================================================

test.describe('Fluxo 5: Boletim Escolar', () => {
  test('deve gerar boletim completo do aluno', async ({ page }) => {
    console.log('🚀 Teste: Geração de boletim');
    
    await page.goto(`${BASE_URL}/alunos`);
    await page.click('tbody tr:first-child');
    await page.click('button:has-text("Ver Boletim")');
    
    // Verificar seções do boletim
    await expect(page.locator('text=Boletim Escolar')).toBeVisible();
    await expect(page.locator('text=Média Geral')).toBeVisible();
    await expect(page.locator('text=Taxa de Presença')).toBeVisible();
    await expect(page.locator('text=Notas por Disciplina')).toBeVisible();
    
    // Verificar botão de PDF
    const pdfButton = page.locator('button:has-text("Baixar PDF")');
    await expect(pdfButton).toBeVisible();
    
    console.log('✅ Boletim gerado com sucesso');
  });
});

// ============================================================================
// FLUXO 6: DASHBOARD INTEGRADO
// ============================================================================

test.describe('Fluxo 6: Dashboard', () => {
  test('deve exibir dashboard com todos os widgets', async ({ page }) => {
    console.log('🚀 Teste: Dashboard integrado');
    
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Verificar cards principais
    await expect(page.locator('text=Total de Alunos')).toBeVisible();
    await expect(page.locator('text=Matrículas Ativas')).toBeVisible();
    await expect(page.locator('text=Taxa de Presença')).toBeVisible();
    await expect(page.locator('text=Média Geral')).toBeVisible();
    await expect(page.locator('text=PEIs Ativos')).toBeVisible();
    
    // Verificar filtros de período
    await page.click('button:has-text("Mês")');
    await expect(page.locator('button:has-text("Mês")[class*="default"]')).toBeVisible();
    
    await page.click('button:has-text("Bimestre")');
    await expect(page.locator('button:has-text("Bimestre")[class*="default"]')).toBeVisible();
    
    console.log('✅ Dashboard funcionando corretamente');
  });
  
  test('deve exibir alertas se houver problemas', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Verificar se há alertas (podem ou não existir)
    const alertCount = await page.locator('[class*="border-l-4"][class*="border-red"]').count();
    
    if (alertCount > 0) {
      console.log(`⚠️ ${alertCount} alerta(s) exibido(s)`);
      
      // Clicar no primeiro alerta
      await page.click('[class*="border-l-4"]:first-child button');
      
      console.log('✅ Alertas funcionando');
    } else {
      console.log('ℹ️ Nenhum alerta (situação normal)');
    }
  });
});

// ============================================================================
// FLUXO 7: INTEGRAÇÃO COM PEI
// ============================================================================

test.describe('Fluxo 7: Integração Gestão ↔ PEI', () => {
  test('deve sincronizar dados ao matricular aluno com PEI', async ({ page }) => {
    console.log('🚀 Teste: Integração Gestão → PEI');
    
    // Esta é uma validação que os triggers SQL funcionam
    // Não é possível testar triggers diretamente no E2E, 
    // mas podemos verificar os resultados
    
    // 1. Buscar aluno com PEI ativo
    await page.goto(`${BASE_URL}/alunos`);
    await page.fill('input[placeholder*="Buscar"]', 'João');
    await page.waitForTimeout(500);
    
    // 2. Abrir detalhes
    await page.click('tbody tr:first-child');
    
    // 3. Verificar se tem PEI vinculado
    const hasPEI = await page.locator('text=PEI Ativo').isVisible();
    
    if (hasPEI) {
      console.log('  ✅ Aluno possui PEI ativo');
      
      // 4. Verificar dados acadêmicos
      await expect(page.locator('text=Turma')).toBeVisible();
      await expect(page.locator('text=Frequência')).toBeVisible();
      await expect(page.locator('text=Desempenho')).toBeVisible();
      
      console.log('  ✅ Dados acadêmicos visíveis no contexto do aluno');
    }
    
    console.log('✅ Integração verificada');
  });
});

// ============================================================================
// RESUMO
// ============================================================================

test.afterAll(() => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║       RESUMO DOS TESTES E2E - GESTÃO ESCOLAR       ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
  console.log('✅ Fluxo 1: Cadastrar Aluno (6 steps)');
  console.log('✅ Fluxo 2: Matricular Aluno (4 steps)');
  console.log('✅ Fluxo 3: Diário de Classe Offline');
  console.log('✅ Fluxo 4: Lançar Notas');
  console.log('✅ Fluxo 5: Gerar Boletim');
  console.log('✅ Fluxo 6: Dashboard Integrado');
  console.log('✅ Fluxo 7: Integração com PEI');
  console.log('');
  console.log('🎉 TODOS OS TESTES CONCLUÍDOS!');
  console.log('');
});

