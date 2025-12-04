# 🎓 PEI Collab - Sistema Integrado de Gestão Educacional Inclusiva

**Versão 3.1.0** | **Monorepo** | **9 Aplicações Integradas**

Plataforma colaborativa completa para gestão de Planos Educacionais Individualizados (PEI), Gestão Escolar, Planos de AEE e módulos complementares para redes de ensino.

---

## 🚀 Início Rápido

### **Para Não-Programadores (Usando IA)** 🤖

**Você vai manter o sistema com ajuda de IA?**

👉 **[COMECE AQUI: Manual de Programação Assistida por IA](docs/00-inicio-rapido/LEIA-ME-PRIMEIRO.md)**

Este manual ensina **como usar IA para desenvolver**, mesmo sem saber programar:
- 📖 [Manual Completo](docs/00-inicio-rapido/MANUAL_PROGRAMACAO_ASSISTIDA_IA.md) (60 min)
- 🎯 [Guia Prático](docs/00-inicio-rapido/GUIA_PRATICO_IA.md) (20 min)  
- 📝 [Cheatsheet - Templates Prontos](docs/00-inicio-rapido/CHEATSHEET_PEDIDOS_IA.md) (5 min)

---

### **Para Programadores** 👨‍💻

**Instalação em 3 Passos:**

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
# Ver: docs/desenvolvimento/01_CONFIGURACAO_AMBIENTE.md

# 3. Rodar os apps
pnpm dev
```

**Apps principais iniciarão em:**
- **PEI Collab**: http://localhost:8080
- **Gestão Escolar**: http://localhost:5174
- **Plano de AEE**: http://localhost:5175
- **Landing Page**: http://localhost:5173
- **Outros apps**: Portas dinâmicas conforme configuração

---

## 📚 Documentação

Toda a documentação está **organizada e consolidada** em [`docs/`](docs/INDICE_DOCUMENTACAO.md):

### **🎯 Início Rápido**

| Documento | Descrição | Tempo |
|-----------|-----------|-------|
| [🤖 Manual de IA](docs/00-inicio-rapido/README.md) | **⭐ PARA NÃO-PROGRAMADORES:** Como usar IA para desenvolver | 30 min |
| [📑 Índice da Documentação](docs/INDICE_DOCUMENTACAO.md) | **⭐ PARA PROGRAMADORES:** Índice completo e organizado | 3 min |
| [👨‍💻 Documentação de Desenvolvimento](docs/desenvolvimento/README.md) | Guias técnicos para desenvolvedores | 2 min |
| [📊 Análise Completa do Projeto](docs/06-analises-avaliacoes/ANALISE_COMPLETA.md) | Estado atual (V3.1.0) - Pontuação: 9.0/10 | 10 min |

### **📂 Documentação por Categoria**

| Categoria | Descrição | Link |
|-----------|-----------|------|
| **🤖 Para IA** | Manual completo para não-programadores | [00-inicio-rapido/](docs/00-inicio-rapido/) |
| **🧪 Testes** | Cobertura 70%+, guias e relatórios | [01-testes/](docs/01-testes/) |
| **🔐 LGPD** | Conformidade, auditoria, retenção | [02-lgpd-observabilidade/](docs/02-lgpd-observabilidade/) |
| **🔧 Correções** | Histórico de correções e bugs | [03-correcoes-historico/](docs/03-correcoes-historico/) |
| **⚙️ Implementações** | Features, status, padronizações | [04-implementacoes/](docs/04-implementacoes/) |
| **🗄️ Migrações** | SQL migrations e banco de dados | [05-migracoes/](docs/05-migracoes/) |
| **📊 Análises** | Avaliações técnicas e relatórios | [06-analises-avaliacoes/](docs/06-analises-avaliacoes/) |
| **⚖️ Legal** | Políticas e termos de uso | [07-legais/](docs/07-legais/) |

### **Para Desenvolvedores:**

| Documento | Descrição | Tempo |
|-----------|-----------|-------|
| [⚙️ Configuração do Ambiente](docs/desenvolvimento/01_CONFIGURACAO_AMBIENTE.md) | Setup completo do ambiente | 15 min |
| [🏗️ Arquitetura do Sistema](docs/desenvolvimento/02_ARQUITETURA_SISTEMA.md) | Estrutura e organização do projeto | 20 min |
| [📐 Padrões de Código](docs/desenvolvimento/04_PADROES_CODIGO.md) | Convenções e boas práticas | 10 min |
| [🗄️ Banco de Dados](docs/desenvolvimento/05_BANCO_DADOS.md) | Estrutura e migrações | 15 min |
| [🔐 Autenticação e Segurança](docs/desenvolvimento/06_AUTENTICACAO_SEGURANCA.md) | RLS, roles e permissões | 15 min |

**[📑 Ver Índice Completo →](docs/INDICE_DOCUMENTACAO.md)**

---

## 🎯 Arquitetura

```
pei-collab/ (monorepo)
├── apps/
│   ├── pei-collab/          → PEI principal + Reuniões + Avaliações
│   ├── gestao-escolar/      → Gestão completa de alunos, profissionais, turmas
│   ├── plano-aee/           → Planos de AEE (Atendimento Educacional Especializado)
│   ├── landing/             → Landing page e marketing
│   ├── blog/                → Sistema de blog e conteúdo
│   ├── atividades/          → Sistema de atividades educacionais
│   ├── planejamento/        → Planejamento pedagógico
│   ├── portal-responsavel/  → Portal para responsáveis
│   ├── transporte-escolar/  → Gestão de transporte
│   └── merenda-escolar/     → Gestão de merenda
│
├── packages/
│   ├── ui/                  → Componentes UI compartilhados (shadcn/ui)
│   ├── database/            → Cliente Supabase + queries + hooks
│   ├── auth/                → Sistema de autenticação
│   ├── dashboards/          → Dashboards e componentes de visualização
│   ├── config/              → Configurações compartilhadas
│   ├── i18n/                → Internacionalização
│   ├── shared-types/        → Tipos TypeScript compartilhados
│   ├── observability/       → Logging, métricas e observabilidade
│   └── test-utils/          → Utilitários para testes
│
├── supabase/
│   ├── migrations/          → 150+ migrações SQL
│   └── functions/           → Edge Functions (Deno)
│
├── scripts/                 → Scripts de manutenção e testes
├── tests/                   → Testes automatizados
└── docs/                    → Documentação completa e organizada
```

---

## ✨ Funcionalidades Principais

### **🎓 PEI Collab (App Principal)**
- ✅ Criação e edição completa de PEIs
- ✅ Sistema de versionamento automático (garante 1 PEI ativo por aluno)
- ✅ Múltiplos professores por PEI (primário + complementares)
- ✅ Dashboard personalizado por perfil (8 perfis de usuário)
- ✅ Sistema de Reuniões (pauta + ata + acompanhamento)
- ✅ Avaliações Cíclicas (I, II, III Ciclo) com relatórios
- ✅ Fila de validação para coordenadores
- ✅ Geração de PDFs formatados
- ✅ IA integrada para sugestões inteligentes
- ✅ PWA completo (instalável, offline-first)

### **📋 Gestão Escolar**
- ✅ Cadastro completo de Alunos, Profissionais e Turmas
- ✅ Sistema de Matrículas com histórico
- ✅ Gestão de Frequência, Notas e Avaliações
- ✅ Integração Educacenso
- ✅ Módulo de Secretaria Avançado

### **♿ Plano de AEE**
- ✅ Formulário completo (12+ seções)
- ✅ Ferramentas de Diagnóstico
- ✅ **Integração completa no PDF do PEI**
- ✅ Sistema de Comentários e Colaboração

---

## 🔧 Stack Tecnológica

### **Frontend**
- **React 18** + **TypeScript 5.2+**
- **Vite 5** (build tool e dev server)
- **Tailwind CSS 3.4** + **shadcn/ui**
- **React Router DOM** (navegação)
- **React Hook Form** + **Zod** (formulários e validação)
- **TanStack Query** (state management e cache)

### **Backend**
- **Supabase** (PostgreSQL + Auth + Storage)
- **Row Level Security (RLS)** para segurança
- **Edge Functions** (Deno) para serverless

### **Qualidade e Testes**
- ✅ **Vitest** - Testes unitários
- ✅ **Playwright** - Testes E2E
- ✅ **GitHub Actions** - CI/CD completo
- ✅ **Cobertura de testes: 70%+**

### **Infraestrutura**
- **Monorepo**: Turborepo + pnpm workspaces
- **CI/CD**: GitHub Actions automatizado
- **Deploy**: Vercel (frontend) + Supabase (backend)

---

## 📊 Estatísticas do Projeto

| Métrica | Valor | Status |
|---------|-------|--------|
| **Versão** | 3.1.0 | ✅ |
| **Aplicações** | 9 apps | ✅ |
| **Pacotes** | 9 packages | ✅ |
| **Componentes** | 300+ | ✅ |
| **Testes** | 130+ casos | ✅ |
| **Cobertura** | 70%+ | ✅ |
| **Migrações SQL** | 150+ | ✅ |
| **Pontuação** | 9.0/10 | ✅ |

---

## 🧪 Testes

### **Scripts de Teste**

```bash
# Testes unitários
pnpm test

# Testes com cobertura
pnpm test:coverage

# Interface visual
pnpm test:ui

# Testes E2E
pnpm test:e2e

# Análise de bundle
pnpm analyze:bundle
```

### **Cobertura**
- ✅ 130+ casos de teste
- ✅ 70%+ de cobertura
- ✅ Testes de integração
- ✅ CI/CD automatizado

---

## 🔐 Segurança e LGPD

- ✅ **Row Level Security (RLS)** em todas as tabelas
- ✅ **Autenticação** via Supabase Auth
- ✅ **Auditoria completa** de todas as ações
- ✅ **Sistema de consentimentos** LGPD
- ✅ **DSR (Data Subject Rights)** implementado
- ✅ **Retenção automática** de dados

---

## 🚀 Deploy

### **CI/CD Automatizado**

O projeto possui pipeline completo no GitHub Actions:

1. **Lint & Type Check** - Validação de código
2. **Tests** - Testes unitários + cobertura
3. **E2E Tests** - Testes end-to-end
4. **Build** - Build de produção
5. **Deploy** - Automático na Vercel

---

## 🌟 Destaques

- 🏆 **Sistema Multi-Tenant** hierárquico completo
- 🏆 **Offline-First** com sincronização automática
- 🏆 **PWA** instalável e funcional
- 🏆 **LGPD Compliant** com sistema completo de consentimentos
- 🏆 **Cobertura de testes 70%+** com CI/CD automatizado
- 🏆 **Arquitetura Escalável** com monorepo bem estruturado
- 🏆 **Type-Safe** com TypeScript em 100% do código
- 🏆 **Manual de IA** para não-programadores

---

## 📖 Documentação Completa

### **Navegação Rápida**

| Preciso... | Vá Para... |
|------------|------------|
| **Usar IA para desenvolver** | [Manual de IA](docs/00-inicio-rapido/LEIA-ME-PRIMEIRO.md) 🤖 |
| **Configurar ambiente** | [Setup](docs/desenvolvimento/01_CONFIGURACAO_AMBIENTE.md) |
| **Entender o projeto** | [Análise Completa](docs/06-analises-avaliacoes/ANALISE_COMPLETA.md) |
| **Ver testes** | [Cobertura de Testes](docs/01-testes/COBERTURA_TESTES_COMPLETA.md) |
| **Ver todos os docs** | [Índice](docs/INDICE_DOCUMENTACAO.md) |

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### **Guidelines**
- Siga os [Padrões de Código](docs/desenvolvimento/04_PADROES_CODIGO.md)
- Mantenha cobertura de testes acima de 70%
- Documente mudanças significativas
- Use commits semânticos (feat, fix, docs, etc.)

---

## 📊 Status do Projeto

### ✅ **Versão 3.1.0 - Sistema Completo e de Alta Qualidade**

| Aspecto | Status | Pontuação |
|---------|--------|-----------|
| **Arquitetura** | ✅ Excelente | 9/10 |
| **Testes** | ✅ 70%+ | 9.5/10 |
| **CI/CD** | ✅ Automatizado | 9.5/10 |
| **Performance** | ✅ Otimizada | 9/10 |
| **Segurança** | ✅ Robusta | 9/10 |
| **Documentação** | ✅ Completa | 10/10 |
| **GERAL** | ✅ Produção | **9.0/10** ⭐ |

---

## 🎉 Conquistas Recentes

### Versão 3.1.0 (Janeiro 2025)
- ✅ **Cobertura de testes 70%+** (130+ casos de teste)
- ✅ **CI/CD completo** com GitHub Actions
- ✅ **Performance otimizada** com code splitting avançado
- ✅ **Manual de IA** para não-programadores
- ✅ **Documentação organizada** (8 categorias, 180+ docs)

---

## 🌟 Destaques Técnicos

- 🏆 **9 Aplicações** integradas em monorepo
- 🏆 **9 Pacotes** compartilhados
- 🏆 **150+ Migrações SQL** organizadas
- 🏆 **300+ Componentes** React
- 🏆 **130+ Testes** automatizados
- 🏆 **8 Perfis** de usuário com RLS
- 🏆 **50.000+ Linhas** de código TypeScript

---

## 📞 Suporte

- **Documentação Completa**: [`docs/`](docs/INDICE_DOCUMENTACAO.md)
- **Manual para IA**: [`docs/00-inicio-rapido/`](docs/00-inicio-rapido/)
- **Setup e Instalação**: [`docs/desenvolvimento/01_CONFIGURACAO_AMBIENTE.md`](docs/desenvolvimento/01_CONFIGURACAO_AMBIENTE.md)
- **Análise do Projeto**: [`docs/06-analises-avaliacoes/ANALISE_COMPLETA.md`](docs/06-analises-avaliacoes/ANALISE_COMPLETA.md)

---

## 📝 Licença

[MIT License](LICENSE)

---

**Desenvolvido com ❤️ para educação inclusiva de qualidade.**

**Última atualização**: Janeiro de 2025 | **Versão**: 3.1.0 | **Status**: 🟢 Pronto para Produção
