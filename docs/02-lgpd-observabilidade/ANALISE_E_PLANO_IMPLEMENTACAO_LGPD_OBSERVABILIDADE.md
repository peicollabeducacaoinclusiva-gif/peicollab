# Análise e Plano de Implementação - LGPD e Observabilidade

**Data:** 2025-01-28  
**Status:** Em Análise → Implementação

## 📋 Resumo Executivo

Análise detalhada do estado atual do sistema em relação a LGPD, Auditoria, Observabilidade e outras melhorias. Este documento mapeia o que foi implementado, o que precisa ser padronizado e as ações recomendadas.

---

## ✅ O Que Já Está Implementado

### 1. Estrutura de Banco de Dados

#### Consents
- ✅ Tabela `consents` criada e consolidada
- ✅ Migration `20250228000001_consolidate_consents.sql` migra dados de `data_consents`
- ✅ View `data_consents_view` criada para compatibilidade retroativa
- ✅ Trigger de aviso para uso da tabela antiga `data_consents`

#### Auditoria
- ✅ Tabela `audit_events` padronizada com RLS robusto
- ✅ Migration `20250228000002_consolidate_audit.sql` migra `audit_log` e `audit_logs`
- ✅ View `audit_log_compat` criada para compatibilidade
- ✅ RPC `get_audit_trail` disponível e funcional

#### DSR (Direitos dos Titulares)
- ✅ Tabela `dsr_requests` completa
- ✅ RPC `get_dsr_requests` agregando `consents` e `audit_events`

#### Retenção de Dados
- ✅ Tabelas `data_retention_rules` e `retention_logs` completas
- ✅ RPCs `apply_retention_rules`, `upsert_retention_rule`, `get_retention_rules`
- ✅ Edge Function `apply-retention` disponível
- ✅ Script CLI `scripts/retention/applyRetentionRules.ts`

#### Observabilidade
- ✅ Migration `20251127123049_create_observability_system.sql` criada
- ✅ Tabelas: `error_logs`, `performance_metrics`, `alerts`, `alert_rules`
- ✅ RPCs: `report_error`, `report_performance_metric`, `get_error_statistics`, `get_performance_statistics`
- ✅ Pacote `@pei/observability` completo:
  - `logging/logger`
  - `errors/errorReporter`
  - `performance/performanceMonitor`
  - `metrics/metricsCollector`
  - `alerts/alertManager`
  - `tracing/tracer`

### 2. Frontend

#### UI de Consentimento
- ✅ `apps/landing/src/components/consent/PrivacyCenter.tsx`
- ✅ `apps/landing/src/components/consent/ConsentManager.tsx`

#### Observabilidade em Gestão Escolar
- ✅ `apps/gestao-escolar/src/components/Monitoring.tsx` usa RPCs
- ✅ `apps/gestao-escolar/src/components/ObservabilityDashboard.tsx` presente

#### Error Boundary
- ✅ `packages/ui/src/components/errors/ErrorBoundary.tsx` usando `@pei/observability`

### 3. Serviços e Pacotes

#### Database Package
- ✅ `packages/database/src/audit/auditMiddleware.ts` grava em `audit_events`
- ✅ `packages/database/src/consent/consentService.ts` usando `consents`
- ✅ `packages/database/src/dsr/dsrService.ts` funcional
- ✅ `packages/database/src/retention/retentionService.ts` funcional

#### Event Bus
- ✅ `packages/database/src/events/eventBus.ts` já usa `auditMiddleware` para gravar em `audit_events`

---

## ⚠️ Referências Antigas que Precisam Padronização

### 1. Consents

**Arquivo:** `apps/gestao-escolar/src/services/lgpdService.ts`

**Problema:** 
- O serviço já usa `consentService` internamente, mas mantém compatibilidade retroativa
- Algumas queries ainda podem estar usando `data_consents` indiretamente

**Ação Recomendada:**
- ✅ **JÁ CORRIGIDO**: O serviço já usa `consentService` que trabalha com `consents`
- ⚠️ Verificar se há queries diretas em `data_consents` que ainda precisam migração

### 2. Auditoria

#### `SimpleAuditLogsViewer.tsx`
**Arquivo:** `src/components/shared/SimpleAuditLogsViewer.tsx`

**Problema:** Consulta diretamente `audit_logs` (linha 52)

```typescript
let query = supabase
  .from("audit_logs")  // ❌ Tabela antiga
```

**Ação Necessária:** Migrar para usar RPC `get_audit_trail` (como `AuditLogsViewer.tsx` já faz)

#### `auditService.ts`
**Arquivo:** `apps/gestao-escolar/src/services/auditService.ts`

**Status:** ✅ **JÁ CORRIGIDO** - Usa `get_audit_trail` que consulta `audit_events`

#### `eventBus.ts`
**Status:** ✅ **JÁ CORRIGIDO** - Usa `auditMiddleware` que grava em `audit_events`

---

## 🔧 Pendências de Implementação

### 1. Padronizar SimpleAuditLogsViewer

**Prioridade:** Alta  
**Esforço:** Baixo

Migrar `SimpleAuditLogsViewer.tsx` para usar `get_audit_trail` ao invés de consultar `audit_logs` diretamente.

---

### 2. ErrorBoundary Global

**Prioridade:** Alta  
**Esforço:** Médio

- ✅ ErrorBoundary já existe em `packages/ui/src/components/errors/ErrorBoundary.tsx`
- ⚠️ **Falta:** Envolver o App principal com ErrorBoundary
- ⚠️ **Falta:** Configurar `errorReporter.reportError` para capturar erros em produção

**Ação:**
- Envolver `App.tsx` com `ErrorBoundary`
- Garantir que erros sejam reportados via `errorReporter`

---

### 3. Instrumentação de Observabilidade

**Prioridade:** Alta  
**Esforço:** Médio-Alto

**Pontos Críticos para Instrumentar:**

1. **Operações de PEI**
   - Criação de PEI
   - Atualização de PEI
   - Aprovação/Retorno de PEI
   - Leitura/Export de dados do PEI

2. **Operações de AEE**
   - Criação/Atualização de AEE
   - Gravação de sessões

3. **Perfis e Família**
   - Acesso de família a dados
   - Criação/Atualização de perfis
   - Acesso a dados sensíveis

**Ação:**
- Usar `auditMiddleware.logEvent` em operações sensíveis
- Usar `errorReporter.reportError` em try/catch críticos
- Usar `performanceMonitor.startSpan` para operações lentas

---

### 4. AlertManager - Configuração de Regras

**Prioridade:** Média  
**Esforço:** Baixo

Configurar regras básicas de alerta:
- LCP > 2.5s
- Erros críticos (> 5 em 5 minutos)
- Taxa de erro > 1%

**Ação:**
- Criar script de configuração inicial de `alert_rules`
- Integrar `alertManager.checkRules()` periodicamente

---

### 5. Agendamento de Retenção

**Prioridade:** Média  
**Esforço:** Médio

- Edge Function `apply-retention` disponível
- Script CLI disponível
- ⚠️ **Falta:** Configuração de agendamento periódico

**Ação:**
- Configurar Supabase Scheduler ou cron job
- Criar painel em Gestão Escolar para visualizar `retention_logs`

---

### 6. Painel de Retenção em Gestão Escolar

**Prioridade:** Baixa  
**Esforço:** Médio

Criar componente para:
- Listar `retention_logs` por tenant
- Visualizar regras de retenção ativas
- Executar retenção manualmente (dry-run)

---

### 7. i18n nas Rotas Críticas

**Prioridade:** Baixa  
**Esforço:** Alto

- Pacote `@pei/i18n` existe
- ⚠️ **Falta:** Uso disseminado nas rotas principais

**Ação:**
- Implementar traduções em Login, Dashboard, PEI/AEE
- Começar com strings críticas do fluxo

---

## 📊 Plano de Ação por Prioridade

### Fase 1: Correções Críticas (Imediato)
1. ✅ Padronizar `SimpleAuditLogsViewer.tsx` para usar `audit_events`
2. ✅ Adicionar ErrorBoundary global ao App
3. ✅ Instrumentar auditoria em operações críticas de PEI

### Fase 2: Observabilidade (Curto Prazo - 1 semana)
4. ✅ Instrumentar `errorReporter` em pontos críticos
5. ✅ Configurar regras básicas de `AlertManager`
6. ✅ Adicionar monitoramento de performance em rotas críticas

### Fase 3: Retenção e Gestão (Médio Prazo - 2 semanas)
7. ⏳ Configurar agendamento de retenção
8. ⏳ Criar painel de retenção em Gestão Escolar

### Fase 4: i18n e Acessibilidade (Longo Prazo - 1 mês)
9. ⏳ Implementar i18n nas rotas críticas
10. ⏳ Checklist de acessibilidade (foco/aria/contraste)

---

## 🔍 Validações Recomendadas

### Migrations
```sql
-- Verificar existência das tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'consents', 
    'audit_events', 
    'dsr_requests', 
    'data_retention_rules',
    'error_logs', 
    'performance_metrics', 
    'alerts', 
    'alert_rules'
  );
```

### RPCs
- ✅ `get_dsr_requests` retorna arrays `consents` e `audit_events` por `tenant_id`
- ✅ `apply_retention_rules` em `dry_run` retorna `result` com `deleted_count` de `audit_events`
- ✅ `report_error` e `report_performance_metric` inserem e disparam `_check_alert_rules`

### UI
- ✅ `PrivacyCenter` e `ConsentManager` listam/gravem via `consentService` usando `consents`
- ✅ `ObservabilityDashboard` apresenta métricas e alertas

---

## 📝 Notas Técnicas

### Estrutura de Auditoria

A tabela canônica é `audit_events`. Todas as operações de auditoria devem gravar nesta tabela via:
- `auditMiddleware.logEvent()` (recomendado)
- RPC `log_audit_event()` (alternativa)

### Estrutura de Consents

A tabela canônica é `consents`. Todas as operações de consentimento devem usar:
- `consentService` do pacote `@pei/database`
- Não usar `data_consents` diretamente (deprecated)

### Observabilidade

Use o pacote `@pei/observability`:
```typescript
import { errorReporter, getAlertManager, performanceMonitor } from '@pei/observability';

// Reportar erro
await errorReporter.reportError('app-name', error, {
  tenantId,
  userId,
  severity: 'high'
});

// Monitorar performance
const span = performanceMonitor.startSpan('operation-name');
// ... operação ...
span.end();
```

---

## ✅ Checklist de Implementação

- [x] Analisar estado atual
- [x] Mapear referências antigas
- [ ] Padronizar `SimpleAuditLogsViewer`
- [ ] Adicionar ErrorBoundary global
- [ ] Instrumentar auditoria em PEI/AEE
- [ ] Configurar AlertManager
- [ ] Agendar retenção
- [ ] Criar painel de retenção
- [ ] Implementar i18n básico

---

**Última atualização:** 2025-01-28

