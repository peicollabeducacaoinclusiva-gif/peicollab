-- =====================================================
-- Migração: Adicionar Policy RLS para Coordenadores 
--           visualizarem tokens de acesso familiar
-- Data: 06/11/2024
-- Descrição: Permite que coordenadores vejam e gerenciem
--            tokens de acesso familiar da sua escola
-- =====================================================

-- Habilitar RLS se ainda não estiver
ALTER TABLE public.family_access_tokens ENABLE ROW LEVEL SECURITY;

-- Remover policy se já existir (para evitar erro de duplicação)
DROP POLICY IF EXISTS "coordinator_can_manage_tokens" ON public.family_access_tokens;

-- Criar policy para coordenadores gerenciarem tokens da sua escola
CREATE POLICY "coordinator_can_manage_tokens" 
ON public.family_access_tokens
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    JOIN public.students s ON s.id = family_access_tokens.student_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'coordinator'
      AND s.school_id = p.school_id
  )
);

-- Comentários para documentação
COMMENT ON POLICY "coordinator_can_manage_tokens" ON public.family_access_tokens IS 
'Permite que coordenadores vejam e gerenciem todos os tokens de acesso familiar dos alunos da sua escola';

-- =====================================================
-- Verificação da Policy
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Policy RLS para coordenadores adicionada com sucesso!';
  RAISE NOTICE 'Coordenadores agora podem ver e gerenciar tokens de acesso familiar.';
END;
$$;

