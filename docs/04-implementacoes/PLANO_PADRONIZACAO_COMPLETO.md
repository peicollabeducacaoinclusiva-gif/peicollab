# Plano Completo de Padronização - LGPD e Observabilidade

**Data:** 2025-01-28  
**Status:** 🎯 **Em Execução**

## 📊 Estado Atual do Sistema

### ✅ O que já está padronizado

#### Consents
- ✅ `lgpdService.ts` usa `consentService` (não há referências diretas a `data_consents`)
- ✅ Migração de consolidação aplicada (`20250228000001_consolidate_consents.sql`)
- ✅ View de compatibilidade criada

#### Auditoria
- ✅ `SimpleAuditLogsViewer.tsx` usa RPC `get_audit_trail` (usa `audit_events`)
- ✅ `AuditLogsViewer.tsx` usa RPC `get_audit_trail` (usa `audit_events`)
- ✅ `eventBus.ts` usa `auditMiddleware` (grava em `audit_events`)
- ✅ Migração de consolidação aplicada (`20250228000002_consolidate_audit.sql`)

#### Observabilidade
- ✅ ErrorBoundary global configurado em `App.tsx`
- ✅ Error reporting instrumentado em pontos críticos
- ✅ AlertManager configurado com regras básicas

#### Retenção
- ✅ Agendamento configurado no Supabase (job ativo)
- ✅ Painel de retenção completo

#### i18n
- ✅ I18nProvider configurado
- ✅ Traduções implementadas em Auth, Dashboard, CreatePEI

---

## ⚠️ Referências Antigas Identificadas

### 1. Consents
**Status:** ✅ **Já Padronizado**
- Não foram encontradas referências diretas a `data_consents` no código
- `lgpdService.ts` já usa `consentService` exclusivamente

### 2. Auditoria
**Status:** ⚠️ **Parcialmente Padronizado**

#### ✅ Já Migrado:
- `src/components/shared/SimpleAuditLogsViewer.tsx` - ✅ Usa `get_audit_trail`
- `src/components/shared/AuditLogsViewer.tsx` - ✅ Usa `get_audit_trail`
- `packages/database/src/events/eventBus.ts` - ✅ Usa `auditMiddleware`

#### ⚠️ A Verificar:
- `apps/pei-collab/src/components/.../AuditLogsViewer.tsx` - Pode ter referência antiga
- Funções de inserção direta em `audit_log` (se houver)

### 3. Triggers de Auditoria
**Status:** ⚠️ **Tabela antiga ainda existe**

Há triggers que gravam em `audit_log` (tabela antiga):
- `audit_trigger()` em migrações antigas
- Tabela `audit_log` ainda existe (compatibilidade)

**Ação:** Criar migração para atualizar triggers para usar `audit_events`

---

## 🎯 Ações de Alto Impacto (Prioridade)

### 1. Padronizar Consents ✅ **CONCLUÍDO**
- [x] Verificar referências a `data_consents`
- [x] Confirmar uso de `consentService` em `lgpdService.ts`

### 2. Padronizar Auditoria ⚠️ **EM PROGRESSO**
- [x] Viewers migrados para `get_audit_trail`
- [x] `eventBus.ts` usando `auditMiddleware`
- [ ] Verificar `apps/pei-collab/src/components/.../AuditLogsViewer.tsx`
- [ ] Migrar triggers de `audit_log` para `audit_events`

### 3. Instrumentar ErrorBoundary ✅ **CONCLUÍDO**
- [x] ErrorBoundary global em `App.tsx`
- [x] Error reporting em pontos críticos

---

## 📋 Plano de Ação Detalhado

### Fase 1: Verificação e Limpeza (Alto Impacto)

#### 1.1 Verificar e Padronizar AuditLogsViewer em pei-collab
**Status:** 🔄 Em progresso
**Ação:** Ler arquivo e migrar se necessário

#### 1.2 Migrar Triggers de Auditoria
**Status:** ⏳ Pendente
**Ação:** Criar migração para atualizar `audit_trigger()` para usar `audit_events`

#### 1.3 Buscar Inserções Diretas em Tabelas Antigas
**Status:** 🔄 Em progresso
**Ação:** Buscar todos os `.insert()` em `audit_log` e substituir por `auditMiddleware`

---

### Fase 2: Instrumentação Automática (Médio Impacto)

#### 2.1 Criar Wrapper Automático de Auditoria
**Status:** ⏳ Pendente
**Ação:** Criar decorator/middleware para auditoria automática em operações CRUD

#### 2.2 Instrumentar Operações Sensíveis
**Status:** 🔄 Parcial
**Ação:** Expandir uso de `auditMiddleware` em:
- Criação/atualização de PEI ✅
- Acesso de família ✅
- Exportação de dados ✅
- Operações de perfis ⏳
- Operações de AEE ⏳

---

### Fase 3: Expansão i18n (Baixo Impacto)

#### 3.1 Adotar i18n em Rotas Críticas
**Status:** 🔄 Parcial
- [x] Auth.tsx
- [x] Dashboard.tsx
- [x] CreatePEI.tsx
- [ ] Students.tsx
- [ ] PEIs.tsx
- [ ] Reports.tsx

---

## 🔍 Checklist de Verificação

### Banco de Dados
- [x] Tabela `consents` existe e tem RLS
- [x] Tabela `audit_events` existe e tem RLS
- [x] Views de compatibilidade criadas
- [x] Migrações de consolidação aplicadas

### Serviços
- [x] `lgpdService.ts` usa `consentService`
- [x] `eventBus.ts` usa `auditMiddleware`
- [ ] Verificar `auditService.ts` (se existir)

### Componentes
- [x] Viewers de auditoria usam RPC
- [ ] Verificar viewer em `apps/pei-collab`

### Observabilidade
- [x] ErrorBoundary global
- [x] Error reporting instrumentado
- [x] AlertManager configurado

---

## 📝 Próximas Ações Imediatas

1. ✅ Verificar `apps/pei-collab/src/components/.../AuditLogsViewer.tsx`
2. ✅ Buscar todas as inserções diretas em `audit_log`
3. ✅ Criar migração para atualizar triggers
4. ✅ Documentar estado final

---

**Última atualização:** 2025-01-28

