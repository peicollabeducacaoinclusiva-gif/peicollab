# 🔍 DIAGNÓSTICO URGENTE - Professor João

## ⚠️ Situação

Você executou o script de correção, mas o professor João **ainda vê "Nenhum aluno atribuído"** ao tentar editar PEIs.

## 🎯 Próximo Passo

Execute o script de **diagnóstico detalhado** para ver exatamente o que está acontecendo.

---

## 📋 EXECUTE ESTE SQL NO SUPABASE

**Arquivo:** `scripts/diagnostico_detalhado_joao.sql`

Ou copie daqui:

```sql
-- ============================================================
-- DIAGNÓSTICO DETALHADO: Professor João
-- ============================================================

-- 1️⃣ Encontrar o ID do professor João
SELECT 
  '👤 PROFESSOR JOÃO' as info,
  id as user_id,
  full_name,
  school_id,
  tenant_id
FROM profiles
WHERE full_name ILIKE '%joão%'
ORDER BY full_name;

-- 2️⃣ Verificar PEIs atribuídos ao João
SELECT 
  '📝 PEIs DO JOÃO' as info,
  p.id as pei_id,
  p.assigned_teacher_id,
  s.name as aluno_nome,
  s.id as aluno_id,
  p.status,
  p.is_active_version
FROM peis p
JOIN students s ON s.id = p.student_id
WHERE p.assigned_teacher_id IN (
  SELECT id FROM profiles WHERE full_name ILIKE '%joão%'
)
ORDER BY s.name;

-- 3️⃣ Verificar se existe student_access para o João
SELECT 
  '✅ REGISTROS EM STUDENT_ACCESS' as info,
  sa.id,
  sa.user_id as professor_id,
  sa.student_id,
  s.name as aluno_nome,
  prof.full_name as professor_nome
FROM student_access sa
JOIN students s ON s.id = sa.student_id
JOIN profiles prof ON prof.id = sa.user_id
WHERE sa.user_id IN (
  SELECT id FROM profiles WHERE full_name ILIKE '%joão%'
);

-- 4️⃣ Identificar alunos FALTANDO em student_access
SELECT 
  '❌ ALUNOS FALTANDO' as info,
  s.name as aluno_nome,
  p.id as pei_id,
  prof.full_name as professor_nome
FROM peis p
JOIN students s ON s.id = p.student_id
JOIN profiles prof ON prof.id = p.assigned_teacher_id
WHERE p.assigned_teacher_id IN (
  SELECT id FROM profiles WHERE full_name ILIKE '%joão%'
)
AND p.is_active_version = true
AND NOT EXISTS (
  SELECT 1 FROM student_access sa
  WHERE sa.user_id = p.assigned_teacher_id
  AND sa.student_id = p.student_id
);

-- 5️⃣ VERIFICAR Débora e Carlos especificamente
SELECT 
  '🎯 DÉBORA E CARLOS' as info,
  s.name as student_name,
  EXISTS (
    SELECT 1 FROM peis p 
    WHERE p.student_id = s.id 
    AND p.assigned_teacher_id IN (SELECT id FROM profiles WHERE full_name ILIKE '%joão%')
    AND p.is_active_version = true
  ) as tem_pei_com_joao,
  EXISTS (
    SELECT 1 FROM student_access sa
    WHERE sa.student_id = s.id
    AND sa.user_id IN (SELECT id FROM profiles WHERE full_name ILIKE '%joão%')
  ) as tem_student_access
FROM students s
WHERE s.name ILIKE '%débora%' 
   OR s.name ILIKE '%carlos%'
ORDER BY s.name;

-- 6️⃣ CORREÇÃO DIRECIONADA para João
DO $$
DECLARE
  v_joao_id UUID;
  v_count INTEGER;
BEGIN
  -- Pegar o ID do João
  SELECT id INTO v_joao_id FROM profiles WHERE full_name ILIKE '%joão%' LIMIT 1;
  
  IF v_joao_id IS NULL THEN
    RAISE NOTICE '❌ Professor João não encontrado!';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ ID do João: %', v_joao_id;
  
  -- Criar student_access para os alunos dos PEIs do João
  INSERT INTO student_access (user_id, student_id)
  SELECT DISTINCT 
    p.assigned_teacher_id,
    p.student_id
  FROM peis p
  WHERE p.assigned_teacher_id = v_joao_id
    AND p.is_active_version = true
  ON CONFLICT (user_id, student_id) DO NOTHING;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✅ Registros criados para João: %', v_count;
END $$;

-- 7️⃣ VERIFICAÇÃO FINAL
SELECT 
  '✅ FINAL' as info,
  COUNT(*) as total_student_access_joao
FROM student_access sa
WHERE sa.user_id IN (
  SELECT id FROM profiles WHERE full_name ILIKE '%joão%'
);
```

---

## 📊 O que Esse Script Faz

### Queries 1-3: **DIAGNÓSTICO** 🔍
- Mostra o ID do João
- Lista os PEIs do João (incluindo Débora e Carlos)
- Mostra os registros em `student_access`

### Query 4: **IDENTIFICA PROBLEMA** ❌
- Lista alunos que estão nos PEIs MAS faltam em `student_access`

### Query 5: **FOCO EM DÉBORA E CARLOS** 🎯
- Verifica especificamente esses dois alunos

### Query 6: **CORREÇÃO CIRÚRGICA** ✅
- Cria `student_access` **apenas para o João**
- Usa o ID exato do professor

### Query 7: **VERIFICAÇÃO** ✅
- Confirma quantos registros o João tem agora

---

## 🎯 O que Esperar

Se tudo estiver OK, você verá algo como:

```
👤 PROFESSOR JOÃO
user_id: abc123-...
full_name: João Silva
```

```
📝 PEIs DO JOÃO
Débora Lima Rodrigues | abc-...
Carlos Eduardo Silva  | def-...
```

```
❌ ALUNOS FALTANDO
Débora Lima Rodrigues
Carlos Eduardo Silva
```

```
✅ Registros criados para João: 2
```

```
✅ FINAL
total_student_access_joao: 2
```

---

## ⚡ Após Executar

1. **Faça logout e login novamente** como João
2. Tente **editar um dos PEIs**
3. Os alunos devem aparecer agora! ✅

---

## 🆘 Se AINDA Não Funcionar

Me envie o resultado das queries, especialmente:
- Query 1: ID do João
- Query 4: Alunos faltando
- Query 6: Quantos registros foram criados

Vou investigar mais fundo! 🔍

---

**Status**: 🔬 Diagnóstico Avançado  
**Tempo**: ~30 segundos  
**Ação**: ✅ Cria registros + mostra o que está errado

