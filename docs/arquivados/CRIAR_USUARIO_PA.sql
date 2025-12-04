-- ============================================================================
-- CRIAR USUÁRIO PROFISSIONAL DE APOIO PARA TESTE
-- ============================================================================
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- OPÇÃO 1: Usar usuário existente (RECOMENDADO - Mais Rápido)
-- ============================================================================

-- 1. Listar usuários existentes para escolher um
SELECT 
    u.id,
    u.email,
    p.full_name,
    ARRAY_AGG(ur.role) as roles_atuais
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN user_roles ur ON ur.user_id = u.id
GROUP BY u.id, u.email, p.full_name
ORDER BY u.created_at DESC
LIMIT 10;

-- 2. ADICIONAR ROLE DE PA (substitua o UUID pelo ID de um usuário da lista acima)
-- Exemplo: pegue um professor ou crie novo role para usuário existente

INSERT INTO user_roles (user_id, role) 
VALUES (
    '00000000-0000-0000-0000-000000000000', -- ⚠️ SUBSTITUA pelo UUID do usuário
    'support_professional'
)
ON CONFLICT DO NOTHING;

-- 3. VINCULAR PA A UM ALUNO (substitua os UUIDs)
INSERT INTO support_professional_students (
    support_professional_id, 
    student_id,
    assigned_by,
    notes
) 
SELECT 
    '00000000-0000-0000-0000-000000000000', -- ⚠️ UUID do PA (mesmo de cima)
    s.id,                                    -- UUID do primeiro aluno ativo
    '00000000-0000-0000-0000-000000000000', -- ⚠️ UUID de quem atribuiu (coordenador/diretor)
    'Vinculação de teste para validação do sistema'
FROM students s
WHERE s.is_active = true
LIMIT 1;

-- ============================================================================
-- OPÇÃO 2: Criar novo usuário PA do zero (se preferir)
-- ============================================================================

-- ATENÇÃO: A criação de usuário no auth.users requer a Admin API
-- É mais fácil criar pelo Dashboard do Supabase:
-- Authentication → Users → Add User

-- Depois de criar pelo dashboard, execute:

-- Adicionar role
INSERT INTO user_roles (user_id, role) 
VALUES (
    'UUID-DO-NOVO-USUARIO', -- ⚠️ UUID do usuário criado
    'support_professional'
);

-- Vincular a aluno
INSERT INTO support_professional_students (
    support_professional_id, 
    student_id
) 
SELECT 
    'UUID-DO-NOVO-USUARIO',
    id 
FROM students 
WHERE is_active = true 
LIMIT 1;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Ver usuários com role de PA
SELECT 
    u.email,
    p.full_name,
    ur.role,
    COUNT(sps.id) as alunos_vinculados
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN support_professional_students sps ON sps.support_professional_id = u.id AND sps.is_active = true
WHERE ur.role = 'support_professional'
GROUP BY u.email, p.full_name, ur.role;

-- ============================================================================
-- CREDENCIAIS DE TESTE
-- ============================================================================

-- Se você criou um novo usuário, as credenciais são:
-- Email: profissional.apoio@escola.com
-- Senha: A que você definiu no dashboard

-- ============================================================================
-- PRÓXIMOS PASSOS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Usuário Profissional de Apoio configurado!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 COMO TESTAR:';
    RAISE NOTICE '1. Faça login com o usuário PA';
    RAISE NOTICE '2. O Dashboard do PA deve aparecer automaticamente';
    RAISE NOTICE '3. Você verá a lista de alunos vinculados';
    RAISE NOTICE '4. Selecione um aluno';
    RAISE NOTICE '5. Registre um feedback diário';
    RAISE NOTICE '6. Veja o histórico com gráficos';
    RAISE NOTICE '';
END $$;






