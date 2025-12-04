# 🧪 Testes

Guia sobre como escrever e executar testes no projeto.

---

## 🎯 Tipos de Testes

### Unitários

Testam funções isoladas:

```typescript
// utils/formatDate.test.ts
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('deve formatar data corretamente', () => {
    const date = new Date('2025-01-15');
    expect(formatDate(date)).toBe('15/01/2025');
  });
});
```

### Integração

Testam fluxos completos:

```typescript
// services/studentService.test.ts
import { createStudent } from './studentService';

describe('createStudent', () => {
  it('deve criar aluno e retornar dados', async () => {
    const student = await createStudent({
      name: 'João',
      schoolId: 'school-id'
    });
    
    expect(student.id).toBeDefined();
    expect(student.name).toBe('João');
  });
});
```

### E2E (End-to-End)

Testam no navegador (Playwright):

```typescript
// tests/e2e/login.test.ts
import { test, expect } from '@playwright/test';

test('deve fazer login com sucesso', async ({ page }) => {
  await page.goto('http://localhost:8080/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/dashboard/);
});
```

---

## 🏃 Executar Testes

### Todos os Testes

```bash
pnpm test
```

### Testes de um App

```bash
pnpm --filter gestao-escolar test
```

### Modo Watch

```bash
pnpm test --watch
```

### Cobertura

```bash
pnpm test --coverage
```

---

## 📝 Escrever Testes

### Estrutura

```typescript
describe('NomeDoComponente', () => {
  // Setup
  beforeEach(() => {
    // Configuração antes de cada teste
  });
  
  // Testes
  it('deve fazer X quando Y', () => {
    // Arrange
    const input = 'valor';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('esperado');
  });
});
```

### Testar Componentes React

```typescript
import { render, screen } from '@testing-library/react';
import { StudentCard } from './StudentCard';

describe('StudentCard', () => {
  it('deve exibir nome do aluno', () => {
    render(<StudentCard student={{ name: 'João', id: '1' }} />);
    
    expect(screen.getByText('João')).toBeInTheDocument();
  });
});
```

### Testar Hooks

```typescript
import { renderHook } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('deve retornar usuário quando autenticado', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeDefined();
  });
});
```

---

## 🎯 Boas Práticas

### Nomes Descritivos

```typescript
// ✅ Bom
it('deve retornar erro quando email é inválido', () => { });

// ❌ Ruim
it('testa validação', () => { });
```

### Um Teste, Uma Coisa

```typescript
// ✅ Bom
it('deve validar email', () => { });
it('deve validar senha', () => { });

// ❌ Ruim
it('deve validar formulário completo', () => { });
```

### Arrange-Act-Assert

```typescript
it('deve calcular média corretamente', () => {
  // Arrange: Preparar dados
  const grades = [8, 9, 7];
  
  // Act: Executar função
  const average = calculateAverage(grades);
  
  // Assert: Verificar resultado
  expect(average).toBe(8);
});
```

---

## 🚫 O Que NÃO Testar

- **Implementação interna** (teste comportamento, não código)
- **Bibliotecas externas** (já testadas)
- **Código trivial** (getters/setters simples)

---

## 📚 Recursos

- **[Guia de Contribuição](./03_GUIA_CONTRIBUICAO.md)**
- **[Documentação do Jest](https://jestjs.io/)**
- **[Documentação do Playwright](https://playwright.dev/)**

---

**Última atualização**: Janeiro 2025

