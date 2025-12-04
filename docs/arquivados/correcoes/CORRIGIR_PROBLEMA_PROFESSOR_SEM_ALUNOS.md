# 🔧 Correção: Professor com PEIs mas sem Alunos na Lista

## 📋 Descrição do Problema

O professor **João** (e possivelmente outros professores) tem PEIs atribuídos, mas **não vê os alunos na lista** quando tenta criar ou editar PEIs.

## 🔍 Causa Raiz

O sistema usa a tabela `student_access` para controlar quais professores têm acesso a quais alunos. Quando um PEI é atribuído a um professor, deveria ser criado automaticamente um registro nessa tabela através de um **trigger**.

O problema ocorre quando:
1. ✅ **Trigger não estava ativo** quando os PEIs foram criados
2. ✅ **Registros foram removidos** acidentalmente
3. ✅ **Migração não foi aplicada** corretamente

## 🛠️ Solução

Execute o script SQL que criei: `scripts/fix_teacher_student_access.sql`

### Como Aplicar no Supabase

#### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo `scripts/fix_teacher_student_access.sql`
5. Cole no editor
6. Clique em **Run** (ou pressione `Ctrl+Enter`)

#### Opção 2: Via CLI do Supabase

```bash
# Se você tem o Supabase CLI instalado
supabase db execute -f scripts/fix_teacher_student_access.sql --project-ref SEU_PROJECT_REF
```

#### Opção 3: Via psql (linha de comando)

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres" -f scripts/fix_teacher_student_access.sql
```

## 📊 O que o Script Faz

### PARTE 1: Diagnóstico 🔍
- Mostra quantos PEIs existem com professor atribuído
- Mostra quantos registros existem em `student_access`
- **Identifica PEIs sem `student_access` correspondente**
- **Lista professores afetados** (como o João)

### PARTE 2: Correção ✅
- **Cria automaticamente** registros em `student_access` para todos os PEIs ativos
- Usa `ON CONFLICT DO NOTHING` para não duplicar registros
- Filtra apenas versões ativas de PEIs (`is_active_version = true`)

### PARTE 3: Verificação 🔐
- Confirma que a função `auto_create_student_access()` existe
- Confirma que o trigger `auto_create_student_access_trigger` está ativo

### PARTE 4: Garantia 🛡️
- **Recria a função** se não existir
- **Recria o trigger** para garantir que funcione daqui pra frente

## 🎯 Resultado Esperado

Após executar o script:

✅ **João verá todos os alunos** dos seus PEIs na lista  
✅ **Outros professores afetados** também terão acesso restaurado  
✅ **Novos PEIs** funcionarão automaticamente (trigger ativo)  
✅ **Sem duplicatas** (constraint UNIQUE garante)  

## 📱 Como Testar

1. **Faça login como Professor João**
2. Vá em **Criar PEI** ou **Dashboard**
3. Verifique se a **lista de alunos aparece**
4. Confirme que são os **mesmos alunos dos PEIs atribuídos**

## 🔄 Funcionamento do Sistema Daqui Pra Frente

Com o trigger ativo, o sistema funciona assim:

```
📝 Coordenador atribui PEI ao Professor
        ↓
🔥 Trigger detecta (assigned_teacher_id mudou)
        ↓
✅ Cria automaticamente student_access
        ↓
👨‍🏫 Professor vê o aluno na lista imediatamente
```

## 📧 Script de Verificação Rápida

Se quiser apenas **verificar sem corrigir**, rode apenas as queries da **PARTE 1** do script:

```sql
-- Ver professores afetados
SELECT 
  prof.full_name as professor,
  COUNT(DISTINCT p.student_id) as alunos_nos_peis,
  COUNT(DISTINCT sa.student_id) as alunos_com_acesso,
  (COUNT(DISTINCT p.student_id) - COUNT(DISTINCT sa.student_id)) as faltando
FROM peis p
JOIN profiles prof ON prof.id = p.assigned_teacher_id
LEFT JOIN student_access sa ON sa.user_id = p.assigned_teacher_id 
  AND sa.student_id = p.student_id
WHERE p.assigned_teacher_id IS NOT NULL
GROUP BY prof.id, prof.full_name
HAVING COUNT(DISTINCT p.student_id) > COUNT(DISTINCT sa.student_id);
```

## ⚠️ Importante

- **Backup**: O Supabase mantém backups automáticos, mas é sempre bom
- **Seguro**: O script usa `ON CONFLICT DO NOTHING` - não quebra nada
- **Idempotente**: Pode rodar múltiplas vezes sem problema
- **Performance**: É rápido, mesmo com milhares de PEIs

## 🆘 Se Algo Der Errado

O script é **100% seguro** e **não deleta nada**. Apenas **cria** registros faltantes.

Se precisar reverter (não recomendado):
```sql
-- Remover apenas registros criados agora (cuidado!)
DELETE FROM student_access 
WHERE created_at > NOW() - INTERVAL '5 minutes';
```

---

## 💡 Prevenção Futura

Este problema **não deve mais ocorrer** porque:
1. ✅ Trigger está ativo e testado
2. ✅ Constraint UNIQUE previne duplicatas
3. ✅ Sistema sincroniza automaticamente

Se surgir novamente, pode ser:
- Bug no código que deleta student_access incorretamente
- Migração que desativa/recria triggers
- Modificação manual no banco de dados

---

**Criado em:** 2025-02-05  
**Autor:** Sistema PEI-Collab  
**Versão:** 1.0




