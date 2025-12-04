#!/usr/bin/env node
/**
 * Script para testar regras de alerta em produção
 * Uso: npx tsx scripts/observability/test-alert-rules.ts
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

async function testAlertRules() {
  console.log('🧪 Testando regras de alerta...\n');

  try {
    // 1. Listar regras ativas
    console.log('1️⃣ Listando regras ativas...');
    const rules = await alertManager.getAlertRules({ is_active: true });
    
    if (rules.length === 0) {
      console.log('   ⚠️ Nenhuma regra ativa encontrada');
      console.log('   💡 Execute: npx tsx scripts/observability/setup-alert-rules.ts');
      return;
    }

    console.log(`   ✅ Encontradas ${rules.length} regra(s) ativa(s):\n`);
    rules.forEach((rule) => {
      console.log(`   • ${rule.rule_name} (${rule.alert_type}) - ${rule.severity}`);
      console.log(`     Condição: ${JSON.stringify(rule.condition)}`);
    });

    // 2. Verificar alertas ativos
    console.log('\n2️⃣ Verificando alertas ativos...');
    const activeAlerts = await alertManager.getAlerts({ status: 'active', limit: 10 });
    
    if (activeAlerts.length === 0) {
      console.log('   ✅ Nenhum alerta ativo (sistema está saudável)');
    } else {
      console.log(`   ⚠️ Encontrados ${activeAlerts.length} alerta(s) ativo(s):\n`);
      activeAlerts.forEach((alert) => {
        console.log(`   • ${alert.alert_name} (${alert.severity})`);
        console.log(`     ${alert.message}`);
        console.log(`     Criado em: ${new Date(alert.created_at!).toLocaleString()}`);
      });
    }

    // 3. Verificar estatísticas de erros recentes
    console.log('\n3️⃣ Verificando erros recentes...');
    const { data: recentErrors, error: errorsError } = await supabase
      .from('error_logs')
      .select('id, error_type, severity, message, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (errorsError) {
      console.log(`   ⚠️ Erro ao buscar erros: ${errorsError.message}`);
    } else if (!recentErrors || recentErrors.length === 0) {
      console.log('   ✅ Nenhum erro recente encontrado');
    } else {
      console.log(`   📊 Últimos ${recentErrors.length} erro(s):\n`);
      recentErrors.forEach((error: any) => {
        console.log(`   • ${error.error_type} (${error.severity})`);
        console.log(`     ${error.message.substring(0, 80)}...`);
        console.log(`     ${new Date(error.created_at).toLocaleString()}`);
      });
    }

    // 4. Verificar métricas de performance recentes
    console.log('\n4️⃣ Verificando métricas de performance...');
    const { data: recentMetrics, error: metricsError } = await supabase
      .from('performance_metrics')
      .select('metric_type, metric_name, value, unit, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (metricsError) {
      console.log(`   ⚠️ Erro ao buscar métricas: ${metricsError.message}`);
    } else if (!recentMetrics || recentMetrics.length === 0) {
      console.log('   ℹ️ Nenhuma métrica recente encontrada');
    } else {
      console.log(`   📊 Últimas ${recentMetrics.length} métrica(s):\n`);
      recentMetrics.forEach((metric: any) => {
        const value = parseFloat(metric.value);
        const threshold = metric.metric_type === 'lcp' ? 2500 : metric.metric_type === 'inp' ? 200 : null;
        const status = threshold && value > threshold ? '⚠️' : '✅';
        console.log(`   ${status} ${metric.metric_type.toUpperCase()}: ${value}${metric.unit}`);
        if (threshold && value > threshold) {
          console.log(`      ⚠️ Acima do threshold de ${threshold}${metric.unit}`);
        }
      });
    }

    // 5. Criar alerta de teste (opcional)
    console.log('\n5️⃣ Teste de criação de alerta...');
    const testAlertId = await alertManager.createAlert({
      app_name: 'test-script',
      alert_type: 'custom',
      alert_name: 'Teste de Sistema',
      message: 'Este é um alerta de teste criado pelo script de teste',
      severity: 'info',
      status: 'active',
    });

    if (testAlertId) {
      console.log(`   ✅ Alerta de teste criado (ID: ${testAlertId})`);
      console.log('   💡 Você pode resolvê-lo no dashboard de observabilidade');
    } else {
      console.log('   ⚠️ Falha ao criar alerta de teste');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Teste concluído!');
    console.log('='.repeat(60));
    console.log('\n📋 Próximos passos:');
    console.log('   1. Verifique alertas no dashboard de observabilidade');
    console.log('   2. Configure notificações se necessário');
    console.log('   3. Monitore métricas regularmente');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Erro durante o teste:', error.message);
    process.exit(1);
  }
}

testAlertRules()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

