import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envPath = join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.log('⚠️ Arquivo .env não encontrado');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1);

  return rows.map((row) => {
    const values = parseCSVLine(row);
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || null;
    });
    return obj;
  });
}

async function testImport() {
  console.log('🧪 Testando importação de escolas...\n');

  try {
    // Ler arquivo CSV
    const csvPath = join(process.cwd(), 'Projeto', 'schools_sao_goncalo.csv');
    const csvContent = readFileSync(csvPath, 'utf8');
    
    console.log('✅ Arquivo lido com sucesso');
    console.log('📄 Primeiras 5 linhas:', csvContent.split('\n').slice(0, 5).join('\n'));
    
    // Parse CSV
    const data = parseCSV(csvContent);
    console.log(`\n✅ ${data.length} escolas parseadas`);
    
    // Mostrar primeira escola
    if (data.length > 0) {
      console.log('\n📊 Primeira escola parseada:');
      console.log(JSON.stringify(data[0], null, 2));
    }
    
    // Tentar inserir a primeira escola
    if (data.length > 0) {
      const firstSchool = data[0];
      
      const itemToInsert = {
        school_name: firstSchool.school_name?.trim(),
        school_address: firstSchool.school_address?.trim() || null,
        school_phone: firstSchool.school_phone?.trim() || null,
        school_email: firstSchool.school_email?.trim() || null,
        tenant_id: firstSchool.tenant_id?.trim(),
        is_active: true
      };
      
      console.log('\n📤 Dados para inserção:');
      console.log(JSON.stringify(itemToInsert, null, 2));
      
      const { data: insertData, error } = await supabase
        .from('schools')
        .insert(itemToInsert)
        .select();
      
      if (error) {
        console.error('\n❌ Erro ao inserir:', error.message);
        console.error('Detalhes:', error);
      } else {
        console.log('\n✅ Escola inserida com sucesso!');
        console.log(JSON.stringify(insertData, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error(error);
  }
}

testImport();

