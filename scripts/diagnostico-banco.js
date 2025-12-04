// Script de Diagnóstico do Banco de Dados
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fximylewmvsllkdczovj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY0NzIsImV4cCI6MjA3NzI3MjQ3Mn0.3FqQqUfVgD3hIh1daa3R1JjouGZ4D4ONR6SmcL9Qids';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnosticar() {
  console.log('🔍 DIAGNÓSTICO DO BANCO DE DADOS\n');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Verificar Tenants
    console.log('1️⃣  REDES DE ENSINO (tenants)');
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, network_name');

    if (tenantError) {
      console.log(`   ❌ Erro: ${tenantError.message}`);
    } else {
      console.log(`   ✅ Total: ${tenants?.length || 0}`);
      tenants?.slice(0, 3).forEach((t) => {
        console.log(`      • ${t.network_name}`);
      });
    }
    console.log('');

    // 2. Verificar Schools
    console.log('2️⃣  ESCOLAS (schools)');
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_name');

    if (schoolError) {
      console.log(`   ❌ Erro: ${schoolError.message}`);
    } else {
      console.log(`   ✅ Total: ${schools?.length || 0}`);
      schools?.slice(0, 3).forEach((s) => {
        console.log(`      • ${s.school_name}`);
      });
    }
    console.log('');

    // 3. Verificar Students
    console.log('3️⃣  ALUNOS (students)');
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, name');

    if (studentError) {
      console.log(`   ❌ Erro: ${studentError.message}`);
    } else {
      console.log(`   ✅ Total: ${students?.length || 0}`);
      students?.slice(0, 3).forEach((s) => {
        console.log(`      • ${s.name}`);
      });
    }
    console.log('');

    // 4. Verificar PEIs (SEM filtro is_active_version primeiro)
    console.log('4️⃣  PEIs (peis) - TODOS');
    const { data: allPeis, error: allPeiError } = await supabase
      .from('peis')
      .select('id, status');

    if (allPeiError) {
      console.log(`   ❌ Erro: ${allPeiError.message}`);
    } else {
      console.log(`   ✅ Total: ${allPeis?.length || 0}`);
      if (allPeis && allPeis.length > 0) {
        const byStatus = allPeis.reduce((acc, pei) => {
          acc[pei.status] = (acc[pei.status] || 0) + 1;
          return acc;
        }, {});

        Object.entries(byStatus).forEach(([status, count]) => {
          console.log(`      ${getStatusIcon(status)} ${getStatusLabel(status)}: ${count}`);
        });
      }
    }
    console.log('');

    // 5. Verificar PEIs Ativos
    console.log('5️⃣  PEIs ATIVOS (is_active_version = true)');
    const { data: activePeis, error: activeError } = await supabase
      .from('peis')
      .select('id, status')
      .eq('is_active_version', true);

    if (activeError) {
      console.log(`   ❌ Erro: ${activeError.message}`);
      console.log(`   💡 Coluna is_active_version pode não existir`);
    } else {
      console.log(`   ✅ Total: ${activePeis?.length || 0}`);
    }
    console.log('');

    // 6. Verificar Profiles
    console.log('6️⃣  PERFIS (profiles)');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name');

    if (profileError) {
      console.log(`   ❌ Erro: ${profileError.message}`);
    } else {
      console.log(`   ✅ Total: ${profiles?.length || 0}`);
    }
    console.log('');

    // 7. Verificar User Roles
    console.log('7️⃣  ROLES (user_roles)');
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role');

    if (roleError) {
      console.log(`   ❌ Erro: ${roleError.message}`);
    } else {
      console.log(`   ✅ Total: ${roles?.length || 0}`);
      if (roles && roles.length > 0) {
        const byRole = roles.reduce((acc, r) => {
          acc[r.role] = (acc[r.role] || 0) + 1;
          return acc;
        }, {});

        Object.entries(byRole).forEach(([role, count]) => {
          console.log(`      • ${role}: ${count}`);
        });
      }
    }
    console.log('');

    // Resumo
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 RESUMO');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Redes: ${tenants?.length || 0}`);
    console.log(`Escolas: ${schools?.length || 0}`);
    console.log(`Alunos: ${students?.length || 0}`);
    console.log(`PEIs (todos): ${allPeis?.length || 0}`);
    console.log(`PEIs (ativos): ${activePeis?.length || 0}`);
    console.log(`Usuários: ${profiles?.length || 0}`);
    console.log('═══════════════════════════════════════════════════\n');

    if ((allPeis?.length || 0) === 0) {
      console.log('⚠️  BANCO DE DADOS VAZIO');
      console.log('💡 Para gerar PDFs, primeiro:');
      console.log('   1. Crie uma rede (tenant)');
      console.log('   2. Crie uma escola vinculada à rede');
      console.log('   3. Crie alunos na escola');
      console.log('   4. Crie PEIs para os alunos');
      console.log('   5. Execute o script de geração de PDFs novamente\n');
    } else if ((activePeis?.length || 0) === 0 && (allPeis?.length || 0) > 0) {
      console.log('⚠️  PEIs EXISTEM MAS NENHUM ESTÁ ATIVO');
      console.log('💡 Possível problema com coluna is_active_version');
      console.log('   Execute a migração que adiciona esta coluna\n');
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
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

function getStatusIcon(status) {
  const icons = {
    draft: '📝',
    pending: '⏳',
    approved: '✅',
    returned: '🔙',
    validated: '✔️',
  };
  return icons[status] || '📄';
}

diagnosticar();

