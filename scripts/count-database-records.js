import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Carregar variáveis de ambiente do arquivo .env
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
  console.log('⚠️ Arquivo .env não encontrado, usando variáveis do sistema');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function countRecords() {
  console.log('🔍 Contando registros no banco de dados...\n');

  try {
    // Contar tenants
    const { count: tenantsCount } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Tenants: ${tenantsCount}`);

    // Contar schools
    const { count: schoolsCount } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Schools: ${schoolsCount}`);

    // Contar students
    const { count: studentsCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Students: ${studentsCount}`);

    // Contar peis
    const { count: peisCount } = await supabase
      .from('peis')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 PEIs: ${peisCount}`);

    // Contar profiles
    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Profiles: ${profilesCount}`);

    // Contar user_roles
    const { count: userRolesCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 User Roles: ${userRolesCount}`);

    // Listar alguns students para verificar
    console.log('\n📋 Primeiros 5 Students:');
    const { data: studentsSample } = await supabase
      .from('students')
      .select('id, name, school_id, created_at')
      .limit(5);
    
    if (studentsSample && studentsSample.length > 0) {
      studentsSample.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} (ID: ${student.id.substring(0, 8)}...)`);
      });
    } else {
      console.log('   ❌ Nenhum student encontrado!');
    }

    // Listar alguns peis
    console.log('\n📋 Primeiros 5 PEIs:');
    const { data: peisSample } = await supabase
      .from('peis')
      .select('id, student_id, status, created_at')
      .limit(5);
    
    if (peisSample && peisSample.length > 0) {
      peisSample.forEach((pei, index) => {
        console.log(`   ${index + 1}. PEI ID: ${pei.id.substring(0, 8)}... (Status: ${pei.status})`);
      });
    } else {
      console.log('   ❌ Nenhum PEI encontrado!');
    }

    // Diagnóstico
    console.log('\n🔍 Diagnóstico:');
    if (studentsCount === 0 && peisCount === 0) {
      console.log('   ⚠️  BANCO VAZIO: Nenhum student ou PEI encontrado!');
      console.log('   💡 Possíveis causas:');
      console.log('      1. Migrações foram aplicadas e não restauraram dados');
      console.log('      2. Dados foram deletados acidentalmente');
      console.log('      3. Problemas com RLS impedindo visualização');
      console.log('   🛠️  Solução: Execute o script de população de dados');
    } else if (studentsCount > 0 && peisCount === 0) {
      console.log('   ⚠️  Students encontrados mas nenhum PEI!');
      console.log('   💡 PEIs podem ter sido deletados ou podem estar bloqueados por RLS');
    } else if (studentsCount === 0 && peisCount > 0) {
      console.log('   ⚠️  PEIs encontrados mas nenhum Student!');
      console.log('   💡 PROBLEMA CRÍTICO: CASCADE DELETE pode ter removido students');
    } else {
      console.log('   ✅ Dados presentes no banco');
    }

  } catch (error) {
    console.error('❌ Erro ao contar registros:', error.message);
  }
}

countRecords();


