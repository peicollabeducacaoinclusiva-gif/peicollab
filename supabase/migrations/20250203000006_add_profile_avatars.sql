-- Migration: Add Profile Avatars with Emojis
-- Created: 2025-02-03
-- Description: Adiciona campo de emoji/avatar aos perfis de usuário

-- ============================================================================
-- ADICIONAR CAMPO DE AVATAR
-- ============================================================================

-- Adicionar coluna de emoji à tabela profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS avatar_emoji VARCHAR(10) DEFAULT '👤';

-- Adicionar coluna de cor de fundo do avatar
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(20) DEFAULT 'blue';

-- Índice para busca (opcional)
CREATE INDEX IF NOT EXISTS idx_profiles_avatar ON profiles(avatar_emoji);

-- ============================================================================
-- FUNÇÃO PARA ATUALIZAR AVATAR
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_avatar(
  p_user_id UUID,
  p_emoji VARCHAR(10),
  p_color VARCHAR(20) DEFAULT 'blue'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET 
    avatar_emoji = p_emoji,
    avatar_color = p_color,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- EMOJIS PADRÃO POR ROLE
-- ============================================================================

-- Função para definir emoji padrão baseado no role
CREATE OR REPLACE FUNCTION set_default_avatar_by_role()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_emoji VARCHAR(10);
  v_color VARCHAR(20);
BEGIN
  -- Obter o role principal do usuário
  SELECT ur.role INTO v_role
  FROM user_roles ur
  WHERE ur.user_id = NEW.id
  ORDER BY 
    CASE ur.role
      WHEN 'superadmin' THEN 1
      WHEN 'education_secretary' THEN 2
      WHEN 'school_director' THEN 3
      WHEN 'coordinator' THEN 4
      WHEN 'teacher' THEN 5
      ELSE 6
    END
  LIMIT 1;
  
  -- Definir emoji e cor padrão baseado no role
  CASE v_role
    WHEN 'superadmin' THEN
      v_emoji := '👑';
      v_color := 'purple';
    WHEN 'education_secretary' THEN
      v_emoji := '🎓';
      v_color := 'indigo';
    WHEN 'school_director' THEN
      v_emoji := '🏫';
      v_color := 'blue';
    WHEN 'coordinator' THEN
      v_emoji := '📋';
      v_color := 'green';
    WHEN 'teacher' THEN
      v_emoji := '👨‍🏫';
      v_color := 'teal';
    WHEN 'aee_teacher' THEN
      v_emoji := '♿';
      v_color := 'cyan';
    WHEN 'specialist' THEN
      v_emoji := '🩺';
      v_color := 'pink';
    WHEN 'family' THEN
      v_emoji := '👨‍👩‍👧';
      v_color := 'orange';
    ELSE
      v_emoji := '👤';
      v_color := 'gray';
  END CASE;
  
  -- Atualizar apenas se ainda não tem emoji personalizado
  IF NEW.avatar_emoji IS NULL OR NEW.avatar_emoji = '👤' THEN
    NEW.avatar_emoji := v_emoji;
    NEW.avatar_color := v_color;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger apenas em INSERT (novos usuários)
DROP TRIGGER IF EXISTS set_default_avatar_trigger ON profiles;
CREATE TRIGGER set_default_avatar_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_default_avatar_by_role();

-- ============================================================================
-- ATUALIZAR USUÁRIOS EXISTENTES
-- ============================================================================

-- Atualizar emojis padrão para usuários existentes baseado no role
DO $$
DECLARE
  v_profile RECORD;
  v_role TEXT;
  v_emoji VARCHAR(10);
  v_color VARCHAR(20);
BEGIN
  FOR v_profile IN SELECT id FROM profiles WHERE avatar_emoji IS NULL OR avatar_emoji = '👤'
  LOOP
    -- Obter role principal
    SELECT ur.role INTO v_role
    FROM user_roles ur
    WHERE ur.user_id = v_profile.id
    ORDER BY 
      CASE ur.role
        WHEN 'superadmin' THEN 1
        WHEN 'education_secretary' THEN 2
        WHEN 'school_director' THEN 3
        WHEN 'coordinator' THEN 4
        WHEN 'teacher' THEN 5
        ELSE 6
      END
    LIMIT 1;
    
    -- Definir emoji
    CASE v_role
      WHEN 'superadmin' THEN
        v_emoji := '👑'; v_color := 'purple';
      WHEN 'education_secretary' THEN
        v_emoji := '🎓'; v_color := 'indigo';
      WHEN 'school_director' THEN
        v_emoji := '🏫'; v_color := 'blue';
      WHEN 'coordinator' THEN
        v_emoji := '📋'; v_color := 'green';
      WHEN 'teacher' THEN
        v_emoji := '👨‍🏫'; v_color := 'teal';
      WHEN 'aee_teacher' THEN
        v_emoji := '♿'; v_color := 'cyan';
      WHEN 'specialist' THEN
        v_emoji := '🩺'; v_color := 'pink';
      WHEN 'family' THEN
        v_emoji := '👨‍👩‍👧'; v_color := 'orange';
      ELSE
        v_emoji := '👤'; v_color := 'gray';
    END CASE;
    
    -- Atualizar
    UPDATE profiles
    SET 
      avatar_emoji = v_emoji,
      avatar_color = v_color
    WHERE id = v_profile.id;
  END LOOP;
  
  RAISE NOTICE '✅ Avatares padrão configurados para usuários existentes';
END $$;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON COLUMN profiles.avatar_emoji IS 
  'Emoji usado como avatar do usuário (ex: 👨‍🏫, 👩‍🏫, 📋, 🎓)';

COMMENT ON COLUMN profiles.avatar_color IS 
  'Cor de fundo do avatar (blue, green, purple, orange, etc.)';

COMMENT ON FUNCTION update_user_avatar(UUID, VARCHAR, VARCHAR) IS 
  'Atualiza o emoji e cor do avatar do usuário';

-- ============================================================================
-- LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de avatares concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações:';
  RAISE NOTICE '  1. ✅ Campo avatar_emoji adicionado';
  RAISE NOTICE '  2. ✅ Campo avatar_color adicionado';
  RAISE NOTICE '  3. ✅ Emojis padrão configurados por role:';
  RAISE NOTICE '      👑 Superadmin (purple)';
  RAISE NOTICE '      🎓 Secretário de Educação (indigo)';
  RAISE NOTICE '      🏫 Diretor Escolar (blue)';
  RAISE NOTICE '      📋 Coordenador (green)';
  RAISE NOTICE '      👨‍🏫 Professor (teal)';
  RAISE NOTICE '      ♿ Professor AEE (cyan)';
  RAISE NOTICE '      🩺 Especialista (pink)';
  RAISE NOTICE '      👨‍👩‍👧 Família (orange)';
  RAISE NOTICE '  4. ✅ Usuários existentes atualizados';
  RAISE NOTICE '  5. ✅ Trigger para novos usuários configurado';
END $$;

