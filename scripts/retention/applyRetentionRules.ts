#!/usr/bin/env node
/**
 * Script para aplicar regras de retenção e anonimização automática
 * Uso: 
 *   - npx tsx scripts/retention/applyRetentionRules.ts <tenant_id> [--dry-run]
 *   - npx tsx scripts/retention/applyRetentionRules.ts --all [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fximylewmvsllkdczovj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (sim/não): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'sim' || answer.toLowerCase() === 's' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function applyRetentionRules(tenantId: string | null, dryRun: boolean = false) {
  try {
    if (!dryRun) {
      console.log(`\n⚠️  ATENÇÃO: Esta operação irá aplicar regras de retenção e pode anonimizar/excluir dados!`);
      if (tenantId) {
        console.log(`   - Tenant: ${tenantId}`);
      } else {
        console.log(`   - Todos os tenants`);
      }
      console.log(`   - Modo: ${dryRun ? 'DRY RUN (simulação)' : 'EXECUÇÃO REAL'}\n`);

      const confirmed = await askConfirmation('Deseja realmente aplicar as regras de retenção?');

      if (!confirmed) {
        console.log('❌ Operação cancelada pelo usuário');
        process.exit(0);
      }
    } else {
      console.log(`\n🔍 Modo DRY RUN - Nenhuma alteração será feita\n`);
    }

    if (tenantId) {
      // Aplicar para um tenant específico
      console.log(`🔄 Aplicando regras de retenção para tenant ${tenantId}...`);

      const { data, error } = await supabase.rpc('apply_retention_rules', {
        p_tenant_id: tenantId,
        p_dry_run: dryRun,
      });

      if (error) {
        console.error('❌ Erro ao aplicar regras de retenção:', error);
        process.exit(1);
      }

      displayResults(data, tenantId);
    } else {
      // Aplicar para todos os tenants
      console.log(`🔄 Aplicando regras de retenção para todos os tenants...`);

      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, network_name');

      if (tenantsError) {
        console.error('❌ Erro ao buscar tenants:', tenantsError);
        process.exit(1);
      }

      if (!tenants || tenants.length === 0) {
        console.log('ℹ️  Nenhum tenant encontrado');
        process.exit(0);
      }

      console.log(`📋 Encontrados ${tenants.length} tenant(s)\n`);

      let totalProcessed = 0;
      let totalAnonymized = 0;
      let totalDeleted = 0;
      let totalArchived = 0;
      const errors: Array<{ tenant: string; error: string }> = [];

      for (const tenant of tenants) {
        try {
          console.log(`\n🔄 Processando tenant: ${tenant.network_name} (${tenant.id})...`);

          const { data, error } = await supabase.rpc('apply_retention_rules', {
            p_tenant_id: tenant.id,
            p_dry_run: dryRun,
          });

          if (error) {
            console.error(`❌ Erro ao processar tenant ${tenant.network_name}:`, error);
            errors.push({ tenant: tenant.network_name, error: error.message });
            continue;
          }

          displayResults(data, tenant.id, tenant.network_name);

          totalProcessed += data.total_rules_processed || 0;
          totalAnonymized += data.total_anonymized || 0;
          totalDeleted += data.total_deleted || 0;
          totalArchived += data.total_archived || 0;
        } catch (error) {
          console.error(`❌ Erro inesperado ao processar tenant ${tenant.network_name}:`, error);
          errors.push({
            tenant: tenant.network_name,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      }

      // Resumo geral
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 RESUMO GERAL`);
      console.log(`${'='.repeat(60)}`);
      console.log(`   - Tenants processados: ${tenants.length}`);
      console.log(`   - Regras processadas: ${totalProcessed}`);
      console.log(`   - Registros anonimizados: ${totalAnonymized}`);
      console.log(`   - Registros deletados: ${totalDeleted}`);
      console.log(`   - Registros arquivados: ${totalArchived}`);
      console.log(`   - Erros: ${errors.length}`);

      if (errors.length > 0) {
        console.log(`\n❌ Erros encontrados:`);
        errors.forEach((err) => {
          console.log(`   - ${err.tenant}: ${err.error}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

function displayResults(
  result: any,
  tenantId: string,
  tenantName?: string
) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RESULTADOS${tenantName ? ` - ${tenantName}` : ''}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   - Tenant ID: ${tenantId}`);
  console.log(`   - Modo: ${result.dry_run ? 'DRY RUN' : 'EXECUÇÃO REAL'}`);
  console.log(`   - Regras processadas: ${result.total_rules_processed || 0}`);
  console.log(`   - Registros anonimizados: ${result.total_anonymized || 0}`);
  console.log(`   - Registros deletados: ${result.total_deleted || 0}`);
  console.log(`   - Registros arquivados: ${result.total_archived || 0}`);
  console.log(`   - Processado em: ${result.processed_at}`);

  if (result.errors && result.errors.length > 0) {
    console.log(`\n❌ Erros encontrados:`);
    result.errors.forEach((err: any) => {
      console.log(`   - ${err.entity_type} (${err.rule_id}): ${err.error}`);
    });
  }
}

// Executar script
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const allTenants = args.includes('--all');
const tenantId = args.find(arg => !arg.startsWith('--'));

if (!tenantId && !allTenants) {
  console.error('❌ Uso: npx tsx scripts/retention/applyRetentionRules.ts <tenant_id> [--dry-run]');
  console.error('   ou: npx tsx scripts/retention/applyRetentionRules.ts --all [--dry-run]');
  console.error('\n   Exemplos:');
  console.error('   - npx tsx scripts/retention/applyRetentionRules.ts abc-123');
  console.error('   - npx tsx scripts/retention/applyRetentionRules.ts abc-123 --dry-run');
  console.error('   - npx tsx scripts/retention/applyRetentionRules.ts --all --dry-run');
  process.exit(1);
}

applyRetentionRules(allTenants ? null : tenantId, dryRun)
  .then(() => {
    console.log('\n✅ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

