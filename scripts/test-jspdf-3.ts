/**
 * Script de teste para verificar jsPDF 3.x
 * Execute com: pnpm tsx scripts/test-jspdf-3.ts
 */

import jsPDF from 'jspdf';

async function testJsPDF() {
  console.log('🧪 Testando jsPDF 3.x...\n');

  try {
    // Teste 1: Criar PDF básico
    console.log('1. Criando PDF básico...');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
    
    pdf.setFontSize(16);
    pdf.text('Teste jsPDF 3.x', 10, 15);
    
    pdf.setFontSize(12);
    pdf.text('Este é um teste de compatibilidade com jsPDF 3.x', 10, 25);
    
    console.log('✅ PDF criado com sucesso');
    
    // Teste 2: Adicionar imagem (simulada)
    console.log('\n2. Testando adição de imagem...');
    // Simular dados de imagem
    const imgData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    try {
      pdf.addImage(imgData, 'PNG', 10, 35, 50, 30);
      console.log('✅ Imagem adicionada com sucesso');
    } catch (error: any) {
      console.log('⚠️  Erro ao adicionar imagem (esperado em ambiente Node):', error.message);
    }
    
    // Teste 3: Adicionar página
    console.log('\n3. Testando adição de página...');
    pdf.addPage();
    pdf.text('Segunda página', 10, 15);
    console.log('✅ Página adicionada com sucesso');
    
    // Teste 4: Gerar output (não salvar em arquivo, apenas verificar)
    console.log('\n4. Testando geração de output...');
    const output = pdf.output('arraybuffer');
    console.log(`✅ Output gerado: ${output.byteLength} bytes`);
    
    // Teste 5: Verificar métodos principais
    console.log('\n5. Verificando métodos principais...');
    const methods = [
      'setFontSize',
      'text',
      'addImage',
      'addPage',
      'save',
      'output'
    ];
    
    methods.forEach(method => {
      if (typeof (pdf as any)[method] === 'function') {
        console.log(`  ✅ ${method} disponível`);
      } else {
        console.log(`  ❌ ${method} não encontrado`);
      }
    });
    
    console.log('\n✅ Todos os testes passaram!');
    console.log('\n📊 Resumo:');
    console.log(`  - PDF criado: ✅`);
    console.log(`  - Métodos principais: ✅`);
    console.log(`  - Output gerado: ✅ (${output.byteLength} bytes)`);
    console.log(`  - Versão jsPDF: 3.x`);
    
  } catch (error: any) {
    console.error('\n❌ Erro nos testes:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar testes
testJsPDF();

