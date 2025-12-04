# Padronização em Andamento

**Data:** 28/01/2025  
**Status:** 🟡 **EM PROGRESSO**

---

## ✅ CORREÇÕES APLICADAS

### 1. lgpdService.ts - Migração para consentService ✅
**Status:** ✅ **CONCLUÍDO**

**Mudanças:**
- ✅ Import de `consentService` do pacote `@pei/database/consent`
- ✅ `getConsents()` agora usa `consentService.getUserConsents()`
- ✅ `createConsent()` agora usa `consentService.grantConsent()`
- ✅ `withdrawConsent()` agora usa `consentService.revokeConsent()`
- ✅ Mantida compatibilidade com tipo `DataConsent` para código existente

**Próximos passos:**
- [ ] Remover interface `DataConsent` obsoleta (quando código existente for atualizado)
- [ ] Testar todas as chamadas de `lgpdService`

---

## 🔄 EM PROGRESSO

### 2. auditService.ts - Migração para audit_events
**Status:** 🟡 **EM PROGRESSO**

**Mudanças necessárias:**
- [ ] Substituir `.from('audit_log')` por `.from('audit_events')`
- [ ] Ajustar campos (table_name → entity_type, record_id → entity_id, etc.)
- [ ] Usar RPC `get_audit_trail` quando possível
- [ ] Manter compatibilidade com interface `AuditLog` atual

---

## 📋 PENDENTES

### 3. Monitoring.tsx e AuditReports.tsx
- [ ] Substituir RPC `get_audit_logs` por `get_audit_trail`
- [ ] Ajustar formatos de resposta

### 4. Componentes AuditLogsViewer
- [ ] Localizar todos os componentes `*AuditLogsViewer.tsx`
- [ ] Migrar para usar `audit_events`

### 5. eventBus.ts
- [ ] Verificar uso de `audit_log`
- [ ] Migrar para `audit_events` via `auditMiddleware`

---

## 📊 PROGRESSO GERAL

- ✅ **lgpdService.ts:** 100%
- 🟡 **auditService.ts:** 0%
- ⏳ **Monitoring.tsx:** 0%
- ⏳ **Componentes Viewer:** 0%
- ⏳ **eventBus.ts:** 0%

**Total:** 20% concluído

---

**Última atualização:** 28/01/2025

