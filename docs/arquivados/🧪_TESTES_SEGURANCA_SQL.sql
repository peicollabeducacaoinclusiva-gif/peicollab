-- ============================================================================
-- TESTES DE SEGURANÇA - BANCO DE DADOS
-- ============================================================================
-- Sistema: PEI Collab
-- Data: 08/01/2025
-- Objetivo: Verificar RLS, permissões e conformidade LGPD
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR TABELAS SEM RLS
-- ============================================================================

SELECT 
    '🔴 CRÍTICO: Tabela SEM RLS ativada' as status,
    schemaname,
    tablename
FROM pg_tables t
WHERE schemaname = 'public'
AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = t.tablename
    AND n.nspname = t.schemaname
    AND c.relrowsecurity = true
)
ORDER BY tablename;

-- ============================================================================
-- 2. VERIFICAR TABELAS SEM POLÍTICAS RLS
-- ============================================================================

SELECT 
    '⚠️ ATENÇÃO: Tabela com RLS mas SEM políticas' as status,
    t.tablename,
    'Criar pelo menos uma política' as recomendacao
FROM pg_tables t
WHERE t.schemaname = 'public'
AND EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = t.tablename
    AND n.nspname = t.schemaname
    AND c.relrowsecurity = true
)
AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = t.schemaname
    AND p.tablename = t.tablename
)
ORDER BY t.tablename;

-- ============================================================================
-- 3. VERIFICAR POLÍTICAS PERMISSIVAS (PERIGOSAS)
-- ============================================================================

SELECT 
    '🔴 PERIGO: Política muito permissiva' as status,
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN qual IS NULL THEN 'SEM FILTRO (permite tudo)'
        ELSE pg_get_expr(qual, (schemaname||'.'||tablename)::regclass)
    END as condicao
FROM pg_policies
WHERE schemaname = 'public'
AND (
    qual IS NULL  -- Sem condição
    OR pg_get_expr(qual, (schemaname||'.'||tablename)::regclass) LIKE '%true%'  -- Sempre true
)
ORDER BY tablename, policyname;

-- ============================================================================
-- 4. LISTAR DADOS PESSOAIS SENSÍVEIS (LGPD)
-- ============================================================================

SELECT 
    'ℹ️ DADOS SENSÍVEIS IDENTIFICADOS' as status,
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name ILIKE '%cpf%' THEN '🔴 DADO SENSÍVEL'
        WHEN column_name ILIKE '%rg%' THEN '🔴 DADO SENSÍVEL'
        WHEN column_name ILIKE '%diagn%' THEN '🔴 DADO SENSÍVEL - SAÚDE'
        WHEN column_name ILIKE '%laudo%' THEN '🔴 DADO SENSÍVEL - SAÚDE'
        WHEN column_name ILIKE '%defici%' THEN '🔴 DADO SENSÍVEL - SAÚDE'
        WHEN column_name ILIKE '%birth%' THEN '⚠️ DADO PESSOAL'
        WHEN column_name ILIKE '%address%' THEN '⚠️ DADO PESSOAL'
        WHEN column_name ILIKE '%phone%' THEN '⚠️ DADO PESSOAL'
        WHEN column_name ILIKE '%email%' THEN '⚠️ DADO PESSOAL'
        WHEN column_name ILIKE '%race%' THEN '🔴 DADO SENSÍVEL - ORIGEM RACIAL'
        ELSE 'OUTRO'
    END as classificacao_lgpd
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
    column_name ILIKE '%cpf%'
    OR column_name ILIKE '%rg%'
    OR column_name ILIKE '%diagn%'
    OR column_name ILIKE '%laudo%'
    OR column_name ILIKE '%defici%'
    OR column_name ILIKE '%birth%'
    OR column_name ILIKE '%address%'
    OR column_name ILIKE '%phone%'
    OR column_name ILIKE '%email%'
    OR column_name ILIKE '%race%'
)
ORDER BY 
    CASE 
        WHEN column_name ILIKE '%cpf%' OR column_name ILIKE '%diagn%' OR column_name ILIKE '%race%' THEN 1
        ELSE 2
    END,
    table_name, column_name;

-- ============================================================================
-- 5. VERIFICAR CAMPOS SEM CRIPTOGRAFIA
-- ============================================================================

SELECT 
    '⚠️ CAMPO SENSÍVEL SEM CRIPTOGRAFIA' as status,
    table_name,
    column_name,
    data_type,
    'Considere usar pgcrypto ou criptografar no app' as recomendacao
FROM information_schema.columns
WHERE table_schema = 'public'
AND (column_name ILIKE '%cpf%' OR column_name ILIKE '%rg%')
AND data_type NOT IN ('bytea', 'uuid')  -- Não é binário criptografado
ORDER BY table_name, column_name;

-- ============================================================================
-- 6. VERIFICAR TABELAS SEM SOFT DELETE
-- ============================================================================

SELECT 
    'ℹ️ Tabela sem soft-delete (direito ao esquecimento)' as status,
    table_name,
    'Adicionar coluna deleted_at ou is_deleted' as recomendacao
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = t.table_schema
    AND c.table_name = t.table_name
    AND (c.column_name = 'deleted_at' OR c.column_name = 'is_deleted')
)
ORDER BY table_name;

-- ============================================================================
-- 7. VERIFICAR EXISTÊNCIA DE TABELA DE CONSENTIMENTO
-- ============================================================================

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'consent_logs'
        ) THEN '✅ Tabela de consentimento existe'
        ELSE '🔴 CRÍTICO: Tabela de consentimento NÃO existe'
    END as status,
    'LGPD Art. 14 - Necessário para dados de crianças' as motivo;

-- ============================================================================
-- 8. VERIFICAR EXISTÊNCIA DE TABELA DE LOGS DE ACESSO
-- ============================================================================

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'access_logs'
        ) THEN '✅ Tabela de logs de acesso existe'
        ELSE '🔴 CRÍTICO: Tabela de logs de acesso NÃO existe'
    END as status,
    'LGPD Art. 37 - Necessário para auditoria' as motivo;

-- ============================================================================
-- 9. VERIFICAR RETENÇÃO DE DADOS (updated_at antigo)
-- ============================================================================

-- Verificar se há mecanismo de retenção/purga
SELECT 
    'ℹ️ RETENÇÃO DE DADOS' as status,
    table_name,
    COUNT(*) as total_registros,
    'Implementar política de retenção' as recomendacao
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = t.table_schema
    AND c.table_name = t.table_name
    AND c.column_name = 'updated_at'
)
GROUP BY table_name
ORDER BY table_name;

-- ============================================================================
-- 10. RESUMO DE SEGURANÇA
-- ============================================================================

WITH security_summary AS (
    SELECT 
        COUNT(DISTINCT t.tablename) as total_tabelas,
        COUNT(DISTINCT CASE 
            WHEN EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = t.tablename
                AND n.nspname = t.schemaname
                AND c.relrowsecurity = true
            ) THEN t.tablename 
        END) as tabelas_com_rls,
        COUNT(DISTINCT p.tablename) as tabelas_com_policies
    FROM pg_tables t
    LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
    WHERE t.schemaname = 'public'
)
SELECT 
    '📊 RESUMO DE SEGURANÇA' as tipo,
    total_tabelas as total_tabelas,
    tabelas_com_rls as tabelas_com_rls,
    tabelas_com_policies as tabelas_com_policies,
    ROUND((tabelas_com_rls::numeric / total_tabelas * 100), 2) as percentual_rls,
    CASE 
        WHEN tabelas_com_rls = total_tabelas THEN '✅ TODAS protegidas'
        WHEN tabelas_com_rls >= total_tabelas * 0.8 THEN '⚠️ MAIORIA protegida'
        ELSE '🔴 MUITAS sem proteção'
    END as status_geral
FROM security_summary;

-- ============================================================================
-- 11. LISTAR TODAS AS POLICIES EXISTENTES
-- ============================================================================

SELECT 
    '📋 POLÍTICAS RLS EXISTENTES' as tipo,
    schemaname,
    tablename,
    policyname,
    cmd as operacao,
    CASE 
        WHEN qual IS NULL THEN 'SEM FILTRO'
        ELSE pg_get_expr(qual, (schemaname||'.'||tablename)::regclass)
    END as condicao_using,
    CASE 
        WHEN with_check IS NULL THEN 'N/A'
        ELSE pg_get_expr(with_check, (schemaname||'.'||tablename)::regclass)
    END as condicao_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- FIM DOS TESTES
-- ============================================================================

SELECT 
    '✅ TESTES CONCLUÍDOS' as status,
    'Revisar todos os resultados acima' as acao,
    NOW() as data_teste;






