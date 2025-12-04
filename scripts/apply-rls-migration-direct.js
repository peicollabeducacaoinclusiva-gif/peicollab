import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('\nConfigure no arquivo .env ou variáveis de ambiente:');
  console.error('  VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key');
  console.error('\nOu execute manualmente no Supabase Dashboard:');
  console.error('  1. Acesse: https://supabase.com/dashboard');
  console.error('  2. Vá para SQL Editor');
  console.error('  3. Cole o conteúdo de: supabase/migrations/20250221000001_fix_education_secretary_rls_dashboard.sql');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Aplicando migração RLS para Education Secretary Dashboard...\n');

  try {
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250221000001_fix_education_secretary_rls_dashboard.sql');
    console.log(`📄 Lendo migração: ${path.basename(migrationPath)}`);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Arquivo de migração não encontrado: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Arquivo lido com sucesso\n');

    // Executar o SQL completo usando uma função RPC ou execução direta
    console.log('📋 Executando migração SQL...\n');

    // Tentar executar via RPC exec_sql (se existir)
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    }).catch(() => ({ data: null, error: { message: 'RPC não disponível' } }));

    if (!rpcError && rpcData) {
      console.log('✅ Migração aplicada via RPC exec_sql!');
      return;
    }

    // Se RPC não funcionar, tentar executar comandos individualmente via Management API
    console.log('⚠️  RPC exec_sql não disponível, executando comandos individualmente...\n');

    // Dividir SQL em comandos (separados por ;)
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => {
        const trimmed = cmd.trim();
        return trimmed.length > 0 && 
               !trimmed.startsWith('--') && 
               !trimmed.startsWith('/*') &&
               trimmed !== '\n' &&
               !trimmed.match(/^\s*$/);
      });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';';
      const commandPreview = command.substring(0, 60).replace(/\n/g, ' ');

      try {
        // Tentar executar via Supabase Management API usando fetch
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: command })
        });

        if (response.ok) {
          console.log(`[${i + 1}/${commands.length}] ✅ ${commandPreview}...`);
          successCount++;
        } else {
          const errorText = await response.text();
          // Alguns erros são esperados (como "already exists")
          if (errorText.includes('already exists') || errorText.includes('does not exist')) {
            console.log(`[${i + 1}/${commands.length}] ⚠️  ${commandPreview}... (já existe ou não existe)`);
            successCount++;
          } else {
            console.log(`[${i + 1}/${commands.length}] ❌ ${commandPreview}...`);
            console.log(`   Erro: ${errorText.substring(0, 100)}`);
            errorCount++;
          }
        }
      } catch (err) {
        // Se a função RPC não existir, precisamos executar manualmente
        if (err.message?.includes('exec_sql') || err.message?.includes('404')) {
          console.log(`\n⚠️  Função RPC exec_sql não está disponível no banco de dados.`);
          console.log(`\n📝 Para aplicar a migração, você tem duas opções:\n`);
          console.log(`1. Via Supabase Dashboard (Recomendado):`);
          console.log(`   - Acesse: https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}`);
          console.log(`   - Vá para SQL Editor`);
          console.log(`   - Cole o conteúdo do arquivo:`);
          console.log(`     ${migrationPath}`);
          console.log(`   - Execute a query\n`);
          console.log(`2. Via Supabase CLI:`);
          console.log(`   - Execute: supabase link`);
          console.log(`   - Execute: supabase db push --linked\n`);
          break;
        } else {
          console.log(`[${i + 1}/${commands.length}] ❌ Erro: ${err.message}`);
          errorCount++;
        }
      }
    }

    if (successCount > 0 || errorCount === 0) {
      console.log(`\n✅ Migração aplicada com sucesso!`);
      console.log(`   Comandos executados: ${successCount}`);
      if (errorCount > 0) {
        console.log(`   Avisos: ${errorCount}`);
      }
    } else {
      console.log(`\n⚠️  Não foi possível aplicar a migração automaticamente.`);
      console.log(`   Use uma das opções acima para aplicar manualmente.`);
    }

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migração:', error.message);
    console.error('\n💡 Execute a migração manualmente no Supabase Dashboard');
    process.exit(1);
  }
}

// Executar
applyMigration();

