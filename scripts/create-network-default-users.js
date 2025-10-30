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

// Configurações - usar Service Role Key para poder criar usuários
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  console.error('📝 Configure no arquivo .env:');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Configuração das redes e seus usuários padrão
const networksConfig = [
  {
    networkName: 'São Gonçalo dos Campos',
    tenantId: '62d992ab-ef6b-4d13-b9c9-6cdfdcb59451',
    suffix: 'SGC',
    users: [
      {
        email: 'admin@sgc.edu.br',
        full_name: 'Administrador SGC',
        role: 'education_secretary',
        password: 'SGC@123456'
      },
      {
        email: 'coord@sgc.edu.br',
        full_name: 'Coordenador SGC',
        role: 'coordinator',
        password: 'SGC@123456'
      }
    ]
  },
  {
    networkName: 'Santanópolis',
    tenantId: '08f6772d-97ae-43bf-949d-bed4c6c038de',
    suffix: 'SAN',
    users: [
      {
        email: 'admin@sant.edu.br',
        full_name: 'Administrador SAN',
        role: 'education_secretary',
        password: 'SAN@123456'
      },
      {
        email: 'coord@sant.edu.br',
        full_name: 'Coordenador SAN',
        role: 'coordinator',
        password: 'SAN@123456'
      }
    ]
  },
  {
    networkName: 'Santa Bárbara',
    tenantId: '77d9af39-0f4d-4702-9692-62277e13e42e',
    suffix: 'SBA',
    users: [
      {
        email: 'admin@sba.edu.br',
        full_name: 'Administrador SBA',
        role: 'education_secretary',
        password: 'SBA@123456'
      },
      {
        email: 'coord@sba.edu.br',
        full_name: 'Coordenador SBA',
        role: 'coordinator',
        password: 'SBA@123456'
      }
    ]
  }
];

async function createNetworksAndUsers() {
  console.log('🏛️ Criando redes de ensino e usuários padrão...\n');

  try {
    for (const networkConfig of networksConfig) {
      console.log(`\n📚 Processando rede: ${networkConfig.networkName}`);
      
      // 1. Verificar se a rede já existe
      let tenant = null;
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', networkConfig.tenantId)
        .single();

      if (existingTenant) {
        console.log(`✅ Rede já existe: ${networkConfig.networkName} (${networkConfig.tenantId})`);
        tenant = existingTenant;
      } else {
        // Criar a rede
        console.log(`➕ Criando rede: ${networkConfig.networkName}`);
        const { data: newTenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            id: networkConfig.tenantId,
            network_name: networkConfig.networkName,
            is_active: true
          })
          .select()
          .single();

        if (tenantError) {
          console.error(`❌ Erro ao criar rede ${networkConfig.networkName}:`, tenantError.message);
          continue;
        }

        console.log(`✅ Rede criada: ${networkConfig.networkName}`);
        tenant = newTenant;
      }

      // 2. Criar usuários para esta rede
      console.log(`👥 Criando usuários padrão para ${networkConfig.networkName}...`);
      
      for (const userConfig of networkConfig.users) {
        // Verificar se o usuário já existe
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('tenant_id', networkConfig.tenantId)
          .eq('full_name', userConfig.full_name)
          .single();

        if (existingUser) {
          console.log(`⏭️  Usuário já existe: ${userConfig.full_name}`);
          continue;
        }

        try {
          // Criar usuário no auth
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: userConfig.email,
            password: userConfig.password,
            email_confirm: true,
            user_metadata: {
              full_name: userConfig.full_name,
              tenant_id: networkConfig.tenantId
            }
          });

          if (authError) {
            console.error(`❌ Erro ao criar usuário de autenticação para ${userConfig.email}:`, authError.message);
            continue;
          }

          // Criar perfil
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              full_name: userConfig.full_name,
              tenant_id: networkConfig.tenantId,
              is_active: true
            });

          if (profileError) {
            console.error(`❌ Erro ao criar perfil para ${userConfig.email}:`, profileError.message);
            continue;
          }

          // Criar role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: userConfig.role
            });

          if (roleError) {
            console.error(`❌ Erro ao criar role para ${userConfig.email}:`, roleError.message);
            continue;
          }

          console.log(`✅ Usuário criado: ${userConfig.full_name} (${userConfig.email}) - ${userConfig.role}`);
          
        } catch (error) {
          console.error(`❌ Erro ao processar usuário ${userConfig.email}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Processo concluído com sucesso!');
    console.log('\n📋 Credenciais criadas:\n');
    
    for (const networkConfig of networksConfig) {
      console.log(`\n🏛️ ${networkConfig.networkName} (${networkConfig.suffix}):`);
      networkConfig.users.forEach(user => {
        console.log(`   📧 ${user.email} / ${user.password}`);
        console.log(`   👤 ${user.full_name} (${user.role})`);
      });
    }
    
    console.log('\n💡 Você pode agora:');
    console.log('   1. Importar as escolas via CSV para cada rede');
    console.log('   2. Criar diretores e professores para cada escola');
    console.log('   3. Vincular alunos às escolas\n');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error(error);
  }
}

// Executar criação
createNetworksAndUsers();

