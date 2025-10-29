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

async function fixUserRolesRLS() {
  console.log('🔧 Corrigindo políticas RLS para user_roles...\n');

  try {
    // 1. Desabilitar RLS temporariamente
    console.log('1. Desabilitando RLS temporariamente...');
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "public"."user_roles" DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableError) {
      console.log('⚠️ RLS já estava desabilitado ou erro:', disableError.message);
    } else {
      console.log('✅ RLS desabilitado');
    }

    // 2. Remover políticas existentes
    console.log('\n2. Removendo políticas existentes...');
    const policies = [
      'user_roles_select_policy',
      'user_roles_insert_policy', 
      'user_roles_update_policy',
      'user_roles_delete_policy'
    ];

    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${policy}" ON "public"."user_roles";`
      });
      
      if (error) {
        console.log(`⚠️ Política ${policy} não existia ou erro:`, error.message);
      } else {
        console.log(`✅ Política ${policy} removida`);
      }
    }

    // 3. Criar novas políticas
    console.log('\n3. Criando novas políticas RLS...');
    
    const newPolicies = [
      {
        name: 'user_roles_select_policy',
        sql: `CREATE POLICY "user_roles_select_policy" ON "public"."user_roles"
              FOR SELECT
              USING (auth.uid() = user_id);`
      },
      {
        name: 'user_roles_insert_policy',
        sql: `CREATE POLICY "user_roles_insert_policy" ON "public"."user_roles"
              FOR INSERT
              WITH CHECK (
                  EXISTS (
                      SELECT 1 FROM "public"."user_roles" ur
                      WHERE ur.user_id = auth.uid()
                      AND ur.role = 'superadmin'
                  )
              );`
      },
      {
        name: 'user_roles_update_policy',
        sql: `CREATE POLICY "user_roles_update_policy" ON "public"."user_roles"
              FOR UPDATE
              USING (
                  EXISTS (
                      SELECT 1 FROM "public"."user_roles" ur
                      WHERE ur.user_id = auth.uid()
                      AND ur.role = 'superadmin'
                  )
              );`
      },
      {
        name: 'user_roles_delete_policy',
        sql: `CREATE POLICY "user_roles_delete_policy" ON "public"."user_roles"
              FOR DELETE
              USING (
                  EXISTS (
                      SELECT 1 FROM "public"."user_roles" ur
                      WHERE ur.user_id = auth.uid()
                      AND ur.role = 'superadmin'
                  )
              );`
      }
    ];

    for (const policy of newPolicies) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: policy.sql
      });
      
      if (error) {
        console.log(`❌ Erro ao criar política ${policy.name}:`, error.message);
      } else {
        console.log(`✅ Política ${policy.name} criada`);
      }
    }

    // 4. Habilitar RLS novamente
    console.log('\n4. Habilitando RLS novamente...');
    const { error: enableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;'
    });
    
    if (enableError) {
      console.log('❌ Erro ao habilitar RLS:', enableError.message);
    } else {
      console.log('✅ RLS habilitado');
    }

    // 5. Testar acesso
    console.log('\n5. Testando acesso à tabela user_roles...');
    const { data, error: testError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Erro ao testar acesso:', testError.message);
    } else {
      console.log('✅ Acesso à tabela user_roles funcionando');
      console.log(`📊 Total de registros encontrados: ${data?.length || 0}`);
    }

    console.log('\n🎉 Correção de RLS concluída com sucesso!');
    console.log('📋 Próximos passos:');
    console.log('   1. Execute: npm run health:check');
    console.log('   2. Teste o login no admin');
    console.log('   3. Verifique se os dashboards funcionam');

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    process.exit(1);
  }
}

// Executar correção
fixUserRolesRLS();


