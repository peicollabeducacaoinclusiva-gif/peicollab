# Plano de Padronização - LGPD e Observabilidade

**Data:** 28/01/2025  
**Status:** 🟡 **EM ANDAMENTO**

---

## 📋 OBJETIVO

Padronizar todas as referências antigas para usar as estruturas canônicas consolidadas:
- `consents` (não `data_consents`)
- `audit_events` (não `audit_log`/`audit_logs`)
- Sistema de observabilidade completo
- Agendamento de retenção

---

## 🎯 PRIORIDADES

### 🔴 **CRÍTICO** - Padronizar Consents
**Prazo:** Imediato  
**Impacto:** Alto

**Arquivos a atualizar:**
- ✅ `apps/gestao-escolar/src/services/lgpdService.ts` → usar `consents`
- ✅ Migrar queries de `data_consents` para `consentService`

---

### 🔴 **CRÍTICO** - Padronizar Auditoria
**Prazo:** Imediato  
**Impacto:** Alto

**Arquivos a atualizar:**
- ✅ `apps/gestao-escolar/src/services/auditService.ts` → usar `audit_events`
- ✅ `packages/database/src/events/eventBus.ts` → usar `audit_events`
- ✅ Componentes `*AuditLogsViewer.tsx` → usar `audit_events`

---

### 🟡 **MÉDIO** - Instrumentar Auditoria Automática
**Prazo:** Curto prazo  
**Impacto:** Médio

**Áreas a instrumentar:**
- ✅ Operações PEI/AEE
- ✅ Operações de perfis/família
- ✅ Exportações de dados sensíveis

---

### 🟡 **MÉDIO** - Agendar Retenção
**Prazo:** Curto prazo  
**Impacto:** Médio

**Ações:**
- ✅ Configurar Supabase Scheduler
- ✅ Criar painel de retenção em Gestão Escolar

---

### 🟢 **BAIXO** - Observabilidade Completa
**Prazo:** Médio prazo  
**Impacto:** Baixo

**Ações:**
- ✅ ErrorBoundary global
- ✅ Configurar AlertManager
- ✅ Instrumentar pontos críticos

---

### 🟢 **BAIXO** - i18n e Acessibilidade
**Prazo:** Médio prazo  
**Impacto:** Baixo

**Ações:**
- ✅ Aplicar i18n em Login, Dashboard, PEI/AEE
- ✅ Checklist de acessibilidade

---

## 📊 PROGRESSO

- [ ] Padronizar Consents
- [ ] Padronizar Auditoria
- [ ] Instrumentar Auditoria Automática
- [ ] Agendar Retenção
- [ ] Observabilidade Completa
- [ ] i18n e Acessibilidade

---

## 🔍 VALIDAÇÕES RÁPIDAS

### Migrations
- [ ] `consents` existe
- [ ] `audit_events` existe
- [ ] `dsr_requests` existe
- [ ] `data_retention_rules` existe
- [ ] `error_logs` existe
- [ ] `performance_metrics` existe

### RPCs
- [ ] `get_dsr_requests` funciona
- [ ] `apply_retention_rules` funciona
- [ ] `report_error` funciona
- [ ] `report_performance_metric` funciona

### UI
- [ ] PrivacyCenter funciona
- [ ] ConsentManager funciona
- [ ] ObservabilityDashboard funciona

---

**Última atualização:** 28/01/2025

