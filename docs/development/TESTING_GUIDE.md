# Guia de Testes - PEI Collab

## Estrutura de Testes

### Pacote test-utils

O pacote `@pei/test-utils` fornece utilitários compartilhados para todos os testes:

- **Mocks**: Mock do Supabase Client com suporte a RLS
- **Helpers**: Funções auxiliares para renderização e aguardar condições
- **Setup**: Configuração global de testes

## Tipos de Testes

### 1. Testes Unitários

Testam componentes isolados, funções e serviços.

**Localização:** `apps/*/src/**/__tests__/*.test.ts`

**Exemplo:**

```typescript
import { describe, it, expect } from 'vitest';
import { createMockSupabaseClient, testData } from '@pei/test-utils';

describe('StudentService', () => {
  it('deve validar estudante válido', () => {
    const student = testData.student();
    // Teste aqui
  });
});
```

### 2. Testes de Integração

Testam interação entre componentes, serviços e APIs.

**Localização:** `tests/integration/*.test.ts`

**Exemplo:**

```typescript
import { describe, it, expect } from 'vitest';
import { ssoManager } from '@pei/auth';

describe('SSO Flow', () => {
  it('deve compartilhar sessão entre apps', async () => {
    // Teste aqui
  });
});
```

### 3. Testes E2E

Testam fluxos completos do ponto de vista do usuário.

**Localização:** `tests/e2e/*.spec.ts`

**Exemplo:**

```typescript
import { test, expect } from '@playwright/test';

test('deve fazer login e navegar para dashboard', async ({ page }) => {
  await page.goto('http://localhost:5174');
  // Teste aqui
});
```

## Executando Testes

### Testes Unitários

```bash
# Executar todos os testes unitários
pnpm test

# Executar testes de um app específico
pnpm --filter gestao-escolar test

# Executar com coverage
pnpm test --coverage
```

### Testes de Integração

```bash
# Executar testes de integração
pnpm test:integration
```

### Testes E2E

```bash
# Executar testes E2E
pnpm test:e2e

# Executar em modo UI
pnpm test:e2e:ui
```

## Mocks

### Mock do Supabase

```typescript
import { createMockSupabaseClient, testData } from '@pei/test-utils';

const mockSupabase = createMockSupabaseClient({
  students: [testData.student()],
});

// Configurar RLS
mockSupabase.setRLS(true);
mockSupabase.setUser({ id: 'user-1', tenant_id: 'tenant-1' });

// Usar em testes
const result = await mockSupabase
  .from('students')
  .select('*')
  .then((res) => res);
```

### Dados de Teste

```typescript
import { testData } from '@pei/test-utils';

const student = testData.student({
  name: 'João Silva',
  cpf: '12345678900',
});

const pei = testData.pei({
  student_id: student.id,
  status: 'draft',
});
```

## Helpers de Renderização

### renderWithProviders

Renderiza componentes com todos os providers necessários:

```typescript
import { renderWithProviders } from '@pei/test-utils';

const { getByText } = renderWithProviders(
  <MyComponent />,
  {
    queryClient: createTestQueryClient(),
    locale: 'pt-BR',
  }
);
```

## Boas Práticas

### 1. Isolamento

- Cada teste deve ser independente
- Limpar estado entre testes
- Não depender de ordem de execução

### 2. Nomenclatura

- Use `describe` para agrupar testes relacionados
- Use `it` ou `test` com descrições claras
- Use `beforeEach` e `afterEach` para setup/teardown

### 3. Assertions

- Use assertions específicas
- Verifique comportamento, não implementação
- Teste casos de sucesso e erro

### 4. Coverage

- Mantenha cobertura mínima de 70%
- Foque em código crítico primeiro
- Use `--coverage` para identificar gaps

## Estrutura de Arquivos

```
packages/
  test-utils/
    src/
      setup.ts          # Setup global
      mocks/
        supabase.ts     # Mock do Supabase
      helpers/
        render.tsx      # Helpers de renderização
        waitFor.ts      # Helpers de aguardar

apps/
  gestao-escolar/
    src/
      services/
        __tests__/
          unifiedStudentService.test.ts

tests/
  integration/
    sso-flow.test.ts
    pei-aee-integration.test.ts
  e2e/
    lgpd-flow.spec.ts
    accessibility.spec.ts
```

## CI/CD

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:e2e
```

## Troubleshooting

### Testes falhando intermitentemente

- Verificar timeouts
- Usar `waitFor` para condições assíncronas
- Limpar estado entre testes

### Mocks não funcionando

- Verificar se mocks estão sendo resetados
- Usar `vi.clearAllMocks()` em `afterEach`
- Verificar ordem de importação

### Coverage baixo

- Identificar arquivos não cobertos
- Adicionar testes para casos de borda
- Verificar se testes estão sendo executados

## Referências

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)

