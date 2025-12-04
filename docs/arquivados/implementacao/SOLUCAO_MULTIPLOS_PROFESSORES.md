
# 🎯 SOLUÇÃO: Múltiplos Professores por PEI

## 🔍 **PROBLEMA IDENTIFICADO**

Você estava certo! O sistema foi modificado para **PEI vinculado a turmas** com **múltiplos professores colaborando**, mas:

❌ O código ainda busca apenas `student_access` baseado no antigo `assigned_teacher_id`  
❌ A tabela `pei_teachers` não está populando o `student_access`  
❌ João está na tabela `pei_teachers` mas NÃO tem `student_access`

## 📊 **NOVA ESTRUTURA (Implementada)**

```
ALUNO
  ↓ (student_enrollments)
TURMA (6º Ano A)
  ↓ (class_teachers)
PROFESSORES DA TURMA
  - João (Português) ← PRINCIPAL
  - Maria (Matemática)
  - Pedro (História)
  ↓ (Quando PEI é criado)
pei_teachers
  ↓ (deveria criar)
student_access ← ❌ ESTAVA FALTANDO ISSO!
```

## ⚡ **SOLUÇÃO EM 2 ETAPAS**

### ETAPA 1: Corrigir dados existentes (SQL)

Execute: `scripts/fix_student_access_pei_teachers.sql`

**O que faz:**
1. ✅ Mostra professores em `pei_teachers` sem `student_access`
2. ✅ Cria `student_access` para TODOS os professores em `pei_teachers`
3. ✅ Cria trigger para manter sincronizado daqui pra frente
4. ✅ Verifica João, Débora e Carlos

### ETAPA 2: Atualizar código frontend (Opcional)

O código do `CreatePEI.tsx` atualmente busca assim:

```typescript
// CÓDIGO ATUAL (considera apenas assigned_teacher_id)
const { data: accessData } = await supabase
  .from("student_access")
  .select("student_id")
  .eq("user_id", profile.id);
```

**Isso está OK!** Depois que o SQL criar os registros em `student_access`, o código funcionará.

Mas **idealmente**, o código deveria também considerar `pei_teachers`:

```typescript
// CÓDIGO IDEAL (considera pei_teachers)
const { data: accessData } = await supabase
  .from("student_access")
  .select("student_id")
  .eq("user_id", profile.id);

// Se não encontrou nada, buscar via pei_teachers
if (!accessData || accessData.length === 0) {
  const { data: peiTeachersData } = await supabase
    .from("pei_teachers")
    .select("peis(student_id)")
    .eq("teacher_id", profile.id);
  
  // processar...
}
```

**Mas isso não é necessário agora!** O trigger vai garantir a sincronização.

---

## 📋 **EXECUTE AGORA**

### 1️⃣ SQL no Supabase Dashboard

Copie e cole: `scripts/fix_student_access_pei_teachers.sql`

```sql
-- Este é o script principal, resumido aqui:

-- Criar student_access para todos em pei_teachers
INSERT INTO student_access (user_id, student_id)
SELECT DISTINCT 
  pt.teacher_id,
  p.student_id
FROM pei_teachers pt
JOIN peis p ON p.id = pt.pei_id
WHERE p.is_active_version = true
  AND NOT EXISTS (
    SELECT 1 FROM student_access sa
    WHERE sa.user_id = pt.teacher_id
    AND sa.student_id = p.student_id
  );
```

### 2️⃣ Verificar resultado

```sql
-- João tem acesso aos alunos?
SELECT s.name
FROM student_access sa
JOIN students s ON s.id = sa.student_id
JOIN profiles prof ON prof.id = sa.user_id
WHERE prof.full_name ILIKE '%joão%';
```

Deve mostrar: **Débora** e **Carlos**!

### 3️⃣ Testar no sistema

1. **LOGOUT e LOGIN** como João (limpar cache)
2. Ir em **"Criar PEI"**
3. **Alunos devem aparecer!** ✅

---

## 🔄 **Como Funciona Agora**

### Fluxo Completo:

1. **Coordenador cria PEI** para aluno da turma 6º Ano A
2. **Trigger auto_assign_teachers_to_pei** detecta
3. Busca professores em **class_teachers** (João, Maria, Pedro)
4. Adiciona todos em **pei_teachers**
5. **Novo trigger** cria **student_access** para cada um
6. ✅ **João vê o aluno** na lista!

### Quando professor é adicionado manualmente:

1. Coordenador adiciona professor ao PEI
2. INSERT em **pei_teachers**
3. **Trigger** cria **student_access** automaticamente
4. ✅ Professor vê o aluno imediatamente!

---

## 🎯 **Por Que Estava Falhando**

| O que tinha | O que faltava |
|-------------|---------------|
| ✅ Tabela `pei_teachers` | ❌ Não criava `student_access` |
| ✅ Trigger ao criar PEI | ❌ Trigger não funcionava |
| ✅ João em `pei_teachers` | ❌ João NÃO em `student_access` |
| ✅ Código busca `student_access` | ❌ Tabela estava vazia |

---

## ✨ **Benefícios do Novo Modelo**

✅ **Múltiplos professores** colaboram no mesmo PEI  
✅ **Professores por disciplina** (Português, Matemática, etc)  
✅ **Professor principal** (responsável)  
✅ **Permissões granulares** (quem pode editar o quê)  
✅ **Atribuição automática** baseada na turma  

---

## 🆘 **Se Ainda Não Funcionar**

### Verificar se João está em pei_teachers:

```sql
SELECT 
  prof.full_name,
  s.name as aluno,
  pt.subject,
  pt.is_primary
FROM pei_teachers pt
JOIN peis p ON p.id = pt.pei_id
JOIN profiles prof ON prof.id = pt.teacher_id
JOIN students s ON s.id = p.student_id
WHERE prof.full_name ILIKE '%joão%';
```

**Se retornar VAZIO**: João NÃO está em `pei_teachers`!
- Solução: Adicionar João manualmente às turmas via `class_teachers`

**Se retornar dados**: João ESTÁ em `pei_teachers`!
- Execute o script de correção do `student_access`

---

## 📞 **Resumo Executivo**

🔴 **Problema**: Sistema mudou para múltiplos professores, mas `student_access` não foi atualizado  
🟡 **Causa**: Faltava trigger para sincronizar `pei_teachers` → `student_access`  
🟢 **Solução**: Script SQL cria os registros + trigger para futuro

**Tempo**: ~2 minutos  
**Risco**: 🟢 Baixo (apenas INSERT)  
**Status**: ✅ Pronto para usar

---

**Criado**: 2025-02-05  
**Versão**: 2.0 (Múltiplos Professores)

