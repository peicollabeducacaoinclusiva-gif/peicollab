/**
 * Edge Function para aplicar regras de retenção de dados
 * 
 * Esta função deve ser executada periodicamente (via cron/Supabase Scheduler)
 * para aplicar as regras de retenção configuradas por tenant.
 */

import { createClient } from '@supabase/supabase-js';

// Headers CORS padrão
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RetentionExecution {
  tenantId: string;
  dryRun: boolean;
  result: {
    success: boolean;
    total_rules_processed: number;
    total_anonymized: number;
    total_deleted: number;
    total_archived: number;
    errors: Array<{
      rule_id: string;
      entity_type: string;
      error: string;
    }>;
    processed_at: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body
    const { tenantId, dryRun = false, forceAllTenants = false } = await req.json().catch(() => ({
      tenantId: null,
      dryRun: false,
      forceAllTenants: false,
    }));

    const executions: RetentionExecution[] = [];

    // Se forceAllTenants, aplicar para todos os tenants ativos
    if (forceAllTenants) {
      // Buscar todos os tenants ativos
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id')
        .eq('is_active', true);

      if (tenantsError) {
        throw new Error(`Erro ao buscar tenants: ${tenantsError.message}`);
      }

      // Aplicar retenção para cada tenant
      for (const tenant of tenants || []) {
        try {
          const { data: result, error } = await supabase.rpc('apply_retention_rules', {
            p_tenant_id: tenant.id,
            p_dry_run: dryRun,
          });

          if (error) {
            executions.push({
              tenantId: tenant.id,
              dryRun,
              result: {
                success: false,
                total_rules_processed: 0,
                total_anonymized: 0,
                total_deleted: 0,
                total_archived: 0,
                errors: [{ rule_id: 'all', entity_type: 'all', error: error.message }],
                processed_at: new Date().toISOString(),
              },
            });
          } else {
            executions.push({
              tenantId: tenant.id,
              dryRun,
              result: result as RetentionExecution['result'],
            });
          }
        } catch (error) {
          executions.push({
            tenantId: tenant.id,
            dryRun,
            result: {
              success: false,
              total_rules_processed: 0,
              total_anonymized: 0,
              total_deleted: 0,
              total_archived: 0,
              errors: [
                {
                  rule_id: 'all',
                  entity_type: 'all',
                  error: error instanceof Error ? error.message : 'Erro desconhecido',
                },
              ],
              processed_at: new Date().toISOString(),
            },
          });
        }
      }
    } else if (tenantId) {
      // Aplicar para um tenant específico
      const { data: result, error } = await supabase.rpc('apply_retention_rules', {
        p_tenant_id: tenantId,
        p_dry_run: dryRun,
      });

      if (error) {
        throw new Error(`Erro ao aplicar retenção: ${error.message}`);
      }

      executions.push({
        tenantId,
        dryRun,
        result: result as RetentionExecution['result'],
      });
    } else {
      throw new Error('tenantId é obrigatório quando forceAllTenants é false');
    }

    // Calcular estatísticas totais
    const totalStats = executions.reduce(
      (acc, exec) => ({
        total_rules_processed: acc.total_rules_processed + exec.result.total_rules_processed,
        total_anonymized: acc.total_anonymized + exec.result.total_anonymized,
        total_deleted: acc.total_deleted + exec.result.total_deleted,
        total_archived: acc.total_archived + exec.result.total_archived,
        total_errors: acc.total_errors + exec.result.errors.length,
      }),
      {
        total_rules_processed: 0,
        total_anonymized: 0,
        total_deleted: 0,
        total_archived: 0,
        total_errors: 0,
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        executed_at: new Date().toISOString(),
        total_tenants: executions.length,
        total_stats: totalStats,
        executions: executions.map((e) => ({
          tenant_id: e.tenantId,
          ...e.result,
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro na Edge Function apply-retention:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        executed_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

