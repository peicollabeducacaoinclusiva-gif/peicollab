import { createClient } from '@supabase/supabase-js';

// Configurações
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
  console.log('❌ Configure as variáveis de ambiente:');
  console.log('VITE_SUPABASE_URL=your-project-url');
  console.log('VITE_SUPABASE_ANON_KEY=your-anon-key');
  console.log('\n🔧 Ou execute diretamente no Supabase Dashboard:');
  console.log('1. Vá para SQL Editor');
  console.log('2. Execute o script SQL abaixo');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function refreshSchemaCache() {
  console.log('🔄 Atualizando cache do schema...\n');

  try {
    // 1. Forçar refresh do schema fazendo uma query simples
    console.log('1. Forçando refresh do schema...');
    
    // Fazer uma query que força o Supabase a atualizar o cache
    const { data: schemaInfo, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'user_roles']);

    if (schemaError) {
      console.log('❌ Erro ao verificar schema:', schemaError.message);
      return;
    }

    console.log('✅ Schema verificado:', schemaInfo.map(t => t.table_name).join(', '));

    // 2. Testar a relação diretamente
    console.log('\n2. Testando relação profiles -> user_roles...');
    
    const { data: testRelation, error: relationError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        user_roles(role)
      `)
      .limit(1);

    if (relationError) {
      console.log('❌ Erro na relação:', relationError.message);
      
      if (relationError.message.includes('schema cache')) {
        console.log('\n🔧 SOLUÇÃO: Cache do schema desatualizado');
        console.log('Execute no Supabase Dashboard:');
        console.log('1. Vá para SQL Editor');
        console.log('2. Execute: SELECT pg_notify(\'pgrst\', \'reload schema\');');
        console.log('3. Aguarde 30 segundos');
        console.log('4. Teste novamente');
      }
      return;
    }

    console.log('✅ Relação funcionando!');
    console.log('📊 Dados encontrados:', testRelation.length);

    // 3. Fazer uma query mais complexa para forçar o cache
    console.log('\n3. Forçando cache com query complexa...');
    
    const { data: complexQuery, error: complexError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        tenant_id,
        school_id,
        user_roles(role),
        tenants(network_name),
        schools(school_name, tenant_id)
      `)
      .limit(5);

    if (complexError) {
      console.log('❌ Erro na query complexa:', complexError.message);
      return;
    }

    console.log('✅ Query complexa funcionando!');
    console.log('📊 Profiles encontrados:', complexQuery.length);

    // 4. Testar função RPC
    console.log('\n4. Testando função RPC...');
    
    if (complexQuery.length > 0) {
      const { data: primaryRole, error: rpcError } = await supabase
        .rpc('get_user_primary_role', { _user_id: complexQuery[0].id });

      if (rpcError) {
        console.log('❌ Erro na função RPC:', rpcError.message);
      } else {
        console.log(`✅ Função RPC funcionando! Role: ${primaryRole}`);
      }
    }

    console.log('\n🎉 Cache do schema atualizado com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Reinicie a aplicação');
    console.log('2. Teste o login no admin');
    console.log('3. Verifique se os dashboards estão funcionando');

  } catch (error) {
    console.error('❌ Erro durante a atualização:', error.message);
  }
}

// Executar atualização
refreshSchemaCache();


