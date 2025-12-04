// Script para Listar Redes e Escolas
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fximylewmvsllkdczovj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY0NzIsImV4cCI6MjA3NzI3MjQ3Mn0.3FqQqUfVgD3hIh1daa3R1JjouGZ4D4ONR6SmcL9Qids';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listarRedes() {
  console.log('🔍 Listando todas as redes cadastradas...\n');

  try {
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, network_name, network_email, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!tenants || tenants.length === 0) {
      console.log('⚠️  Nenhuma rede encontrada no banco de dados');
      return;
    }

    console.log(`📊 Total de redes: ${tenants.length}\n`);
    console.log('═══════════════════════════════════════════════════');

    for (const tenant of tenants) {
      console.log(`\n🏛️  ${tenant.network_name}`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Email: ${tenant.network_email || 'Não informado'}`);
      console.log(`   Status: ${tenant.is_active ? '✅ Ativo' : '❌ Inativo'}`);
      console.log(`   Criado em: ${new Date(tenant.created_at).toLocaleDateString('pt-BR')}`);

      // Buscar escolas da rede
      const { data: schools } = await supabase
        .from('schools')
        .select('id, school_name, is_active')
        .eq('tenant_id', tenant.id);

      if (schools && schools.length > 0) {
        console.log(`   🏫 Escolas: ${schools.length}`);
        schools.forEach((school, idx) => {
          console.log(`      ${idx + 1}. ${school.school_name} ${school.is_active ? '✅' : '❌'}`);
        });
      } else {
        console.log('   🏫 Escolas: 0 (nenhuma escola cadastrada)');
      }

      // Buscar PEIs ativos da rede
      if (schools && schools.length > 0) {
        const schoolIds = schools.map((s) => s.id);
        const { data: peis } = await supabase
          .from('peis')
          .select('id, status')
          .in('school_id', schoolIds)
          .eq('is_active_version', true);

        console.log(`   📄 PEIs Ativos: ${peis?.length || 0}`);

        if (peis && peis.length > 0) {
          const byStatus = peis.reduce((acc, pei) => {
            acc[pei.status] = (acc[pei.status] || 0) + 1;
            return acc;
          }, {});

          Object.entries(byStatus).forEach(([status, count]) => {
            console.log(`      ${getStatusIcon(status)} ${getStatusLabel(status)}: ${count}`);
          });
        }
      }

      console.log('═══════════════════════════════════════════════════');
    }

    console.log('\n✅ Listagem concluída!\n');
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

listarRedes();

