# Validação do Estado Atual - LGPD, Observabilidade e Infraestrutura

**Data:** 28/01/2025  
**Status:** 🔍 **Validação e Plano de Ação**

---

## 📊 RESUMO EXECUTIVO

Análise completa do estado atual do monorepo, validando as evoluções detectadas e criando plano de ação prioritário para padronização e conclusão das funcionalidades.

---

## ✅ VALIDAÇÕES REALIZADAS

### 1. LGPD - Estrutura no Banco ✅

#### Tabelas Confirmadas

**Consentimentos:**
- ✅ `consents` - Nova tabela unificada (migration `20251127112858`)
- ⚠️ `data_consents` - Tabela antiga ainda presente (migration `20250120000013`)
- ✅ `consent_templates` - Templates personalizáveis por tenant

**Auditoria:**
- ⚠️ `audit_log` - Tabela antiga (migrations antigas)
- ⚠️ `audit_logs` - Tabela intermediária (migration `20250215000013`)
- ✅ `audit_events` - Nova tabela padronizada (migration `20251127112538`)

**DSR:**
- ✅ `dsr_requests` - Solicitações de direitos do titular (migration `20251127113503`)

**Retenção:**
- ✅ `data_retention_rules` - Regras de retenção (migration `20251127114815`)
- ✅ `retention_logs` - Logs de aplicação de retenção

#### RPCs Confirmados

**Consentimento:**
- ✅ `grant_consent(tenant_id, consent_type, ...)`
- ✅ `revoke_consent(tenant_id, consent_type, ...)`
- ✅ `check_consent(tenant_id, consent_type, ...)`
- ✅ `get_user_consents(tenant_id, user_id, student_id, guardian_id)`

**DSR:**
- ✅ `create_dsr_request(...)`
- ✅ `get_dsr_requests(tenant_id, filters...)`
- ✅ `update_dsr_request_status(...)`
- ✅ `export_personal_data_v2(...)`
- ✅ `anonymize_personal_data_v2(...)`

**Retenção:**
- ✅ `upsert_retention_rule(...)`
- ✅ `get_retention_rules(tenant_id)`
- ✅ `apply_retention_rules(tenant_id, dry_run)`

**Auditoria:**
- ✅ `log_audit_event(tenant_id, entity_type, action, ...)` (em `20251127112538`)

### 2. Serviços Frontend ✅

#### Packages Confirmados

**`packages/database/src/consent/consentService.ts`**
- ✅ `grantConsent()` - Usa RPC `grant_consent`
- ✅ `revokeConsent()` - Usa RPC `revoke_consent`
- ✅ `checkConsent()` - Usa RPC `check_consent`
- ✅ `getUserConsents()` - Usa RPC `get_user_consents`
- ✅ `getConsentTemplates()` - Query direta em `consent_templates`
- ✅ `upsertConsentTemplate()` - Upsert em `consent_templates`

**`packages/database/src/dsr/dsrService.ts`**
- ✅ `createRequest()` - Usa RPC `create_dsr_request`
- ✅ `getRequests()` - Usa RPC `get_dsr_requests`
- ✅ `updateRequestStatus()` - Usa RPC `update_dsr_request_status`
- ✅ `exportPersonalData()` - Usa RPC `export_personal_data_v2`
- ✅ `anonymizePersonalData()` - Usa RPC `anonymize_personal_data_v2`
- ✅ `processRequest()` - Processamento automático completo

**`packages/database/src/retention/retentionService.ts`**
- ✅ `upsertRule()` - Usa RPC `upsert_retention_rule`
- ✅ `getRules()` - Usa RPC `get_retention_rules`
- ✅ `applyRules()` - Usa RPC `apply_retention_rules`
- ✅ `getLogs()` - Query direta em `retention_logs`
- ✅ `toggleRule()` - Update direto
- ✅ `deleteRule()` - Delete direto

### 3. Observabilidade ✅

#### Pacote Confirmado

**`packages/observability/`**
- ✅ `src/alerts/alertManager.ts`
- ✅ `src/errors/errorHandler.ts`
- ✅ `src/errors/errorReporter.ts`
- ✅ `src/logging/logger.ts`
- ✅ `src/metrics/metricsCollector.ts`
- ✅ `src/performance/performanceMonitor.ts`
- ✅ `src/tracing/tracer.ts`

#### Páginas de Monitoramento

**`apps/gestao-escolar/src/pages/ObservabilityDashboard.tsx`** ✅
**`apps/gestao-escolar/src/pages/Monitoring.tsx`** ✅

### 4. Consentimento na UI ⚠️

**`apps/landing/src/components/consent/PrivacyCenter.tsx`** ✅
- Componente criado
- ⚠️ **NÃO conectado** ao fluxo de consentimento
- ⚠️ **NÃO integrado** com `consentService`

### 5. i18n e Testes ✅

**`packages/i18n/`** ✅ - Presente e exportado
**`packages/test-utils/`** ✅ - Com mocks de Supabase e helpers

---

## ⚠️ PROBLEMAS DETECTADOS

### 🔴 CRÍTICOS

#### 1. Duplicação de Tabelas de Consentimento
- **Problema:** Coexistem `data_consents` (antiga) e `consents` (nova)
- **Impacto:** Dados podem estar espalhados entre duas tabelas
- **Ação Necessária:** Migrar dados e deprecar `data_consents`

#### 2. Duplicação de Tabelas de Auditoria
- **Problema:** Coexistem 3 tabelas:
  - `audit_log` (antiga)
  - `audit_logs` (intermediária)
  - `audit_events` (nova padronizada)
- **Impacto:** Auditoria pode não estar sendo gravada consistentemente
- **Ação Necessária:** Padronizar uso de `audit_events` e migrar dados

#### 3. PrivacyCenter Desconectado
- **Problema:** Componente existe mas não está integrado
- **Impacto:** Usuários não podem gerenciar consentimentos na UI
- **Ação Necessária:** Conectar ao `consentService` e integrar no fluxo

### 🟡 IMPORTANTES

#### 4. Auditoria Não Instrumentada
- **Problema:** Serviços existem mas não há gravação automática em operações críticas
- **Impacto:** Falta rastreabilidade em PEI/AEE/Perfis
- **Ação Necessária:** Instrumentar serviços críticos

#### 5. Retenção Sem Agendamento
- **Problema:** Regras existem mas não há job agendado
- **Impacto:** Limpeza não acontece automaticamente
- **Ação Necessária:** Criar job/cron/Supabase Scheduler

#### 6. i18n Não Utilizado
- **Problema:** Pacote existe mas não é usado nos apps principais
- **Impacto:** App monolíngue (português apenas)
- **Ação Necessária:** Integrar nas páginas principais

---

## 🎯 PLANO DE AÇÃO PRIORITÁRIO

### FASE 1: Padronização de Tabelas (URGENTE)

#### 1.1 Consolidar Consentimentos
**Objetivo:** Definir `consents` como tabela canônica

**Tarefas:**
1. ✅ Criar migration para migrar dados de `data_consents` → `consents`
2. ✅ Criar trigger para redirecionar inserts em `data_consents` → `consents`
3. ✅ Atualizar serviços para usar apenas `consents`
4. ✅ Marcar `data_consents` como deprecated (comentário na tabela)

**Arquivos:**
- Migration: `supabase/migrations/20250228000001_consolidate_consents.sql`
- Atualizar: `packages/database/src/consent/consentService.ts`

#### 1.2 Consolidar Auditoria
**Objetivo:** Padronizar uso de `audit_events`

**Tarefas:**
1. ✅ Criar migration para migrar dados de `audit_log` e `audit_logs` → `audit_events`
2. ✅ Criar triggers para redirecionar inserts
3. ✅ Atualizar serviços para usar apenas `audit_events`
4. ✅ Deprecar tabelas antigas

**Arquivos:**
- Migration: `supabase/migrations/20250228000002_consolidate_audit.sql`

### FASE 2: Integração de UI (ALTA PRIORIDADE)

#### 2.1 Conectar PrivacyCenter
**Objetivo:** Usuários podem gerenciar consentimentos na UI

**Tarefas:**
1. ✅ Conectar `PrivacyCenter` ao `consentService`
2. ✅ Criar hook `useConsents()` usando React Query
3. ✅ Integrar no fluxo de login/landing
4. ✅ Adicionar página de gerenciamento no Portal do Responsável

**Arquivos:**
- Hook: `apps/landing/src/hooks/useConsents.ts`
- Atualizar: `apps/landing/src/components/consent/PrivacyCenter.tsx`
- Nova página: `apps/portal-responsavel/src/pages/PrivacySettings.tsx`

#### 2.2 Instrumentar Auditoria
**Objetivo:** Gravação automática em operações críticas

**Tarefas:**
1. ✅ Criar middleware/hook para gravar auditoria
2. ✅ Instrumentar serviços de PEI/AEE
3. ✅ Instrumentar serviços de Gestão Escolar
4. ✅ Instrumentar alterações de perfis

**Arquivos:**
- Middleware: `packages/database/src/audit/auditMiddleware.ts`
- Hook: `packages/database/src/audit/useAudit.ts`
- Instrumentar: Serviços críticos

### FASE 3: Automação (MÉDIA PRIORIDADE)

#### 3.1 Job de Retenção
**Objetivo:** Aplicar retenção automaticamente

**Tarefas:**
1. ✅ Criar Edge Function para aplicar retenção
2. ✅ Configurar Supabase Scheduler ou cron externo
3. ✅ Criar dashboard de monitoramento de execuções
4. ✅ Adicionar alertas para falhas

**Arquivos:**
- Edge Function: `supabase/functions/apply-retention/index.ts`
- Dashboard: `apps/gestao-escolar/src/pages/RetentionDashboard.tsx`

#### 3.2 Instrumentar Observabilidade
**Objetivo:** Coleta automática de métricas

**Tarefas:**
1. ✅ Integrar `performanceMonitor` nos apps críticos
2. ✅ Configurar alertas automáticos
3. ✅ Criar dashboards por app
4. ✅ Definir SLAs e metas de performance

### FASE 4: i18n e Acessibilidade (BAIXA PRIORIDADE)

#### 4.1 Aplicar i18n
**Tarefas:**
1. ✅ Integrar `@pei/i18n` nas páginas principais
2. ✅ Traduzir textos críticos
3. ✅ Adicionar seletor de idioma

#### 4.2 Checklist de Acessibilidade
**Tarefas:**
1. ✅ Revisar componentes com checklist WCAG
2. ✅ Adicionar atributos ARIA faltantes
3. ✅ Melhorar contraste e navegação por teclado

---

## 📋 CHECKLIST DE VALIDAÇÃO RÁPIDA

### LGPD
- [ ] Executar `get_user_consents` para usuário de teste
- [ ] Criar solicitação DSR via `create_dsr_request`
- [ ] Verificar que `audit_events` está sendo populado
- [ ] Testar `apply_retention_rules` em dry-run

### Observabilidade
- [ ] Acessar `ObservabilityDashboard` e verificar métricas
- [ ] Acessar `Monitoring` e verificar logs
- [ ] Verificar que RPCs estão sendo chamados
- [ ] Testar criação de alertas

### Portal do Responsável
- [ ] Testar login e navegação
- [ ] Verificar RLS funciona corretamente
- [ ] Testar visibilidade de dados do aluno
- [ ] Verificar que diagnóstico é ocultado se preferências definirem

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

### Prioridade 1 (Esta Sprint)
1. **Consolidar tabelas** (consents e audit)
2. **Conectar PrivacyCenter** ao consentService
3. **Criar hook useConsents** para React

### Prioridade 2 (Próxima Sprint)
1. **Instrumentar auditoria** nos serviços críticos
2. **Criar job de retenção** agendado
3. **Dashboard de retenção** para gestores

### Prioridade 3 (Backlog)
1. **Aplicar i18n** nas páginas principais
2. **Checklist de acessibilidade**
3. **Performance e SEO** (metas e sitemaps)

---

**Status:** 🟡 **Validação completa. Plano de ação definido. Pronto para implementação.**

