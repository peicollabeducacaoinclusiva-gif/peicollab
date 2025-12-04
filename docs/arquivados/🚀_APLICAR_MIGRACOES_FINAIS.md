# 🚀 GUIA: APLICAR MIGRAÇÕES FINAIS

**Data**: 09/11/2025  
**Apps**: Plano AEE V2.0 + Gestão Escolar  

---

## 📋 Migrações a Aplicar

Existem **3 novas migrações** SQL que precisam ser aplicadas:

| # | Arquivo | App | Descrição | Linhas |
|---|---------|-----|-----------|--------|
| 1 | `20250210000001_gestao_escolar_expansion.sql` | Gestão Escolar | Expandir schema + criar tabelas | 662 |
| 2 | `20250210000002_aee_visitas_encaminhamentos.sql` | Plano AEE | Visitas e encaminhamentos | 340 |
| 3 | `20250210000003_aee_notifications.sql` | Plano AEE | Notificações inteligentes | 438 |
| **Total** | **3 arquivos** | - | - | **1.440** |

---

## ⚡ Opção 1: Aplicar via Supabase CLI (RECOMENDADO)

```bash
# 1. Verificar migrações pendentes
supabase db diff

# 2. Aplicar todas as migrações
supabase db push

# 3. Verificar se aplicou com sucesso
supabase db remote commit
```

---

## 📝 Opção 2: Aplicar Manualmente via SQL Editor

### Passo 1: Gestão Escolar (Base)

```sql
-- Copie e cole o conteúdo de:
-- supabase/migrations/20250210000001_gestao_escolar_expansion.sql

-- Este script:
-- ✅ Expande students (40+ campos)
-- ✅ Expande profiles (15+ campos)
-- ✅ Expande schools (5+ campos)
-- ✅ Expande peis (2+ campos)
-- ✅ Cria grade_levels (6 campos)
-- ✅ Cria subjects (15 campos)
-- ✅ Cria enrollments (20 campos)
-- ✅ Cria attendance (12 campos)
-- ✅ Cria grades (15 campos)
-- ✅ Cria 3 triggers (sync_pei_class, notify_pei_attendance, compare_grade_with_pei)
-- ✅ Cria 4 funções auxiliares
-- ✅ Cria 25+ índices
-- ✅ Cria 15+ políticas RLS
```

**✅ Sucesso esperado**: 
```
Query executed successfully
```

---

### Passo 2: Visitas e Encaminhamentos

```sql
-- Copie e cole o conteúdo de:
-- supabase/migrations/20250210000002_aee_visitas_encaminhamentos.sql

-- Este script:
-- ✅ Cria aee_school_visits (26 campos)
-- ✅ Cria aee_referrals (27 campos)
-- ✅ Cria triggers de updated_at
-- ✅ Cria funções get_plan_visits_stats() e get_plan_referrals_stats()
-- ✅ Cria 6 índices para visitas
-- ✅ Cria 7 índices para encaminhamentos
-- ✅ Cria 4 políticas RLS
```

**✅ Sucesso esperado**: 
```
Query executed successfully
```

---

### Passo 3: Notificações Inteligentes

```sql
-- Copie e cole o conteúdo de:
-- supabase/migrations/20250210000003_aee_notifications.sql

-- Este script:
-- ✅ Cria aee_notifications (20 campos)
-- ✅ Cria função create_aee_notification()
-- ✅ Cria função check_ending_cycles()
-- ✅ Cria função check_low_attendance()
-- ✅ Cria função check_pending_referrals()
-- ✅ Cria função check_visit_followups()
-- ✅ Cria função run_notification_checks() (master)
-- ✅ Cria 6 índices
-- ✅ Cria 3 políticas RLS
```

**✅ Sucesso esperado**: 
```
Query executed successfully
```

---

### Passo 4: Configurar Cron Job (IMPORTANTE)

```sql
-- Agendar verificações diárias de notificações
SELECT cron.schedule(
    'run-aee-notifications',
    '0 8 * * *', -- Todo dia às 8h da manhã
    $$ SELECT run_notification_checks(); $$
);
```

**✅ Sucesso esperado**: 
```
Cron job scheduled successfully
```

**Verificar**:
```sql
SELECT * FROM cron.job;
```

---

## 🧪 Testar as Migrações

Use os scripts de teste criados:

### Teste Rápido
```sql
-- Arquivo: ⚡_TESTE_RAPIDO_AGORA.md
-- Execute as queries para validar:
-- 1. Criação de dados de teste
-- 2. Validação de triggers
-- 3. Validação de estatísticas
```

### Teste Completo
```sql
-- Arquivo: 🧪_TESTAR_INTEGRACAO_GESTAO_PEI.sql
-- Execute todas as seções:
-- 1. Setup de dados (10 queries)
-- 2. Validações de schema (5 queries)
-- 3. Testes de triggers (6 cenários)
-- 4. Testes de funções (4 queries)
```

---

## ✅ Checklist de Validação

Após aplicar as migrações, verifique:

### Database
- [ ] Tabela `grade_levels` existe
- [ ] Tabela `subjects` existe
- [ ] Tabela `enrollments` existe
- [ ] Tabela `attendance` existe com partial indexes
- [ ] Tabela `grades` existe
- [ ] Tabela `aee_school_visits` existe
- [ ] Tabela `aee_referrals` existe
- [ ] Tabela `aee_notifications` existe
- [ ] Coluna `students.name` existe
- [ ] Coluna `students.logradouro` existe
- [ ] Coluna `enrollments.bolsista` existe
- [ ] Coluna `peis.enrollment_id` existe

### Triggers
- [ ] Trigger `sync_pei_class` existe
- [ ] Trigger `notify_pei_attendance` existe
- [ ] Trigger `compare_grade_with_pei` existe
- [ ] Trigger `update_visits_updated_at` existe
- [ ] Trigger `update_referrals_updated_at` existe

### Funções
- [ ] Função `get_student_academic_context()` existe
- [ ] Função `get_plan_visits_stats()` existe
- [ ] Função `get_plan_referrals_stats()` existe
- [ ] Função `create_aee_notification()` existe
- [ ] Função `check_ending_cycles()` existe
- [ ] Função `check_low_attendance()` existe
- [ ] Função `check_pending_referrals()` existe
- [ ] Função `check_visit_followups()` existe
- [ ] Função `run_notification_checks()` existe

### RLS
- [ ] RLS habilitado em `grade_levels`
- [ ] RLS habilitado em `subjects`
- [ ] RLS habilitado em `enrollments`
- [ ] RLS habilitado em `attendance`
- [ ] RLS habilitado em `grades`
- [ ] RLS habilitado em `aee_school_visits`
- [ ] RLS habilitado em `aee_referrals`
- [ ] RLS habilitado em `aee_notifications`

---

## 🔄 Se Houver Erro

### Erro: "relation already exists"
```sql
-- A migração é idempotente, pode executar novamente
-- Todos os CREATE usam IF NOT EXISTS
-- Todos os DROP usam IF EXISTS
```

### Erro: "column does not exist"
```sql
-- Verifique se migration anterior foi aplicada
-- Execute migrations em ordem: 001 → 002 → 003
```

### Erro: "foreign key constraint"
```sql
-- A migração 001 reordena as tabelas corretamente
-- Se persistir, execute manualmente na ordem:
-- 1. CREATE TABLE grade_levels
-- 2. CREATE TABLE subjects
-- 3. CREATE TABLE enrollments
-- 4. ALTER TABLE peis ADD COLUMN enrollment_id
-- 5. CREATE TABLE attendance
-- 6. CREATE TABLE grades
```

---

## 🎯 Após Aplicar com Sucesso

### 1. Reiniciar o Servidor Dev
```bash
# Parar o servidor
Ctrl+C

# Limpar cache
rm -rf dist/ .vite/

# Reinstalar se necessário
pnpm install

# Reiniciar
pnpm dev
```

### 2. Testar no Frontend
1. Abrir página de Alunos
2. Criar novo aluno com formulário expandido
3. Matricular aluno em turma
4. Registrar frequência (testar offline)
5. Lançar notas
6. Ver boletim
7. Abrir dashboard

### 3. Verificar Integrações
1. Criar PEI para aluno matriculado
2. Verificar se turma foi sincronizada no PEI
3. Registrar frequência baixa (< 75%)
4. Verificar se notificação foi criada
5. Lançar nota divergente da meta do PEI
6. Verificar alerta no comparativo

---

## 🎉 Pronto!

Após aplicar as 3 migrações e configurar o cron job, o sistema estará **100% funcional** e **pronto para uso**!

✅ **Gestão Escolar**: Operacional  
✅ **Plano AEE V2.0**: Operacional  
✅ **Integração**: Funcionando  
✅ **Notificações**: Ativas  
✅ **PWA Offline**: Funcionando  

🚀 **BOA IMPLEMENTAÇÃO!** 🚀

