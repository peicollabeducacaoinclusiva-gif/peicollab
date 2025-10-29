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

// Configurações - usar valores padrão para teste
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

console.log('🔍 Verificando estrutura do banco de dados...\n');

if (supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
  console.log('⚠️ Variáveis de ambiente não configuradas');
  console.log('📝 Configure no arquivo .env:');
  console.log('VITE_SUPABASE_URL=your-project-url');
  console.log('VITE_SUPABASE_ANON_KEY=your-anon-key');
  console.log('\n🔧 Ou execute diretamente no Supabase Dashboard:');
  console.log('1. Vá para SQL Editor');
  console.log('2. Execute a migração: supabase/migrations/20250113000002_fix_user_roles_relationship.sql');
  console.log('3. Verifique se a tabela user_roles foi criada');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseStructure() {
  try {
    console.log('1. Verificando tabela user_roles...');
    
    // Tentar buscar dados da tabela user_roles
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);

    if (userRolesError) {
      console.log('❌ Erro ao acessar user_roles:', userRolesError.message);
      
      if (userRolesError.message.includes('relation "user_roles" does not exist')) {
        console.log('\n🔧 SOLUÇÃO:');
        console.log('1. Execute a migração no Supabase Dashboard:');
        console.log('   - Vá para SQL Editor');
        console.log('   - Cole o conteúdo de: supabase/migrations/20250113000002_fix_user_roles_relationship.sql');
        console.log('   - Execute a query');
        console.log('\n2. Ou execute via CLI:');
        console.log('   supabase db push');
      }
      return;
    }

    console.log('✅ Tabela user_roles existe');

    console.log('\n2. Verificando relação profiles -> user_roles...');
    
    // Tentar fazer join entre profiles e user_roles
    const { data: profilesWithRoles, error: relationError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        user_roles(role)
      `)
      .limit(1);

    if (relationError) {
      console.log('❌ Erro na relação:', relationError.message);
      console.log('\n🔧 SOLUÇÃO:');
      console.log('Execute a migração de correção no Supabase Dashboard');
      return;
    }

    console.log('✅ Relação profiles -> user_roles funcionando');

    console.log('\n3. Verificando função RPC get_user_primary_role...');
    
    // Testar função RPC
    const { data: testProfile } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (testProfile) {
      const { data: primaryRole, error: rpcError } = await supabase
        .rpc('get_user_primary_role', { _user_id: testProfile.id });

      if (rpcError) {
        console.log('❌ Erro na função RPC:', rpcError.message);
        console.log('\n🔧 SOLUÇÃO:');
        console.log('Execute a migração de correção no Supabase Dashboard');
        return;
      }

      console.log(`✅ Função RPC funcionando! Role: ${primaryRole}`);
    }

    console.log('\n🎉 Estrutura do banco está correta!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Reinicie a aplicação');
    console.log('2. Teste o login no admin');
    console.log('3. Verifique se os dashboards estão funcionando');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
  }
}

checkDatabaseStructure();
