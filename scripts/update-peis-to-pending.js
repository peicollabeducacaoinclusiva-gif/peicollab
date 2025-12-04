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

async function updatePEIsStatus() {
  console.log('🔄 Atualizando status dos PEIs para pending_validation...\n');

  try {
    // Atualizar PEIs com status 'pending' para 'pending_validation'
    const { data, error } = await supabase
      .from('peis')
      .update({ status: 'pending_validation' })
      .eq('status', 'pending')
      .select();

    if (error) {
      console.error('❌ Erro ao atualizar PEIs:', error.message);
      return;
    }

    console.log(`✅ ${data?.length || 0} PEIs atualizados de 'pending' para 'pending_validation'`);

    // Listar status dos PEIs
    const { data: allPEIs } = await supabase
      .from('peis')
      .select('id, status');

    if (allPEIs) {
      const statusCount = allPEIs.reduce((acc, pei) => {
        acc[pei.status] = (acc[pei.status] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📊 Distribuição de status dos PEIs:');
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

updatePEIsStatus();

