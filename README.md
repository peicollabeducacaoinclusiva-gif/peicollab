# 🎓 PEI Collab - Sistema Integrado de Gestão Educacional Inclusiva

**Versão 3.0.0** | **Monorepo** | **9 Aplicações Integradas**

Plataforma colaborativa completa para gestão de Planos Educacionais Individualizados (PEI), Gestão Escolar, Planos de AEE e módulos complementares para redes de ensino.

---

## 🚀 Início Rápido

### **Instalação em 3 Passos:**

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
# Ver: docs/setup/📦_INSTALACAO_FINAL.md

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

Toda a documentação está organizada em [`docs/`](docs/README.md):

### **Para Desenvolvedores:**

| Documento | Descrição | Tempo |
|-----------|-----------|-------|
| [👨‍💻 Documentação de Desenvolvimento](docs/desenvolvimento/README.md) | **⭐ COMECE AQUI:** Índice da documentação técnica | 2 min |
| [⚙️ Configuração do Ambiente](docs/desenvolvimento/01_CONFIGURACAO_AMBIENTE.md) | Setup completo do ambiente | 15 min |
| [🏗️ Arquitetura do Sistema](docs/desenvolvimento/02_ARQUITETURA_SISTEMA.md) | Estrutura e organização do projeto | 20 min |
| [📐 Padrões de Código](docs/desenvolvimento/04_PADROES_CODIGO.md) | Convenções e boas práticas | 10 min |
| [🗄️ Banco de Dados](docs/desenvolvimento/05_BANCO_DADOS.md) | Estrutura e migrações | 15 min |
| [🔐 Autenticação e Segurança](docs/desenvolvimento/06_AUTENTICACAO_SEGURANCA.md) | RLS, roles e permissões | 15 min |

### **Documentos Gerais:**

| Documento | Descrição | Tempo |
|-----------|-----------|-------|
| [🎯 Resumo Executivo](docs/resumos/🎯_RESUMO_EXECUTIVO_FINAL_MONOREPO.md) | Visão geral completa | 5 min |
| [📦 Instalação](docs/setup/📦_INSTALACAO_FINAL.md) | Setup passo a passo | 15 min |
| [🚀 Início Rápido](docs/setup/🚀_INICIO_RAPIDO_MONOREPO.md) | Configuração rápida | 5 min |
| [📚 Guia Completo](docs/guias/📚_GUIA_COMPLETO_MONOREPO_V3.md) | Arquitetura detalhada | 30 min |
| [🔗 Integração PDF](docs/integracao/🔗_INTEGRACAO_PEI_PLANO_AEE.md) | Integração PEI + AEE | 15 min |

**[📑 Ver Índice Completo →](docs/resumos/📑_INDICE_DOCUMENTACAO_MONOREPO.md)**

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
└── docs/                    → Documentação completa
```

---

## ✨ Funcionalidades Principais

### **🎓 PEI Collab (App Principal)**
- ✅ Criação e edição completa de PEIs
- ✅ Sistema de versionamento automático (garante 1 PEI ativo por aluno)
- ✅ Múltiplos professores por PEI (primário + complementares)
- ✅ Dashboard personalizado por perfil (8 perfis de usuário)
- ✅ Dashboard do Profissional de Apoio (PA) com feedbacks diários
- ✅ Sistema de Reuniões (pauta + ata + acompanhamento)
- ✅ Avaliações Cíclicas (I, II, III Ciclo) com relatórios
- ✅ Fila de validação para coordenadores
- ✅ Geração de PDFs formatados com jsPDF
- ✅ IA integrada para sugestões inteligentes
- ✅ Notificações em tempo real
- ✅ Sistema de tokens para acesso de famílias
- ✅ Modo offline-first com sincronização automática
- ✅ PWA completo (instalável, service worker, cache offline)
- ✅ Avatares personalizáveis (emoji + cores)
- ✅ Logos institucionais personalizadas por rede

### **📋 Gestão Escolar**
- ✅ Cadastro completo de Alunos (campos expandidos + INEP)
- ✅ Cadastro de Profissionais (11+ tipos de funções)
- ✅ Gestão de Turmas (Educação Infantil → EM + EJA)
- ✅ Disciplinas e Campos de Experiência (BNCC)
- ✅ Sistema de Matrículas com histórico
- ✅ Gestão de Frequência
- ✅ Sistema de Notas e Avaliações
- ✅ Relatórios escolares e consolidação
- ✅ Superficha integrada (dados consolidados)
- ✅ Integração Educacenso
- ✅ Módulo de Secretaria Avançado

### **♿ Plano de AEE**
- ✅ Formulário completo (12+ seções)
- ✅ Ferramentas de Diagnóstico por tipo de deficiência
- ✅ Anamnese estruturada
- ✅ Identificação de Barreiras e Adaptações
- ✅ Recursos e Estratégias de Ensino
- ✅ Objetivos de Ensino personalizados
- ✅ Avaliações Cíclicas com acompanhamento
- ✅ Sistema de Comentários e Colaboração
- ✅ **Integração completa no PDF do PEI**
- ✅ Banco de estratégias e recomendações

### **🌐 Outros Módulos**
- ✅ **Blog**: Sistema de blog e conteúdo
- ✅ **Atividades**: Gestão de atividades educacionais
- ✅ **Planejamento**: Planejamento pedagógico e aulas
- ✅ **Portal Responsável**: Portal dedicado para famílias
- ✅ **Transporte Escolar**: Gestão de rotas e transporte
- ✅ **Merenda Escolar**: Gestão de cardápios e merenda

---

## 🔐 Perfis de Usuário

O sistema suporta **8 perfis distintos** com permissões granulares:

1. **Superadmin** - Administração completa do sistema
2. **Secretário de Educação** - Gestão de rede e escolas
3. **Diretor Escolar** - Gestão da escola e equipe
4. **Coordenador** - Validação de PEIs e coordenação pedagógica
5. **Professor** - Criação e edição de PEIs
6. **Professor AEE** - Planos de AEE e atendimento especializado
7. **Especialista** - Acompanhamento e consultoria
8. **Família** - Acesso via token para visualização e participação

---

## 🗄️ Banco de Dados

**150+ migrações SQL** organizadas em módulos:

| Módulo | Migrações Principais |
|--------|---------------------|
| **Core** | Estrutura base, multi-tenancy, RLS |
| **PEI** | PEIs, versionamento, avaliações |
| **Gestão Escolar** | Alunos, profissionais, turmas, matrículas |
| **AEE** | Planos AEE, diagnósticos, avaliações |
| **Auditoria** | Sistema completo de logs e auditoria |
| **LGPD** | Consentimentos, DSR, retenção de dados |
| **Observabilidade** | Métricas, logging, monitoramento |
| **Módulos Avançados** | Secretaria, dashboards, integrações |

**Principais Tabelas:**
- `peis` - Planos Educacionais Individualizados
- `students` - Alunos e matrículas
- `profiles` - Perfis de usuários
- `tenants` - Redes de ensino (multi-tenant)
- `schools` - Escolas
- `plano_aee` - Planos de AEE
- `audit_events` - Logs de auditoria
- `consents` - Consentimentos LGPD
- E muitas outras...

---

## 🔧 Stack Tecnológica

### **Frontend**
- **React 18** + **TypeScript 5.2+**
- **Vite 5** (build tool e dev server)
- **Tailwind CSS 3.4** + **shadcn/ui**
- **React Router DOM** (navegação)
- **React Hook Form** + **Zod** (formulários e validação)
- **TanStack Query** (state management e cache)
- **Recharts** (gráficos e visualizações)
- **jsPDF** (geração de PDFs)

### **Backend**
- **Supabase** (PostgreSQL + Auth + Storage)
- **Row Level Security (RLS)** para segurança
- **Edge Functions** (Deno) para serverless
- **PostgreSQL** com extensões (pgcrypto, uuid-ossp, etc.)

### **Offline & PWA**
- **Dexie.js** (IndexedDB wrapper)
- **Service Workers** (cache e offline)
- **Workbox** (estratégias de cache)
- **PWA** completo (installable, offline-first)

### **Infraestrutura**
- **Monorepo**: Turborepo + pnpm workspaces
- **CI/CD**: GitHub Actions (planejado)
- **Deploy**: Vercel (frontend) + Supabase (backend)
- **Observabilidade**: Logging estruturado, métricas

### **Ferramentas de Desenvolvimento**
- **TypeScript** (tipagem estática)
- **ESLint** (linting)
- **Vitest** (testes unitários)
- **Playwright** (testes E2E)
- **Jest** (testes de acessibilidade)

---

## 📊 Estatísticas do Projeto

| Métrica | Valor |
|---------|-------|
| **Aplicações** | 9 apps completos |
| **Pacotes Compartilhados** | 9 packages |
| **Componentes React** | 300+ componentes |
| **Páginas** | 80+ páginas |
| **Migrações SQL** | 150+ migrações |
| **Edge Functions** | 15+ funções |
| **Tabelas de Banco** | 50+ tabelas |
| **Linhas de Código** | ~50.000+ linhas |
| **Testes Automatizados** | 20+ casos de teste |
| **Perfis de Usuário** | 8 perfis distintos |

---

## 🧪 Testes

### **Scripts de Teste Disponíveis**

```bash
# Testes unitários
pnpm test:unit

# Testes de integração
pnpm test:integration

# Testes E2E (Playwright)
pnpm test:e2e
pnpm test:e2e:ui  # Interface visual

# Testes de acessibilidade
pnpm test:accessibility

# Cobertura de código
pnpm test:coverage

# Testes de login/logout
node scripts/test-all-user-flows.js
```

### **Relatórios de Teste**
- [Relatório Completo de Testes](RELATORIO_TESTES_COMPLETO.md)
- [Relatório de Fluxos de Usuário](RELATORIO_TESTES_FLUXOS_USUARIO.md)

---

## 🚀 Deploy

### **Deploy Automático na Vercel**

O projeto está configurado para deploy automático na Vercel:

1. **Push para `main`** → Deploy automático em produção
2. **Pull Requests** → Deploy de preview automaticamente
3. **Variáveis de Ambiente** → Configuradas no dashboard Vercel

### **Comandos Úteis**

```bash
# Build para produção
pnpm build

# Preview do build
pnpm preview

# Verificar tipos
pnpm type-check

# Linting
pnpm lint
```

---

## 🔒 Segurança e LGPD

- ✅ **Row Level Security (RLS)** em todas as tabelas
- ✅ **Autenticação** via Supabase Auth
- ✅ **Auditoria completa** de todas as ações
- ✅ **Sistema de consentimentos** LGPD
- ✅ **DSR (Data Subject Rights)** implementado
- ✅ **Retenção automática** de dados
- ✅ **Criptografia** de dados sensíveis
- ✅ **Tokens seguros** para acesso de famílias

---

## 📱 Acessibilidade

- ✅ **WCAG 2.1 AA** compliance
- ✅ **Navegação por teclado** completa
- ✅ **Suporte a leitores de tela**
- ✅ **Alto contraste** configurável
- ✅ **Textos alternativos** em imagens
- ✅ **Design responsivo** mobile-first
- ✅ **PWA** para uso offline

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### **Guidelines**
- Siga os padrões de código definidos em `docs/desenvolvimento/04_PADROES_CODIGO.md`
- Mantenha cobertura de testes acima de 70%
- Documente mudanças significativas
- Use commits semânticos (feat, fix, docs, etc.)

---

## 📞 Suporte

- **Documentação Completa**: [`docs/`](docs/README.md)
- **Setup e Instalação**: [`docs/setup/📦_INSTALACAO_FINAL.md`](docs/setup/📦_INSTALACAO_FINAL.md)
- **Troubleshooting**: Veja seção de troubleshooting na documentação
- **Issues**: [GitHub Issues](#)

---

## 📝 Licença

[MIT License](LICENSE)

---

## 🎉 Status do Projeto

✅ **Versão 3.0.0 - Sistema Completo e Funcional**

### **✅ Implementado**
- [x] 9 Aplicações completas
- [x] 9 Pacotes compartilhados
- [x] 150+ Migrações SQL aplicadas
- [x] 8 Perfis de usuário com RLS
- [x] Sistema offline-first com PWA
- [x] Sistema de auditoria e LGPD
- [x] Integração total entre apps
- [x] Documentação completa
- [x] Testes automatizados
- [x] Deploy automático configurado

### **🚧 Em Desenvolvimento**
- [ ] Suíte completa de testes E2E
- [ ] Otimizações de performance
- [ ] Expansão de módulos
- [ ] Integrações externas adicionais

### **📅 Próximos Passos**
- [ ] CI/CD completo com GitHub Actions
- [ ] Monitoramento de performance em produção
- [ ] Expansão de testes automatizados
- [ ] Otimizações de bundle size

---

## 🌟 Destaques

- 🏆 **Sistema Multi-Tenant** hierárquico completo
- 🏆 **Offline-First** com sincronização automática
- 🏆 **PWA** instalável e funcional
- 🏆 **LGPD Compliant** com sistema completo de consentimentos
- 🏆 **Acessibilidade** WCAG 2.1 AA
- 🏆 **Arquitetura Escalável** com monorepo bem estruturado
- 🏆 **Type-Safe** com TypeScript em 100% do código

---

**Desenvolvido com ❤️ para educação inclusiva de qualidade.**

**Última atualização**: Janeiro de 2025
