/**
 * Script de teste para verificar migração exceljs
 * Execute com: pnpm tsx scripts/test-exceljs-migration.ts
 */

import ExcelJS from 'exceljs';

async function testExcelJS() {
  console.log('🧪 Testando ExcelJS...\n');

  try {
    // Teste 1: Criar workbook
    console.log('1. Criando workbook...');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Teste');
    
    // Adicionar cabeçalhos
    worksheet.addRow(['Nome', 'Idade', 'Email']);
    
    // Adicionar dados
    worksheet.addRow(['João Silva', 25, 'joao@example.com']);
    worksheet.addRow(['Maria Santos', 30, 'maria@example.com']);
    
    // Estilizar cabeçalhos
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCCCCC' }
    };
    
    console.log('✅ Workbook criado com sucesso');
    
    // Teste 2: Gerar buffer
    console.log('\n2. Gerando buffer...');
    const buffer = await workbook.xlsx.writeBuffer();
    console.log(`✅ Buffer gerado: ${buffer.byteLength} bytes`);
    
    // Teste 3: Ler workbook do buffer
    console.log('\n3. Lendo workbook do buffer...');
    const readWorkbook = new ExcelJS.Workbook();
    await readWorkbook.xlsx.load(buffer);
    
    const readWorksheet = readWorkbook.getWorksheet(1);
    if (!readWorksheet) {
      throw new Error('Worksheet não encontrada');
    }
    
    console.log('✅ Workbook lido com sucesso');
    
    // Teste 4: Ler dados
    console.log('\n4. Lendo dados...');
    const rows: any[] = [];
    readWorksheet.eachRow((row, rowNumber) => {
      const rowData: any[] = [];
      row.eachCell((cell) => {
        rowData.push(cell.value);
      });
      rows.push(rowData);
    });
    
    console.log('Dados lidos:');
    rows.forEach((row, index) => {
      console.log(`  Linha ${index + 1}:`, row);
    });
    
    console.log('\n✅ Todos os testes passaram!');
    console.log('\n📊 Resumo:');
    console.log(`  - Workbook criado: ✅`);
    console.log(`  - Buffer gerado: ✅ (${buffer.byteLength} bytes)`);
    console.log(`  - Workbook lido: ✅`);
    console.log(`  - Dados lidos: ✅ (${rows.length} linhas)`);
    
  } catch (error: any) {
    console.error('\n❌ Erro nos testes:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar testes
testExcelJS();

