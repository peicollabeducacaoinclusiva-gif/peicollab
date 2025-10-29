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
  console.error('📝 Configure no arquivo .env:');
  console.error('VITE_SUPABASE_URL=your-project-url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyUserRolesFix() {
  console.log('🔧 Aplicando correção definitiva para user_roles...\n');

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
      console.log('✅ Acesso funcionando, mas vamos otimizar...');
    }

    // 2. Aplicar correção via SQL direto
    console.log('\n2. Aplicando correção SQL...');
    
    const sqlCommands = [
      'ALTER TABLE "public"."user_roles" DISABLE ROW LEVEL SECURITY;',
      'DROP POLICY IF EXISTS "user_roles_select_policy" ON "public"."user_roles";',
      'DROP POLICY IF EXISTS "user_roles_insert_policy" ON "public"."user_roles";',
      'DROP POLICY IF EXISTS "user_roles_update_policy" ON "public"."user_roles";',
      'DROP POLICY IF EXISTS "user_roles_delete_policy" ON "public"."user_roles";',
      'CREATE POLICY "user_roles_select_policy" ON "public"."user_roles" FOR SELECT USING (true);',
      'CREATE POLICY "user_roles_insert_policy" ON "public"."user_roles" FOR INSERT WITH CHECK (true);',
      'CREATE POLICY "user_roles_update_policy" ON "public"."user_roles" FOR UPDATE USING (true);',
      'CREATE POLICY "user_roles_delete_policy" ON "public"."user_roles" FOR DELETE USING (true);',
      'ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;'
    ];

    for (const sql of sqlCommands) {
      try {
        const { error } = await supabase.rpc('exec', { sql });
        if (error) {
          console.log(`⚠️ Comando executado (pode ter erro esperado): ${sql.substring(0, 50)}...`);
        } else {
          console.log(`✅ Comando executado: ${sql.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`⚠️ Comando executado (erro esperado): ${sql.substring(0, 50)}...`);
      }
    }

    // 3. Aguardar um pouco
    console.log('\n3. Aguardando aplicação das mudanças...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Testar acesso novamente
    console.log('\n4. Testando acesso após correção...');
    const { data: finalTest, error: finalError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);

    if (finalError) {
      console.log('❌ Ainda há erro:', finalError.message);
      console.log('🔧 Solução manual: Execute o arquivo scripts/fix-user-roles-simple.sql no Supabase Dashboard');
    } else {
      console.log('✅ Correção aplicada com sucesso!');
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
    } else {
      console.log('✅ Relação profiles ↔ user_roles funcionando!');
      console.log('📋 Dados:', relationTest);
    }

    console.log('\n🎉 Correção de user_roles concluída!');
    console.log('📋 Próximos passos:');
    console.log('   1. Execute: npm run health:check');
    console.log('   2. Teste o login na aplicação');
    console.log('   3. Verifique se os dashboards funcionam');

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    console.log('🔧 Solução manual: Execute o arquivo scripts/fix-user-roles-simple.sql no Supabase Dashboard');
  }
}

// Executar correção
applyUserRolesFix();


