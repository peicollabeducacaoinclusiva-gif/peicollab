// Edge Function para aplicar regras de retenção periodicamente
// Esta função será chamada por webhook/cron externo (GitHub Actions, etc.)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar autenticação (webhook secret ou service role)
    const authHeader = req.headers.get("authorization");
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { tenant_id = null, dry_run = false } = await req.json().catch(() => ({}));

    // Registrar início do job
    const { data: jobLog, error: logError } = await supabaseClient
      .from("retention_logs")
      .insert({
        tenant_id: tenant_id || "00000000-0000-0000-0000-000000000000", // Placeholder
        entity_type: "system",
        entity_id: crypto.randomUUID(),
        action: "anonymized",
        metadata: { job_start: new Date().toISOString(), dry_run },
      })
      .select()
      .single();

    if (logError) {
      console.error("Erro ao registrar início do job:", logError);
    }

    let results: any[] = [];

    if (tenant_id) {
      // Aplicar para um tenant específico
      const { data, error } = await supabaseClient.rpc("apply_retention_rules", {
        p_tenant_id: tenant_id,
        p_dry_run: dry_run,
      });

      if (error) {
        throw error;
      }

      results.push({ tenant_id, result: data });
    } else {
      // Aplicar para todos os tenants
      const { data: tenants, error: tenantsError } = await supabaseClient
        .from("tenants")
        .select("id, network_name");

      if (tenantsError) {
        throw tenantsError;
      }

      if (!tenants || tenants.length === 0) {
        return new Response(
          JSON.stringify({ message: "Nenhum tenant encontrado", results: [] }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      for (const tenant of tenants) {
        try {
          const { data, error } = await supabaseClient.rpc("apply_retention_rules", {
            p_tenant_id: tenant.id,
            p_dry_run: dry_run,
          });

          if (error) {
            console.error(`Erro ao processar tenant ${tenant.network_name}:`, error);
            results.push({
              tenant_id: tenant.id,
              tenant_name: tenant.network_name,
              error: error.message,
            });
            continue;
          }

          results.push({
            tenant_id: tenant.id,
            tenant_name: tenant.network_name,
            result: data,
          });
        } catch (error) {
          console.error(`Erro inesperado ao processar tenant ${tenant.network_name}:`, error);
          results.push({
            tenant_id: tenant.id,
            tenant_name: tenant.network_name,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }
    }

    // Calcular estatísticas
    const stats = {
      total_tenants: results.length,
      total_rules_processed: results.reduce((sum, r) => sum + (r.result?.total_rules_processed || 0), 0),
      total_anonymized: results.reduce((sum, r) => sum + (r.result?.total_anonymized || 0), 0),
      total_deleted: results.reduce((sum, r) => sum + (r.result?.total_deleted || 0), 0),
      total_archived: results.reduce((sum, r) => sum + (r.result?.total_archived || 0), 0),
      errors: results.filter((r) => r.error).length,
    };

    return new Response(
      JSON.stringify({
        success: true,
        dry_run: dry_run,
        stats,
        results,
        processed_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao aplicar regras de retenção:", error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

