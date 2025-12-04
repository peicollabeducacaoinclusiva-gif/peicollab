# ⏸️ Correções Pendentes - PEI Collab

**Gerado em:** 04/11/2024  
**Status:** 7 correções adicionais a implementar

---

## 📊 Status Geral

| Categoria | Total | Corrigidas | Pendentes | % |
|-----------|-------|------------|-----------|---|
| Críticas | 3 | 3 | 0 | 100% ✅ |
| Altas | 1 | 1 | 0 | 100% ✅ |
| Médias | 4 | 2 | 2 | 50% ⏸️ |
| Baixas | 2 | 0 | 2 | 0% ⏸️ |
| Erros | 3 | 3 | 0 | 100% ✅ |
| UX | 3 | 1 | 2 | 33% ⏸️ |
| **TOTAL** | **16** | **9** | **7** | **56%** |

---

## 🟡 PENDENTES MÉDIAS (2)

### 1. Validação de Chave Demo em Produção
**Prioridade:** Média  
**Arquivo:** `src/integrations/supabase/client.ts`

**Problema:**
```typescript
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Chave demo
```

**Solução:** Adicionar validação em produção

### 2. Rate Limiting
**Prioridade:** Média  
**Local:** Login, tokens de família

**Problema:** Sem proteção contra força bruta

**Solução:** Implementar rate limiting

---

## 🟢 PENDENTES BAIXAS (2)

### 3. Senhas de Teste
**Prioridade:** Baixa  
**Local:** Scripts de teste

**Solução:** Gerar senhas aleatórias

### 4. Prompt PWA
**Prioridade:** Baixa  
**Arquivo:** `PWAUpdatePrompt.tsx`

**Solução:** Desabilitar em dev

---

## 🎨 PENDENTES UX (2)

### 5. Loading Travado
**Prioridade:** Média  
**Arquivo:** `Auth.tsx`

**Solução:** Melhorar tratamento de loading

### 6. Animações Longas
**Prioridade:** Baixa

**Solução:** Reduzir duração

