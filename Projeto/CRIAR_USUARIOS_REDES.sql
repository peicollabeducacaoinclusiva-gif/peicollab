-- ============================================================================
-- CRIAR REDES DE ENSINO E USUÁRIOS PADRÃO
-- ============================================================================
-- Este script cria as 3 redes municipais e seus usuários padrão
-- Data: 2025-01-28
-- ============================================================================

-- São Gonçalo dos Campos (SGC)
INSERT INTO public.tenants (id, network_name, is_active)
VALUES (
  '62d992ab-ef6b-4d13-b9c9-6cdfdcb59451'::uuid,
  'São Gonçalo dos Campos',
  true
)
ON CONFLICT (id) DO UPDATE 
SET network_name = EXCLUDED.network_name, is_active = EXCLUDED.is_active;

-- Santanópolis (SAN)
INSERT INTO public.tenants (id, network_name, is_active)
VALUES (
  '08f6772d-97ae-43bf-949d-bed4c6c038de'::uuid,
  'Santanópolis',
  true
)
ON CONFLICT (id) DO UPDATE 
SET network_name = EXCLUDED.network_name, is_active = EXCLUDED.is_active;

-- Santa Bárbara (SBA)
INSERT INTO public.tenants (id, network_name, is_active)
VALUES (
  '77d9af39-0f4d-4702-9692-62277e13e42e'::uuid,
  'Santa Bárbara',
  true
)
ON CONFLICT (id) DO UPDATE 
SET network_name = EXCLUDED.network_name, is_active = EXCLUDED.is_active;

-- ============================================================================
-- NOTA: Os usuários devem ser criados manualmente pelo dashboard do superadmin
-- ou via Supabase Auth Dashboard devido às políticas de segurança
-- ============================================================================

-- Credenciais sugeridas após criar os usuários:

-- São Gonçalo dos Campos (SGC):
--   admin@sgc.edu.br / SGC@123456 (education_secretary)
--   coord@sgc.edu.br / SGC@123456 (coordinator)

-- Santanópolis (SAN):
--   admin@sant.edu.br / SAN@123456 (education_secretary)
--   coord@sant.edu.br / SAN@123456 (coordinator)

-- Santa Bárbara (SBA):
--   admin@sba.edu.br / SBA@123456 (education_secretary)
--   coord@sba.edu.br / SBA@123456 (coordinator)

