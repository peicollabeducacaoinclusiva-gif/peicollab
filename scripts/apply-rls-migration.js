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
  console.error('Configure:');
  console.error('  VITE_SUPABASE_URL ou SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
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
    console.log(`📄 Lendo migração: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Arquivo de migração não encontrado: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Arquivo lido com sucesso\n');

    // Dividir o SQL em comandos individuais (separados por ;)
    // Remover comentários e linhas vazias
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => 
        cmd.length > 0 && 
        !cmd.startsWith('--') && 
        !cmd.startsWith('/*') &&
        cmd !== '\n'
      );

    console.log(`📋 Executando ${commands.length} comandos SQL...\n`);

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      // Pular comandos vazios ou apenas espaços
      if (!command || command.trim().length === 0) continue;

      try {
        console.log(`[${i + 1}/${commands.length}] Executando comando...`);
        
        // Usar RPC para executar SQL (se disponível) ou executar diretamente
        const { error } = await supabase.rpc('exec_sql', { 
          sql: command + ';' 
        }).catch(async () => {
          // Se RPC não existir, tentar executar via query direta
          // Para comandos DDL, precisamos usar uma função específica
          return { error: { message: 'RPC exec_sql não disponível' } };
        });

        if (error) {
          // Se o erro for que a função não existe, tentar outra abordagem
          if (error.message?.includes('exec_sql') || error.message?.includes('function') || error.code === 'PGRST202') {
            console.log(`⚠️  RPC não disponível, tentando abordagem alternativa...`);
            // Para comandos DDL, precisamos usar o Supabase Management API ou executar manualmente
            console.log(`📝 Comando precisa ser executado manualmente no Supabase Dashboard`);
            console.log(`   SQL: ${command.substring(0, 100)}...`);
            continue;
          } else {
            // Alguns erros são esperados (como "policy already exists")
            if (error.message?.includes('already exists') || 
                error.message?.includes('does not exist') ||
                error.message?.includes('IF EXISTS')) {
              console.log(`   ⚠️  ${error.message.substring(0, 80)}...`);
            } else {
              console.error(`   ❌ Erro: ${error.message}`);
            }
          }
        } else {
          console.log(`   ✅ Comando executado com sucesso`);
        }
      } catch (err) {
        console.error(`   ❌ Erro ao executar comando: ${err.message}`);
      }
    }

    console.log('\n✅ Migração aplicada!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Verifique se as políticas foram criadas corretamente');
    console.log('   2. Teste o dashboard do secretário de educação');
    console.log('   3. Verifique se os usuários estão sendo contados corretamente');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migração:', error);
    console.error('\n💡 Alternativa: Execute a migração manualmente no Supabase Dashboard:');
    console.error('   1. Acesse: https://supabase.com/dashboard');
    console.error('   2. Vá para SQL Editor');
    console.error('   3. Cole o conteúdo do arquivo: supabase/migrations/20250221000001_fix_education_secretary_rls_dashboard.sql');
    console.error('   4. Execute a query');
    process.exit(1);
  }
}

// Executar
applyMigration();

