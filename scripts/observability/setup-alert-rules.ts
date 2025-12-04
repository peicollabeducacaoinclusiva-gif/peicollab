#!/usr/bin/env node
/**
 * Script para configurar regras básicas de alerta no AlertManager
 * Uso: npx tsx scripts/observability/setup-alert-rules.ts [--app-name=gestao-escolar] [--tenant-id=<uuid>]
 */

import { createClient } from '@supabase/supabase-js';
import { getAlertManager } from '@pei/observability';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Configure as variáveis de ambiente:');
  console.error('   VITE_SUPABASE_URL ou SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const alertManager = getAlertManager();

// Regras básicas de alerta
const BASIC_ALERT_RULES = [
  {
    rule_name: 'LCP Alto (> 2.5s)',
    alert_type: 'performance' as const,
    condition: {
      metric: 'lcp',
      operator: '>' as const,
      threshold: 2500,
      window: '5m',
    },
    severity: 'warning' as const,
    notification_channels: [],
  },
  {
    rule_name: 'Taxa de Erro Crítico (> 5 em 5min)',
    alert_type: 'error_rate' as const,
    condition: {
      metric: 'critical_error_count',
      operator: '>' as const,
      threshold: 5,
      window: '5m',
    },
    severity: 'critical' as const,
    notification_channels: [],
  },
  {
    rule_name: 'Taxa de Erro Alta (> 1%)',
    alert_type: 'error_rate' as const,
    condition: {
      metric: 'error_rate',
      operator: '>' as const,
      threshold: 1, // 1%
      window: '15m',
    },
    severity: 'error' as const,
    notification_channels: [],
  },
  {
    rule_name: 'Erro de Autenticação (Múltiplas Falhas)',
    alert_type: 'security' as const,
    condition: {
      metric: 'auth_failure_count',
      operator: '>' as const,
      threshold: 10,
      window: '5m',
    },
    severity: 'warning' as const,
    notification_channels: [],
  },
  {
    rule_name: 'Falha ao Acessar Dados Sensíveis',
    alert_type: 'security' as const,
    condition: {
      metric: 'sensitive_data_access_error',
      operator: '>=' as const,
      threshold: 1,
      window: '1m',
    },
    severity: 'critical' as const,
    notification_channels: [],
  },
  {
    rule_name: 'INP Alto (> 200ms)',
    alert_type: 'performance' as const,
    condition: {
      metric: 'inp',
      operator: '>' as const,
      threshold: 200,
      window: '5m',
    },
    severity: 'warning' as const,
    notification_channels: [],
  },
];

async function setupAlertRules(appName?: string, tenantId?: string) {
  console.log('🔔 Configurando regras básicas de alerta...\n');

  if (appName) {
    console.log(`   App: ${appName}`);
  }
  if (tenantId) {
    console.log(`   Tenant: ${tenantId}`);
  }
  console.log('');

  let rulesCreated = 0;
  let rulesSkipped = 0;
  let rulesFailed = 0;

  for (const rule of BASIC_ALERT_RULES) {
    try {
      // Verificar se a regra já existe
      const existingRules = await alertManager.getAlertRules({
        tenant_id: tenantId,
        app_name: appName,
        is_active: true,
      });

      const exists = existingRules.some(
        (r) =>
          r.rule_name === rule.rule_name &&
          r.alert_type === rule.alert_type &&
          (tenantId ? r.tenant_id === tenantId : r.tenant_id === null) &&
          (appName ? r.app_name === appName : r.app_name === null)
      );

      if (exists) {
        console.log(`⏭️  Regra já existe: ${rule.rule_name}`);
        rulesSkipped++;
        continue;
      }

      // Criar regra
      const ruleId = await alertManager.createAlertRule({
        tenant_id: tenantId,
        app_name: appName,
        ...rule,
        is_active: true,
      });

      if (ruleId) {
        console.log(`✅ Regra criada: ${rule.rule_name} (ID: ${ruleId})`);
        rulesCreated++;
      } else {
        console.log(`❌ Falha ao criar regra: ${rule.rule_name}`);
        rulesFailed++;
      }
    } catch (error: any) {
      console.error(`❌ Erro ao processar regra "${rule.rule_name}":`, error.message);
      rulesFailed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO');
  console.log('='.repeat(60));
  console.log(`   ✅ Criadas: ${rulesCreated}`);
  console.log(`   ⏭️  Ignoradas (já existem): ${rulesSkipped}`);
  console.log(`   ❌ Falhas: ${rulesFailed}`);
  console.log(`   📋 Total: ${BASIC_ALERT_RULES.length}`);
  console.log('');

  // Listar regras ativas
  console.log('📋 Regras ativas após configuração:\n');
  const activeRules = await alertManager.getAlertRules({
    tenant_id: tenantId,
    app_name: appName,
    is_active: true,
  });

  if (activeRules.length === 0) {
    console.log('   Nenhuma regra ativa encontrada.');
  } else {
    activeRules.forEach((rule) => {
      console.log(`   • ${rule.rule_name} (${rule.alert_type}) - ${rule.severity}`);
    });
  }
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
let appName: string | undefined;
let tenantId: string | undefined;

args.forEach((arg) => {
  if (arg.startsWith('--app-name=')) {
    appName = arg.split('=')[1];
  } else if (arg.startsWith('--tenant-id=')) {
    tenantId = arg.split('=')[1];
  }
});

// Executar configuração
setupAlertRules(appName, tenantId)
  .then(() => {
    console.log('\n✅ Configuração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

