#!/usr/bin/env node

/**
 * Script para verificar um usuário específico no banco de dados pelo email
 * Verifica: auth.users, profiles, user_roles, user_tenants, user_schools
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Carregar variáveis de ambiente do arquivo .env
let supabaseUrl, supabaseServiceKey;

try {
  const envPath = join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0 && !key.startsWith('#')) {
      const value = valueParts.join('=').trim();
      if (key === 'VITE_SUPABASE_URL') {
        supabaseUrl = value;
      }
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
        supabaseServiceKey = value;
      }
    }
  });
} catch (error) {
  log('⚠️  Arquivo .env não encontrado, usando variáveis do sistema', 'yellow');
}

supabaseUrl = supabaseUrl || process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
supabaseServiceKey = supabaseServiceKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  log('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!', 'red');
  log('   Configure no arquivo .env ou como variável de ambiente', 'yellow');
  process.exit(1);
}

// Criar cliente com Service Role Key (acesso admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Email a verificar
const emailToCheck = process.argv[2] || 'danielbruno84@gmail.com';

async function checkUserByEmail() {
  log(`\n🔍 Verificando usuário: ${emailToCheck}\n`, 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    // 1. Buscar usuário em auth.users
    log('\n1️⃣  Buscando em auth.users...', 'blue');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      log(`   ❌ Erro ao listar usuários: ${listError.message}`, 'red');
      return;
    }

    const authUser = users.find(u => u.email?.toLowerCase() === emailToCheck.toLowerCase());
    
    if (!authUser) {
      log(`   ❌ Usuário não encontrado em auth.users`, 'red');
      log(`\n   📋 Total de usuários no sistema: ${users.length}`, 'yellow');
      log(`   💡 Verifique se o email está correto: ${emailToCheck}`, 'yellow');
      return;
    }

    log(`   ✅ Usuário encontrado!`, 'green');
    log(`   📧 Email: ${authUser.email}`, 'cyan');
    log(`   🆔 ID: ${authUser.id}`, 'cyan');
    log(`   📅 Criado em: ${authUser.created_at}`, 'cyan');
    log(`   ✉️  Email confirmado: ${authUser.email_confirmed_at ? 'Sim' : 'Não'}`, authUser.email_confirmed_at ? 'green' : 'yellow');
    log(`   🔐 Último login: ${authUser.last_sign_in_at || 'Nunca'}`, 'cyan');
    log(`   🚫 Banned: ${authUser.banned_until ? 'Sim' : 'Não'}`, authUser.banned_until ? 'red' : 'green');

    const userId = authUser.id;

    // 2. Verificar profile
    log('\n2️⃣  Verificando profile...', 'blue');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      log(`   ❌ Erro ao buscar profile: ${profileError.message}`, 'red');
      if (profileError.code === 'PGRST116') {
        log(`   ⚠️  Profile não existe! O usuário precisa ter um perfil criado.`, 'yellow');
      }
    } else {
      log(`   ✅ Profile encontrado!`, 'green');
      log(`   👤 Nome: ${profile.full_name}`, 'cyan');
      log(`   🎭 Role: ${profile.role || 'N/A'}`, 'cyan');
      log(`   ✅ Ativo: ${profile.is_active ? 'Sim' : 'Não'}`, profile.is_active ? 'green' : 'red');
      log(`   🏫 School ID: ${profile.school_id || 'Nenhuma'}`, 'cyan');
      log(`   🏛️  Tenant ID: ${profile.tenant_id || 'Nenhum'}`, 'cyan');
      log(`   📅 Criado em: ${profile.created_at}`, 'cyan');
      log(`   📅 Atualizado em: ${profile.updated_at}`, 'cyan');
    }

    // 3. Verificar user_roles
    log('\n3️⃣  Verificando user_roles...', 'blue');
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role, created_at')
      .eq('user_id', userId);

    if (rolesError) {
      log(`   ❌ Erro ao buscar roles: ${rolesError.message}`, 'red');
    } else if (!userRoles || userRoles.length === 0) {
      log(`   ⚠️  Nenhum role atribuído!`, 'yellow');
    } else {
      log(`   ✅ ${userRoles.length} role(s) encontrado(s):`, 'green');
      userRoles.forEach((ur, index) => {
        log(`   ${index + 1}. ${ur.role} (criado em: ${ur.created_at})`, 'cyan');
      });
    }

    // 4. Verificar user_tenants
    log('\n4️⃣  Verificando user_tenants...', 'blue');
    const { data: userTenants, error: tenantsError } = await supabase
      .from('user_tenants')
      .select(`
        tenant_id,
        created_at,
        tenants (
          id,
          network_name,
          is_active
        )
      `)
      .eq('user_id', userId);

    if (tenantsError) {
      log(`   ❌ Erro ao buscar tenants: ${tenantsError.message}`, 'red');
    } else if (!userTenants || userTenants.length === 0) {
      log(`   ⚠️  Nenhum tenant associado!`, 'yellow');
    } else {
      log(`   ✅ ${userTenants.length} tenant(s) associado(s):`, 'green');
      userTenants.forEach((ut, index) => {
        const tenant = ut.tenants;
        log(`   ${index + 1}. ${tenant?.network_name || 'N/A'} (ID: ${ut.tenant_id})`, 'cyan');
        log(`      Status: ${tenant?.is_active ? 'Ativo' : 'Inativo'}`, tenant?.is_active ? 'green' : 'red');
        log(`      Criado em: ${ut.created_at}`, 'cyan');
      });
    }

    // 5. Verificar user_schools
    log('\n5️⃣  Verificando user_schools...', 'blue');
    const { data: userSchools, error: schoolsError } = await supabase
      .from('user_schools')
      .select(`
        school_id,
        created_at,
        schools (
          id,
          school_name,
          is_active,
          tenant_id
        )
      `)
      .eq('user_id', userId);

    if (schoolsError) {
      log(`   ❌ Erro ao buscar escolas: ${schoolsError.message}`, 'red');
    } else if (!userSchools || userSchools.length === 0) {
      log(`   ⚠️  Nenhuma escola associada!`, 'yellow');
    } else {
      log(`   ✅ ${userSchools.length} escola(s) associada(s):`, 'green');
      userSchools.forEach((us, index) => {
        const school = us.schools;
        log(`   ${index + 1}. ${school?.school_name || 'N/A'} (ID: ${us.school_id})`, 'cyan');
        log(`      Status: ${school?.is_active ? 'Ativa' : 'Inativa'}`, school?.is_active ? 'green' : 'red');
        log(`      Tenant ID: ${school?.tenant_id || 'N/A'}`, 'cyan');
        log(`      Criado em: ${us.created_at}`, 'cyan');
      });
    }

    // 6. Verificar consistências
    log('\n6️⃣  Verificando consistências...', 'blue');
    const issues = [];

    // Verificar se profile existe
    if (!profile) {
      issues.push('❌ Profile não existe - usuário não pode fazer login');
    }

    // Verificar se tem role
    if (!userRoles || userRoles.length === 0) {
      issues.push('⚠️  Nenhum role atribuído - usuário pode não ter permissões');
    }

    // Verificar se profile.is_active está alinhado
    if (profile && !profile.is_active) {
      issues.push('⚠️  Profile está inativo - usuário não pode fazer login');
    }

    // Verificar se email está confirmado
    if (!authUser.email_confirmed_at) {
      issues.push('⚠️  Email não confirmado - pode afetar recuperação de senha');
    }

    // Verificar consistência entre profile.tenant_id e user_tenants
    if (profile && profile.tenant_id) {
      const hasTenantInUserTenants = userTenants?.some(ut => ut.tenant_id === profile.tenant_id);
      if (!hasTenantInUserTenants) {
        issues.push('⚠️  profile.tenant_id não corresponde a nenhum registro em user_tenants');
      }
    }

    // Verificar consistência entre profile.school_id e user_schools
    if (profile && profile.school_id) {
      const hasSchoolInUserSchools = userSchools?.some(us => us.school_id === profile.school_id);
      if (!hasSchoolInUserSchools) {
        issues.push('⚠️  profile.school_id não corresponde a nenhum registro em user_schools');
      }
    }

    if (issues.length === 0) {
      log(`   ✅ Nenhum problema encontrado!`, 'green');
    } else {
      log(`   ⚠️  ${issues.length} problema(s) encontrado(s):`, 'yellow');
      issues.forEach((issue, index) => {
        log(`   ${index + 1}. ${issue}`, 'yellow');
      });
    }

    // Resumo final
    log('\n' + '='.repeat(60), 'cyan');
    log('\n📊 RESUMO:', 'magenta');
    log(`   Email: ${emailToCheck}`, 'cyan');
    log(`   ID: ${userId}`, 'cyan');
    log(`   Profile: ${profile ? '✅ Existe' : '❌ Não existe'}`, profile ? 'green' : 'red');
    log(`   Roles: ${userRoles?.length || 0}`, userRoles && userRoles.length > 0 ? 'green' : 'yellow');
    log(`   Tenants: ${userTenants?.length || 0}`, userTenants && userTenants.length > 0 ? 'green' : 'yellow');
    log(`   Escolas: ${userSchools?.length || 0}`, userSchools && userSchools.length > 0 ? 'green' : 'yellow');
    log(`   Status Geral: ${issues.length === 0 ? '✅ OK' : '⚠️  Problemas encontrados'}`, issues.length === 0 ? 'green' : 'yellow');
    log('\n');

  } catch (error) {
    log(`\n❌ Erro geral: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Executar verificação
checkUserByEmail();









