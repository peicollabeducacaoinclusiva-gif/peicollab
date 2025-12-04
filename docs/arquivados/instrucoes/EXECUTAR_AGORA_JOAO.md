# ⚡ EXECUTE ESTE SQL AGORA (Versão Limpa)

## ⚠️ O Erro que Você Teve

O erro `policy "authenticated_read_tenants" already exists` aconteceu porque você tentou executar uma **migração completa** que já foi aplicada.

## ✅ Solução: Execute Apenas a Correção

### 📋 COPIE E COLE ESTE SQL:

```sql
-- ============================================================
-- CORREÇÃO: Professor sem alunos na lista
-- APENAS SINCRONIZA student_access COM PEIs
-- ============================================================

-- 1. DIAGNÓSTICO: Ver quem está afetado
SELECT 
  '🔍 Professores Afetados' as info,
  prof.full_name as professor,
  COUNT(DISTINCT p.student_id) as alunos_nos_peis,
  COUNT(DISTINCT sa.student_id) as alunos_com_acesso,
  (COUNT(DISTINCT p.student_id) - COUNT(DISTINCT sa.student_id)) as faltando
FROM peis p
JOIN profiles prof ON prof.id = p.assigned_teacher_id
LEFT JOIN student_access sa 
  ON sa.user_id = p.assigned_teacher_id 
  AND sa.student_id = p.student_id
WHERE p.assigned_teacher_id IS NOT NULL
  AND p.is_active_version = true
GROUP BY prof.id, prof.full_name
HAVING COUNT(DISTINCT p.student_id) > COUNT(DISTINCT sa.student_id)
ORDER BY faltando DESC;

-- 2. CORREÇÃO: Criar registros faltantes
INSERT INTO student_access (user_id, student_id)
SELECT DISTINCT 
  p.assigned_teacher_id,
  p.student_id
FROM peis p
WHERE p.assigned_teacher_id IS NOT NULL
  AND p.is_active_version = true
  AND NOT EXISTS (
    SELECT 1 FROM student_access sa
    WHERE sa.user_id = p.assigned_teacher_id
    AND sa.student_id = p.student_id
  );

-- 3. VERIFICAÇÃO: Confirmar que funcionou (deve ser 0)
SELECT 
  '✅ VERIFICAÇÃO' as info,
  COUNT(*) as peis_ainda_sem_acesso,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ RESOLVIDO!'
    ELSE '⚠️ Há ' || COUNT(*) || ' ainda sem acesso'
  END as status
FROM peis p
WHERE p.assigned_teacher_id IS NOT NULL
  AND p.is_active_version = true
  AND NOT EXISTS (
    SELECT 1 FROM student_access sa
    WHERE sa.user_id = p.assigned_teacher_id
    AND sa.student_id = p.student_id
  );
```

---

## 🎯 Onde Executar

1. **Supabase Dashboard** → https://supabase.com/dashboard
2. Abra seu projeto
3. Clique em **SQL Editor** (menu lateral esquerdo)
4. Cole o SQL acima
5. Clique em **RUN** ou pressione `Ctrl+Enter`

---

## 📊 O que Vai Acontecer

### Query 1: DIAGNÓSTICO 🔍
Vai mostrar uma tabela tipo:

| professor | alunos_nos_peis | alunos_com_acesso | faltando |
|-----------|-----------------|-------------------|----------|
| João Silva | 5 | 0 | 5 |

Isso mostra que **João tem 5 alunos nos PEIs mas 0 com acesso**.

### Query 2: CORREÇÃO ✅
```
INSERT 0 5
```
Isso significa que **5 registros foram criados** em `student_access`.

### Query 3: VERIFICAÇÃO ✅
```
✅ RESOLVIDO!
peis_ainda_sem_acesso: 0
```

---

## ⚡ Depois de Executar

1. **Faça login como João** no sistema
2. Vá em **Criar PEI** ou **Dashboard**
3. **Os alunos devem aparecer agora!** 🎉

---

## 🛡️ É 100% Seguro

- ✅ **Não mexe em policies** (por isso o erro anterior)
- ✅ **Não cria triggers**
- ✅ **Só faz INSERT** em `student_access`
- ✅ Verifica antes para não duplicar (`NOT EXISTS`)
- ✅ Pode rodar múltiplas vezes sem problema

---

## 🆘 Se Der Erro

**Erro de permissão?**
- Você precisa estar logado como **Owner/Admin** no Supabase

**Outro erro?**
- Me mande o erro exato que vou ajustar o script

---

**Status**: ⚡ Pronto para executar  
**Tempo**: ~10 segundos  
**Risco**: 🟢 Zero (apenas INSERT)

