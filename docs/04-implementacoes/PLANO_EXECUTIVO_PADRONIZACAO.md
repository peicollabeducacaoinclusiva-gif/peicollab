# Plano Executivo de Padronização - LGPD e Observabilidade

**Data:** 28/01/2025  
**Status:** 🟡 **EM ANDAMENTO**

---

## 📋 RESUMO EXECUTIVO

Este plano consolida as ações necessárias para padronizar o sistema, migrando de estruturas antigas (`data_consents`, `audit_log`) para as estruturas canônicas consolidadas (`consents`, `audit_events`).

---

## ✅ CONCLUÍDO

### 1. lgpdService.ts - Migração para consentService ✅
**Status:** ✅ **100% CONCLUÍDO**

**Mudanças aplicadas:**
- ✅ Substituído uso direto de `data_consents` por `consentService`
- ✅ Métodos `getConsents()`, `createConsent()`, `withdrawConsent()` agora usam RPCs do pacote database
- ✅ Mantida compatibilidade com interface `DataConsent` para código existente

---

## 🔄 EM PROGRESSO

### 2. auditService.ts - Migração para audit_events
**Status:** 🟡 **PRÓXIMO**

**Ações necessárias:**
1. Substituir `.from('audit_log')` por `.from('audit_events')`
2. Mapear campos:
   - `table_name` → `entity_type`
   - `record_id` → `entity_id`
   - `changed_by` → `actor_id`
   - `changed_at` → `created_at`
3. Usar RPC `get_audit_trail()` quando possível
4. Integrar com `auditMiddleware` para gravação automática

---

## 📋 PENDENTES

### 3. Monitoring.tsx e AuditReports.tsx
**Prioridade:** 🔴 **ALTA**

**Ações:**
- [ ] Substituir `get_audit_logs` por `get_audit_trail`
- [ ] Ajustar formato de resposta
- [ ] Atualizar exportação CSV

---

### 4. Componentes AuditLogsViewer
**Prioridade:** 🟡 **MÉDIA**

**Ações:**
- [ ] Localizar todos `*AuditLogsViewer.tsx`
- [ ] Migrar para `audit_events`
- [ ] Usar `get_audit_trail` RPC

---

### 5. Instrumentar Auditoria Automática
**Prioridade:** 🔴 **ALTA**

**Áreas a instrumentar:**
- [ ] Operações PEI/AEE (já parcialmente feito via `peiService`)
- [ ] Operações de perfis/família
- [ ] Exportações de dados sensíveis
- [ ] Operações de consentimento (já feito)

**Ferramenta:** Usar `auditMiddleware.withAudit()` wrapper

---

### 6. Agendar Retenção de Dados
**Prioridade:** 🟡 **MÉDIA**

**Ações:**
- [ ] Configurar Supabase Scheduler
- [ ] Criar rotina periódica por tenant
- [ ] Criar painel de visualização de execuções

---

### 7. Observabilidade Completa
**Prioridade:** 🟢 **BAIXA**

**Ações:**
- [ ] ErrorBoundary global com `errorReporter`
- [ ] Configurar `AlertManager` com regras básicas
- [ ] Instrumentar pontos críticos

---

### 8. i18n e Acessibilidade
**Prioridade:** 🟢 **BAIXA**

**Ações:**
- [ ] Aplicar `@pei/i18n` em Login, Dashboard, PEI/AEE
- [ ] Checklist de acessibilidade (foco, aria, contraste)

---

## 📊 MÉTRICAS DE PROGRESSO

| Item | Status | Progresso |
|------|--------|-----------|
| lgpdService.ts | ✅ | 100% |
| auditService.ts | 🔄 | 0% |
| Monitoring.tsx | ⏳ | 0% |
| AuditLogsViewer | ⏳ | 0% |
| Auditoria Automática | ⏳ | 30% (PEI feito) |
| Agendamento Retenção | ⏳ | 0% |
| Observabilidade | ⏳ | 50% (infra pronta) |
| i18n | ⏳ | 10% |

**Progresso Geral:** 24% concluído

---

## 🎯 PRÓXIMAS AÇÕES (Ordem de Prioridade)

1. **🔴 CRÍTICO** - Completar migração de `auditService.ts`
2. **🔴 CRÍTICO** - Atualizar `Monitoring.tsx` para usar `get_audit_trail`
3. **🟡 MÉDIO** - Instrumentar operações críticas restantes
4. **🟡 MÉDIO** - Configurar agendamento de retenção
5. **🟢 BAIXO** - Completar observabilidade e i18n

---

## 📝 NOTAS IMPORTANTES

- **Compatibilidade:** Mantidas interfaces antigas (`DataConsent`, `AuditLog`) para não quebrar código existente
- **Migração gradual:** Estruturas antigas serão deprecadas após migração completa
- **Views de compatibilidade:** `data_consents_view` e `audit_log_compat` disponíveis como ponte temporária

---

**Última atualização:** 28/01/2025

