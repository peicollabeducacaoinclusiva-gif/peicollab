# 🚀 SOLUÇÃO RÁPIDA - Professor João sem Alunos

## 🔴 Problema
Professor João tem PEIs atribuídos, mas não vê alunos na lista.

## ✅ Solução em 3 Passos

### 1️⃣ Abra o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Entre no seu projeto
- Clique em **SQL Editor** (ícone de banco de dados no menu lateral)

### 2️⃣ Execute Este SQL

Cole e execute no SQL Editor:

```sql
-- DIAGNÓSTICO: Ver professores afetados
SELECT 
  prof.full_name as professor,
  prof.email,
  COUNT(DISTINCT p.student_id) as alunos_nos_peis,
  COUNT(DISTINCT sa.student_id) as alunos_com_acesso,
  (COUNT(DISTINCT p.student_id) - COUNT(DISTINCT sa.student_id)) as faltando
FROM peis p
JOIN profiles prof ON prof.id = p.assigned_teacher_id
LEFT JOIN student_access sa ON sa.user_id = p.assigned_teacher_id 
  AND sa.student_id = p.student_id
WHERE p.assigned_teacher_id IS NOT NULL
GROUP BY prof.id, prof.full_name, prof.email
HAVING COUNT(DISTINCT p.student_id) > COUNT(DISTINCT sa.student_id)
ORDER BY faltando DESC;

-- CORREÇÃO: Sincronizar student_access com PEIs
INSERT INTO student_access (user_id, student_id)
SELECT DISTINCT 
  p.assigned_teacher_id,
  p.student_id
FROM peis p
WHERE p.assigned_teacher_id IS NOT NULL
  AND p.is_active_version = true
ON CONFLICT (user_id, student_id) DO NOTHING;

-- VERIFICAÇÃO: Confirmar que funcionou (deve retornar 0)
SELECT COUNT(*) as peis_ainda_sem_acesso
FROM peis p
WHERE p.assigned_teacher_id IS NOT NULL
  AND p.is_active_version = true
  AND NOT EXISTS (
    SELECT 1 FROM student_access sa
    WHERE sa.user_id = p.assigned_teacher_id
    AND sa.student_id = p.student_id
  );
```

### 3️⃣ Teste o Login do João
- Login como João
- Entre em "Criar PEI" ou "Dashboard"
- **Agora ele deve ver os alunos!** ✅

## 📄 Documentação Completa
Para mais detalhes, veja: `CORRIGIR_PROBLEMA_PROFESSOR_SEM_ALUNOS.md`

## 🛡️ É Seguro?
✅ **SIM!** O script apenas **cria** registros faltantes  
✅ Não deleta nada  
✅ Pode rodar múltiplas vezes  
✅ Usa `ON CONFLICT DO NOTHING` (não duplica)

## ⏱️ Tempo Estimado
**~2 minutos** para executar tudo

---

**Status**: ⚡ Pronto para usar  
**Testado**: ✅ Sim  
**Risk Level**: 🟢 Baixo (apenas INSERT)




