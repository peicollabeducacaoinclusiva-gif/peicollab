# Plano de Testes e Garantia de Qualidade (QA) - PEI Collab V3

**Versão:** 1.0  
**Data:** 30 de Novembro de 2025  
**Status:** Consolidado

---

## 1. Introdução

Este documento define a estratégia de testes e garantia de qualidade (QA) para o ecossistema **PEI Collab V3**. O objetivo é assegurar a confiabilidade, segurança, acessibilidade e performance de todas as aplicações do monorepo.

---

## 2. Estratégia de Testes (Pirâmide de Testes)

Adotamos uma estratégia baseada na pirâmide de testes, priorizando testes rápidos e isolados na base, e testes integrados e de ponta a ponta no topo.

### 2.1. Nível 1: Testes Unitários (Base)
*   **Objetivo:** Validar a lógica de funções isoladas, hooks personalizados e componentes simples.
*   **Ferramentas:** Vitest, React Testing Library.
*   **Escopo:** `packages/`, `utils/`, `hooks/`.
*   **Comando:** `pnpm test:unit`

### 2.2. Nível 2: Testes de Integração (Meio)
*   **Objetivo:** Validar a comunicação entre componentes, serviços e o banco de dados (mockado ou ambiente de teste).
*   **Ferramentas:** Vitest, Testing Library.
*   **Escopo:** Fluxos de formulários, serviços de API (`services/`), contextos (`contexts/`).
*   **Comando:** `pnpm test:integration`

### 2.3. Nível 3: Testes End-to-End (Topo)
*   **Objetivo:** Simular o comportamento do usuário real navegando na aplicação completa.
*   **Ferramentas:** Playwright.
*   **Escopo:** Fluxos críticos (Login, Criação de PEI, Matrícula de Aluno).
*   **Comando:** `pnpm test:e2e`

---

## 3. Testes Especializados

Além da pirâmide tradicional, realizamos testes focados em requisitos não funcionais críticos.

### 3.1. Testes de Acessibilidade (a11y)
*   **Objetivo:** Garantir conformidade com WCAG 2.1 AA.
*   **Ferramentas:** Jest + @axe-core/puppeteer.
*   **Validação:** Contraste de cores, navegação por teclado, rótulos ARIA, estrutura semântica.
*   **Comando:** `pnpm test:accessibility`

### 3.2. Testes de Performance (Carga)
*   **Objetivo:** Validar comportamento sob alta demanda (ex: redes com 10k+ alunos).
*   **Ferramentas:** K6, Artillery.
*   **Cenários:** Login simultâneo, geração de relatórios em massa.
*   **Scripts:** Localizados em `scripts/k6-load-test.js`.

### 3.3. Testes de Segurança e SSO
*   **Objetivo:** Validar isolamento de dados (RLS) e fluxo de autenticação única.
*   **Ferramentas:** Scripts manuais e automatizados.
*   **Escopo:** Login multi-tenant, troca de senha, permissões de acesso.
*   **Comando:** `pnpm test:sso`

---

## 4. Ferramentas e Configuração

| Tipo | Ferramenta | Configuração |
|------|------------|--------------|
| **Runner / Unit** | Vitest | `vite.config.ts` |
| **E2E** | Playwright | `playwright.config.ts` |
| **Acessibilidade** | Axe Core | `jest.config.js` |
| **Carga** | K6 | `scripts/k6-load-test.js` |
| **CI/CD** | GitHub Actions | `.github/workflows/` |

---

## 5. Plano de Execução

### 5.1. Ciclo de Desenvolvimento Local
O desenvolvedor deve executar antes de cada commit:
1.  **Lint e Type Check:** `pnpm lint && pnpm type-check`
2.  **Testes Unitários:** `pnpm test:unit` (ou modo watch: `pnpm test --watch`)

### 5.2. Pipeline de CI (Pull Request)
Ao abrir um PR, o pipeline executa automaticamente:
1.  Build de todos os apps.
2.  Lint e verificação de tipos.
3.  Testes Unitários e de Integração.
4.  Testes E2E (Smoke Tests).

### 5.3. Validação de Release (QA Manual)
Antes de deploy em produção, o QA deve validar manualmente:
1.  **Usabilidade:** Verificar responsividade em Mobile e Desktop.
2.  **Fluxos Críticos:**
    *   [ ] Login/Logout com diferentes perfis.
    *   [ ] Criação e Edição de PEI.
    *   [ ] Matrícula e Enturmação.
    *   [ ] Geração de Relatórios PDF.
3.  **Acessibilidade:** Navegação completa apenas com teclado.

---

## 6. Casos de Teste Críticos (Smoke Test)

### CT-01: Login e SSO
*   **Ação:** Usuário acessa `pei.dominio.com`, faz login.
*   **Resultado:** Redirecionado para Dashboard. Ao acessar `gestao.dominio.com`, já está logado.

### CT-02: Criação de PEI
*   **Ação:** Professor cria novo PEI para aluno.
*   **Resultado:** PEI salvo com status "Rascunho". Dados persistem após refresh.

### CT-03: Isolamento de Dados (RLS)
*   **Ação:** Usuário da "Escola A" tenta acessar URL de aluno da "Escola B".
*   **Resultado:** Acesso negado ou erro 404. Dados não vazam.

### CT-04: Exportação Educacenso
*   **Ação:** Secretário solicita exportação do Censo.
*   **Resultado:** Arquivo gerado no formato correto. Validação de campos obrigatórios ocorre antes.

---

## 7. Relatórios de Qualidade

Os resultados dos testes são gerados nos seguintes formatos:
*   **Cobertura de Código:** `coverage/index.html` (Meta: > 80%).
*   **Relatório E2E:** `playwright-report/index.html` (com vídeos e traces).
*   **Acessibilidade:** Logs no console com violações WCAG.

---

## 8. Definição de Pronto (Definition of Done - DoD)

Uma funcionalidade só é considerada "Pronta" quando:
1.  [ ] Código implementado e revisado (Code Review).
2.  [ ] Testes unitários criados/atualizados.
3.  [ ] Testes de integração passando.
4.  [ ] Não gera novos erros de lint ou tipos.
5.  [ ] Funcionalidade validada em ambiente de Staging.
6.  [ ] Documentação atualizada.
