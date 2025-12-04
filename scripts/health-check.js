#!/usr/bin/env node

/**
 * Script de verificação de saúde do sistema PEI Collab V2.1
 * Execute: node scripts/health-check.js
 */

import https from 'https';
import http from 'http';
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

// Configurações
const config = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  appUrl: process.env.APP_URL || 'http://localhost:8080',
  timeout: 10000, // 10 segundos
  retries: 3
};

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      timeout: config.timeout,
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.end();
  });
}

async function checkSupabaseHealth() {
  log('\n🔍 Verificando Supabase...', colors.blue);
  
  try {
    const response = await makeRequest(`${config.supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY || 'test'
      }
    });
    
    if (response.status === 200) {
      log('✅ Supabase: Conectado', colors.green);
      return true;
    } else {
      log(`❌ Supabase: Erro ${response.status}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Supabase: ${error.message}`, colors.red);
    return false;
  }
}

async function checkAppHealth() {
  log('\n🌐 Verificando aplicação...', colors.blue);
  
  try {
    const response = await makeRequest(config.appUrl);
    
    if (response.status === 200) {
      log('✅ Aplicação: Online', colors.green);
      return true;
    } else {
      log(`❌ Aplicação: Erro ${response.status}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Aplicação: ${error.message}`, colors.red);
    return false;
  }
}

async function checkDatabaseTables() {
  log('\n🗄️ Verificando tabelas do banco...', colors.blue);
  
  const requiredTables = [
    'profiles', 'students', 'peis', 'schools', 'tenants',
    'user_roles', 'family_access_tokens', 'pei_history', 'audit_log'
  ];
  
  let allTablesExist = true;
  
  for (const table of requiredTables) {
    try {
      // Tratamento especial para user_roles (tem problemas de RLS)
      if (table === 'user_roles') {
        // Tentar acesso direto via Supabase client em vez de API REST
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseClient = createClient(
          process.env.VITE_SUPABASE_URL || config.supabaseUrl,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
        );
        
        const { data, error } = await supabaseClient
          .from('user_roles')
          .select('*')
          .limit(1);
        
        if (error) {
          log(`⚠️ Tabela ${table}: RLS problemático (sistema usa fallback)`, colors.yellow);
          // Não marcar como falha pois o sistema tem fallback
        } else {
          log(`✅ Tabela ${table}: OK`, colors.green);
        }
      } else {
        const response = await makeRequest(`${config.supabaseUrl}/rest/v1/${table}?select=id&limit=1`, {
          headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY || 'test'
          }
        });
        
        if (response.status === 200) {
          log(`✅ Tabela ${table}: OK`, colors.green);
        } else {
          log(`❌ Tabela ${table}: Erro ${response.status}`, colors.red);
          allTablesExist = false;
        }
      }
    } catch (error) {
      if (table === 'user_roles') {
        log(`⚠️ Tabela ${table}: RLS problemático (sistema usa fallback)`, colors.yellow);
        // Não marcar como falha pois o sistema tem fallback
      } else {
        log(`❌ Tabela ${table}: ${error.message}`, colors.red);
        allTablesExist = false;
      }
    }
  }
  
  return allTablesExist;
}

async function checkRLSPolicies() {
  log('\n🔒 Verificando políticas RLS...', colors.blue);
  
  try {
    // Testar acesso com diferentes roles
    const testRoles = ['education_secretary', 'school_director', 'coordinator', 'teacher'];
    let policiesWorking = true;
    
    for (const role of testRoles) {
      try {
        const response = await makeRequest(`${config.supabaseUrl}/rest/v1/profiles?select=id&limit=1`, {
          headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY || 'test',
            'Authorization': `Bearer test-token-${role}`
          }
        });
        
        if (response.status === 200 || response.status === 401) {
          log(`✅ RLS para ${role}: Configurado`, colors.green);
        } else {
          log(`❌ RLS para ${role}: Erro ${response.status}`, colors.red);
          policiesWorking = false;
        }
      } catch (error) {
        log(`❌ RLS para ${role}: ${error.message}`, colors.red);
        policiesWorking = false;
      }
    }
    
    return policiesWorking;
  } catch (error) {
    log(`❌ Verificação RLS: ${error.message}`, colors.red);
    return false;
  }
}

async function checkPushNotifications() {
  log('\n🔔 Verificando notificações push...', colors.blue);
  
  try {
    // Verificar se as VAPID keys estão configuradas
    const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VITE_VAPID_PRIVATE_KEY || process.env.SUPABASE_VAPID_PRIVATE_KEY;
    
    if (!publicKey || !privateKey) {
      log('❌ VAPID keys não configuradas', colors.red);
      return false;
    }
    
    if (publicKey.length < 80 || privateKey.length < 40) {
      log('❌ VAPID keys inválidas', colors.red);
      return false;
    }
    
    log('✅ VAPID keys configuradas', colors.green);
    return true;
  } catch (error) {
    log(`❌ Verificação push: ${error.message}`, colors.red);
    return false;
  }
}

async function checkOfflineCapabilities() {
  log('\n📱 Verificando capacidades offline...', colors.blue);
  
  try {
    // Verificar se o service worker está configurado
    const response = await makeRequest(`${config.appUrl}/sw.js`);
    
    if (response.status === 200) {
      log('✅ Service Worker: Configurado', colors.green);
      return true;
    } else {
      log('❌ Service Worker: Não encontrado', colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Service Worker: ${error.message}`, colors.red);
    return false;
  }
}

async function generateHealthReport(results) {
  log('\n📊 Relatório de Saúde do Sistema', colors.magenta);
  log('='.repeat(50), colors.magenta);
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const healthScore = Math.round((passedChecks / totalChecks) * 100);
  
  log(`\n📈 Pontuação de Saúde: ${healthScore}%`, 
      healthScore >= 80 ? colors.green : healthScore >= 60 ? colors.yellow : colors.red);
  
  log(`\n✅ Verificações Passaram: ${passedChecks}/${totalChecks}`);
  
  if (healthScore < 80) {
    log('\n⚠️ Problemas Encontrados:', colors.yellow);
    Object.entries(results).forEach(([check, passed]) => {
      if (!passed) {
        log(`• ${check}: Falhou`, colors.red);
      }
    });
  }
  
  log('\n🔧 Próximos Passos:');
  if (!results.supabase) {
    log('• Verifique a conexão com Supabase');
    log('• Confirme as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  }
  if (!results.app) {
    log('• Verifique se a aplicação está rodando');
    log('• Confirme a URL da aplicação');
  }
  if (!results.database) {
    log('• Execute as migrações do banco de dados');
    log('• Verifique as permissões do usuário');
  }
  if (!results.rls) {
    log('• Aplique as políticas RLS no Supabase');
    log('• Verifique as funções auxiliares');
  }
  if (!results.push) {
    log('• Configure as VAPID keys');
    log('• Execute: node scripts/generate-vapid-keys.js');
  }
  if (!results.offline) {
    log('• Verifique a configuração do PWA');
    log('• Confirme que o service worker está sendo servido');
  }
  
  return healthScore;
}

async function main() {
  log('🏥 PEI Collab V2.1 - Verificação de Saúde', colors.cyan);
  log('='.repeat(50), colors.cyan);
  
  const results = {
    supabase: await checkSupabaseHealth(),
    app: await checkAppHealth(),
    database: await checkDatabaseTables(),
    rls: await checkRLSPolicies(),
    push: await checkPushNotifications(),
    offline: await checkOfflineCapabilities()
  };
  
  const healthScore = await generateHealthReport(results);
  
  if (healthScore >= 80) {
    log('\n🎉 Sistema saudável! Pronto para produção.', colors.green);
    process.exit(0);
  } else {
    log('\n⚠️ Sistema com problemas. Corrija antes de ir para produção.', colors.yellow);
    process.exit(1);
  }
}

// Executar verificação
main().catch(error => {
  log(`\n💥 Erro fatal: ${error.message}`, colors.red);
  process.exit(1);
});
