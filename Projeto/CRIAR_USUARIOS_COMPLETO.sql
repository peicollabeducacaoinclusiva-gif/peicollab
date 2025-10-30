-- ============================================================================
-- CRIAR REDES E USUÁRIOS PADRÃO DAS 3 REDES MUNICIPAIS
-- ============================================================================
-- Execute este script no Supabase SQL Editor para criar tudo de uma vez
-- Data: 2025-01-28
-- ============================================================================

-- ============================================================================
-- PARTE 1: CRIAR AS REDES (TENANTS)
-- ============================================================================

-- São Gonçalo dos Campos (SGC)
INSERT INTO public.tenants (id, network_name, is_active, created_at, updated_at)
VALUES (
  '62d992ab-ef6b-4d13-b9c9-6cdfdcb59451'::uuid,
  'São Gonçalo dos Campos',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE 
SET network_name = EXCLUDED.network_name, 
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- Santanópolis (SAN)
INSERT INTO public.tenants (id, network_name, is_active, created_at, updated_at)
VALUES (
  '08f6772d-97ae-43bf-949d-bed4c6c038de'::uuid,
  'Santanópolis',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE 
SET network_name = EXCLUDED.network_name, 
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- Santa Bárbara (SBA)
INSERT INTO public.tenants (id, network_name, is_active, created_at, updated_at)
VALUES (
  '77d9af39-0f4d-4702-9692-62277e13e42e'::uuid,
  'Santa Bárbara',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE 
SET network_name = EXCLUDED.network_name, 
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- ============================================================================
-- PARTE 2: VERIFICAR REDES CRIADAS
-- ============================================================================

SELECT '✅ Redes criadas:' as status;
SELECT network_name, id::text as tenant_id FROM public.tenants 
WHERE id IN (
  '62d992ab-ef6b-4d13-b9c9-6cdfdcb59451'::uuid,
  '08f6772d-97ae-43bf-949d-bed4c6c038de'::uuid,
  '77d9af39-0f4d-4702-9692-62277e13e42e'::uuid
)
ORDER BY network_name;

-- ============================================================================
-- PARTE 3: NOTAS SOBRE CRIAÇÃO DE USUÁRIOS
-- ============================================================================

-- IMPORTANTE: Os usuários devem ser criados via Dashboard do Superadmin
-- ou via Supabase Auth Dashboard por questões de segurança
--
-- Para criar os usuários, siga os passos em: CREDENCIAIS_REDES.md
--
-- Após criar os usuários no auth, você pode usar este SQL para verificar:
--
-- SELECT p.full_name, p.id, p.tenant_id, ur.role 
-- FROM public.profiles p
-- JOIN public.user_roles ur ON ur.user_id = p.id
-- WHERE p.tenant_id IN (
--   '62d992ab-ef6b-4d13-b9c9-6cdfdcb59451'::uuid,
--   '08f6772d-97ae-43bf-949d-bed4c6c038de'::uuid,
--   '77d9af39-0f4d-4702-9692-62277e13e42e'::uuid
-- )
-- ORDER BY p.full_name;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

