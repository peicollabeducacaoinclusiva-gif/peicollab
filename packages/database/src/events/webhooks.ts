import { supabase } from '../client';
import { EventPayload, EventType } from './eventBus';

export interface WebhookConfig {
  id: string;
  url: string;
  events: EventType[];
  secret?: string;
  enabled: boolean;
  tenant_id?: string;
}

/**
 * Envia webhook para URL configurada
 */
async function sendWebhook(config: WebhookConfig, payload: EventPayload) {
  if (!config.enabled) return;

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
        ...(config.secret && { 'X-Webhook-Signature': await signPayload(payload, config.secret) }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    // Registrar sucesso
    await supabase.from('webhook_logs').insert({
      webhook_id: config.id,
      event_type: payload.event,
      status: 'success',
      response_status: response.status,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Erro ao enviar webhook ${config.id}:`, error);

    // Registrar falha
    await supabase.from('webhook_logs').insert({
      webhook_id: config.id,
      event_type: payload.event,
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      created_at: new Date().toISOString(),
    });
  }
}

/**
 * Assina payload com secret (HMAC SHA256)
 */
async function signPayload(payload: EventPayload, secret: string): Promise<string> {
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

/**
 * Processa webhooks para um evento
 */
export async function processWebhooks(payload: EventPayload) {
  try {
    // Buscar webhooks configurados para este evento
    const { data: webhooks, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('enabled', true)
      .contains('events', [payload.event])
      .or(
        payload.tenantId
          ? `tenant_id.is.null,tenant_id.eq.${payload.tenantId}`
          : 'tenant_id.is.null'
      );

    if (error) {
      console.error('Erro ao buscar webhooks:', error);
      return;
    }

    if (!webhooks || webhooks.length === 0) return;

    // Enviar webhooks em paralelo
    await Promise.all(
      webhooks.map((webhook) =>
        sendWebhook(
          {
            id: webhook.id,
            url: webhook.url,
            events: webhook.events || [],
            secret: webhook.secret || undefined,
            enabled: webhook.enabled,
            tenant_id: webhook.tenant_id || undefined,
          },
          payload
        )
      )
    );
  } catch (error) {
    console.error('Erro ao processar webhooks:', error);
  }
}

