import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event: string;
  timestamp: string;
  userId?: string;
  tenantId?: string;
  schoolId?: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: WebhookPayload = await req.json();

    // Buscar webhooks configurados para este evento
    const { data: webhooks, error: webhookError } = await supabaseClient
      .from('webhook_configs')
      .select('*')
      .eq('enabled', true)
      .contains('events', [payload.event])
      .or(
        payload.tenantId
          ? `tenant_id.is.null,tenant_id.eq.${payload.tenantId}`
          : 'tenant_id.is.null'
      );

    if (webhookError) {
      throw webhookError;
    }

    if (!webhooks || webhooks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No webhooks configured for this event' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Processar webhooks
    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Event': payload.event,
              'X-Webhook-Timestamp': payload.timestamp,
              ...(webhook.secret && {
                'X-Webhook-Signature': await signPayload(payload, webhook.secret),
              }),
            },
            body: JSON.stringify(payload),
          });

          const status = response.ok ? 'success' : 'failed';

          // Registrar log
          await supabaseClient.from('webhook_logs').insert({
            webhook_id: webhook.id,
            event_type: payload.event,
            status,
            response_status: response.status,
            error_message: response.ok ? null : await response.text(),
          });

          return { webhook_id: webhook.id, status, response_status: response.status };
        } catch (error) {
          // Registrar erro
          await supabaseClient.from('webhook_logs').insert({
            webhook_id: webhook.id,
            event_type: payload.event,
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });

          throw error;
        }
      })
    );

    return new Response(
      JSON.stringify({
        message: 'Webhooks processed',
        results: results.map((r) => (r.status === 'fulfilled' ? r.value : { error: r.reason })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function signPayload(payload: WebhookPayload, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

