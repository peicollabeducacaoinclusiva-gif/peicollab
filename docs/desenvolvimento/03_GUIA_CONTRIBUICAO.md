# 🤝 Guia de Contribuição

Este guia explica como contribuir com o projeto PEI Collab V3.

---

## 🌿 Fluxo de Trabalho

### 1. Criar Branch

Sempre crie uma branch a partir de `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/nome-da-funcionalidade
```

### 2. Convenções de Nome de Branch

| Tipo | Prefixo | Exemplo |
|------|---------|---------|
| Nova funcionalidade | `feature/` | `feature/dashboard-professor` |
| Correção de bug | `fix/` | `fix/login-redirect` |
| Documentação | `docs/` | `docs/guia-deploy` |
| Refatoração | `refactor/` | `refactor/auth-service` |
| Testes | `test/` | `test/avaliacoes-e2e` |

### 3. Desenvolver

- Siga os [Padrões de Código](./04_PADROES_CODIGO.md)
- Escreva testes quando apropriado
- Documente mudanças significativas

### 4. Commits

Use mensagens de commit descritivas:

```bash
# ❌ Ruim
git commit -m "fix"

# ✅ Bom
git commit -m "fix: corrige redirecionamento após login"
```

#### Formato de Commit

```
<tipo>: <descrição curta>

[corpo opcional explicando o que e por quê]
```

#### Tipos de Commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Mudanças na documentação
- `style`: Formatação, ponto e vírgula, etc.
- `refactor`: Refatoração de código
- `test`: Adição ou correção de testes
- `chore`: Tarefas de manutenção

### 5. Push e Pull Request

```bash
git push origin feature/nome-da-funcionalidade
```

Depois, crie um Pull Request no GitHub/GitLab com:
- **Título descritivo**
- **Descrição** do que foi feito
- **Screenshots** (se aplicável)
- **Checklist** de verificação

---

## ✅ Checklist Antes de Enviar PR

- [ ] Código segue os [Padrões de Código](./04_PADROES_CODIGO.md)
- [ ] Testes passam: `pnpm test`
- [ ] App roda sem erros: `pnpm dev`
- [ ] Sem erros de lint: `pnpm lint`
- [ ] Documentação atualizada (se necessário)
- [ ] Commits seguem o padrão
- [ ] Branch está atualizada com `main`

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
pnpm test

# Testes de um app específico
pnpm --filter gestao-escolar test

# Testes em modo watch
pnpm test --watch
```

### Escrever Testes

- **Unitários**: Testam funções isoladas
- **Integração**: Testam fluxos completos
- **E2E**: Testam no navegador (Playwright)

**Documentação completa**: [`../07_TESTES.md`](./07_TESTES.md)

---

## 📝 Code Review

### Ao Revisar um PR

- Verifique se o código segue os padrões
- Teste localmente se possível
- Sugira melhorias construtivas
- Aprove se estiver tudo ok

### Ao Receber Feedback

- Responda aos comentários
- Faça as correções sugeridas
- Peça esclarecimentos se necessário

---

## 🚫 O Que NÃO Fazer

- ❌ Commits diretos na branch `main`
- ❌ PRs sem descrição
- ❌ Código sem testes (quando aplicável)
- ❌ Quebrar funcionalidades existentes
- ❌ Ignorar erros de lint/TypeScript

---

## 🎯 Boas Práticas

### Código

- **Mantenha funções pequenas** (máximo 50 linhas)
- **Use nomes descritivos** para variáveis e funções
- **Comente código complexo**, não o óbvio
- **Evite duplicação** (DRY - Don't Repeat Yourself)

### Git

- **Commits pequenos e frequentes**
- **Uma funcionalidade por PR**
- **Mantenha branch atualizada** com `main`

### Comunicação

- **Seja claro** em PRs e issues
- **Pergunte** se tiver dúvidas
- **Ajude outros** desenvolvedores

---

## 📚 Recursos

- **[Padrões de Código](./04_PADROES_CODIGO.md)**
- **[Arquitetura do Sistema](./02_ARQUITETURA_SISTEMA.md)**
- **[Documentação Completa](../README.md)**

---

**Última atualização**: Janeiro 2025

