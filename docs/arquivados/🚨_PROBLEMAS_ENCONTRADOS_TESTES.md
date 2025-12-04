# 🚨 PROBLEMAS ENCONTRADOS NOS TESTES DO NAVEGADOR

**Data**: 09/11/2025 20:04  
**Status**: Bloqueado por imports incorretos

---

## 📊 Resumo

**Problema Principal**: Os arquivos do app **Plano AEE** foram criados importando componentes de `@pei/ui`, mas esses componentes NÃO estão implementados no pacote `@pei/ui`. Eles existem apenas em `src/components/ui/` (app PEI Collab) e foram copiados para `apps/plano-aee/src/components/ui/`.

---

## 🔍 Arquivos com Imports Problemáticos

**14 arquivos** no `apps/plano-aee/src/` importando de `@pei/ui`:

```
1. apps/plano-aee/src/components/aee/Analytics/DashboardKPIs.tsx
2. apps/plano-aee/src/components/aee/DiagnosticAssessment/steps/SummaryStep.tsx
3. apps/plano-aee/src/components/aee/DiagnosticAssessment/steps/ReadingStep.tsx
4. apps/plano-aee/src/components/aee/DiagnosticAssessment/steps/IdentificationStep.tsx
5. apps/plano-aee/src/components/aee/DiagnosticAssessment/steps/LateralityStep.tsx
6. apps/plano-aee/src/components/aee/DiagnosticAssessment/AssessmentForm.tsx
7. apps/plano-aee/src/components/aee/Attendance/QuickRecord.tsx
8. apps/plano-aee/src/components/aee/Goals/GoalsList.tsx
9. apps/plano-aee/src/pages/EditPlanoAEE.tsx
10. apps/plano-aee/src/components/aee/Goals/GoalForm.tsx
11. apps/plano-aee/src/pages/ViewPlanoAEE.tsx
12. apps/plano-aee/src/pages/CreatePlanoAEE.tsx
13. apps/plano-aee/src/pages/Login.tsx
14. apps/plano-aee/src/pages/Dashboard.tsx
```

---

## 🎯 Exemplo do Problema

### Dashboard.tsx (Linha 6):
```typescript
import { Button, Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
```

**Problema**: `@pei/ui` não exporta esses componentes!

**Solução**: Mudar para:
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
```

---

## ✅ O que JÁ foi corrigido

1. ✅ Componentes UI copiados para `apps/plano-aee/src/components/ui/`
2. ✅ `lib/utils.ts` criado em `apps/plano-aee/src/lib/`
3. ✅ Dependências Radix UI instaladas
4. ✅ `sonner` adicionado ao package.json do app
5. ✅ `App.tsx` corrigido para importar `Toaster` localmente

---

## 🔧 O que PRECISA ser feito

### 1. Substituir Imports (14 arquivos)

**Componentes usados** (precisam dos imports corretos):
- `Button`, `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardDescription`
- `Input`, `Label`, `Textarea`, `Select`
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Badge`, `Progress`, `Separator`
- `Calendar`, `Popover`
- E mais...

**Estratégia**:
1. Criar um script de busca e substituição automática
2. OU corrigir manualmente os 14 arquivos (trabalhoso)
3. OU criar um arquivo `@/components/ui/index.ts` que exporte tudo e importar de lá

### 2. Adicionar Provider do Sonner no App.tsx

O componente `Toaster` de sonner precisa estar na raiz do app para funcionar:

```typescript
import { Toaster } from 'sonner';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <Toaster position="top-right" />
          <BrowserRouter>
            ...
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### 3. Verificar se @pei/database está configurado corretamente

O app importa `supabase` de `@pei/database`. Precisa verificar se está exportando corretamente.

### 4. Verificar se @pei/auth está configurado

O `AuthProvider` vem de `@pei/auth`. Precisa verificar a implementação.

---

## 💡 Recomendação: Criar index.ts centralizado

**Solução mais rápida**:

Criar `apps/plano-aee/src/components/ui/index.ts`:

```typescript
// Exportar todos os componentes UI de uma vez
export * from './accordion';
export * from './alert';
export * from './alert-dialog';
export * from './aspect-ratio';
export * from './avatar';
export * from './badge';
export * from './button';
export * from './calendar';
export * from './card';
// ... (todos os 49 componentes)
```

Então nos arquivos, trocar:
```typescript
// De:
import { Button, Card } from '@pei/ui';

// Para:
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
```

---

## ⏱️ Estimativa de Tempo

- **Criar index.ts centralizado**: ~5 minutos
- **Substituir imports nos 14 arquivos**: ~20 minutos
- **Testar e corrigir erros**: ~15 minutos
- **Total**: ~40 minutos

---

## 🎯 Situação Atual

**Apps testados**: 0/6  
**Tempo gasto até agora**: ~1h30min  
**Bloqueio**: Imports incorretos  

**Recomendação**: Aplicar a solução do index.ts centralizado e continuar os testes.

---

## 📝 Lições Aprendidas

1. **Ao criar novos componentes**, sempre verificar de onde os imports estão vindo
2. **Pacotes workspace** precisam ter seus exports bem definidos
3. **Arquitetura de monorepo** requer atenção especial com dependências compartilhadas
4. **Testes manuais** são essenciais antes de considerar "implementado"

---

## 🔄 Próximos Passos

1. ✅ Documentar problemas (FEITO - este arquivo)
2. ⏳ Criar `components/ui/index.ts` em cada app
3. ⏳ Substituir imports de `@pei/ui` por `@/components/ui`
4. ⏳ Testar app Plano AEE no navegador
5. ⏳ Repetir para os outros apps
6. ⏳ Documentar resultados dos testes

---

**Status**: 🚨 Aguardando correção dos imports para prosseguir com testes

