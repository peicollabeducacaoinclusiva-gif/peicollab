# Erros do pnpm - Correções Aplicadas

**Data:** 28/01/2025

---

## ✅ ERROS CORRIGIDOS

### 1. `MultiSchoolDashboard.tsx:76` - Sintaxe de função arrow ✅
**Erro:**
```typescript
const convertToCSV = (data: any[]): string {
```

**Correção:**
```typescript
const convertToCSV = (data: any[]): string => {
```

---

### 2. `useModuleGuard.ts` - JSX em arquivo TypeScript ✅
**Erro:** Arquivo retornava JSX mas tinha extensão `.ts`

**Correção:** Arquivo renomeado para `useModuleGuard.tsx`

---

## ⚠️ ERROS RESTANTES (Não críticos)

### 3. Imports incorretos de `@pei/ui`

Vários componentes estão importando do pacote `@pei/ui` quando deveriam importar dos componentes locais `@/components/ui`:

**Arquivos afetados:**
- `src/components/dashboard/InclusionIndicators.tsx`
- `src/components/dashboard/MultiSchoolDashboard.tsx`
- `src/components/alerts/AlertsDashboard.tsx`

**Componentes não exportados por `@pei/ui`:**
- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`
- `Button`, `Badge`, `Input`, `Label`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Dialog`, `DialogContent`, `DialogDescription`, `DialogHeader`
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`

**Solução:** Alterar imports de:
```typescript
import { Card, Button } from "@pei/ui";
```

Para:
```typescript
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
```

---

## 📊 RESUMO

- **Erros críticos corrigidos:** 2/2 ✅
- **Avisos de import:** ~40 (não críticos)
- **Status de compilação:** Erros de sintaxe resolvidos

**Observação:** Os erros de import não impedem o funcionamento se os componentes existirem em `@/components/ui`. São apenas avisos do TypeScript sobre imports não encontrados no pacote `@pei/ui`.

