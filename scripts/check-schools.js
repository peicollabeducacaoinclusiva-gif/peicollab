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

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchools() {
  console.log('🔍 Verificando escolas no banco de dados...\n');

  try {
    const { data, error } = await supabase
      .from('schools')
      .select('id, school_name, tenant_id, is_active')
      .order('school_name');

    if (error) {
      console.error('❌ Erro ao buscar escolas:', error.message);
      return;
    }

    console.log(`📊 Encontradas ${data?.length || 0} escolas:\n`);
    
    if (!data || data.length === 0) {
      console.log('⚠️ Nenhuma escola encontrada no banco de dados');
    } else {
      data.forEach((school, index) => {
        console.log(`${index + 1}. ${school.school_name}`);
        console.log(`   Tenant: ${school.tenant_id}`);
        console.log(`   Status: ${school.is_active ? 'Ativa' : 'Inativa'}`);
        console.log('');
      });
    }

    // Verificar tenants
    console.log('\n🔍 Verificando redes (tenants)...\n');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, network_name')
      .order('network_name');

    if (tenantsError) {
      console.error('❌ Erro ao buscar tenants:', tenantsError.message);
    } else {
      console.log(`📊 Encontradas ${tenants?.length || 0} redes:\n`);
      tenants?.forEach((tenant, index) => {
        console.log(`${index + 1}. ${tenant.network_name} (${tenant.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkSchools();

