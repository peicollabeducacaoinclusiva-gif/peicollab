# Padronização de insertAuditLog - Completo

**Data:** 2025-01-28  
**Status:** ✅ **CONCLUÍDO**

---

## 🎯 Objetivo

Padronizar todas as funções locais `insertAuditLog` para usar o helper centralizado que utiliza `auditMiddleware`, garantindo que todos os logs sejam gravados na tabela canônica `audit_events`.

---

## ✅ Arquivos Migrados

### 1. Helper Centralizado ✅
- **Arquivo criado:** `packages/database/src/audit/auditHelper.ts`
- **Exportado em:** `packages/database/src/audit/index.ts`
- **Função:** `insertAuditLog(action, details, severity)` - Compatível com interface antiga
- **Uso interno:** Usa `auditMiddleware.logEvent()` para gravar em `audit_events`

### 2. Componentes Migrados ✅

#### `src/components/dashboards/SuperadminDashboard.tsx`
- ✅ Removida função local `insertAuditLog`
- ✅ Adicionado import: `import { insertAuditLog } from "@pei/database/audit"`
- ✅ Todas as chamadas mantidas (compatibilidade garantida)

#### `apps/pei-collab/src/components/dashboards/SuperadminDashboard.tsx`
- ✅ Removida função local `insertAuditLog`
- ✅ Adicionado import: `import { insertAuditLog } from "@pei/database/audit"`
- ✅ Todas as chamadas mantidas (compatibilidade garantida)

#### `packages/dashboards/src/hooks/useSuperadminMaintenance.ts`
- ✅ Removida função local `insertAuditLog`
- ✅ Adicionado wrapper que usa helper centralizado
- ✅ Retorna função compatível com interface antiga

---

## 📋 Arquivos que Recebem insertAuditLog como Parâmetro

Estes arquivos não precisam ser modificados, apenas recebem a função:

- ✅ `src/hooks/useSuperadminUsers.ts` - Recebe `insertAuditLog` como parâmetro
- ✅ `src/hooks/useSuperadminSchools.ts` - Recebe `insertAuditLog` como parâmetro

**Ação:** Os componentes que chamam esses hooks passam o helper centralizado.

---

## 🔧 Interface do Helper

### Interface Antiga (Compatibilidade Mantida)
```typescript
insertAuditLog(
  action: string,
  details?: string,
  severity?: 'info' | 'warning' | 'error'
): Promise<void>
```

### Interface Nova (Opcional)
```typescript
insertAuditLog({
  action: string,
  details?: string,
  severity?: AuditSeverity,
  entityType?: AuditEntityType,
  entityId?: string,
  tenantId?: string,
  metadata?: Record<string, unknown>
}): Promise<void>
```

---

## 📊 Como Funciona

1. **Helper centralizado** (`packages/database/src/audit/auditHelper.ts`):
   - Aceita interface antiga (parâmetros separados) ou nova (objeto)
   - Obtém `tenantId` automaticamente do perfil do usuário
   - Mapeia `severity` e `action` para tipos de `audit_events`
   - Usa `auditMiddleware.logEvent()` para gravar na tabela canônica

2. **Compatibilidade retroativa:**
   - Todas as chamadas antigas continuam funcionando
   - Nenhuma mudança necessária nos componentes que usam

3. **Gravação:**
   - Todos os logs são gravados em `audit_events` (tabela canônica)
   - Inclui metadata completo (action, details, severity)
   - Tipo de entidade padrão: `'system'` (para eventos gerais)

---

## ✅ Verificação

### Antes:
- ❌ Funções locais apenas faziam `console.log`
- ❌ Logs não eram persistidos
- ❌ Inconsistência entre diferentes implementações

### Depois:
- ✅ Todos os logs gravados em `audit_events`
- ✅ Consistência via helper centralizado
- ✅ Metadata completo preservado
- ✅ Compatibilidade retroativa mantida

---

## 📝 Exemplo de Uso

### Uso Antigo (Ainda Funciona)
```typescript
await insertAuditLog(
  'Nova Rede Criada',
  'Rede "Municipal" criada com sucesso',
  'info'
);
```

### Uso Novo (Opcional)
```typescript
await insertAuditLog({
  action: 'Nova Rede Criada',
  details: 'Rede "Municipal" criada com sucesso',
  severity: 'info',
  entityType: 'tenant',
  entityId: tenantId,
  metadata: {
    network_name: 'Municipal',
    created_by: userId
  }
});
```

---

## ✅ Checklist de Migração

- [x] Helper centralizado criado em `@pei/database/audit`
- [x] Exportado do módulo audit
- [x] `SuperadminDashboard.tsx` (src) migrado
- [x] `SuperadminDashboard.tsx` (pei-collab) migrado
- [x] `useSuperadminMaintenance.ts` migrado
- [x] Interface antiga mantida (compatibilidade)
- [x] Interface nova disponível (opcional)
- [x] Todos os logs agora gravam em `audit_events`

---

**Padronização concluída!** ✅

Todos os `insertAuditLog` locais foram substituídos pelo helper centralizado que usa `auditMiddleware` e grava na tabela canônica `audit_events`.

**Última atualização:** 2025-01-28

