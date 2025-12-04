-- ============================================================================
-- MIGRAÇÃO COMPLETA: Sistema de Importação CSV
-- Data: 2025-11-05
-- 
-- EXECUTAR APENAS ESTE ARQUIVO - JÁ INCLUI TUDO!
-- 
-- Copie TODO este conteúdo e cole no Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PASSO 1: Limpar funções antigas (evitar conflitos)
-- ============================================================================

DROP FUNCTION IF EXISTS import_pei_from_csv_row CASCADE;
DROP FUNCTION IF EXISTS generate_goals_from_diagnosis CASCADE;
DROP FUNCTION IF EXISTS generate_referrals_from_diagnosis CASCADE;
DROP FUNCTION IF EXISTS transform_csv_barriers CASCADE;
DROP FUNCTION IF EXISTS create_coordinator_from_email CASCADE;
DROP FUNCTION IF EXISTS get_or_create_coordinator CASCADE;
DROP FUNCTION IF EXISTS list_import_coordinators CASCADE;

DO $$
BEGIN
  RAISE NOTICE '🔄 Limpando funções antigas...';
END $$;

