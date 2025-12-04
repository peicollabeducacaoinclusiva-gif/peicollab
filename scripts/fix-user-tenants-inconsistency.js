#!/usr/bin/env node

/**
 * Script para corrigir inconsistência entre profile.tenant_id e user_tenants
 * 
 * Problema: Alguns usuários têm tenant_id no profile mas não têm registro em user_tenants
 * Solução: Criar o registro em user_tenants para manter consistência
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

async function fixUserTenantsInconsistency() {
  log('\n🔧 Corrigindo inconsistências entre profile.tenant_id e user_tenants\n', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    // 1. Buscar todos os profiles que têm tenant_id
    log('\n1️⃣  Buscando profiles com tenant_id...', 'blue');
    const { data: profilesWithTenant, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, tenant_id')
      .not('tenant_id', 'is', null);

    if (profilesError) {
      log(`   ❌ Erro ao buscar profiles: ${profilesError.message}`, 'red');
      return;
    }

    if (!profilesWithTenant || profilesWithTenant.length === 0) {
      log('   ✅ Nenhum profile com tenant_id encontrado', 'green');
      return;
    }

    log(`   ✅ Encontrados ${profilesWithTenant.length} profiles com tenant_id`, 'green');

    // 2. Para cada profile, verificar se existe registro em user_tenants
    log('\n2️⃣  Verificando registros em user_tenants...', 'blue');
    const inconsistencies = [];

    for (const profile of profilesWithTenant) {
      const { data: userTenant, error: checkError } = await supabase
        .from('user_tenants')
        .select('user_id, tenant_id')
        .eq('user_id', profile.id)
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle();

      if (checkError) {
        log(`   ⚠️  Erro ao verificar user_tenants para ${profile.full_name}: ${checkError.message}`, 'yellow');
        continue;
      }

      if (!userTenant) {
        inconsistencies.push(profile);
        log(`   ❌ Inconsistência encontrada: ${profile.full_name} (ID: ${profile.id})`, 'red');
        log(`      Profile tem tenant_id: ${profile.tenant_id}`, 'yellow');
        log(`      Mas não há registro em user_tenants`, 'yellow');
      }
    }

    if (inconsistencies.length === 0) {
      log('\n   ✅ Nenhuma inconsistência encontrada!', 'green');
      return;
    }

    log(`\n   ⚠️  Encontradas ${inconsistencies.length} inconsistências`, 'yellow');

    // 3. Corrigir as inconsistências
    log('\n3️⃣  Corrigindo inconsistências...', 'blue');
    const fixed = [];
    const errors = [];

    for (const profile of inconsistencies) {
      try {
        // Verificar se o tenant_id é válido
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id')
          .eq('id', profile.tenant_id)
          .maybeSingle();

        if (tenantError || !tenant) {
          log(`   ⚠️  Tenant ${profile.tenant_id} não encontrado para ${profile.full_name}`, 'yellow');
          errors.push({
            profile,
            error: `Tenant ${profile.tenant_id} não existe`
          });
          continue;
        }

        // Criar registro em user_tenants
        const { error: insertError } = await supabase
          .from('user_tenants')
          .insert({
            user_id: profile.id,
            tenant_id: profile.tenant_id,
          });

        if (insertError) {
          log(`   ❌ Erro ao criar registro para ${profile.full_name}: ${insertError.message}`, 'red');
          errors.push({
            profile,
            error: insertError.message
          });
        } else {
          log(`   ✅ Corrigido: ${profile.full_name} → tenant ${profile.tenant_id}`, 'green');
          fixed.push(profile);
        }
      } catch (error) {
        log(`   ❌ Erro ao processar ${profile.full_name}: ${error.message}`, 'red');
        errors.push({
          profile,
          error: error.message
        });
      }
    }

    // 4. Resumo
    log('\n' + '='.repeat(60), 'cyan');
    log('\n📊 RESUMO:', 'magenta');
    log(`   Total de profiles verificados: ${profilesWithTenant.length}`, 'cyan');
    log(`   Inconsistências encontradas: ${inconsistencies.length}`, 'yellow');
    log(`   ✅ Corrigidas com sucesso: ${fixed.length}`, 'green');
    log(`   ❌ Erros: ${errors.length}`, errors.length > 0 ? 'red' : 'green');

    if (errors.length > 0) {
      log('\n   ⚠️  Erros detalhados:', 'yellow');
      errors.forEach(({ profile, error }) => {
        log(`      - ${profile.full_name} (${profile.id}): ${error}`, 'yellow');
      });
    }

    if (fixed.length > 0) {
      log('\n   ✅ Usuários corrigidos:', 'green');
      fixed.forEach(profile => {
        log(`      - ${profile.full_name} (${profile.id})`, 'green');
      });
    }

    log('\n');

  } catch (error) {
    log(`\n❌ Erro geral: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Executar correção
fixUserTenantsInconsistency();









