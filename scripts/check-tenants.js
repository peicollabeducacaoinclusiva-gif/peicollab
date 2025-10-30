// Script para verificar tenants e escolas
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTenants() {
  console.log('🔍 Verificando tenants...\n');
  
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, network_name');
  
  if (tenantsError) {
    console.error('❌ Erro ao buscar tenants:', tenantsError);
  } else {
    console.log('✅ Tenants encontrados:', tenants?.length || 0);
    tenants?.forEach(t => console.log('  -', t.id, ':', t.network_name));
  }
  
  console.log('\n🔍 Verificando escolas...\n');
  
  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .select('id, school_name, tenant_id');
  
  if (schoolsError) {
    console.error('❌ Erro ao buscar escolas:', schoolsError);
  } else {
    console.log('✅ Escolas encontradas:', schools?.length || 0);
    schools?.forEach(s => console.log('  -', s.id, ':', s.school_name, '(tenant:', s.tenant_id, ')'));
  }
  
  console.log('\n🔍 Verificando alunos...\n');
  
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, name, school_id, tenant_id')
    .limit(3);
  
  if (studentsError) {
    console.error('❌ Erro ao buscar alunos:', studentsError);
  } else {
    console.log('✅ Alunos encontrados:', students?.length || 0);
    students?.forEach(s => console.log('  -', s.name, '(school:', s.school_id, ', tenant:', s.tenant_id, ')'));
  }
}

checkTenants();

