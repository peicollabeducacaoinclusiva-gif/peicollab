# Instrumentação de Auditoria nos Serviços

**Data:** 28/01/2025  
**Status:** ✅ **EM PROGRESSO**

---

## ✅ SERVIÇOS INSTRUMENTADOS

### 1. Consent Service ✅
**Arquivo:** `packages/database/src/consent/consentService.ts`

**Operações instrumentadas:**
- ✅ `grantConsent()` - Grava auditoria após conceder consentimento
- ✅ `revokeConsent()` - Grava auditoria após revogar consentimento

**Exemplo:**
```typescript
// Auditoria automática ao conceder
await consentService.grantConsent(tenantId, 'data_collection', { userId });

// Auditoria automática ao revogar
await consentService.revokeConsent(tenantId, 'data_collection', { userId, reason: 'Solicitação do usuário' });
```

---

### 2. Students Service ✅
**Arquivo:** `apps/gestao-escolar/src/services/studentsService.ts`

**Operações instrumentadas:**
- ✅ `createStudent()` - Grava auditoria após criar aluno
- ✅ `updateStudent()` - Grava auditoria com old/new values após atualizar
- ✅ `deleteStudent()` - Grava auditoria após desativar aluno

**Exemplo:**
```typescript
// Auditoria automática ao criar
const student = await studentsService.createStudent({ name: 'João', tenant_id: '...' });

// Auditoria automática ao atualizar (com old/new values)
await studentsService.updateStudent(studentId, { name: 'João Silva' });

// Auditoria automática ao deletar
await studentsService.deleteStudent(studentId);
```

---

### 3. PEI Service ✅
**Arquivo:** `src/services/peiService.ts` (NOVO)

**Operações instrumentadas:**
- ✅ `createPEI()` - Grava auditoria após criar PEI
- ✅ `updatePEI()` - Grava auditoria com old/new values após atualizar
- ✅ `approvePEI()` - Grava auditoria ao aprovar PEI
- ✅ `returnPEI()` - Grava auditoria ao devolver PEI
- ✅ `deletePEI()` - Grava auditoria ao deletar PEI

**Exemplo:**
```typescript
// Criar PEI
const pei = await peiService.createPEI({
  student_id: '...',
  tenant_id: '...',
  school_id: '...',
});

// Aprovar PEI
await peiService.approvePEI(peiId);

// Devolver PEI
await peiService.returnPEI(peiId, 'Necessita revisão do diagnóstico');
```

---

## 📋 PRÓXIMOS SERVIÇOS A INSTRUMENTAR

### 4. AEE Service (Pendente)
- `createAEEPlan()`
- `updateAEEPlan()`
- `approveAEEPlan()`
- `deleteAEEPlan()`

### 5. DSR Service (Pendente)
- `createDSRRequest()` - Já tem no `dsrService.ts`
- `exportPersonalData()` - Já tem no `dsrService.ts`
- `anonymizePersonalData()` - Já tem no `dsrService.ts`

### 6. Retention Service (Pendente)
- `applyRules()` - Já tem no `retentionService.ts`

---

## 🔄 MIGRAÇÃO DE CÓDIGO EXISTENTE

### Componentes que usam operações diretas de PEI

**Arquivos identificados:**
- `src/pages/CreatePEI.tsx` - Criar PEI diretamente
- `src/components/coordinator/PEIDetailDialog.tsx` - Aprovar/Devolver PEI
- `src/components/coordinator/RequestPEIDialog.tsx` - Criar/Atualizar PEI

**Ação:** Substituir chamadas diretas por `peiService`:
```typescript
// ANTES
await supabase.from('peis').insert({...});

// DEPOIS
await peiService.createPEI({...});
```

---

## 📊 ESTATÍSTICAS

- **Serviços instrumentados:** 3
- **Operações instrumentadas:** 8
- **Componentes a migrar:** 3+

---

**Status:** 🟡 **Em progresso. Serviços principais instrumentados. Migrar componentes para usar serviços.**

