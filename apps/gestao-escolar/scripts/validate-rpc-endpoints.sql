-- ============================================================================
-- Script SQL para validar se os endpoints RPC da Superficha existem
-- Execute no Supabase SQL Editor ou via psql
-- ============================================================================

-- Verificar se as funções existem
SELECT 
    routine_name as "Função",
    routine_type as "Tipo",
    CASE 
        WHEN routine_name IN (
            'get_student_complete_profile',
            'get_student_risk_indicators',
            'get_student_suggestions',
            'update_student_field',
            'get_student_activity_timeline'
        ) THEN '✅ Existe'
        ELSE '❌ Não encontrada'
    END as "Status"
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_student_complete_profile',
    'get_student_risk_indicators',
    'get_student_suggestions',
    'update_student_field',
    'get_student_activity_timeline'
)
ORDER BY routine_name;

-- Verificar permissões das funções
SELECT 
    p.proname as "Função",
    pg_get_function_identity_arguments(p.oid) as "Argumentos",
    CASE 
        WHEN has_function_privilege('authenticated', p.oid, 'EXECUTE') THEN '✅ Autorizado'
        ELSE '❌ Não autorizado'
    END as "Permissão Authenticated"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'get_student_complete_profile',
    'get_student_risk_indicators',
    'get_student_suggestions',
    'update_student_field',
    'get_student_activity_timeline'
)
ORDER BY p.proname;

-- Verificar comentários das funções
SELECT 
    p.proname as "Função",
    obj_description(p.oid, 'pg_proc') as "Comentário"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'get_student_complete_profile',
    'get_student_risk_indicators',
    'get_student_suggestions',
    'update_student_field',
    'get_student_activity_timeline'
)
ORDER BY p.proname;

-- Contar total de funções esperadas vs encontradas
WITH expected_functions AS (
    SELECT unnest(ARRAY[
        'get_student_complete_profile',
        'get_student_risk_indicators',
        'get_student_suggestions',
        'update_student_field',
        'get_student_activity_timeline'
    ]) as function_name
),
found_functions AS (
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN (SELECT function_name FROM expected_functions)
)
SELECT 
    (SELECT COUNT(*) FROM expected_functions) as "Total Esperado",
    (SELECT COUNT(*) FROM found_functions) as "Total Encontrado",
    CASE 
        WHEN (SELECT COUNT(*) FROM expected_functions) = (SELECT COUNT(*) FROM found_functions)
        THEN '✅ Todas as funções existem'
        ELSE '❌ Algumas funções estão faltando'
    END as "Status";

