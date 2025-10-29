-- 1. Inconsistência no Modelo de Dados: Remover campo 'role' deprecated de 'profiles'
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- Criar view de compatibilidade (opcional, mas recomendado para mitigar quebras)
CREATE OR REPLACE VIEW profiles_with_legacy_role AS
SELECT 
  p.*,
  (SELECT ur.role FROM user_roles ur WHERE ur.user_id = p.id AND ur.role != 'family' ORDER BY ur.role LIMIT 1) as legacy_role
FROM profiles p;

-- 2. Versionamento de PEI com Risco de Inconsistência: Implementar trigger robusto
CREATE OR REPLACE FUNCTION ensure_single_active_pei()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a nova linha está sendo marcada como ativa
  IF NEW.is_active_version = true THEN
    -- Desativar todas as outras versões ativas para o mesmo aluno
    UPDATE peis 
    SET is_active_version = false
    WHERE student_id = NEW.student_id 
      AND id != NEW.id 
      AND is_active_version = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar o trigger
CREATE OR REPLACE TRIGGER enforce_single_active_pei
  BEFORE INSERT OR UPDATE ON peis
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_pei();

-- 3. Segurança dos Tokens Familiares: Adicionar campos de segurança
ALTER TABLE family_access_tokens ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 10;
ALTER TABLE family_access_tokens ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0;
ALTER TABLE family_access_tokens ADD COLUMN IF NOT EXISTS last_ip_address TEXT;
ALTER TABLE family_access_tokens ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT FALSE;

-- Função melhorada de validação de token
CREATE OR REPLACE FUNCTION validate_family_token_secure(
  _token TEXT,
  _ip_address TEXT DEFAULT NULL
) RETURNS TABLE(valid BOOLEAN, message TEXT, pei_id UUID) AS $$
DECLARE
  v_token RECORD;
BEGIN
  -- Buscar token (usando token_hash e comparando com crypt)
  SELECT * INTO v_token 
  FROM family_access_tokens 
  WHERE token_hash = crypt(_token, token_hash)
    AND expires_at > NOW()
    AND NOT used;
  
  -- 1. Validação: Token encontrado e não expirado/usado
  IF v_token IS NULL THEN
    RETURN QUERY SELECT false, 'Token inválido ou expirado'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- 2. Validação: Verificar limite de usos
  IF v_token.current_uses >= v_token.max_uses THEN
    UPDATE family_access_tokens SET used = true WHERE id = v_token.id;
    RETURN QUERY SELECT false, 'Token excedeu limite de usos'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- 3. Validação: Verificar mudança suspeita de IP (após 3 usos iniciais)
  IF v_token.last_ip_address IS NOT NULL 
     AND v_token.last_ip_address != _ip_address 
     AND v_token.current_uses >= 3 THEN
    RETURN QUERY SELECT false, 'Acesso suspeito detectado: Mudança de IP'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- 4. Atualizar uso
  UPDATE family_access_tokens 
  SET current_uses = current_uses + 1,
      last_accessed_at = NOW(),
      last_ip_address = COALESCE(_ip_address, v_token.last_ip_address) -- Mantém o IP se o novo for NULL
  WHERE id = v_token.id;
  
  RETURN QUERY SELECT true, 'Token válido'::TEXT, v_token.pei_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Performance em Queries Complexas: Materialized View para Dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_network_dashboard AS
SELECT 
  t.id as tenant_id,
  t.network_name,
  COUNT(DISTINCT s.id) as total_schools,
  COUNT(DISTINCT st.id) as total_students,
  COUNT(DISTINCT CASE WHEN p.is_active_version THEN p.id END) as total_active_peis,
  COUNT(DISTINCT CASE WHEN p.status = 'draft' AND p.is_active_version THEN p.id END) as peis_draft,
  COUNT(DISTINCT CASE WHEN p.status = 'pending' AND p.is_active_version THEN p.id END) as peis_pending,
  COUNT(DISTINCT CASE WHEN p.status = 'approved' AND p.is_active_version THEN p.id END) as peis_approved,
  COUNT(DISTINCT pr.id) as total_users,
  MAX(p.updated_at) as last_pei_update
FROM tenants t
LEFT JOIN schools s ON s.tenant_id = t.id
LEFT JOIN students st ON st.school_id = s.id
LEFT JOIN peis p ON p.student_id = st.id
LEFT JOIN profiles pr ON pr.tenant_id = t.id
GROUP BY t.id, t.network_name;

-- Índice para refresh
CREATE UNIQUE INDEX IF NOT EXISTS mv_network_dashboard_tenant_id ON mv_network_dashboard(tenant_id);

-- Função de refresh
CREATE OR REPLACE FUNCTION refresh_network_dashboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_network_dashboard;
END;
$$ LANGUAGE plpgsql;

-- 6. Auditoria Incompleta: Tabela e Trigger de Auditoria Universal
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON audit_log(changed_at DESC);

-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old_data = to_jsonb(OLD);
    v_new_data = NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data = to_jsonb(OLD);
    v_new_data = to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_old_data = NULL;
    v_new_data = to_jsonb(NEW);
  END IF;
  
  INSERT INTO audit_log (
    table_name, 
    record_id, 
    action, 
    old_data, 
    new_data, 
    changed_by
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    v_old_data,
    v_new_data,
    auth.uid() -- Assume que a função auth.uid() está disponível no Supabase/PostgreSQL
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar em tabelas críticas (Exemplos)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_tenants') THEN
    CREATE TRIGGER audit_tenants AFTER INSERT OR UPDATE OR DELETE ON tenants
      FOR EACH ROW EXECUTE FUNCTION audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_peis') THEN
    CREATE TRIGGER audit_peis AFTER INSERT OR UPDATE OR DELETE ON peis
      FOR EACH ROW EXECUTE FUNCTION audit_trigger();
  END IF;
END $$;

-- 8. Full-Text Search Otimizado: Adicionar coluna e função de busca
ALTER TABLE students ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Função para atualizar o search_vector
CREATE OR REPLACE FUNCTION update_student_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.mother_name, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.father_name, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.email, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualização automática
CREATE OR REPLACE TRIGGER update_student_search
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_student_search_vector();

-- Índice GIN para busca rápida
CREATE INDEX IF NOT EXISTS idx_students_search ON students USING GIN(search_vector);

-- Função de busca otimizada
CREATE OR REPLACE FUNCTION search_students(
  _query TEXT,
  _school_id UUID DEFAULT NULL,
  _limit INTEGER DEFAULT 20
) RETURNS TABLE(
  id UUID,
  name TEXT,
  date_of_birth DATE,
  school_name TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.date_of_birth,
    sc.school_name,
    ts_rank(s.search_vector, websearch_to_tsquery('portuguese', _query)) as rank
  FROM students s
  JOIN schools sc ON sc.id = s.school_id
  WHERE s.search_vector @@ websearch_to_tsquery('portuguese', _query)
    AND (_school_id IS NULL OR s.school_id = _school_id)
  ORDER BY rank DESC
  LIMIT _limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ----------------------------------------------------------------------------
-- 9. POLÍTICAS RLS PARA NOVOS ROLES
-- ----------------------------------------------------------------------------

-- Função para verificar se usuário é education_secretary
CREATE OR REPLACE FUNCTION public.is_education_secretary(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
      AND role = 'education_secretary'::app_role
  );
$$;

-- Função para verificar se usuário é school_director
CREATE OR REPLACE FUNCTION public.is_school_director(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
      AND role = 'school_director'::app_role
  );
$$;

-- Função para obter escola do usuário (school_director)
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public
AS $$
  SELECT school_id FROM public.profiles WHERE id = _user_id;
$$;

-- Função para verificar acesso à escola
CREATE OR REPLACE FUNCTION public.user_has_school_access(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
      AND school_id = _school_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_schools 
    WHERE user_id = _user_id 
      AND school_id = _school_id
  );
$$;

-- RLS Policies para SCHOOLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Education Secretary pode ver todas as escolas da sua rede
CREATE POLICY "education_secretary_can_view_schools" ON public.schools
  FOR SELECT USING (
    is_education_secretary(auth.uid()) AND 
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- School Director pode ver apenas sua escola
CREATE POLICY "school_director_can_view_own_school" ON public.schools
  FOR SELECT USING (
    is_school_director(auth.uid()) AND 
    id = get_user_school_id(auth.uid())
  );

-- Education Secretary pode gerenciar escolas da sua rede
CREATE POLICY "education_secretary_can_manage_schools" ON public.schools
  FOR ALL USING (
    is_education_secretary(auth.uid()) AND 
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- RLS Policies para STUDENTS
-- Education Secretary pode ver todos os alunos da rede
CREATE POLICY "education_secretary_can_view_students" ON public.students
  FOR SELECT USING (
    is_education_secretary(auth.uid()) AND 
    school_id IN (
      SELECT id FROM public.schools 
      WHERE tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- School Director pode ver alunos da sua escola
CREATE POLICY "school_director_can_view_students" ON public.students
  FOR SELECT USING (
    is_school_director(auth.uid()) AND 
    school_id = get_user_school_id(auth.uid())
  );

-- School Director pode gerenciar alunos da sua escola
CREATE POLICY "school_director_can_manage_students" ON public.students
  FOR ALL USING (
    is_school_director(auth.uid()) AND 
    school_id = get_user_school_id(auth.uid())
  );

-- RLS Policies para PEIS
-- Education Secretary pode ver todos os PEIs da rede
CREATE POLICY "education_secretary_can_view_peis" ON public.peis
  FOR SELECT USING (
    is_education_secretary(auth.uid()) AND 
    school_id IN (
      SELECT id FROM public.schools 
      WHERE tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- School Director pode ver PEIs da sua escola
CREATE POLICY "school_director_can_view_peis" ON public.peis
  FOR SELECT USING (
    is_school_director(auth.uid()) AND 
    school_id = get_user_school_id(auth.uid())
  );

-- RLS Policies para PROFILES
-- Education Secretary pode ver todos os perfis da rede
CREATE POLICY "education_secretary_can_view_profiles" ON public.profiles
  FOR SELECT USING (
    is_education_secretary(auth.uid()) AND 
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- School Director pode ver perfis da sua escola
CREATE POLICY "school_director_can_view_profiles" ON public.profiles
  FOR SELECT USING (
    is_school_director(auth.uid()) AND 
    school_id = get_user_school_id(auth.uid())
  );

-- School Director pode gerenciar perfis da sua escola
CREATE POLICY "school_director_can_manage_profiles" ON public.profiles
  FOR ALL USING (
    is_school_director(auth.uid()) AND 
    school_id = get_user_school_id(auth.uid())
  );

-- RLS Policies para FAMILY_ACCESS_TOKENS
-- Education Secretary pode gerenciar tokens da rede
CREATE POLICY "education_secretary_can_manage_tokens" ON public.family_access_tokens
  FOR ALL USING (
    is_education_secretary(auth.uid()) AND 
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.schools sc ON sc.id = s.school_id
      WHERE sc.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- School Director pode gerenciar tokens da sua escola
CREATE POLICY "school_director_can_manage_tokens" ON public.family_access_tokens
  FOR ALL USING (
    is_school_director(auth.uid()) AND 
    student_id IN (
      SELECT id FROM public.students 
      WHERE school_id = get_user_school_id(auth.uid())
    )
  );

-- RLS Policies para PEI_HISTORY
-- Education Secretary pode ver histórico da rede
CREATE POLICY "education_secretary_can_view_history" ON public.pei_history
  FOR SELECT USING (
    is_education_secretary(auth.uid()) AND 
    pei_id IN (
      SELECT p.id FROM public.peis p
      JOIN public.schools s ON s.id = p.school_id
      WHERE s.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- School Director pode ver histórico da sua escola
CREATE POLICY "school_director_can_view_history" ON public.pei_history
  FOR SELECT USING (
    is_school_director(auth.uid()) AND 
    pei_id IN (
      SELECT p.id FROM public.peis p
      WHERE p.school_id = get_user_school_id(auth.uid())
    )
  );

-- RLS Policies para AUDIT_LOG
-- Education Secretary pode ver logs da rede
CREATE POLICY "education_secretary_can_view_audit" ON public.audit_log
  FOR SELECT USING (
    is_education_secretary(auth.uid()) AND 
    table_name IN ('schools', 'students', 'peis', 'profiles') AND
    record_id IN (
      SELECT id FROM public.schools 
      WHERE tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
      UNION
      SELECT id FROM public.students s
      JOIN public.schools sc ON sc.id = s.school_id
      WHERE sc.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
      UNION
      SELECT id FROM public.peis p
      JOIN public.schools s ON s.id = p.school_id
      WHERE s.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
      UNION
      SELECT id FROM public.profiles 
      WHERE tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- School Director pode ver logs da sua escola
CREATE POLICY "school_director_can_view_audit" ON public.audit_log
  FOR SELECT USING (
    is_school_director(auth.uid()) AND 
    table_name IN ('students', 'peis', 'profiles') AND
    record_id IN (
      SELECT id FROM public.students 
      WHERE school_id = get_user_school_id(auth.uid())
      UNION
      SELECT id FROM public.peis 
      WHERE school_id = get_user_school_id(auth.uid())
      UNION
      SELECT id FROM public.profiles 
      WHERE school_id = get_user_school_id(auth.uid())
    )
  );

