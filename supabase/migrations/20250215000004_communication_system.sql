-- ============================================================================
-- MIGRAÇÃO: Sistema de Comunicação Interna
-- Data: 15/02/2025
-- Descrição: 
--   1. Criar tabela announcements (Mural de Avisos)
--   2. Expandir sistema de notificações
--   3. Criar tabela messages (Recados)
--   4. Criar tabela meeting_schedules (Agendamento de Reuniões)
--   5. Criar tabela report_cards (Boletins Digitais)
--   6. Criar RPCs para gerenciar comunicação
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELA announcements (Mural de Avisos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Conteúdo
  title text NOT NULL,
  content text NOT NULL,
  target_audience text[] DEFAULT ARRAY[]::text[], -- ['teacher', 'coordinator', 'family', etc.]
  
  -- Prioridade e visibilidade
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  is_pinned boolean DEFAULT false,
  
  -- Datas
  publish_date timestamptz DEFAULT now(),
  expires_date timestamptz,
  
  -- Anexos e metadados
  attachments jsonb DEFAULT '[]'::jsonb, -- [{type, url, name, size}]
  read_by jsonb DEFAULT '[]'::jsonb, -- [{user_id, read_at}]
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_announcements_school ON announcements(school_id, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_tenant ON announcements(tenant_id, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_author ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_publish_date ON announcements(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_date ON announcements(expires_date) WHERE expires_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority, publish_date DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS announcements_updated_at_trigger ON announcements;
CREATE TRIGGER announcements_updated_at_trigger
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();

-- Comentários
COMMENT ON TABLE announcements IS 
  'Mural de avisos para comunicação interna. Permite que gestores publiquem avisos direcionados a diferentes públicos.';

COMMENT ON COLUMN announcements.target_audience IS 
  'Array de roles que podem ver o aviso: teacher, coordinator, school_director, family, etc.';

COMMENT ON COLUMN announcements.read_by IS 
  'Array de objetos com user_id e read_at para rastrear leitura: [{user_id, read_at}]';

-- ============================================================================
-- PARTE 2: TABELA notifications (Notificações Genéricas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Destinatário
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Conteúdo
  type text NOT NULL, -- 'announcement', 'message', 'meeting', 'grade', 'attendance', 'alert', etc.
  title text NOT NULL,
  message text NOT NULL,
  
  -- Ação
  action_url text, -- URL para ação relacionada
  action_label text, -- Label do botão de ação
  
  -- Status
  is_read boolean DEFAULT false,
  read_at timestamptz,
  
  -- Metadados
  metadata jsonb DEFAULT '{}'::jsonb, -- Dados adicionais específicos do tipo
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Comentários
COMMENT ON TABLE notifications IS 
  'Sistema de notificações genérico para todos os tipos de eventos no sistema.';

COMMENT ON COLUMN notifications.metadata IS 
  'Dados adicionais específicos do tipo de notificação: {announcement_id, message_id, meeting_id, etc.}';

-- ============================================================================
-- PARTE 3: TABELA messages (Recados)
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Remetente e destinatário
  from_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  to_student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  to_family_token_id uuid REFERENCES family_access_tokens(id) ON DELETE SET NULL,
  
  -- Conteúdo
  subject text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Status
  is_read boolean DEFAULT false,
  read_at timestamptz,
  
  -- Metadados
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_to_student ON messages(to_student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_to_family ON messages(to_family_token_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_priority ON messages(priority, created_at DESC);

-- Comentários
COMMENT ON TABLE messages IS 
  'Sistema de recados entre usuários, ou de usuários para alunos/famílias.';

-- ============================================================================
-- PARTE 4: TABELA meeting_schedules (Agendamento de Reuniões)
-- ============================================================================

CREATE TABLE IF NOT EXISTS meeting_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Detalhes da reunião
  title text NOT NULL,
  description text,
  meeting_date date NOT NULL,
  meeting_time time NOT NULL,
  duration_minutes integer DEFAULT 60,
  
  -- Participantes
  participants jsonb DEFAULT '[]'::jsonb, -- [{user_id, role, confirmed, confirmed_at}]
  student_ids uuid[] DEFAULT ARRAY[]::uuid[], -- Alunos relacionados
  
  -- Local e tipo
  location text,
  meeting_type text NOT NULL DEFAULT 'individual' CHECK (meeting_type IN ('individual', 'coletiva', 'online')),
  meeting_url text, -- Para reuniões online
  
  -- Status
  status text NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada', 'confirmada', 'realizada', 'cancelada', 'remarcada')),
  
  -- Metadados
  notes text, -- Notas da reunião (após realização)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meeting_schedules_school ON meeting_schedules(school_id, meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_schedules_organizer ON meeting_schedules(organizer_id, meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_schedules_date ON meeting_schedules(meeting_date, meeting_time);
CREATE INDEX IF NOT EXISTS idx_meeting_schedules_status ON meeting_schedules(status, meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_schedules_students ON meeting_schedules USING GIN(student_ids);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_meeting_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS meeting_schedules_updated_at_trigger ON meeting_schedules;
CREATE TRIGGER meeting_schedules_updated_at_trigger
  BEFORE UPDATE ON meeting_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_schedules_updated_at();

-- Comentários
COMMENT ON TABLE meeting_schedules IS 
  'Agendamento de reuniões entre profissionais da escola, ou com responsáveis.';

COMMENT ON COLUMN meeting_schedules.participants IS 
  'Array de participantes: [{user_id, role, confirmed, confirmed_at}]';

-- ============================================================================
-- PARTE 5: TABELA report_cards (Boletins Digitais)
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES student_enrollments(id) ON DELETE SET NULL,
  academic_year integer NOT NULL,
  bimester integer NOT NULL CHECK (bimester BETWEEN 1 AND 4),
  
  -- Dados do boletim
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb, -- Estrutura completa do boletim
  
  -- Geração e envio
  generated_at timestamptz DEFAULT now(),
  generated_by uuid REFERENCES profiles(id),
  pdf_url text,
  
  -- Envio para família
  sent_to_family_at timestamptz,
  viewed_by_family_at timestamptz,
  family_token_id uuid REFERENCES family_access_tokens(id) ON DELETE SET NULL,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_report_cards_student ON report_cards(student_id, academic_year, bimester);
CREATE INDEX IF NOT EXISTS idx_report_cards_enrollment ON report_cards(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_academic_year ON report_cards(academic_year, bimester);
CREATE INDEX IF NOT EXISTS idx_report_cards_family_token ON report_cards(family_token_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_report_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS report_cards_updated_at_trigger ON report_cards;
CREATE TRIGGER report_cards_updated_at_trigger
  BEFORE UPDATE ON report_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_report_cards_updated_at();

-- Comentários
COMMENT ON TABLE report_cards IS 
  'Boletins digitais gerados para alunos. Permite envio automático para responsáveis via portal.';

COMMENT ON COLUMN report_cards.report_data IS 
  'Estrutura completa do boletim: {grades: [...], attendance: {...}, observations: [...], etc.}';

-- ============================================================================
-- PARTE 6: RPCs PARA GERENCIAR COMUNICAÇÃO
-- ============================================================================

-- 6.1. Criar anúncio
CREATE OR REPLACE FUNCTION create_announcement(
  p_school_id uuid,
  p_tenant_id uuid,
  p_author_id uuid,
  p_title text,
  p_content text,
  p_target_audience text[] DEFAULT ARRAY[]::text[],
  p_priority text DEFAULT 'media',
  p_is_pinned boolean DEFAULT false,
  p_publish_date timestamptz DEFAULT now(),
  p_expires_date timestamptz DEFAULT NULL,
  p_attachments jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_announcement_id uuid;
BEGIN
  INSERT INTO announcements (
    school_id,
    tenant_id,
    author_id,
    title,
    content,
    target_audience,
    priority,
    is_pinned,
    publish_date,
    expires_date,
    attachments
  ) VALUES (
    p_school_id,
    p_tenant_id,
    p_author_id,
    p_title,
    p_content,
    p_target_audience,
    p_priority,
    p_is_pinned,
    p_publish_date,
    p_expires_date,
    p_attachments
  )
  RETURNING id INTO v_announcement_id;
  
  -- Criar notificações para usuários do público-alvo
  INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
  SELECT 
    p.id,
    'announcement',
    p_title,
    LEFT(p_content, 200) || '...',
    '/announcements/' || v_announcement_id,
    jsonb_build_object('announcement_id', v_announcement_id)
  FROM profiles p
  WHERE 
    (p.school_id = p_school_id OR p.tenant_id = p_tenant_id)
    AND (
      p_target_audience = ARRAY[]::text[]
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = p.id
        AND ur.role = ANY(p_target_audience)
      )
    );
  
  RETURN v_announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.2. Marcar anúncio como lido
CREATE OR REPLACE FUNCTION mark_announcement_read(
  p_announcement_id uuid,
  p_user_id uuid
)
RETURNS boolean AS $$
BEGIN
  UPDATE announcements
  SET read_by = read_by || jsonb_build_array(
    jsonb_build_object(
      'user_id', p_user_id,
      'read_at', NOW()
    )
  )
  WHERE id = p_announcement_id
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(read_by) AS elem
    WHERE elem->>'user_id' = p_user_id::text
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3. Criar recado
CREATE OR REPLACE FUNCTION create_message(
  p_from_user_id uuid,
  p_to_user_id uuid DEFAULT NULL,
  p_to_student_id uuid DEFAULT NULL,
  p_to_family_token_id uuid DEFAULT NULL,
  p_subject text,
  p_message text,
  p_priority text DEFAULT 'normal',
  p_attachments jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_message_id uuid;
BEGIN
  IF p_to_user_id IS NULL AND p_to_student_id IS NULL AND p_to_family_token_id IS NULL THEN
    RAISE EXCEPTION 'Destinatário deve ser especificado';
  END IF;
  
  INSERT INTO messages (
    from_user_id,
    to_user_id,
    to_student_id,
    to_family_token_id,
    subject,
    message,
    priority,
    attachments
  ) VALUES (
    p_from_user_id,
    p_to_user_id,
    p_to_student_id,
    p_to_family_token_id,
    p_subject,
    p_message,
    p_priority,
    p_attachments
  )
  RETURNING id INTO v_message_id;
  
  -- Criar notificação se destinatário for usuário
  IF p_to_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
    VALUES (
      p_to_user_id,
      'message',
      p_subject,
      LEFT(p_message, 200) || '...',
      '/messages/' || v_message_id,
      jsonb_build_object('message_id', v_message_id)
    );
  END IF;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.4. Agendar reunião
CREATE OR REPLACE FUNCTION create_meeting(
  p_school_id uuid,
  p_organizer_id uuid,
  p_title text,
  p_description text DEFAULT NULL,
  p_meeting_date date,
  p_meeting_time time,
  p_duration_minutes integer DEFAULT 60,
  p_participants jsonb DEFAULT '[]'::jsonb,
  p_student_ids uuid[] DEFAULT ARRAY[]::uuid[],
  p_location text DEFAULT NULL,
  p_meeting_type text DEFAULT 'individual',
  p_meeting_url text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_meeting_id uuid;
BEGIN
  INSERT INTO meeting_schedules (
    school_id,
    organizer_id,
    title,
    description,
    meeting_date,
    meeting_time,
    duration_minutes,
    participants,
    student_ids,
    location,
    meeting_type,
    meeting_url
  ) VALUES (
    p_school_id,
    p_organizer_id,
    p_title,
    p_description,
    p_meeting_date,
    p_meeting_time,
    p_duration_minutes,
    p_participants,
    p_student_ids,
    p_location,
    p_meeting_type,
    p_meeting_url
  )
  RETURNING id INTO v_meeting_id;
  
  -- Criar notificações para participantes
  INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
  SELECT 
    (participant->>'user_id')::uuid,
    'meeting',
    p_title,
    'Reunião agendada para ' || p_meeting_date::text || ' às ' || p_meeting_time::text,
    '/meetings/' || v_meeting_id,
    jsonb_build_object('meeting_id', v_meeting_id)
  FROM jsonb_array_elements(p_participants) AS participant;
  
  RETURN v_meeting_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.5. Gerar boletim
CREATE OR REPLACE FUNCTION generate_report_card(
  p_student_id uuid,
  p_academic_year integer,
  p_bimester integer,
  p_enrollment_id uuid DEFAULT NULL,
  p_generated_by uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_report_id uuid;
  v_report_data jsonb;
BEGIN
  -- Buscar dados do aluno, notas, frequência, etc.
  -- (Implementação simplificada - expandir conforme necessário)
  v_report_data := jsonb_build_object(
    'student_id', p_student_id,
    'academic_year', p_academic_year,
    'bimester', p_bimester,
    'generated_at', NOW()
  );
  
  INSERT INTO report_cards (
    student_id,
    enrollment_id,
    academic_year,
    bimester,
    report_data,
    generated_by
  ) VALUES (
    p_student_id,
    p_enrollment_id,
    p_academic_year,
    p_bimester,
    v_report_data,
    COALESCE(p_generated_by, auth.uid())
  )
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.6. Enviar boletim para família
CREATE OR REPLACE FUNCTION send_report_card_to_family(
  p_report_card_id uuid,
  p_family_token_id uuid
)
RETURNS boolean AS $$
BEGIN
  UPDATE report_cards
  SET 
    sent_to_family_at = NOW(),
    family_token_id = p_family_token_id
  WHERE id = p_report_card_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 7: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
DROP POLICY IF EXISTS "Superadmin full access to announcements" ON announcements;
CREATE POLICY "Superadmin full access to announcements"
  ON announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Usuários veem anúncios da sua escola/rede
DROP POLICY IF EXISTS "Users can view announcements in their school" ON announcements;
CREATE POLICY "Users can view announcements in their school"
  ON announcements FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
    OR tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- Autores podem gerenciar seus anúncios
DROP POLICY IF EXISTS "Authors can manage their announcements" ON announcements;
CREATE POLICY "Authors can manage their announcements"
  ON announcements FOR ALL
  USING (author_id = auth.uid());

-- Notificações: usuários veem apenas as suas
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Mensagens: usuários veem mensagens enviadas/recebidas
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (
    from_user_id = auth.uid()
    OR to_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create messages" ON messages;
CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

-- Reuniões: participantes veem reuniões da escola
DROP POLICY IF EXISTS "Users can view meetings in their school" ON meeting_schedules;
CREATE POLICY "Users can view meetings in their school"
  ON meeting_schedules FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organizers can manage their meetings" ON meeting_schedules;
CREATE POLICY "Organizers can manage their meetings"
  ON meeting_schedules FOR ALL
  USING (organizer_id = auth.uid());

-- Boletins: profissionais da escola veem boletins dos alunos
DROP POLICY IF EXISTS "School staff can view report cards" ON report_cards;
CREATE POLICY "School staff can view report cards"
  ON report_cards FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN profiles p ON p.school_id = s.school_id
      WHERE p.id = auth.uid()
    )
  );

-- ============================================================================
-- PARTE 8: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de sistema de comunicação interna concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada tabela announcements (mural de avisos)';
  RAISE NOTICE '  2. ✅ Criada tabela notifications (notificações genéricas)';
  RAISE NOTICE '  3. ✅ Criada tabela messages (recados)';
  RAISE NOTICE '  4. ✅ Criada tabela meeting_schedules (agendamento de reuniões)';
  RAISE NOTICE '  5. ✅ Criada tabela report_cards (boletins digitais)';
  RAISE NOTICE '  6. ✅ Criados RPCs para gerenciar comunicação';
  RAISE NOTICE '  7. ✅ RLS policies aplicadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Criar interface no app Gestão Escolar (/communication)';
  RAISE NOTICE '  - Integrar notificações em tempo real';
  RAISE NOTICE '  - Implementar geração de PDF para boletins';
END $$;

