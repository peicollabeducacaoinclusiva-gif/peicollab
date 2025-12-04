-- ============================================================================
-- MIGRAÇÃO COMPLETA: Importação CSV São Gonçalo
-- Data: 2025-11-05
-- Descrição: Script unificado para executar de uma vez só
-- ============================================================================
-- 
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo
-- 2. Cole no Supabase SQL Editor
-- 3. Clique em "Run"
-- 
-- ============================================================================

-- ============================================================================
-- PARTE 1: LIMPAR FUNÇÕES ANTIGAS (se existirem)
-- ============================================================================

DROP FUNCTION IF EXISTS import_pei_from_csv_row CASCADE;
DROP FUNCTION IF EXISTS generate_goals_from_diagnosis CASCADE;
DROP FUNCTION IF EXISTS generate_referrals_from_diagnosis CASCADE;
DROP FUNCTION IF EXISTS transform_csv_barriers CASCADE;
DROP FUNCTION IF EXISTS create_coordinator_from_email CASCADE;
DROP FUNCTION IF EXISTS get_or_create_coordinator CASCADE;
DROP FUNCTION IF EXISTS list_import_coordinators CASCADE;

-- ============================================================================
-- PARTE 2: INCLUIR MIGRAÇÃO PRINCIPAL
-- ============================================================================
-- 
-- ATENÇÃO: Cole AQUI o conteúdo COMPLETO de:
-- scripts/add_diagnosis_fields_and_import_logic.sql
-- 
-- (Desde a linha "CREATE TABLE IF NOT EXISTS pei_import_batches" 
--  até o final do arquivo)
-- 
-- ============================================================================

-- INSTRUÇÕES:
-- 1. Abra o arquivo: scripts/add_diagnosis_fields_and_import_logic.sql
-- 2. Copie TODO o conteúdo
-- 3. Cole AQUI (substituindo este comentário)
-- 4. Continue com a Parte 3 abaixo

-- ============================================================================
-- PARTE 3: DROPAR FUNÇÃO ANTES DE RECRIAR
-- ============================================================================

-- Dropar função criada na Parte 2
DROP FUNCTION IF EXISTS import_pei_from_csv_row CASCADE;

-- ============================================================================
-- PARTE 4: INCLUIR MIGRAÇÃO DE COORDENADORES
-- ============================================================================
-- 
-- ATENÇÃO: Cole AQUI o conteúdo COMPLETO de:
-- scripts/add_auto_coordinator_creation.sql
-- 
-- (Todo o conteúdo do arquivo)
-- 
-- ============================================================================

-- INSTRUÇÕES:
-- 1. Abra o arquivo: scripts/add_auto_coordinator_creation.sql
-- 2. Copie TODO o conteúdo
-- 3. Cole AQUI (substituindo este comentário)

-- ============================================================================
-- FIM
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ MIGRAÇÃO COMPLETA EXECUTADA COM SUCESSO!           ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Sistema pronto para importação CSV!';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximo passo:';
  RAISE NOTICE '  npx ts-node scripts/import_csv_pei.ts arquivo.csv';
  RAISE NOTICE '';
END $$;

