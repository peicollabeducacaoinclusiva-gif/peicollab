// Script para Analisar Formulários CSV
// Mapeia dados das mães e coordenadores com PEIs existentes
// Data: 06/11/2024

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ====================================
// CONFIGURAÇÕES
// ====================================

const SUPABASE_URL = 'https://fximylewmvsllkdczovj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY5NjQ3MiwiZXhwIjoyMDc3MjcyNDcyfQ.ezYPOGMO2ik-VaiNoBrJ7cKivms3SiZsJ5zN0Fhm3Fg';

const CSV_COORDENADORES = path.join(__dirname, '..', 'Projeto', 'PEI Colaborativo - SGC (respostas) - Respostas ao formulário 1.csv');
const CSV_MAES = path.join(__dirname, '..', 'Projeto', 'PEI Colaborativo - Mãe (respostas) - resposta.csv');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ====================================
// FUNÇÕES DE NORMALIZAÇÃO
// ====================================

function normalizarNome(nome) {
  if (!nome) return '';
  return nome
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function encontrarCorrespondencia(nomeFormulario, nomeBanco) {
  const norm1 = normalizarNome(nomeFormulario);
  const norm2 = normalizarNome(nomeBanco);
  
  // Correspondência exata
  if (norm1 === norm2) return 100;
  
  // Verifica se um contém o outro
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 90;
  
  // Verifica palavras em comum
  const palavras1 = norm1.split(' ').filter(p => p.length > 2);
  const palavras2 = norm2.split(' ').filter(p => p.length > 2);
  
  const comuns = palavras1.filter(p => palavras2.includes(p));
  const similaridade = (comuns.length / Math.max(palavras1.length, palavras2.length)) * 100;
  
  return similaridade;
}

// ====================================
// ANÁLISE DOS CSVs
// ====================================

async function analisarFormularios() {
  console.log('📊 ANÁLISE DOS FORMULÁRIOS CSV');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Ler CSV dos Coordenadores
    console.log('📋 Lendo formulário dos coordenadores...');
    const csvCoordContent = fs.readFileSync(CSV_COORDENADORES, 'utf8');
    const dadosCoord = parse(csvCoordContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    console.log(`✅ ${dadosCoord.length} registros de coordenadores\n`);

    // 2. Ler CSV das Mães
    console.log('📋 Lendo formulário das mães...');
    const csvMaesContent = fs.readFileSync(CSV_MAES, 'utf8');
    const dadosMaes = parse(csvMaesContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    console.log(`✅ ${dadosMaes.length} registros de mães\n`);

    // 3. Buscar alunos no banco
    console.log('🔍 Buscando alunos no banco...');
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .ilike('network_name', '%São Gonçalo%');

    if (!tenants || tenants.length === 0) {
      throw new Error('Rede não encontrada');
    }

    const { data: schools } = await supabase
      .from('schools')
      .select('id, school_name')
      .eq('tenant_id', tenants[0].id);

    const schoolIds = schools.map(s => s.id);

    const { data: students } = await supabase
      .from('students')
      .select('id, name')
      .in('school_id', schoolIds);

    console.log(`✅ ${students.length} alunos no banco\n`);

    // 4. Mapear dados
    console.log('🔗 MAPEAMENTO DE DADOS\n');
    console.log('═══════════════════════════════════════════════════\n');

    const mapeamento = [];

    for (const aluno of students) {
      const info = {
        id: aluno.id,
        nome: aluno.name,
        dadosCoord: null,
        dadosMae: null,
        similaridadeCoord: 0,
        similaridadeMae: 0,
      };

      // Buscar nos dados dos coordenadores
      for (const registro of dadosCoord) {
        const nomeFormulario = registro['Nome do Estudante'] || '';
        const similaridade = encontrarCorrespondencia(nomeFormulario, aluno.name);
        
        if (similaridade > info.similaridadeCoord) {
          info.dadosCoord = registro;
          info.similaridadeCoord = similaridade;
        }
      }

      // Buscar nos dados das mães
      for (const registro of dadosMaes) {
        const nomeFormulario = registro['Nome do seu filho(a): '] || '';
        const similaridade = encontrarCorrespondencia(nomeFormulario, aluno.name);
        
        if (similaridade > info.similaridadeMae) {
          info.dadosMae = registro;
          info.similaridadeMae = similaridade;
        }
      }

      if (info.similaridadeCoord > 70 || info.similaridadeMae > 70) {
        mapeamento.push(info);
      }
    }

    console.log(`✅ ${mapeamento.length} alunos com dados nos formulários\n`);

    // 5. Exibir correspondências
    console.log('📋 CORRESPONDÊNCIAS ENCONTRADAS\n');
    
    mapeamento.forEach((item, index) => {
      console.log(`${index + 1}. ${item.nome}`);
      
      if (item.dadosCoord && item.similaridadeCoord > 70) {
        console.log(`   ✅ Dados Coordenador (${item.similaridadeCoord.toFixed(0)}%)`);
        console.log(`      Escola: ${item.dadosCoord['ESCOLA REGULAR'] || 'N/A'}`);
        console.log(`      Série: ${item.dadosCoord['Série/Ano Escolar'] || 'N/A'}`);
        console.log(`      Histórico: ${(item.dadosCoord['Histórico resumido (Relato familiar, escolar e do próprio estudante. Inclua informações sobre convivência, saúde, frequência e rotina.)'] || '').substring(0, 80)}...`);
      }
      
      if (item.dadosMae && item.similaridadeMae > 70) {
        console.log(`   ✅ Dados Mãe (${item.similaridadeMae.toFixed(0)}%)`);
        console.log(`      Necessidades: ${(item.dadosMae['Quais as necessidades do seu filho(a)?'] || 'N/A').substring(0, 80)}...`);
        console.log(`      Expectativas: ${(item.dadosMae['Quais ações você espera da escola para incluir seu filho(a)?'] || 'N/A').substring(0, 80)}...`);
      }
      
      console.log('');
    });

    // 6. Estatísticas
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ESTATÍSTICAS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total de alunos no banco: ${students.length}`);
    console.log(`Registros formulário coordenadores: ${dadosCoord.length}`);
    console.log(`Registros formulário mães: ${dadosMaes.length}`);
    console.log(`Alunos com dados dos formulários: ${mapeamento.length}`);
    console.log(`  - Com dados de coordenador: ${mapeamento.filter(m => m.dadosCoord).length}`);
    console.log(`  - Com dados de mãe: ${mapeamento.filter(m => m.dadosMae).length}`);
    console.log(`  - Com ambos: ${mapeamento.filter(m => m.dadosCoord && m.dadosMae).length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 7. Salvar mapeamento em JSON
    const outputPath = path.join(__dirname, '..', 'mapeamento-formularios.json');
    fs.writeFileSync(outputPath, JSON.stringify(mapeamento, null, 2), 'utf8');
    console.log(`💾 Mapeamento salvo em: ${outputPath}\n`);

    // 8. Análise de campos preenchidos
    console.log('📋 CAMPOS DISPONÍVEIS NOS FORMULÁRIOS\n');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('🎯 Formulário Coordenadores:');
    if (dadosCoord.length > 0) {
      const campos = Object.keys(dadosCoord[0]);
      campos.forEach((campo, i) => {
        console.log(`   ${i + 1}. ${campo}`);
      });
    }
    console.log('');

    console.log('👨‍👩‍👧‍👦 Formulário Mães:');
    if (dadosMaes.length > 0) {
      const campos = Object.keys(dadosMaes[0]);
      campos.forEach((campo, i) => {
        console.log(`   ${i + 1}. ${campo}`);
      });
    }
    console.log('');

    console.log('✅ Análise concluída!');
    console.log('\n💡 PRÓXIMO PASSO: Executar script de enriquecimento dos PEIs');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  }
}

analisarFormularios();

