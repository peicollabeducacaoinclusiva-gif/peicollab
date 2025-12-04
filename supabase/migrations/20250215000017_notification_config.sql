-- ============================================================================
-- MIGRAÇÃO: Configuração de Notificações por Email/SMS
-- Data: 15/02/2025
-- Descrição: 
--   1. Criar tabelas de configuração e templates
--   2. Criar RPCs para envio de notificações
--   3. Atualizar função send_alert_notifications
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELA notification_configs (Configurações de Canais)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  channel_type text NOT NULL UNIQUE CHECK (channel_type IN ('email', 'sms')),
  provider text NOT NULL, -- 'sendgrid', 'twilio', etc.
  
  -- Configuração
  is_enabled boolean DEFAULT true,
  config_data jsonb DEFAULT '{}'::jsonb, -- {api_key, from_email, from_phone, etc.}
  
  -- Rate limiting
  rate_limit_per_hour integer DEFAULT 100,
  rate_limit_per_day integer DEFAULT 1000,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notification_configs_channel ON notification_configs(channel_type, is_enabled);

-- Comentários
COMMENT ON TABLE notification_configs IS 
  'Configurações de canais de notificação (email, SMS). Chaves de API devem ser armazenadas em Supabase Secrets.';

-- ============================================================================
-- PARTE 2: TABELA notification_templates (Templates de Mensagens)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  template_code text NOT NULL UNIQUE,
  template_name text NOT NULL,
  channel_type text NOT NULL CHECK (channel_type IN ('email', 'sms', 'dashboard')),
  
  -- Template
  subject text, -- Para email
  body_template text NOT NULL, -- Template com placeholders {entity_id}, {alert_message}, etc.
  
  -- Variáveis disponíveis
  available_variables jsonb DEFAULT '[]'::jsonb, -- ['entity_id', 'alert_message', 'school_name', etc.]
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notification_templates_code ON notification_templates(template_code, is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_channel ON notification_templates(channel_type, is_active);

-- Comentários
COMMENT ON TABLE notification_templates IS 
  'Templates de mensagens para notificações. Suporta placeholders como {entity_id}, {alert_message}, etc.';

-- ============================================================================
-- PARTE 3: TABELA notification_send_log (Log de Envios)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento
  alert_id uuid REFERENCES automatic_alerts(id) ON DELETE CASCADE,
  notification_id uuid REFERENCES notifications(id) ON DELETE SET NULL,
  
  -- Envio
  channel_type text NOT NULL CHECK (channel_type IN ('email', 'sms', 'dashboard')),
  recipient_id uuid REFERENCES profiles(id),
  recipient_email text,
  recipient_phone text,
  
  -- Status
  status text NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0,
  
  -- Metadados
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notification_send_log_alert ON notification_send_log(alert_id, status);
CREATE INDEX IF NOT EXISTS idx_notification_send_log_recipient ON notification_send_log(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_send_log_status ON notification_send_log(status, created_at DESC);

-- Comentários
COMMENT ON TABLE notification_send_log IS 
  'Log de todos os envios de notificações. Usado para auditoria e troubleshooting.';

-- ============================================================================
-- PARTE 4: RPCs PARA ENVIO DE NOTIFICAÇÕES
-- ============================================================================

-- 4.1. Enviar notificação por email (chama Edge Function)
CREATE OR REPLACE FUNCTION send_email_notification(
  p_recipient_email text,
  p_subject text,
  p_body text,
  p_alert_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
  v_config RECORD;
BEGIN
  -- Verificar se email está habilitado
  SELECT * INTO v_config
  FROM notification_configs
  WHERE channel_type = 'email'
  AND is_enabled = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Canal de email não configurado ou desabilitado';
  END IF;
  
  -- Criar log de envio
  INSERT INTO notification_send_log (
    alert_id,
    channel_type,
    recipient_email,
    status
  ) VALUES (
    p_alert_id,
    'email',
    p_recipient_email,
    'pending'
  )
  RETURNING id INTO v_log_id;
  
  -- A Edge Function será chamada externamente via HTTP
  -- O log será atualizado pela Edge Function após o envio
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2. Enviar notificação por SMS (chama Edge Function)
CREATE OR REPLACE FUNCTION send_sms_notification(
  p_recipient_phone text,
  p_message text,
  p_alert_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
  v_config RECORD;
BEGIN
  -- Verificar se SMS está habilitado
  SELECT * INTO v_config
  FROM notification_configs
  WHERE channel_type = 'sms'
  AND is_enabled = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Canal de SMS não configurado ou desabilitado';
  END IF;
  
  -- Criar log de envio
  INSERT INTO notification_send_log (
    alert_id,
    channel_type,
    recipient_phone,
    status
  ) VALUES (
    p_alert_id,
    'sms',
    p_recipient_phone,
    'pending'
  )
  RETURNING id INTO v_log_id;
  
  -- A Edge Function será chamada externamente via HTTP
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3. Processar template de mensagem
CREATE OR REPLACE FUNCTION process_notification_template(
  p_template_code text,
  p_variables jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_template RECORD;
  v_subject text;
  v_body text;
  v_key text;
  v_value text;
BEGIN
  -- Buscar template
  SELECT * INTO v_template
  FROM notification_templates
  WHERE template_code = p_template_code
  AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template não encontrado: %', p_template_code;
  END IF;
  
  v_subject := v_template.subject;
  v_body := v_template.body_template;
  
  -- Substituir placeholders
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
  LOOP
    v_subject := REPLACE(v_subject, '{' || v_key || '}', COALESCE(v_value, ''));
    v_body := REPLACE(v_body, '{' || v_key || '}', COALESCE(v_value, ''));
  END LOOP;
  
  RETURN jsonb_build_object(
    'subject', v_subject,
    'body', v_body,
    'channel_type', v_template.channel_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 5: ATUALIZAR FUNÇÃO send_alert_notifications
-- ============================================================================

CREATE OR REPLACE FUNCTION send_alert_notifications(p_alert_id uuid)
RETURNS void AS $$
DECLARE
  v_alert RECORD;
  v_rule RECORD;
  v_user RECORD;
  v_notification_id uuid;
  v_template_result jsonb;
  v_email_log_id uuid;
  v_sms_log_id uuid;
  v_user_email text;
  v_user_phone text;
BEGIN
  SELECT a.*, ar.notification_channels, ar.target_roles, ar.target_schools
  INTO v_alert, v_rule
  FROM automatic_alerts a
  INNER JOIN alert_rules ar ON ar.id = a.alert_rule_id
  WHERE a.id = p_alert_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Enviar notificação no dashboard para usuários com roles alvo
  FOR v_user IN
    SELECT DISTINCT p.id, p.tenant_id, p.school_id, p.email, p.phone
    FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.id
    WHERE 
      ur.role = ANY(v_rule.target_roles)
      AND (
        array_length(v_rule.target_schools, 1) IS NULL 
        OR p.school_id = ANY(v_rule.target_schools)
        OR p.tenant_id = v_alert.tenant_id
      )
  LOOP
    -- Criar notificação no dashboard
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      metadata
    ) VALUES (
      v_user.id,
      'alert',
      'Alerta Automático',
      v_alert.alert_message,
      format('/alerts/%s', p_alert_id),
      jsonb_build_object('alert_id', p_alert_id, 'alert_type', v_alert.alert_type)
    )
    RETURNING id INTO v_notification_id;
    
    -- Registrar envio no dashboard
    UPDATE automatic_alerts
    SET notifications_sent = notifications_sent || jsonb_build_object(
      'channel', 'dashboard',
      'sent_at', NOW(),
      'recipient_id', v_user.id,
      'notification_id', v_notification_id
    )
    WHERE id = p_alert_id;
    
    -- Enviar por email se configurado
    IF 'email' = ANY(v_rule.notification_channels) AND v_user.email IS NOT NULL THEN
      BEGIN
        -- Processar template
        SELECT process_notification_template(
          'alert_email_' || LOWER(v_alert.alert_type),
          jsonb_build_object(
            'entity_id', v_alert.entity_id,
            'alert_message', v_alert.alert_message,
            'alert_type', v_alert.alert_type,
            'school_name', COALESCE((SELECT school_name FROM schools WHERE id = v_alert.school_id), 'N/A')
          )
        ) INTO v_template_result;
        
        -- Chamar função de envio (que criará log e chamará Edge Function)
        SELECT send_email_notification(
          v_user.email,
          v_template_result->>'subject',
          v_template_result->>'body',
          p_alert_id
        ) INTO v_email_log_id;
        
        -- Registrar no log do alerta
        UPDATE automatic_alerts
        SET notifications_sent = notifications_sent || jsonb_build_object(
          'channel', 'email',
          'sent_at', NOW(),
          'recipient_id', v_user.id,
          'log_id', v_email_log_id
        )
        WHERE id = p_alert_id;
      EXCEPTION WHEN OTHERS THEN
        -- Log erro mas não interrompe processo
        RAISE WARNING 'Erro ao enviar email para %: %', v_user.email, SQLERRM;
      END;
    END IF;
    
    -- Enviar por SMS se configurado
    IF 'sms' = ANY(v_rule.notification_channels) AND v_user.phone IS NOT NULL THEN
      BEGIN
        -- Processar template SMS (mais curto)
        SELECT process_notification_template(
          'alert_sms_' || LOWER(v_alert.alert_type),
          jsonb_build_object(
            'alert_message', v_alert.alert_message
          )
        ) INTO v_template_result;
        
        -- Chamar função de envio
        SELECT send_sms_notification(
          v_user.phone,
          v_template_result->>'body',
          p_alert_id
        ) INTO v_sms_log_id;
        
        -- Registrar no log do alerta
        UPDATE automatic_alerts
        SET notifications_sent = notifications_sent || jsonb_build_object(
          'channel', 'sms',
          'sent_at', NOW(),
          'recipient_id', v_user.id,
          'log_id', v_sms_log_id
        )
        WHERE id = p_alert_id;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Erro ao enviar SMS para %: %', v_user.phone, SQLERRM;
      END;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 6: TEMPLATES PADRÃO
-- ============================================================================

DO $$
BEGIN
  -- Template de email para alerta crítico
  INSERT INTO notification_templates (
    template_code,
    template_name,
    channel_type,
    subject,
    body_template,
    available_variables
  ) VALUES (
    'alert_email_critical',
    'Email - Alerta Crítico',
    'email',
    'Alerta Crítico: {alert_message}',
    'Olá,

Um alerta crítico foi gerado no sistema:

{alert_message}

Escola: {school_name}
Entidade: {entity_id}

Por favor, acesse o sistema para mais detalhes: {action_url}

Atenciosamente,
Sistema PEI Collab',
    ARRAY['alert_message', 'school_name', 'entity_id', 'action_url']::jsonb
  )
  ON CONFLICT (template_code) DO NOTHING;
  
  -- Template de email para alerta de atenção
  INSERT INTO notification_templates (
    template_code,
    template_name,
    channel_type,
    subject,
    body_template,
    available_variables
  ) VALUES (
    'alert_email_warning',
    'Email - Alerta de Atenção',
    'email',
    'Alerta: {alert_message}',
    'Olá,

Um alerta foi gerado no sistema:

{alert_message}

Escola: {school_name}

Por favor, verifique no sistema.

Atenciosamente,
Sistema PEI Collab',
    ARRAY['alert_message', 'school_name']::jsonb
  )
  ON CONFLICT (template_code) DO NOTHING;
  
  -- Template de SMS para alerta crítico
  INSERT INTO notification_templates (
    template_code,
    template_name,
    channel_type,
    body_template,
    available_variables
  ) VALUES (
    'alert_sms_critical',
    'SMS - Alerta Crítico',
    'sms',
    'ALERTA CRÍTICO: {alert_message}. Acesse o sistema para detalhes.',
    ARRAY['alert_message']::jsonb
  )
  ON CONFLICT (template_code) DO NOTHING;
  
  -- Template de SMS para alerta de atenção
  INSERT INTO notification_templates (
    template_code,
    template_name,
    channel_type,
    body_template,
    available_variables
  ) VALUES (
    'alert_sms_warning',
    'SMS - Alerta de Atenção',
    'sms',
    'Alerta: {alert_message}. Verifique no sistema.',
    ARRAY['alert_message']::jsonb
  )
  ON CONFLICT (template_code) DO NOTHING;
  
  -- Configurações padrão (desabilitadas até configuração de chaves)
  INSERT INTO notification_configs (
    channel_type,
    provider,
    is_enabled,
    config_data
  ) VALUES 
  (
    'email',
    'sendgrid',
    false, -- Desabilitado até configurar SENDGRID_API_KEY
    jsonb_build_object('from_email', 'noreply@peicollab.com')
  ),
  (
    'sms',
    'twilio',
    false, -- Desabilitado até configurar TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN
    jsonb_build_object('from_phone', '+5511999999999')
  )
  ON CONFLICT (channel_type) DO NOTHING;
  
  RAISE NOTICE '✅ Templates e configurações de notificação criados!';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANTE:';
  RAISE NOTICE '  1. Configure SENDGRID_API_KEY no Supabase Secrets para habilitar email';
  RAISE NOTICE '  2. Configure TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN para habilitar SMS';
  RAISE NOTICE '  3. Ative os canais em notification_configs após configurar as chaves';
END $$;

-- ============================================================================
-- PARTE 7: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE notification_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_send_log ENABLE ROW LEVEL SECURITY;

-- Superadmin pode gerenciar configurações
DROP POLICY IF EXISTS "Superadmin can manage notification configs" ON notification_configs;
CREATE POLICY "Superadmin can manage notification configs"
  ON notification_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Usuários podem ver configurações ativas
DROP POLICY IF EXISTS "Users can view active notification configs" ON notification_configs;
CREATE POLICY "Users can view active notification configs"
  ON notification_configs FOR SELECT
  USING (is_enabled = true);

-- Templates: todos podem ver templates ativos
DROP POLICY IF EXISTS "Users can view active templates" ON notification_templates;
CREATE POLICY "Users can view active templates"
  ON notification_templates FOR SELECT
  USING (is_active = true);

-- Logs: usuários veem apenas seus próprios logs
DROP POLICY IF EXISTS "Users can view their own send logs" ON notification_send_log;
CREATE POLICY "Users can view their own send logs"
  ON notification_send_log FOR SELECT
  USING (recipient_id = auth.uid());

-- Superadmin vê todos os logs
DROP POLICY IF EXISTS "Superadmin can view all send logs" ON notification_send_log;
CREATE POLICY "Superadmin can view all send logs"
  ON notification_send_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- ============================================================================
-- PARTE 8: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de configuração de notificações concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada tabela notification_configs (configurações de canais)';
  RAISE NOTICE '  2. ✅ Criada tabela notification_templates (templates de mensagens)';
  RAISE NOTICE '  3. ✅ Criada tabela notification_send_log (log de envios)';
  RAISE NOTICE '  4. ✅ Criados RPCs: send_email_notification, send_sms_notification, process_notification_template';
  RAISE NOTICE '  5. ✅ Atualizada função send_alert_notifications para suportar email/SMS';
  RAISE NOTICE '  6. ✅ Criados 4 templates padrão (email crítico/atenção, SMS crítico/atenção)';
  RAISE NOTICE '  7. ✅ RLS policies aplicadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Criar Edge Function send-notifications';
  RAISE NOTICE '  - Configurar variáveis de ambiente (SENDGRID_API_KEY, TWILIO_*)';
  RAISE NOTICE '  - Ativar canais em notification_configs';
END $$;

