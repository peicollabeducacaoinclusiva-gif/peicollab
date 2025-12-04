// Edge Function para enviar notificações por email e SMS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  log_id?: string;
}

interface SendSMSRequest {
  to: string;
  message: string;
  log_id?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { channel, ...payload } = await req.json();

    if (!channel || !["email", "sms"].includes(channel)) {
      return new Response(
        JSON.stringify({ error: "Canal inválido. Use 'email' ou 'sms'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se canal está habilitado
    const { data: config, error: configError } = await supabaseClient
      .from("notification_configs")
      .select("*")
      .eq("channel_type", channel)
      .eq("is_enabled", true)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ 
          error: `Canal ${channel} não está configurado ou habilitado` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result;

    if (channel === "email") {
      const { to, subject, body, log_id } = payload as SendEmailRequest;

      if (!to || !subject || !body) {
        return new Response(
          JSON.stringify({ error: "to, subject e body são obrigatórios para email" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Enviar via SendGrid
      const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
      if (!sendgridApiKey) {
        throw new Error("SENDGRID_API_KEY não configurada");
      }

      const sendgridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
            },
          ],
          from: {
            email: config.config_data?.from_email || "noreply@peicollab.com",
            name: "PEI Collab",
          },
          subject: subject,
          content: [
            {
              type: "text/plain",
              value: body,
            },
            {
              type: "text/html",
              value: body.replace(/\n/g, "<br>"),
            },
          ],
        }),
      });

      if (!sendgridResponse.ok) {
        const errorText = await sendgridResponse.text();
        throw new Error(`SendGrid error: ${sendgridResponse.status} - ${errorText}`);
      }

      result = { success: true, channel: "email", to };

      // Atualizar log se fornecido
      if (log_id) {
        await supabaseClient
          .from("notification_send_log")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", log_id);
      }

    } else if (channel === "sms") {
      const { to, message, log_id } = payload as SendSMSRequest;

      if (!to || !message) {
        return new Response(
          JSON.stringify({ error: "to e message são obrigatórios para SMS" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Enviar via Twilio
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioFromPhone = config.config_data?.from_phone || Deno.env.get("TWILIO_FROM_PHONE");

      if (!twilioAccountSid || !twilioAuthToken || !twilioFromPhone) {
        throw new Error("Configuração do Twilio incompleta");
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

      const twilioResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: twilioFromPhone,
          To: to,
          Body: message,
        }),
      });

      if (!twilioResponse.ok) {
        const errorText = await twilioResponse.text();
        throw new Error(`Twilio error: ${twilioResponse.status} - ${errorText}`);
      }

      result = { success: true, channel: "sms", to };

      // Atualizar log se fornecido
      if (log_id) {
        await supabaseClient
          .from("notification_send_log")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", log_id);
      }
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro ao enviar notificação:", error);
    
    // Atualizar log com erro se log_id fornecido
    try {
      const { log_id } = await req.json().then((d: any) => d);
      if (log_id) {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        await supabaseClient
          .from("notification_send_log")
          .update({
            status: "failed",
            error_message: error.message,
          })
          .eq("id", log_id);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

