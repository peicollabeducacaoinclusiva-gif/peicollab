# Guia de Migração: Componentes UI

## Objetivo

Remover duplicação de componentes UI e padronizar o uso de `@pei/ui` em todo o app de gestão escolar.

## Situação Atual

O app `gestao-escolar` possui componentes UI duplicados em `apps/gestao-escolar/src/components/ui/` que já existem no pacote compartilhado `@pei/ui`.

## Componentes Disponíveis em @pei/ui

### Componentes Básicos
- `Button` - Botão acessível
- `Card`, `CardHeader`, `CardTitle`, `CardContent` - Cards
- `Input` - Campo de entrada
- `Label` - Rótulo de campo
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` - Seleção
- `Badge` - Badge/etiqueta
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` - Diálogos
- `AlertDialog` - Diálogo de confirmação

### Componentes Acessíveis
- `AccessibleButton` - Botão com ARIA labels
- `AccessibleInput` - Input com labels e mensagens de erro
- `AccessibleTable` - Tabela acessível
- `AccessibleSelect` - Select acessível
- `AccessibleCard` - Card acessível
- `Pagination` - Paginação acessível

### Componentes Compartilhados
- `AppHeader` - Cabeçalho do app
- `ThemeToggle` - Toggle de tema
- `UserMenu` - Menu do usuário
- `LoginForm` - Formulário de login
- `ProtectedRoute` - Rota protegida

## Plano de Migração

### Fase 1: Páginas Principais (✅ Concluído)

- ✅ `Students.tsx` - Migrado para `@pei/ui`
- ✅ `Professionals.tsx` - Migrado para `@pei/ui`
- ✅ `Classes.tsx` - Migrado para `@pei/ui`
- ✅ `Dashboard.tsx` - Usa `AppHeader` de `@pei/ui`

### Fase 2: Páginas Secundárias (Pendente)

#### Prioridade Alta:
1. **Enrollments.tsx**
   - Migrar de `@/components/ui` para `@pei/ui`
   - Criar `enrollmentsService.ts` e `useEnrollments` hook
   - Usar `AccessibleTable` e `Pagination`

2. **Users.tsx**
   - Migrar componentes UI
   - Criar `usersService.ts` e `useUsers` hook

#### Prioridade Média:
3. **Diary.tsx**
4. **Communication.tsx**
5. **Alerts.tsx**
6. **Finance.tsx**
7. **ReportCards.tsx**

### Fase 3: Remover Duplicação (Pendente)

Após migrar todas as páginas, remover a pasta `apps/gestao-escolar/src/components/ui/` e atualizar imports.

## Exemplo de Migração

### Antes:
```typescript
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();
toast({ title: 'Sucesso', description: 'Operação realizada' });
```

### Depois:
```typescript
import { Button, Card, CardHeader, CardTitle, CardContent } from '@pei/ui';
import { toast } from 'sonner';

toast.success('Operação realizada');
```

## Checklist de Migração por Página

Para cada página, verificar:

- [ ] Imports de `@/components/ui` → `@pei/ui`
- [ ] `useToast` → `toast` do sonner
- [ ] Queries diretas do Supabase → Hooks React Query
- [ ] Tabelas HTML → `AccessibleTable`
- [ ] Paginação customizada → `Pagination` component
- [ ] Headers customizados → `AppHeader`
- [ ] `ThemeToggle` e `UserMenu` → Componentes de `@pei/ui`
- [ ] ARIA labels em elementos interativos
- [ ] Ícones com `aria-hidden="true"`

## Benefícios da Migração

1. **Consistência**: Todos os apps usam os mesmos componentes
2. **Manutenção**: Uma única fonte de verdade para componentes UI
3. **Acessibilidade**: Componentes acessíveis garantidos
4. **Performance**: Bundle menor (sem duplicação)
5. **Padronização**: Código mais limpo e previsível

## Notas Importantes

- Alguns componentes podem ter pequenas diferenças de API
- Testar cada página após migração
- Manter compatibilidade durante a transição
- Documentar qualquer diferença encontrada




