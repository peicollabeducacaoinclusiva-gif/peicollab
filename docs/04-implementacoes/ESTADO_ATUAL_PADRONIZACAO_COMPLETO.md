# Estado Atual Completo - Padronização LGPD e Observabilidade

**Data:** 2025-01-28  
**Baseado em:** Resumo geral fornecido pelo usuário

---

## 🎯 Resumo Executivo

O monorepo está **mais estável e consistente** em LGPD e Observabilidade. As migrações consolidaram tabelas canônicas e a base de observabilidade está completa. Há algumas referências antigas ainda presentes que estão sendo padronizadas.

---

## ✅ O que está COMPLETO

### 1. Banco de Dados e Migrações ✅
- ✅ Tabelas canônicas criadas: `consents`, `audit_events`, `dsr_requests`, `data_retention_rules`
- ✅ Migrações de consolidação aplicadas:
  - `20250228000001_consolidate_consents.sql` - Consents consolidados
  - `20250228000002_consolidate_audit.sql` - Auditoria consolidada
- ✅ Views de compatibilidade criadas

### 2. LGPD - Consents ✅
- ✅ `lgpdService.ts` usa `consentService` exclusivamente
- ✅ Não há referências diretas a `data_consents` no código
- ✅ Estrutura `consents` com índices e RLS ok

### 3. LGPD - DSR ✅
- ✅ `dsr_requests` completo
- ✅ RPC `get_dsr_requests` retorna consents e audit_events relacionados
- ✅ `packages/database/src/dsr/dsrService.ts` usa RPC corretamente

### 4. LGPD - Retenção ✅
- ✅ Regras e logs funcionais
- ✅ `apply_retention_rules` cobre estudantes, usuários e audit_events
- ✅ Edge Function e script CLI prontos
- ✅ **Agendamento configurado no Supabase** (job ativo)

### 5. Observabilidade - Banco ✅
- ✅ Tabelas criadas: `error_logs`, `performance_metrics`, `alerts`, `alert_rules`
- ✅ RPCs com RLS: `report_error`, `report_performance_metric`, `get_error_statistics`, `get_performance_statistics`
- ✅ Migration `20251127123049_create_observability_system.sql` aplicada

### 6. Observabilidade - Pacote ✅
- ✅ `@pei/observability` maduro:
  - Logger central
  - Tracer
  - Collector de métricas
  - Monitor de performance
  - Reporter de erros
  - Gerenciador de alertas

### 7. Observabilidade - Frontend ✅
- ✅ ErrorBoundary global em `App.tsx`
- ✅ Error reporting instrumentado em pontos críticos
- ✅ AlertManager configurado com regras básicas
- ✅ App Gestão consome RPCs agregadas

### 8. i18n ✅
- ✅ `I18nProvider` configurado em `App.tsx`
- ✅ Traduções implementadas em: Auth, Dashboard, CreatePEI

---

## ⚠️ O que está EM PROGRESSO

### 1. Auditoria - Viewers ✅ (RECÉM COMPLETADO)
- ✅ `src/components/shared/SimpleAuditLogsViewer.tsx` - Usa `get_audit_trail`
- ✅ `src/components/shared/AuditLogsViewer.tsx` - Usa `get_audit_trail`
- ✅ `apps/pei-collab/src/components/shared/AuditLogsViewer.tsx` - **MIGRADO AGORA** para usar `get_audit_trail`

### 2. Auditoria - Serviços ✅
- ✅ `auditService.ts` já usa `get_audit_trail` RPC
- ✅ `eventBus.ts` usa `auditMiddleware` (grava em `audit_events`)

---

## 🔴 O que PRECISA SER FEITO

### 1. Funções `insertAuditLog` locais ⚠️
**Status:** Pendente  
**Impacto:** Alto

**Arquivos afetados:**
- `src/components/dashboards/SuperadminDashboard.tsx`
- `apps/pei-collab/src/components/dashboards/SuperadminDashboard.tsx`
- `packages/dashboards/src/hooks/useSuperadminMaintenance.ts`
- `src/hooks/useSuperadminUsers.ts`
- `src/hooks/useSuperadminSchools.ts`

**Ação:** Criar helper centralizado usando `auditMiddleware` e migrar todas as funções locais.

### 2. Triggers de Auditoria ⚠️
**Status:** Pendente  
**Impacto:** Médio

**Problema:** Triggers antigos ainda gravam em `audit_log` (tabela antiga)

**Arquivos:**
- `supabase/migrations/20250113000005_v2_2_improvements.sql` (linha 138-173)
- `supabase/migrations/20250113000004_schema_complete_v2.sql` (linha 388-423)

**Ação:** Criar migração para atualizar `audit_trigger()` para usar `audit_events`.

### 3. Função RPC `insert_audit_log` ⚠️
**Status:** Pendente  
**Impacto:** Médio

**Problema:** Função SQL antiga grava em `audit_logs`

**Arquivo:** `supabase/migrations/20250113000003_advanced_maintenance_functions.sql` (linha 275-295)

**Ação:** Deprecar ou atualizar função.

### 4. Instrumentação Automática de Auditoria ⚠️
**Status:** Pendente  
**Impacto:** Baixo

**Ação:** Criar wrappers automáticos para operações sensíveis (PEI/AEE, perfis, família).

---

## 📊 Métricas de Progresso

| Área | Status | Progresso |
|------|--------|-----------|
| **LGPD - Consents** | ✅ | 100% |
| **LGPD - DSR** | ✅ | 100% |
| **LGPD - Retenção** | ✅ | 100% |
| **Auditoria - Viewers** | ✅ | 100% (recém completado) |
| **Auditoria - Serviços** | ✅ | 100% |
| **Auditoria - Funções locais** | ⚠️ | 0% |
| **Auditoria - Triggers** | ⚠️ | 0% |
| **Observabilidade** | ✅ | 100% |
| **i18n** | ✅ | 85% (3 rotas principais) |

**Progresso Geral:** ~90%

---

## 🎯 Plano de Ação Imediato

### Alta Prioridade

1. ✅ **Migrar AuditLogsViewer em pei-collab** - **CONCLUÍDO**
2. ⏳ **Criar helper centralizado `insertAuditLog`** usando `auditMiddleware`
3. ⏳ **Migrar todas as funções locais** `insertAuditLog` para usar o helper

### Média Prioridade

4. ⏳ **Criar migração** para atualizar triggers de `audit_log` para `audit_events`
5. ⏳ **Deprecar função RPC** `insert_audit_log` antiga

### Baixa Prioridade

6. ⏳ **Expandir i18n** para outras rotas (Students, PEIs, Reports)
7. ⏳ **Criar wrappers automáticos** de auditoria

---

## 📝 Notas Importantes

1. **Tabelas antigas mantidas por compatibilidade:**
   - `data_consents` → View de compatibilidade criada
   - `audit_log` → View de compatibilidade criada
   - `audit_logs` → View de compatibilidade criada

2. **Diretriz de padronização:**
   - ✅ Usar tabelas canônicas: `consents`, `audit_events`
   - ✅ Usar RPCs quando disponíveis: `get_audit_trail`, `get_dsr_requests`
   - ✅ Usar services centralizados: `consentService`, `auditMiddleware`

3. **Próximos passos recomendados:**
   - Padronizar `insertAuditLog` local → `auditMiddleware`
   - Migrar triggers para `audit_events`
   - Expandir i18n para rotas restantes

---

**Última atualização:** 2025-01-28  
**Status:** ✅ Sistema estável, padronizações finais em progresso

