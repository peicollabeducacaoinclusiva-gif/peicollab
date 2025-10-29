-- Criar usuários de teste
-- Este script cria usuários diretamente na tabela auth.users

-- Inserir usuários na tabela auth.users
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES 
-- Superadmin
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'superadmin@teste.com',
    crypt('Teste123!', gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Super Admin Sistema", "role": "superadmin", "tenant_id": "00000000-0000-0000-0000-000000000001", "school_id": "00000000-0000-0000-0000-000000000002"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
),
-- Coordenador
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'coordenador@teste.com',
    crypt('Teste123!', gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Maria Coordenadora", "role": "coordinator", "tenant_id": "00000000-0000-0000-0000-000000000001", "school_id": "00000000-0000-0000-0000-000000000002"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
),
-- Professor
(
    '33333333-3333-3333-3333-333333333333'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'professor@teste.com',
    crypt('Teste123!', gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "João Professor", "role": "teacher", "tenant_id": "00000000-0000-0000-0000-000000000001", "school_id": "00000000-0000-0000-0000-000000000002"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
),
-- Gestor Escolar
(
    '44444444-4444-4444-4444-444444444444'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'gestor@teste.com',
    crypt('Teste123!', gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Carlos Gestor Escolar", "role": "school_manager", "tenant_id": "00000000-0000-0000-0000-000000000001", "school_id": "00000000-0000-0000-0000-000000000002"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
),
-- Professor AEE
(
    '55555555-5555-5555-5555-555555555555'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'aee@teste.com',
    crypt('Teste123!', gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Ana Professora AEE", "role": "aee_teacher", "tenant_id": "00000000-0000-0000-0000-000000000001", "school_id": "00000000-0000-0000-0000-000000000002"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
),
-- Especialista
(
    '66666666-6666-6666-6666-666666666666'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'especialista@teste.com',
    crypt('Teste123!', gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Dr. Pedro Especialista", "role": "specialist", "tenant_id": "00000000-0000-0000-0000-000000000001", "school_id": "00000000-0000-0000-0000-000000000002"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
),
-- Família
(
    '77777777-7777-7777-7777-777777777777'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'familia@teste.com',
    crypt('Teste123!', gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Pedro Família", "role": "family", "tenant_id": "00000000-0000-0000-0000-000000000001", "school_id": "00000000-0000-0000-0000-000000000002"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
)
ON CONFLICT (id) DO NOTHING;

-- Inserir perfis dos usuários
INSERT INTO public.profiles (
    id,
    full_name,
    role,
    tenant_id,
    school_id,
    is_active
) VALUES 
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Super Admin Sistema',
    'superadmin',
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    true
),
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Maria Coordenadora',
    'coordinator',
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    true
),
(
    '33333333-3333-3333-3333-333333333333'::uuid,
    'João Professor',
    'teacher',
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    true
),
(
    '44444444-4444-4444-4444-444444444444'::uuid,
    'Carlos Gestor Escolar',
    'school_manager',
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    true
),
(
    '55555555-5555-5555-5555-555555555555'::uuid,
    'Ana Professora AEE',
    'aee_teacher',
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    true
),
(
    '66666666-6666-6666-6666-666666666666'::uuid,
    'Dr. Pedro Especialista',
    'specialist',
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    true
),
(
    '77777777-7777-7777-7777-777777777777'::uuid,
    'Pedro Família',
    'family',
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    true
)
ON CONFLICT (id) DO NOTHING;

-- Inserir relacionamentos user_schools
INSERT INTO public.user_schools (user_id, school_id) VALUES 
('11111111-1111-1111-1111-111111111111'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
('22222222-2222-2222-2222-222222222222'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
('33333333-3333-3333-3333-333333333333'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
('44444444-4444-4444-4444-444444444444'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
('55555555-5555-5555-5555-555555555555'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
('66666666-6666-6666-6666-666666666666'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
('77777777-7777-7777-7777-777777777777'::uuid, '00000000-0000-0000-0000-000000000002'::uuid)
ON CONFLICT (user_id, school_id) DO NOTHING;

-- Inserir relacionamentos user_tenants
INSERT INTO public.user_tenants (user_id, tenant_id) VALUES 
('11111111-1111-1111-1111-111111111111'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
('22222222-2222-2222-2222-222222222222'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
('33333333-3333-3333-3333-333333333333'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
('44444444-4444-4444-4444-444444444444'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
('55555555-5555-5555-5555-555555555555'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
('66666666-6666-6666-6666-666666666666'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
('77777777-7777-7777-7777-777777777777'::uuid, '00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (user_id, tenant_id) DO NOTHING;




