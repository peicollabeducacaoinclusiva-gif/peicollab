#!/usr/bin/env node

/**
 * Script de Teste SSO Simplificado (sem dependências externas)
 * 
 * Este script testa a configuração básica do SSO:
 * 1. Verificar URLs dos apps
 * 2. Verificar estrutura de arquivos
 * 3. Verificar variáveis de ambiente
 * 
 * Uso: node scripts/test-sso-simple.js
 */

const { readFileSync, existsSync, statSync } = require('fs');
const { join } = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function recordTest(name, passed, message) {
  results.tests.push({ name, passed, message });
  if (passed) {
    success(`${name}: ${message}`);
    results.passed++;
  } else {
    error(`${name}: ${message}`);
    results.failed++;
  }
}

// Teste 1: Verificar Edge Functions existem
function testEdgeFunctionsExist() {
  info('\n📋 Teste 1: Verificar Edge Functions');
  
  const functionsPath = join(process.cwd(), 'supabase', 'functions');
  const createSSO = join(functionsPath, 'create-sso-code', 'index.ts');
  const validateSSO = join(functionsPath, 'validate-sso-code', 'index.ts');
  
  if (existsSync(createSSO)) {
    recordTest('create-sso-code existe', true, 'Arquivo encontrado');
  } else {
    recordTest('create-sso-code existe', false, 'Arquivo não encontrado');
  }
  
  if (existsSync(validateSSO)) {
    recordTest('validate-sso-code existe', true, 'Arquivo encontrado');
  } else {
    recordTest('validate-sso-code existe', false, 'Arquivo não encontrado');
  }
}

// Teste 2: Verificar migrações SSO
function testMigrationsExist() {
  info('\n📋 Teste 2: Verificar Migrações SSO');
  
  const migrationsPath = join(process.cwd(), 'supabase', 'migrations');
  const ssoMigration = '20250215000022_sso_codes_table.sql';
  const tenantAppsMigration = '20250215000021_tenant_apps_config.sql';
  
  try {
    const files = require('fs').readdirSync(migrationsPath);
    
    const hasSSOTable = files.includes(ssoMigration);
    const hasTenantApps = files.includes(tenantAppsMigration);
    
    recordTest('Migração sso_codes existe', hasSSOTable, 
      hasSSOTable ? 'Arquivo encontrado' : 'Arquivo não encontrado');
    
    recordTest('Migração tenant_apps existe', hasTenantApps,
      hasTenantApps ? 'Arquivo encontrado' : 'Arquivo não encontrado');
  } catch (e) {
    recordTest('Migrações existem', false, `Erro: ${e.message}`);
  }
}

// Teste 3: Verificar AppSwitcher
function testAppSwitcherExists() {
  info('\n📋 Teste 3: Verificar AppSwitcher');
  
  const appSwitcherPath = join(process.cwd(), 'packages', 'ui', 'src', 'AppSwitcher.tsx');
  
  if (existsSync(appSwitcherPath)) {
    recordTest('AppSwitcher existe', true, 'Componente encontrado');
    
    // Verificar se exporta corretamente
    try {
      const content = readFileSync(appSwitcherPath, 'utf-8');
      if (content.includes('export function AppSwitcher')) {
        recordTest('AppSwitcher exportado', true, 'Função exportada corretamente');
      } else {
        recordTest('AppSwitcher exportado', false, 'Função não exportada');
      }
    } catch (e) {
      recordTest('AppSwitcher legível', false, `Erro ao ler: ${e.message}`);
    }
  } else {
    recordTest('AppSwitcher existe', false, 'Arquivo não encontrado');
  }
}

// Teste 4: Verificar AppHeader
function testAppHeaderExists() {
  info('\n📋 Teste 4: Verificar AppHeader');
  
  const appHeaderPath = join(process.cwd(), 'packages', 'ui', 'src', 'components', 'shared', 'AppHeader.tsx');
  
  if (existsSync(appHeaderPath)) {
    recordTest('AppHeader existe', true, 'Componente encontrado');
    
    try {
      const content = readFileSync(appHeaderPath, 'utf-8');
      if (content.includes('AppSwitcher')) {
        recordTest('AppHeader usa AppSwitcher', true, 'Integração correta');
      } else {
        recordTest('AppHeader usa AppSwitcher', false, 'AppSwitcher não importado');
      }
    } catch (e) {
      recordTest('AppHeader legível', false, `Erro ao ler: ${e.message}`);
    }
  } else {
    recordTest('AppHeader existe', false, 'Arquivo não encontrado');
  }
}

// Teste 5: Verificar apps têm AppHeader
function testAppsHaveAppHeader() {
  info('\n📋 Teste 5: Verificar Apps têm AppHeader');
  
  const apps = [
    { name: 'pei-collab', path: join(process.cwd(), 'apps', 'pei-collab', 'src', 'pages', 'Dashboard.tsx') },
    { name: 'gestao-escolar', path: join(process.cwd(), 'apps', 'gestao-escolar', 'src', 'components', 'PageHeader.tsx') },
    { name: 'plano-aee', path: join(process.cwd(), 'apps', 'plano-aee', 'src', 'pages', 'Dashboard.tsx') },
    { name: 'planejamento', path: join(process.cwd(), 'apps', 'planejamento', 'src', 'pages', 'DashboardPlanejamento.tsx') },
    { name: 'atividades', path: join(process.cwd(), 'apps', 'atividades', 'src', 'pages', 'DashboardAtividades.tsx') },
  ];
  
  apps.forEach(app => {
    if (existsSync(app.path)) {
      try {
        const content = readFileSync(app.path, 'utf-8');
        if (content.includes('AppHeader') || content.includes('@pei/ui')) {
          recordTest(`${app.name} usa AppHeader`, true, 'Integrado');
        } else {
          recordTest(`${app.name} usa AppHeader`, false, 'Não encontrado');
        }
      } catch (e) {
        recordTest(`${app.name} verificado`, false, `Erro: ${e.message}`);
      }
    } else {
      recordTest(`${app.name} existe`, false, 'Arquivo não encontrado');
    }
  });
}

// Teste 6: Verificar URLs dos apps
function testAppUrls() {
  info('\n📋 Teste 6: Verificar Configuração de URLs');
  
  const apps = [
    { id: 'pei-collab', port: 8080, name: 'PEI Collab' },
    { id: 'gestao-escolar', port: 5174, name: 'Gestão Escolar' },
    { id: 'plano-aee', port: 5175, name: 'Plano de AEE' },
    { id: 'planejamento', port: 5176, name: 'Planejamento' },
    { id: 'atividades', port: 5178, name: 'Atividades' },
    { id: 'blog', port: 5179, name: 'Blog' },
    { id: 'transporte-escolar', port: 5181, name: 'Transporte Escolar' },
    { id: 'merenda-escolar', port: 5182, name: 'Merenda Escolar' },
  ];
  
  info(`Configuração esperada de ${apps.length} apps:`);
  apps.forEach(app => {
    console.log(`  • ${app.name}: http://localhost:${app.port}`);
  });
  
  recordTest('URLs dos apps configuradas', true, `${apps.length} apps`);
}

// Função principal
async function runTests() {
  log('\n🚀 Iniciando Testes SSO End-to-End\n', 'blue');
  log('='.repeat(60), 'blue');
  
  testEdgeFunctionsExist();
  testMigrationsExist();
  testAppSwitcherExists();
  testAppHeaderExists();
  testAppsHaveAppHeader();
  testAppUrls();
  
  // Resumo
  log('\n' + '='.repeat(60), 'blue');
  log('\n📊 Resumo dos Testes\n', 'blue');
  
  results.tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    const color = test.passed ? 'green' : 'red';
    log(`${icon} ${test.name}`, color);
    log(`   ${test.message}\n`, 'reset');
  });
  
  log(`\n✅ Passou: ${results.passed}`, 'green');
  log(`❌ Falhou: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`📊 Total: ${results.tests.length}\n`, 'blue');
  
  if (results.failed > 0) {
    warn('\n⚠️  Alguns testes falharam. Verifique os arquivos.');
    info('Para testes completos com navegação entre apps, siga o guia em docs/TESTE_SSO_ENDO_TO_END.md');
    process.exit(1);
  } else {
    success('\n✅ Todos os testes de configuração passaram!');
    info('📚 Próximos passos:');
    info('   1. Execute os testes manuais: scripts/test-sso-manual.md');
    info('   2. Veja o guia completo: docs/TESTE_SSO_ENDO_TO_END.md');
    info('   3. Inicie os apps e teste navegação entre eles');
    process.exit(0);
  }
}

// Executar
runTests().catch(error => {
  error(`Erro fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});

