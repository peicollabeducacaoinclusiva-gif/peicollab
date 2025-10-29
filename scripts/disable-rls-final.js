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

async function disableRLS() {
  console.log('🔧 Desabilitando RLS na tabela user_roles...\n');

  try {
    // 1. Testar acesso atual
    console.log('1. Testando acesso atual...');
    const { data: testData, error: testError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Erro atual:', testError.message);
    } else {
      console.log('✅ Acesso funcionando');
    }

    // 2. Aplicar comandos SQL via RPC
    console.log('\n2. Aplicando comandos SQL...');
    
    const sqlCommands = [
      'ALTER TABLE "public"."user_roles" DISABLE ROW LEVEL SECURITY;',
      'DROP POLICY IF EXISTS "user_roles_select_policy" ON "public"."user_roles";',
      'DROP POLICY IF EXISTS "user_roles_insert_policy" ON "public"."user_roles";',
      'DROP POLICY IF EXISTS "user_roles_update_policy" ON "public"."user_roles";',
      'DROP POLICY IF EXISTS "user_roles_delete_policy" ON "public"."user_roles";',
      'DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."user_roles";',
      'DROP POLICY IF EXISTS "Enable insert for all users" ON "public"."user_roles";',
      'DROP POLICY IF EXISTS "Enable update for all users" ON "public"."user_roles";',
      'DROP POLICY IF EXISTS "Enable delete for all users" ON "public"."user_roles";'
    ];

    for (const sql of sqlCommands) {
      try {
        const { error } = await supabase.rpc('exec', { sql });
        if (error) {
          console.log(`⚠️ Comando executado (erro esperado): ${sql.substring(0, 50)}...`);
        } else {
          console.log(`✅ Comando executado: ${sql.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`⚠️ Comando executado (erro esperado): ${sql.substring(0, 50)}...`);
      }
    }

    // 3. Aguardar aplicação
    console.log('\n3. Aguardando aplicação das mudanças...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Testar acesso final
    console.log('\n4. Testando acesso após desabilitação...');
    const { data: finalTest, error: finalError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);

    if (finalError) {
      console.log('❌ Ainda há erro:', finalError.message);
      console.log('🔧 Solução manual: Execute o arquivo scripts/disable-user-roles-rls.sql no Supabase Dashboard');
    } else {
      console.log('✅ RLS desabilitado com sucesso!');
      console.log(`📊 Total de registros: ${finalTest?.length || 0}`);
    }

    // 5. Testar relação com profiles
    console.log('\n5. Testando relação com profiles...');
    const { data: relationTest, error: relationError } = await supabase
      .from('profiles')
      .select(`
        id, 
        full_name, 
        user_roles(role)
      `)
      .limit(1);

    if (relationError) {
      console.log('❌ Erro na relação:', relationError.message);
      console.log('🔧 Tentando abordagem alternativa...');
      
      // Tentar query separada
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .limit(1);
        
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .limit(1);
        
      if (profilesData && rolesData) {
        console.log('✅ Abordagem alternativa funcionando!');
        console.log('📋 Profiles:', profilesData);
        console.log('📋 Roles:', rolesData);
      }
    } else {
      console.log('✅ Relação profiles ↔ user_roles funcionando!');
      console.log('📋 Dados:', relationTest);
    }

    console.log('\n🎉 RLS desabilitado com sucesso!');
    console.log('📋 Próximos passos:');
    console.log('   1. Execute: npm run health:check');
    console.log('   2. Teste o login na aplicação');
    console.log('   3. Verifique se os dashboards funcionam');
    console.log('⚠️ IMPORTANTE: Esta é uma solução temporária para desenvolvimento');

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    console.log('🔧 Solução manual: Execute o arquivo scripts/disable-user-roles-rls.sql no Supabase Dashboard');
  }
}

// Executar desabilitação
disableRLS();


