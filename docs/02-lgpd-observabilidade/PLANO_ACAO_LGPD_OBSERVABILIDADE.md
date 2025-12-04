# Plano de Ação Detalhado - LGPD e Observabilidade

**Data:** 28/01/2025  
**Versão:** 1.0

---

## 🎯 OBJETIVO

Padronizar e finalizar a implementação de LGPD e Observabilidade, resolvendo duplicações de tabelas e integrando funcionalidades na UI.

---

## 📅 FASE 1: Padronização de Tabelas (URGENTE)

### 1.1 Consolidar Consentimentos

#### Migration de Consolidação
**Arquivo:** `supabase/migrations/20250228000001_consolidate_consents.sql`

**Tarefas:**
1. Migrar dados de `data_consents` → `consents`
2. Criar trigger para redirecionar novos inserts
3. Adicionar views de compatibilidade (opcional)
4. Marcar `data_consents` como deprecated

**Código SQL:**
```sql
-- Migrar dados existentes
INSERT INTO consents (tenant_id, user_id, student_id, consent_type, granted, granted_at, metadata, created_at, updated_at)
SELECT 
  COALESCE(tenant_id, (SELECT tenant_id FROM students WHERE id = student_id LIMIT 1)),
  user_id,
  student_id,
  consent_type::text,
  consent_given,
  consent_date,
  jsonb_build_object('source', 'data_consents', 'original_id', id),
  created_at,
  updated_at
FROM data_consents
ON CONFLICT DO NOTHING;

-- Trigger para redirecionar
CREATE OR REPLACE FUNCTION redirect_data_consents_to_consents()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO consents (tenant_id, user_id, student_id, consent_type, granted, granted_at, metadata)
  VALUES (
    NEW.tenant_id,
    NEW.user_id,
    NEW.student_id,
    NEW.consent_type::text,
    NEW.consent_given,
    NEW.consent_date,
    jsonb_build_object('source', 'data_consents_redirect', 'original_id', NEW.id)
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER redirect_data_consents_insert
INSTEAD OF INSERT ON data_consents
FOR EACH ROW EXECUTE FUNCTION redirect_data_consents_to_consents();
```

### 1.2 Consolidar Auditoria

#### Migration de Consolidação
**Arquivo:** `supabase/migrations/20250228000002_consolidate_audit.sql`

**Tarefas:**
1. Migrar dados de `audit_log` → `audit_events`
2. Migrar dados de `audit_logs` → `audit_events`
3. Criar triggers para redirecionar
4. Deprecar tabelas antigas

---

## 📅 FASE 2: Integração de UI (ALTA PRIORIDADE)

### 2.1 Conectar PrivacyCenter

#### Hook de Consentimentos
**Arquivo:** `apps/landing/src/hooks/useConsents.ts`

**Funcionalidades:**
- `useConsents()` - Listar consentimentos
- `useGrantConsent()` - Conceder consentimento
- `useRevokeConsent()` - Revogar consentimento
- `useConsentTemplates()` - Carregar templates

#### Integração no PrivacyCenter
**Arquivo:** `apps/landing/src/components/consent/PrivacyCenter.tsx`

**Tarefas:**
1. Substituir dados mockados por chamadas reais
2. Carregar templates do tenant
3. Permitir conceder/revogar consentimentos
4. Mostrar histórico de consentimentos

### 2.2 Instrumentar Auditoria

#### Middleware de Auditoria
**Arquivo:** `packages/database/src/audit/auditMiddleware.ts`

**Funcionalidades:**
- Função helper para gravar auditoria
- Integração automática em operações críticas

#### Serviços a Instrumentar
- ✅ PEI: create, update, delete, approve, return
- ✅ AEE: create, update, delete
- ✅ Students: create, update, delete (dados sensíveis)
- ✅ Profiles: update (dados pessoais)
- ✅ Consentimentos: grant, revoke

---

## 📅 FASE 3: Automação (MÉDIA PRIORIDADE)

### 3.1 Job de Retenção

#### Edge Function
**Arquivo:** `supabase/functions/apply-retention/index.ts`

**Funcionalidades:**
- Executar `apply_retention_rules` para cada tenant ativo
- Logging de execuções
- Notificações de falhas
- Suporte a dry-run

#### Configuração do Scheduler
**Opções:**
1. Supabase Scheduler (pg_cron)
2. Edge Function com cron externo
3. GitHub Actions (agendado)

#### Dashboard de Retenção
**Arquivo:** `apps/gestao-escolar/src/pages/RetentionDashboard.tsx`

**Funcionalidades:**
- Listar regras ativas
- Visualizar logs de execução
- Executar retenção manualmente (dry-run ou real)
- Métricas de retenção por tenant

---

## 📊 MÉTRICAS DE SUCESSO

### LGPD
- ✅ Zero duplicação de tabelas
- ✅ 100% das operações críticas auditadas
- ✅ PrivacyCenter funcional e integrado
- ✅ Retenção automática funcionando

### Observabilidade
- ✅ Métricas coletadas em todos os apps
- ✅ Alertas configurados e funcionando
- ✅ Dashboards atualizados em tempo real

### i18n e Acessibilidade
- ✅ 3+ páginas principais traduzidas
- ✅ Checklist de acessibilidade 100% completo

---

## 🔄 VALIDAÇÕES CONTÍNUAS

### Checklist Diário
- [ ] Verificar que `audit_events` está sendo populado
- [ ] Confirmar que retenção executou (se agendada)
- [ ] Validar que PrivacyCenter está acessível

### Checklist Semanal
- [ ] Revisar logs de retenção
- [ ] Verificar métricas de performance
- [ ] Auditar consentimentos concedidos/revogados

---

**Status:** 📋 **Plano definido. Pronto para implementação faseada.**

