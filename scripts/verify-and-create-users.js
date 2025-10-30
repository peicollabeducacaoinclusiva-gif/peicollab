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

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const networksConfig = [
  {
    networkName: 'São Gonçalo dos Campos',
    tenantId: '62d992ab-ef6b-4d13-b9c9-6cdfdcb59451',
    users: [
      { email: 'admin@sgc.edu.br', full_name: 'Administrador SGC', role: 'education_secretary', password: 'SGC@123456' },
      { email: 'coord@sgc.edu.br', full_name: 'Coordenador SGC', role: 'coordinator', password: 'SGC@123456' }
    ]
  },
  {
    networkName: 'Santanópolis',
    tenantId: '08f6772d-97ae-43bf-949d-bed4c6c038de',
    users: [
      { email: 'admin@sant.edu.br', full_name: 'Administrador SAN', role: 'education_secretary', password: 'SAN@123456' },
      { email: 'coord@sant.edu.br', full_name: 'Coordenador SAN', role: 'coordinator', password: 'SAN@123456' }
    ]
  },
  {
    networkName: 'Santa Bárbara',
    tenantId: '77d9af39-0f4d-4702-9692-62277e13e42e',
    users: [
      { email: 'admin@sba.edu.br', full_name: 'Administrador SBA', role: 'education_secretary', password: 'SBA@123456' },
      { email: 'coord@sba.edu.br', full_name: 'Coordenador SBA', role: 'coordinator', password: 'SBA@123456' }
    ]
  }
];

async function verifyAndCreateUsers() {
  console.log('🔍 Verificando usuários existentes...\n');

  try {
    const totalUsers = networksConfig.reduce((sum, net) => sum + net.users.length, 0);
    let created = 0;
    let existing = 0;
    let errors = 0;

    for (const networkConfig of networksConfig) {
      console.log(`\n📚 Rede: ${networkConfig.networkName}`);
      
      for (const userConfig of networkConfig.users) {
        // Verificar se já existe por e-mail no auth
        const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
        const userExists = existingAuthUser.users.some(u => u.email === userConfig.email);

        if (userExists) {
          console.log(`  ✅ ${userConfig.email} - já existe`);
          existing++;
          continue;
        }

        console.log(`  ⏳ Criando ${userConfig.email}...`);
        
        // Aguardar 3 segundos para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 3000));

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
            console.log(`  ❌ Erro: ${authError.message}`);
            errors++;
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
            console.log(`  ❌ Erro ao criar perfil: ${profileError.message}`);
            errors++;
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
            console.log(`  ❌ Erro ao criar role: ${roleError.message}`);
            errors++;
            continue;
          }

          console.log(`  ✅ ${userConfig.email} - criado com sucesso`);
          created++;
          
        } catch (error) {
          console.log(`  ❌ Erro: ${error.message}`);
          errors++;
        }
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`   Total: ${totalUsers} usuários`);
    console.log(`   Criados: ${created}`);
    console.log(`   Já existiam: ${existing}`);
    console.log(`   Erros: ${errors}`);
    console.log('\n🎉 Processo concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

verifyAndCreateUsers();

