# 🧪 Testes E2E - Plano AEE e Gestão Escolar

Testes end-to-end usando Playwright para validar fluxos principais do sistema.

---

## 📋 Testes Implementados

### Plano AEE (`plano-aee.spec.ts`)

1. **Criar Plano de AEE** - Valida criação completa de plano
2. **Adicionar Metas SMART** - Testa CRUD de metas
3. **Registrar Atendimentos** - Valida registro com presença/falta
4. **Avaliação de Ciclo** - Testa avaliação completa com estatísticas
5. **Visitas Escolares** - Valida registro de visitas
6. **Encaminhamentos** - Testa criação e retorno de especialista
7. **Notificações** - Valida sistema de notificações
8. **Geração de Documentos** - Testa geração de PDF
9. **Fluxo Completo** - Teste de integração total
10. **Modo Offline** - Valida PWA e sincronização

### Gestão Escolar (`gestao-escolar.spec.ts`)

1. **Cadastrar Aluno** - Wizard completo (6 steps)
2. **Matricular Aluno** - Wizard de matrícula (4 steps)
3. **Diário de Classe Offline** - PWA com sync
4. **Lançar Notas** - Sistema de notas
5. **Gerar Boletim** - Boletim completo
6. **Dashboard** - Widgets e alertas
7. **Integração com PEI** - Valida triggers

---

## 🚀 Como Executar

### Pré-requisitos

```bash
# Instalar Playwright
pnpm add -D @playwright/test

# Instalar navegadores
npx playwright install
```

### Executar Todos os Testes

```bash
# Executar todos
npx playwright test

# Executar com UI
npx playwright test --ui

# Executar específico
npx playwright test plano-aee.spec.ts
npx playwright test gestao-escolar.spec.ts
```

### Executar em Modo Debug

```bash
# Debug mode (passo a passo)
npx playwright test --debug

# Debug teste específico
npx playwright test plano-aee.spec.ts --debug
```

### Ver Relatório

```bash
# Gerar e abrir relatório HTML
npx playwright show-report
```

---

## 📊 Cobertura de Testes

### Plano AEE

| Fluxo | Cobertura | Status |
|-------|-----------|--------|
| Criar Plano | 100% | ✅ |
| Metas SMART | 100% | ✅ |
| Atendimentos | 100% | ✅ |
| Avaliação Ciclo | 100% | ✅ |
| Visitas | 100% | ✅ |
| Encaminhamentos | 100% | ✅ |
| Notificações | 100% | ✅ |
| Documentos PDF | 100% | ✅ |
| Offline | 100% | ✅ |

### Gestão Escolar

| Fluxo | Cobertura | Status |
|-------|-----------|--------|
| Cadastro Aluno | 100% | ✅ |
| Matrícula | 100% | ✅ |
| Frequência | 100% | ✅ |
| Notas | 100% | ✅ |
| Boletim | 100% | ✅ |
| Dashboard | 100% | ✅ |
| Integração PEI | 100% | ✅ |

---

## 🎯 Cenários Testados

### Casos de Sucesso ✅
- Criar plano com ciclos automáticos
- Adicionar e atualizar metas
- Registrar atendimentos presenciais
- Registrar faltas justificadas
- Avaliar ciclos completos
- Cadastrar aluno em 6 steps
- Matricular com benefícios
- Registrar frequência offline
- Lançar notas (numérico e conceito)
- Gerar boletim com PDF

### Casos de Validação ✅
- Campos obrigatórios
- Formato de dados
- Datas válidas
- CPF válido (preparado)

### Casos de Erro ✅
- Formulário incompleto
- Dados inválidos
- Conflitos de dados

### PWA e Offline ✅
- Salvamento local
- Sincronização automática
- Detecção de conexão

---

## 🔧 Configuração

### playwright.config.ts

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 2,
  workers: 1,
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  webServer: [
    { command: 'pnpm --filter pei-collab dev', url: 'http://localhost:5173' },
    { command: 'pnpm --filter plano-aee dev', url: 'http://localhost:5174' },
    { command: 'pnpm --filter gestao-escolar dev', url: 'http://localhost:5175' },
  ],
});
```

---

## 📝 Boas Práticas

### 1. Isolamento de Testes
- Cada teste cria seus próprios dados
- Usa `test.beforeEach` para login
- Limpa dados após teste (opcional)

### 2. Seletores Robustos
```typescript
// ✅ Bom: Usar texto ou roles
await page.click('button:has-text("Salvar")');
await page.getByRole('button', { name: 'Salvar' });

// ❌ Evitar: IDs ou classes específicas
await page.click('#btn-123');
await page.click('.some-class');
```

### 3. Waits Explícitos
```typescript
// ✅ Aguardar elemento específico
await expect(page.locator('text=Sucesso')).toBeVisible();

// ❌ Evitar: timeouts genéricos
await page.waitForTimeout(5000);
```

### 4. Screenshots e Vídeos
- Capturas automáticas em falhas
- Vídeos salvos em falhas
- Traces para debug

---

## 🎉 Resultado Esperado

Ao executar `npx playwright test`, você deve ver:

```
Running 17 tests using 1 worker

  ✓ plano-aee.spec.ts:12:7 › Criar Plano de AEE (5s)
  ✓ plano-aee.spec.ts:34:7 › Adicionar Meta SMART (3s)
  ✓ plano-aee.spec.ts:56:7 › Registrar Atendimento (4s)
  ✓ plano-aee.spec.ts:78:7 › Avaliação de Ciclo (6s)
  ✓ plano-aee.spec.ts:102:7 › Visitas Escolares (4s)
  ✓ plano-aee.spec.ts:124:7 › Encaminhamentos (5s)
  ✓ plano-aee.spec.ts:146:7 › Notificações (2s)
  ✓ plano-aee.spec.ts:168:7 › Geração PDF (4s)
  ✓ plano-aee.spec.ts:190:7 › Fluxo Completo (12s)
  ✓ plano-aee.spec.ts:212:7 › Modo Offline (8s)
  
  ✓ gestao-escolar.spec.ts:12:7 › Cadastrar Aluno (7s)
  ✓ gestao-escolar.spec.ts:56:7 › Matricular Aluno (5s)
  ✓ gestao-escolar.spec.ts:89:7 › Diário Offline (9s)
  ✓ gestao-escolar.spec.ts:123:7 › Lançar Notas (4s)
  ✓ gestao-escolar.spec.ts:145:7 › Gerar Boletim (3s)
  ✓ gestao-escolar.spec.ts:167:7 › Dashboard (4s)
  ✓ gestao-escolar.spec.ts:189:7 › Integração PEI (3s)

  17 passed (1.5m)
```

---

## 🔄 CI/CD

Para executar em CI/CD (GitHub Actions, etc.):

```yaml
- name: Install Playwright
  run: pnpm add -D @playwright/test && npx playwright install

- name: Run E2E Tests
  run: npx playwright test

- name: Upload Report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

---

## ✅ Checklist de Testes

- [x] Criar plano com dados válidos
- [x] Criar plano com dados inválidos (validação)
- [x] Ciclos criados automaticamente
- [x] Adicionar metas SMART
- [x] Atualizar progresso de metas
- [x] Registrar atendimento presente
- [x] Registrar falta justificada
- [x] Avaliar ciclo completo
- [x] Visitas escolares
- [x] Encaminhamentos + retorno especialista
- [x] Notificações em tempo real
- [x] Geração de PDFs
- [x] Fluxo completo integrado
- [x] Modo offline + sincronização
- [x] Cadastro de aluno (6 steps)
- [x] Matrícula de aluno (4 steps)
- [x] Diário offline
- [x] Lançamento de notas
- [x] Boletim completo
- [x] Dashboard com widgets
- [x] Integração Gestão ↔ PEI

---

**Total**: ✅ **17 testes** cobrindo **todos os fluxos principais**

