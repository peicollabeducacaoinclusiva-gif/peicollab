# ⚙️ Configuração do Ambiente de Desenvolvimento

Este guia explica como configurar o ambiente de desenvolvimento do PEI Collab V3.

---

## 📋 Pré-requisitos

### Software Necessário

| Software | Versão Mínima | Como Instalar |
|----------|---------------|---------------|
| **Node.js** | >= 18.0.0 | [nodejs.org](https://nodejs.org/) |
| **pnpm** | >= 8.0.0 | `npm install -g pnpm@8.10.0` |
| **Git** | >= 2.30.0 | [git-scm.com](https://git-scm.com/) |
| **VS Code** (recomendado) | Última versão | [code.visualstudio.com](https://code.visualstudio.com/) |

### Verificar Instalações

```bash
node --version    # deve ser >= 18
pnpm --version    # deve ser >= 8
git --version     # deve ser >= 2.30
```

---

## 🚀 Configuração Inicial

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd pei-collab
```

### 2. Instalar Dependências

No **root do projeto** (onde está o `pnpm-workspace.yaml`):

```bash
pnpm install
```

**Tempo estimado**: 2-3 minutos

Isso vai:
- Instalar dependências de todos os apps (`apps/*`)
- Instalar dependências dos packages (`packages/*`)
- Criar links simbólicos entre os packages

### 3. Configurar Variáveis de Ambiente

Criar arquivos `.env` em **cada app** com as credenciais do **mesmo banco Supabase**:

#### **apps/pei-collab/.env**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

#### **apps/gestao-escolar/.env**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

#### **apps/plano-aee/.env**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

**⚠️ Importante**: Todos os apps devem usar as **mesmas credenciais** do Supabase.

### 4. Configurar Banco de Dados

Aplicar as migrações SQL no Supabase Dashboard → SQL Editor:

1. Acesse: https://app.supabase.com/project/seu-projeto/sql
2. Execute as migrações em ordem (ver `supabase/migrations/`)
3. Verifique se as tabelas foram criadas corretamente

**Documentação completa**: [`../setup/📦_INSTALACAO_FINAL.md`](../setup/📦_INSTALACAO_FINAL.md)

---

## 🏃 Executar o Projeto

### Modo Desenvolvimento

No **root do projeto**:

```bash
pnpm dev
```

Isso inicia **todos os apps** simultaneamente:

- **Gestão Escolar**: http://localhost:5174
- **Plano de AEE**: http://localhost:5175
- **PEI Collab**: http://localhost:8080

### Executar Apps Individuais

```bash
# Apenas Gestão Escolar
pnpm --filter gestao-escolar dev

# Apenas Plano de AEE
pnpm --filter plano-aee dev

# Apenas PEI Collab
pnpm --filter pei-collab dev
```

---

## 🧪 Executar Testes

```bash
# Todos os testes
pnpm test

# Testes de um app específico
pnpm --filter gestao-escolar test
```

---

## 🔧 Troubleshooting

### Erro: "Cannot find module"

```bash
# Limpar cache e reinstalar
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Erro: "Port already in use"

Altere a porta no `vite.config.ts` do app correspondente.

### Erro: "Supabase connection failed"

1. Verifique se as variáveis de ambiente estão corretas
2. Verifique se o projeto Supabase está ativo
3. Verifique se as migrações foram aplicadas

---

## 📚 Próximos Passos

- **[Arquitetura do Sistema](./02_ARQUITETURA_SISTEMA.md)** - Entenda a estrutura do projeto
- **[Guia de Contribuição](./03_GUIA_CONTRIBUICAO.md)** - Como contribuir
- **[Padrões de Código](./04_PADROES_CODIGO.md)** - Convenções do projeto

---

**Última atualização**: Janeiro 2025

