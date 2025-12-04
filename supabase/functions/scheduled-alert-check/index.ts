// Edge Function para verificação agendada de alertas
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

    const { job_type = "alert_check", tenant_id = null } = await req.json().catch(() => ({}));

    // Registrar início do job
    const { data: jobLog, error: logError } = await supabaseClient.rpc("log_job_start", {
      p_job_name: "scheduled_alert_check",
      p_job_type: job_type,
      p_triggered_by: "scheduled",
      p_metadata: { tenant_id },
    });

    if (logError) {
      console.error("Erro ao registrar início do job:", logError);
    }

    const jobId = jobLog;

    let result;
    let recordsProcessed = 0;
    let errorMessage: string | null = null;

    try {
      if (job_type === "alert_check") {
        // Executar verificação de alertas
        const { data: alertsGenerated, error: alertError } = await supabaseClient.rpc(
          "run_automatic_alerts_check"
        );

        if (alertError) throw alertError;

        recordsProcessed = alertsGenerated || 0;
        result = {
          success: true,
          alerts_generated: recordsProcessed,
          job_id: jobId,
        };

        // Registrar conclusão com sucesso
        await supabaseClient.rpc("log_job_completion", {
          p_job_id: jobId,
          p_status: "completed",
          p_records_processed: recordsProcessed,
          p_result_data: { alerts_generated: recordsProcessed },
        });
      } else {
        throw new Error(`Tipo de job não suportado: ${job_type}`);
      }
    } catch (error: any) {
      errorMessage = error.message;
      console.error("Erro ao executar job:", error);

      // Registrar conclusão com erro
      await supabaseClient.rpc("log_job_completion", {
        p_job_id: jobId,
        p_status: "failed",
        p_error_message: errorMessage,
      });

      throw error;
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

