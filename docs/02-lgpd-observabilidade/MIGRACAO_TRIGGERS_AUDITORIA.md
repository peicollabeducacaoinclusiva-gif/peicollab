# Migração de Triggers de Auditoria para audit_events

**Data:** 2025-01-28  
**Status:** ✅ **MIGRAÇÃO CRIADA**

---

## 🎯 Objetivo

Atualizar a função de trigger `audit_trigger_function()` para usar a tabela canônica `audit_events` ao invés de `audit_log`, garantindo padronização e conformidade LGPD.

---

## 📋 O Que Foi Feito

### 1. Função Auxiliar Criada

**Arquivo:** `supabase/migrations/20250128000001_migrate_audit_triggers_to_audit_events.sql`

**Função:** `get_tenant_id_from_entity(p_table_name, p_entity_id)`
- Obtém `tenant_id` automaticamente baseado na tabela e ID da entidade
- Suporta múltiplas tabelas (students, peis, schools, professionals, classes, etc.)
- Fallback para obter do perfil do usuário

### 2. Função de Trigger Atualizada

**Função:** `audit_trigger_function()`

**Antes:**
- Gravava diretamente em `audit_log` (tabela antiga)
- Estrutura: `table_name`, `record_id`, `action`, `old_data`, `new_data`

**Depois:**
- Usa RPC `log_audit_event()` para gravar em `audit_events` (tabela canônica)
- Estrutura padronizada: `tenant_id`, `entity_type`, `entity_id`, `action`, `metadata`
- Mapeamento automático de `table_name` para `entity_type`

### 3. Triggers Existentes

**Triggers que usam `audit_trigger_function()`:**
- ✅ `audit_students_trigger`
- ✅ `audit_peis_trigger`
- ✅ `audit_enrollments_trigger`
- ✅ `audit_enrollment_requests_trigger`
- ✅ `audit_grades_trigger`
- ✅ `audit_attendance_trigger`
- ✅ `audit_daily_attendance_trigger`
- ✅ `audit_descriptive_reports_trigger`
- ✅ `audit_evaluation_configs_trigger`
- ✅ `audit_classes_trigger`
- ✅ `audit_professionals_trigger`
- ✅ `audit_certificates_trigger`
- ✅ `audit_class_diary_trigger`
- ✅ `audit_diary_occurrences_trigger`

**Observação:** Todos os triggers existentes continuam funcionando. Não é necessário recriá-los - apenas a função foi atualizada.

---

## 🔧 Como Funciona

### Mapeamento de Tabelas para Entity Types

```sql
'students' → 'student'
'peis' → 'pei'
'schools' → 'school'
'professionals' → 'professional'
'classes' → 'class'
'enrollments' → 'enrollment'
-- etc.
```

### Obtenção de Tenant ID

1. **Primária:** Busca direta na tabela (se tiver coluna `tenant_id`)
2. **Secundária:** Busca via relacionamento (ex: `classes` → `schools` → `tenant_id`)
3. **Fallback:** Busca no perfil do usuário (`auth.uid()` → `profiles.tenant_id`)

### Estrutura do Metadata

```json
{
  "table_name": "students",
  "trigger_source": "audit_trigger_function",
  "old_values": { ... },
  "new_values": { ... }
}
```

---

## ✅ Benefícios

1. **Padronização:** Todos os eventos em uma única tabela canônica
2. **Conformidade LGPD:** Estrutura padronizada com tenant_id obrigatório
3. **Rastreabilidade:** Metadata completo preservado
4. **Consistência:** Usa mesma estrutura que `auditMiddleware`
5. **Fail-Safe:** Warnings em caso de erro, mas não interrompe operações

---

## ⚠️ Observações Importantes

### Tenant ID Obrigatório

A tabela `audit_events` requer `tenant_id` NOT NULL. A função tenta obter automaticamente, mas:

- Se não conseguir obter `tenant_id`, um WARNING é logado
- A operação principal **não é interrompida** (fail-safe)
- Em produção, todos os registros devem ter `tenant_id` válido

### Compatibilidade

- ✅ Triggers existentes continuam funcionando sem alteração
- ✅ Apenas a função foi atualizada (DROP/CREATE OR REPLACE)
- ✅ Estrutura de dados migrada automaticamente (via migração anterior)

---

## 🚀 Próximos Passos

1. **Aplicar Migração:**
   ```sql
   -- Executar via Supabase CLI ou Dashboard
   supabase migration up 20250128000001_migrate_audit_triggers_to_audit_events
   ```

2. **Verificar Funcionamento:**
   ```sql
   -- Testar trigger em uma tabela
   UPDATE students SET name = 'Teste' WHERE id = '...';
   
   -- Verificar evento criado
   SELECT * FROM audit_events 
   WHERE entity_type = 'student' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

3. **Monitorar Logs:**
   - Verificar se há WARNINGS sobre `tenant_id` não encontrado
   - Garantir que todos os eventos estão sendo gravados corretamente

---

## 📊 Estrutura do Evento Gravado

```sql
INSERT INTO audit_events (
    tenant_id,          -- Obtido automaticamente
    actor_id,           -- auth.uid()
    entity_type,        -- Mapeado de table_name
    entity_id,          -- ID da entidade
    action,             -- INSERT, UPDATE, DELETE
    ip_address,         -- Do contexto HTTP (se disponível)
    user_agent,         -- Do contexto HTTP (se disponível)
    metadata,           -- JSONB com old_values, new_values, table_name
    created_at          -- NOW()
)
```

---

**Migração criada com sucesso!** ✅

Todos os triggers de auditoria agora usam a tabela canônica `audit_events` via `log_audit_event` RPC.

**Última atualização:** 2025-01-28

