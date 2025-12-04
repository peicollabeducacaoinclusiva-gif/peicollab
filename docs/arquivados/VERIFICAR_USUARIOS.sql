-- ============================================================================
-- VERIFICAR ESTADO ATUAL DO BANCO
-- ============================================================================
-- Execute para ver quais usuários existem
-- ============================================================================

-- 1. Ver TODOS os usuários
SELECT 
    'USUÁRIOS EXISTENTES:' as tipo,
    u.id,
    u.email,
    u.created_at
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 10;

-- 2. Ver usuários com perfis
SELECT 
    'USUÁRIOS COM PERFIL:' as tipo,
    u.id,
    u.email,
    p.full_name,
    p.is_active
FROM auth.users u
JOIN profiles p ON p.id = u.id
LIMIT 10;

-- 3. Ver roles dos usuários
SELECT 
    'ROLES:' as tipo,
    u.email,
    ur.role
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
ORDER BY u.email;

-- 4. Ver alunos ativos
SELECT 
    'ALUNOS ATIVOS:' as tipo,
    id,
    name,
    class_name
FROM students
WHERE is_active = true
LIMIT 5;

-- 5. Ver PAs já existentes (se houver)
SELECT 
    'PAs EXISTENTES:' as tipo,
    u.email,
    COUNT(sps.id) as alunos_vinculados,
    COUNT(spf.id) as feedbacks_total
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN support_professional_students sps ON sps.support_professional_id = u.id
LEFT JOIN support_professional_feedbacks spf ON spf.support_professional_id = u.id
WHERE ur.role = 'support_professional'
GROUP BY u.email;

