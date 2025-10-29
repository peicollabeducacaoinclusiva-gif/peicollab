import { createClient } from '@supabase/supabase-js';

// Configurações
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (supabaseUrl === 'https://your-project.supabase.co' || supabaseServiceKey === 'your-service-role-key') {
  console.log('❌ Configure as variáveis de ambiente:');
  console.log('VITE_SUPABASE_URL=your-project-url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.log('\n🔧 Ou execute diretamente no Supabase Dashboard:');
  console.log('1. Vá para SQL Editor');
  console.log('2. Execute o script SQL abaixo');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function populateUserRoles() {
  console.log('🔧 Populando tabela user_roles...\n');

  try {
    // 1. Verificar se há profiles existentes
    console.log('1. Verificando profiles existentes...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, tenant_id, school_id')
      .limit(10);

    if (profilesError) {
      console.log('❌ Erro ao buscar profiles:', profilesError.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ Nenhum profile encontrado. Criando usuários de teste...');
      await createTestUsers();
      return;
    }

    console.log(`📊 Encontrados ${profiles.length} profiles`);

    // 2. Verificar se há coluna role na tabela profiles
    console.log('\n2. Verificando coluna role em profiles...');
    const { data: profileWithRole, error: roleError } = await supabase
      .from('profiles')
      .select('id, role')
      .limit(1);

    if (roleError && roleError.message.includes('column "role" does not exist')) {
      console.log('✅ Coluna role já foi removida - migração já foi feita');
    } else if (profileWithRole && profileWithRole[0]?.role) {
      console.log('⚠️ Coluna role ainda existe - migrando dados...');
      await migrateExistingRoles(profiles);
    } else {
      console.log('📝 Criando roles padrão para profiles existentes...');
      await createDefaultRoles(profiles);
    }

    // 3. Verificar resultado
    console.log('\n3. Verificando resultado...');
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(10);

    if (userRolesError) {
      console.log('❌ Erro ao verificar user_roles:', userRolesError.message);
      return;
    }

    console.log(`✅ ${userRoles.length} roles criados na tabela user_roles`);

    // 4. Mostrar estatísticas
    const { data: roleStats } = await supabase
      .from('user_roles')
      .select('role')
      .then(({ data }) => {
        const stats = {};
        data?.forEach(r => {
          stats[r.role] = (stats[r.role] || 0) + 1;
        });
        return { data: stats };
      });

    console.log('\n📊 Estatísticas de roles:');
    Object.entries(roleStats || {}).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} usuários`);
    });

    console.log('\n🎉 Tabela user_roles populada com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Reinicie a aplicação');
    console.log('2. Teste o login no admin');
    console.log('3. Verifique se os dashboards estão funcionando');

  } catch (error) {
    console.error('❌ Erro durante a população:', error.message);
  }
}

async function migrateExistingRoles(profiles) {
  console.log('🔄 Migrando roles existentes...');
  
  for (const profile of profiles) {
    if (profile.role) {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.id,
          role: profile.role
        });

      if (error) {
        console.log(`❌ Erro ao migrar role para ${profile.full_name}:`, error.message);
      } else {
        console.log(`✅ Role '${profile.role}' migrado para ${profile.full_name}`);
      }
    }
  }
}

async function createDefaultRoles(profiles) {
  console.log('📝 Criando roles padrão...');
  
  for (const profile of profiles) {
    // Determinar role baseado na estrutura do perfil
    let defaultRole = 'teacher'; // Role padrão
    
    // Se tem tenant_id direto, provavelmente é education_secretary
    if (profile.tenant_id && !profile.school_id) {
      defaultRole = 'education_secretary';
    }
    // Se tem school_id, pode ser school_director ou teacher
    else if (profile.school_id) {
      // Verificar se é o primeiro usuário da escola (provavelmente diretor)
      const { data: schoolUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: true })
        .limit(1);
      
      if (schoolUsers && schoolUsers[0]?.id === profile.id) {
        defaultRole = 'school_director';
      } else {
        defaultRole = 'teacher';
      }
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: profile.id,
        role: defaultRole
      });

    if (error) {
      console.log(`❌ Erro ao criar role para ${profile.full_name}:`, error.message);
    } else {
      console.log(`✅ Role '${defaultRole}' criado para ${profile.full_name}`);
    }
  }
}

async function createTestUsers() {
  console.log('🧪 Criando usuários de teste...');
  
  const testUsers = [
    {
      email: 'admin@teste.com',
      full_name: 'Administrador Sistema',
      role: 'superadmin',
      tenant_id: null,
      school_id: null
    },
    {
      email: 'secretario@teste.com',
      full_name: 'Secretário de Educação',
      role: 'education_secretary',
      tenant_id: 'test-tenant-id', // Será criado
      school_id: null
    },
    {
      email: 'diretor@teste.com',
      full_name: 'Diretor da Escola',
      role: 'school_director',
      tenant_id: null,
      school_id: 'test-school-id' // Será criado
    },
    {
      email: 'professor@teste.com',
      full_name: 'Professor da Escola',
      role: 'teacher',
      tenant_id: null,
      school_id: 'test-school-id'
    }
  ];

  for (const user of testUsers) {
    // Criar usuário no auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'Teste123',
      email_confirm: true,
      user_metadata: {
        full_name: user.full_name
      }
    });

    if (authError) {
      console.log(`❌ Erro ao criar usuário ${user.email}:`, authError.message);
      continue;
    }

    // Criar profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        full_name: user.full_name,
        tenant_id: user.tenant_id,
        school_id: user.school_id,
        is_active: true
      });

    if (profileError) {
      console.log(`❌ Erro ao criar profile para ${user.email}:`, profileError.message);
      continue;
    }

    // Criar role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        role: user.role
      });

    if (roleError) {
      console.log(`❌ Erro ao criar role para ${user.email}:`, roleError.message);
    } else {
      console.log(`✅ Usuário de teste criado: ${user.email} (${user.role})`);
    }
  }
}

// Executar população
populateUserRoles();


