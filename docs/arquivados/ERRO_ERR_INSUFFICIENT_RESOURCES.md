# 🔧 Solução: ERR_INSUFFICIENT_RESOURCES

## Problema Identificado

O erro `ERR_INSUFFICIENT_RESOURCES` ocorre quando há muitas requisições simultâneas para o Supabase, especialmente requisições HEAD para as tabelas `professionals` e `classes`.

### Sintomas

```
HEAD https://fximylewmvsllkdczovj.supabase.co/rest/v1/professionals?select=id%2C…ool_id&tenant_id=eq.e2bc1a84-9f02-4cce-8b2d-1bd1daa6b029&is_active=eq.true net::ERR_INSUFFICIENT_RESOURCES

HEAD https://fximylewmvsllkdczovj.supabase.co/rest/v1/classes?select=id%2Cschool_id&tenant_id=eq.e2bc1a84-9f02-4cce-8b2d-1bd1daa6b029&is_active=eq.true net::ERR_INSUFFICIENT_RESOURCES
```

### Causas Prováveis

1. **Múltiplos componentes montando simultaneamente** - Vários componentes fazendo requisições ao mesmo tempo
2. **Requisições HEAD automáticas do Supabase** - O Supabase pode fazer verificações prévias (HEAD requests) para validar queries antes de executá-las
3. **Múltiplos `useEffect` disparando ao mesmo tempo** - Vários hooks executando requisições simultaneamente
4. **Falta de debounce/throttle** - Requisições sendo feitas sem controle de frequência

## Soluções Implementadas

### 1. Otimização do QueryClient (React Query)

O `QueryClient` já está configurado com:
- `staleTime: 5 minutos` - Dados considerados "frescos" por 5 minutos
- `refetchOnWindowFocus: false` - Não refetch ao focar a janela
- `retry: 1` - Apenas 1 tentativa de retry

### 2. Verificação de Tabelas

As tabelas `professionals` e `classes` existem e têm dados:
- `professionals`: 39 registros ativos
- `classes`: 13 registros ativos

### 3. Recomendações

#### A. Adicionar Debounce em Requisições

Para componentes que fazem buscas frequentes, adicionar debounce:

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (searchTerm: string) => {
    // Fazer requisição aqui
  },
  300 // 300ms de delay
);
```

#### B. Consolidar Requisições

Em vez de fazer múltiplas requisições separadas, usar `Promise.all` para fazer requisições em paralelo:

```typescript
const [professionalsData, classesData] = await Promise.all([
  supabase.from('professionals').select('id, school_id').eq('tenant_id', tenantId).eq('is_active', true),
  supabase.from('classes').select('id, school_id').eq('tenant_id', tenantId).eq('is_active', true)
]);
```

#### C. Usar Cache do React Query

Para dados que não mudam frequentemente, usar React Query com cache:

```typescript
const { data: professionals } = useQuery({
  queryKey: ['professionals', tenantId],
  queryFn: () => supabase.from('professionals').select('*').eq('tenant_id', tenantId).eq('is_active', true),
  staleTime: 5 * 60 * 1000, // 5 minutos
});
```

#### D. Evitar Requisições em Loop

Verificar se há `useEffect` sem dependências corretas que podem causar loops:

```typescript
// ❌ Ruim - pode causar loop
useEffect(() => {
  loadData();
});

// ✅ Bom - com dependências corretas
useEffect(() => {
  if (tenantId) {
    loadData();
  }
}, [tenantId]);
```

## Próximos Passos

1. ✅ Verificar se as tabelas existem (confirmado)
2. ⏳ Adicionar debounce em componentes de busca
3. ⏳ Consolidar requisições duplicadas
4. ⏳ Verificar se há `useEffect` causando loops
5. ⏳ Monitorar logs do Supabase para identificar padrões

## Monitoramento

Para monitorar o problema:

1. **Logs do Supabase**: Verificar logs de API para identificar requisições frequentes
2. **Network Tab**: Verificar no DevTools quantas requisições estão sendo feitas simultaneamente
3. **Performance Tab**: Verificar se há gargalos de performance

## Notas

- O erro `ERR_INSUFFICIENT_RESOURCES` é um limite do navegador, não do Supabase
- Requisições HEAD são feitas automaticamente pelo Supabase para validar queries
- O problema pode ser temporário e se resolver sozinho após algumas tentativas

