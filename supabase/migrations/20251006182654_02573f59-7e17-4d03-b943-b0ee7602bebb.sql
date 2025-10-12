-- Criar nova tabela family_access_tokens
CREATE TABLE IF NOT EXISTS public.family_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  pei_id UUID NOT NULL REFERENCES public.peis(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER NOT NULL DEFAULT 0
);

-- Índices
CREATE INDEX idx_family_tokens_student ON public.family_access_tokens(student_id);
CREATE INDEX idx_family_tokens_pei ON public.family_access_tokens(pei_id);
CREATE INDEX idx_family_tokens_hash ON public.family_access_tokens(token_hash);
CREATE INDEX idx_family_tokens_expires ON public.family_access_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.family_access_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Coordinators can manage tokens in their tenant"
ON public.family_access_tokens
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.peis p
    JOIN public.profiles pr ON pr.tenant_id = p.tenant_id
    WHERE p.id = family_access_tokens.pei_id
    AND pr.id = auth.uid()
    AND pr.role IN ('coordinator', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.peis p
    JOIN public.profiles pr ON pr.tenant_id = p.tenant_id
    WHERE p.id = family_access_tokens.pei_id
    AND pr.id = auth.uid()
    AND pr.role IN ('coordinator', 'superadmin')
  )
);

-- Gerar token seguro (32 caracteres hex)
CREATE OR REPLACE FUNCTION public.generate_secure_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token TEXT;
  exists_token BOOLEAN;
BEGIN
  LOOP
    token := encode(gen_random_bytes(16), 'hex');
    SELECT EXISTS(SELECT 1 FROM family_access_tokens WHERE token = token) INTO exists_token;
    IF NOT exists_token THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN token;
END;
$$;

-- Hash simples usando MD5 (para compatibilidade)
CREATE OR REPLACE FUNCTION public.hash_token(token_value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT md5(token_value || 'pei_collab_salt_2025');
$$;

-- Validar token
CREATE OR REPLACE FUNCTION public.validate_family_token(token_value TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_hash_value TEXT;
  token_record RECORD;
BEGIN
  token_hash_value := hash_token(token_value);
  
  SELECT 
    fat.id,
    fat.student_id,
    fat.pei_id,
    fat.expires_at,
    s.name as student_name,
    t.name as tenant_name
  INTO token_record
  FROM family_access_tokens fat
  JOIN students s ON s.id = fat.student_id
  JOIN peis p ON p.id = fat.pei_id
  JOIN tenants t ON t.id = s.tenant_id
  WHERE fat.token_hash = token_hash_value
  AND fat.expires_at > NOW()
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Token inválido ou expirado'
    );
  END IF;
  
  UPDATE family_access_tokens
  SET 
    last_accessed_at = NOW(),
    access_count = access_count + 1
  WHERE token_hash = token_hash_value;
  
  RETURN json_build_object(
    'valid', true,
    'student_id', token_record.student_id,
    'pei_id', token_record.pei_id,
    'student_name', token_record.student_name,
    'tenant_name', token_record.tenant_name,
    'expires_at', token_record.expires_at
  );
END;
$$;

-- Limpar tokens expirados
CREATE OR REPLACE FUNCTION public.clean_expired_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM family_access_tokens
  WHERE expires_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Migrar dados existentes
INSERT INTO public.family_access_tokens (
  pei_id,
  student_id,
  token,
  token_hash,
  expires_at,
  created_by,
  created_at,
  last_accessed_at
)
SELECT 
  pft.pei_id,
  p.student_id,
  pft.token,
  hash_token(pft.token),
  pft.expires_at,
  p.created_by,
  pft.created_at,
  pft.last_accessed_at
FROM pei_family_tokens pft
JOIN peis p ON p.id = pft.pei_id
WHERE pft.expires_at > NOW()
ON CONFLICT (token) DO NOTHING;

-- RLS para família acessar PEI
CREATE POLICY "Family can view PEI with valid token"
ON public.peis
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT pei_id 
    FROM family_access_tokens
    WHERE token_hash = hash_token(COALESCE(
      split_part(auth.jwt()->>'email', '@', 1),
      ''
    ))
    AND expires_at > NOW()
  )
);

-- RLS para família ver estudante
CREATE POLICY "Family can view student with valid token"
ON public.students
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT student_id 
    FROM family_access_tokens
    WHERE token_hash = hash_token(COALESCE(
      split_part(auth.jwt()->>'email', '@', 1),
      ''
    ))
    AND expires_at > NOW()
  )
);