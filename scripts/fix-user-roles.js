import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configurações
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (supabaseUrl === 'https://your-project.supabase.co' || supabaseServiceKey === 'your-service-role-key') {
  console.log('❌ Configure as variáveis de ambiente:');
  console.log('VITE_SUPABASE_URL=your-project-url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserRoles() {
  console.log('🔧 Corrigindo relação user_roles...\n');

  try {
    // 1. Verificar se a tabela user_roles existe
    console.log('1. Verificando tabela user_roles...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_roles');

    if (tablesError) {
      console.log('❌ Erro ao verificar tabelas:', tablesError.message);
      return;
    }

    if (tables.length === 0) {
      console.log('⚠️ Tabela user_roles não existe. Aplicando migração...');
      
      // Ler e executar a migração
      const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250113000002_fix_user_roles_relationship.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
      
      if (migrationError) {
        console.log('❌ Erro ao aplicar migração:', migrationError.message);
        return;
      }
      
      console.log('✅ Migração aplicada com sucesso!');
    } else {
      console.log('✅ Tabela user_roles já existe');
    }

    // 2. Verificar se há dados na tabela user_roles
    console.log('\n2. Verificando dados na tabela user_roles...');
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(5);

    if (userRolesError) {
      console.log('❌ Erro ao verificar user_roles:', userRolesError.message);
      return;
    }

    console.log(`📊 Encontrados ${userRoles.length} registros em user_roles`);

    // 3. Verificar se há profiles sem user_roles
    console.log('\n3. Verificando profiles sem user_roles...');
    const { data: profilesWithoutRoles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .not('id', 'in', `(SELECT user_id FROM user_roles)`);

    if (profilesError) {
      console.log('❌ Erro ao verificar profiles:', profilesError.message);
      return;
    }

    if (profilesWithoutRoles.length > 0) {
      console.log(`⚠️ Encontrados ${profilesWithoutRoles.length} profiles sem user_roles`);
      console.log('📝 Criando roles padrão para profiles sem roles...');
      
      // Criar role padrão 'teacher' para profiles sem roles
      for (const profile of profilesWithoutRoles) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: profile.id,
            role: 'teacher'
          });

        if (insertError) {
          console.log(`❌ Erro ao criar role para ${profile.full_name}:`, insertError.message);
        } else {
          console.log(`✅ Role 'teacher' criado para ${profile.full_name}`);
        }
      }
    } else {
      console.log('✅ Todos os profiles têm user_roles');
    }

    // 4. Testar função RPC
    console.log('\n4. Testando função RPC get_user_primary_role...');
    const { data: testUser } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (testUser) {
      const { data: primaryRole, error: rpcError } = await supabase
        .rpc('get_user_primary_role', { _user_id: testUser.id });

      if (rpcError) {
        console.log('❌ Erro ao testar RPC:', rpcError.message);
      } else {
        console.log(`✅ RPC funcionando! Role principal: ${primaryRole}`);
      }
    }

    // 5. Verificar relação profiles -> user_roles
    console.log('\n5. Testando relação profiles -> user_roles...');
    const { data: profileWithRoles, error: relationError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        user_roles(role)
      `)
      .limit(1);

    if (relationError) {
      console.log('❌ Erro na relação profiles -> user_roles:', relationError.message);
      console.log('🔧 Tentando corrigir a relação...');
      
      // Aplicar migração de correção
      const fixMigrationSQL = `
        -- Recriar a relação
        DROP VIEW IF EXISTS "public"."profiles_with_legacy_role";
        
        CREATE OR REPLACE VIEW "public"."profiles_with_legacy_role" AS
        SELECT 
          p.*,
          (SELECT ur.role FROM "public"."user_roles" ur WHERE ur.user_id = p.id ORDER BY ur.role LIMIT 1) as legacy_role
        FROM "public"."profiles" p;
      `;
      
      const { error: fixError } = await supabase.rpc('exec_sql', { sql: fixMigrationSQL });
      
      if (fixError) {
        console.log('❌ Erro ao corrigir relação:', fixError.message);
      } else {
        console.log('✅ Relação corrigida!');
      }
    } else {
      console.log('✅ Relação profiles -> user_roles funcionando!');
      console.log(`📊 Profile: ${profileWithRoles[0]?.full_name}, Roles: ${profileWithRoles[0]?.user_roles?.map(r => r.role).join(', ')}`);
    }

    console.log('\n🎉 Correção de user_roles concluída com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Reinicie a aplicação');
    console.log('2. Teste o login no admin');
    console.log('3. Verifique se os dashboards estão funcionando');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
    process.exit(1);
  }
}

// Executar correção
fixUserRoles();


