# PEI Collab Monorepo — Visão Geral e Status dos Apps

Data: 2025-11-26  
Resumo: Documento explicativo do sistema atual, arquitetura e estágio de cada aplicação do monorepo.

---

## Visão Geral do Sistema

- Monorepo com Turborepo e `pnpm`, compartilhando pacotes (`packages/ui`, `database`, `auth`, `config`, `dashboards`).
- Front-end moderno: React + Vite + TypeScript + Tailwind + Radix UI (shadcn), com assets PWA.
- Backend: Supabase (Auth + DB + RLS), políticas multi-tenant e isolamento por `tenant_id`.
- Integrações: PEI ↔ Plano AEE ↔ Gestão Escolar ↔ Atividades/Planejamento; Blog e Portal do Responsável para conteúdo e comunicação.
- SSO por subdomínios planejados: `pei.*`, `aee.*`, `gestao.*`, `aulas.*`.
- Dev/Observabilidade: testes e2e base, scripts de saúde e checagens (`scripts/`, `tests/`), perf de carga (`artillery`, `k6`).

Referências:
- `docs/arquivados/🏁_RESUMO_FINAL_COMPLETO.md`
- `docs/arquivados/resumos/📑_INDICE_DOCUMENTACAO_MONOREPO.md`
- `docs/arquivados/monorepo/ESTRATEGIA_DOMINIOS_MONOREPO.md`
- `docs/arquivados/🎉_COMPATIBILIDADE_MONOREPO_COMPLETA.md`

---

## Segurança e Multi-Tenancy

- Autenticação centralizada (Supabase Auth + `@pei/auth`) e sessão compartilhada entre apps (SSO).
- Row-Level Security (RLS) por app, com políticas específicas e sem recursão.
- Isolamento por `tenant_id` e perfis vinculados a escola/rede.
- LGPD: trilhas de auditoria, consentimento e minimização de dados (em implementação contínua).

Referência: `docs/arquivados/📊_RESUMO_APPS_MONOREPO.md` (Seção “Segurança Multi-App”)

---

## Apps e Estágio Atual

Observação: Progresso em porcentagem conforme documentação consolidada. Alguns documentos possuem datas e estados diferentes; abaixo, a síntese mais consistente.

### 1) PEI Collab (App Principal)
- Objetivo: Gestão colaborativa de PEIs, dashboards, reuniões e avaliações cíclicas.
- Funcionalidades ativas:
  - Dashboard do Profissional de Apoio (PA): alunos atribuídos e feedbacks diários.
  - Sistema de Reuniões: criação, participantes, pauta e ata.
  - Avaliação Cíclica: ciclos I–III e relatórios.
  - Dashboards de rede (Secretaria): métricas de inclusão, conformidade, engajamento.
- Estágio: Estável e expandido; novas funcionalidades em andamento (reuniões V2 e relatórios).
- Portas (dev): 8080 (conforme docs).
- Referências: `docs/arquivados/🎯_RESUMO_EXECUTIVO_FINAL_MONOREPO.md`, `docs/arquivados/🏁_RESUMO_FINAL_COMPLETO.md`

### 2) Gestão Escolar
- Objetivo: Cadastros centralizados de alunos, profissionais, turmas e disciplinas; visão gerencial por escola/rede.
- Funcionalidades ativas:
  - Base de dados e hooks integrados.
  - Cadastros principais prontos; integrações com PEI/AEE.
- Estágio: Backend e integrações prontos; UI de fases 4–8 (frequência, notas, dashboards) em andamento.
  - Docs variam entre “100% concluído” e “37% (fases 1–3)”, consolidando que UI gerencial segue em progresso.
- Portas (dev): 5174 (conforme docs).
- Referências: `docs/arquivados/🎊_SESSAO_GESTAO_ESCOLAR_09NOV2025.md`, `docs/arquivados/🎯_RESUMO_EXECUTIVO_FINAL_MONOREPO.md`

### 3) Plano de AEE
- Objetivo: Planos de Atendimento Educacional Especializado com diagnóstico e anexos, vinculados ao PEI.
- Funcionalidades ativas:
  - CRUD completo, comentários, anexos.
  - Vinculação a PEI via `pei_id`; geração de documentos.
- Estágio: Versão 2.0 em progresso (~71%); evolução de diagnóstico e relatórios.
- Portas (dev): 5175 (conforme docs).
- Referências: `docs/arquivados/resumos/📑_INDICE_DOCUMENTACAO_MONOREPO.md`, `docs/arquivados/📊_RESUMO_APPS_MONOREPO.md`

### 4) Landing (Página Institucional)
- Objetivo: Site institucional com AppHub, roteando para os apps do monorepo.
- Funcionalidades ativas:
  - AppHub com cards e navegação entre 6 apps; SEO básico.
- Estágio: Concluído (100%).
- Portas (dev): 3000 (conforme docs).
- Referências: `docs/arquivados/🔗_LINKS_ENTRE_APPS_CRIADOS.md`, `docs/arquivados/🏁_RESUMO_FINAL_COMPLETO.md`

### 5) Blog Educacional
- Objetivo: Conteúdo sobre Educação Inclusiva (artigos, tutoriais, novidades).
- Funcionalidades ativas:
  - Projeto e migrações de base; navegação e links inter-app (Landing ↔ Blog ↔ PEI Collab).
- Estágio: Em construção (conteúdo e SEO a serem finalizados).
- Portas (dev): 5179 (conforme docs).
- Referências: `docs/arquivados/🔗_LINKS_ENTRE_APPS_CRIADOS.md`

### 6) Portal do Responsável
- Objetivo: Visualização segura do PEI e do Plano de AEE para responsáveis, com SSO e RLS por tenant.
- Funcionalidades previstas:
  - Acesso autenticado e limitado ao aluno.
  - Comunicação e acompanhamento de evolução.
- Estágio: Inicial (protótipos e estrutura de pastas pronta).
- Referências: `docs/arquivados/monorepo/ESTRATEGIA_DOMINIOS_MONOREPO.md` (SSO)

### 7) Atividades (Planejador de Aulas Adaptadas)
- Objetivo: Planejar aulas/atividades adaptadas com sugestões baseadas no PEI e Plano AEE.
- Funcionalidades ativas:
  - Fluxos principais de criação/edição (funcional).
  - Integração prevista com PEI/AEE para sugestões automáticas.
- Estágio: Funcional ~80%; pendências: exportação PDF, PWA offline, integração avançada.
- Referências: `docs/arquivados/📊_RESUMO_APPS_MONOREPO.md`

### 8) Planejamento
- Objetivo: Consolidar planejamento pedagógico (metas/objetivos) e vincular a aulas adaptadas.
- Funcionalidades ativas:
  - Estrutura de metas e vinculação inicial.
- Estágio: Funcional ~80%; pendências: relatórios e integrações com cronogramas.
- Referências: `docs/arquivados/📊_RESUMO_APPS_MONOREPO.md`

### 9) Merenda Escolar
- Objetivo: Gestão de merenda e relatórios operacionais por escola/rede.
- Estágio: Inicial; modelagem de dados e telas em definição.
- Referências: (planejado nos docs gerais do monorepo)

### 10) Transporte Escolar
- Objetivo: Planejamento de rotas e acompanhamento de transporte, com atenção ao AEE.
- Estágio: Inicial; foco em integração com cadastros e georreferenciamento futuro.
- Referências: (planejado nos docs gerais do monorepo)

---

## Infraestrutura e Ferramentas

- Pacotes compartilhados:
  - `packages/ui`: componentes de UI (Radix + shadcn), padronizados.
  - `packages/database`: cliente e hooks Supabase, queries consolidadas.
  - `packages/auth`: autenticação e controle de sessão por app.
  - `packages/config`: configurações centralizadas.
- Banco de Dados:
  - Migrações aplicadas: PEI, Reuniões, Avaliações Cíclicas, Plano AEE, Blog, Gestão Escolar, Multi-Tenancy.
  - RLS revisado com simplificação e correções de relacionamentos.
- Scripts e Testes:
  - `scripts/*`: checagens de dados, saúde, autenticação, SSO e estudantes.
  - `tests/*`: e2e base e setup; performance de carga (`artillery`, `k6`).

Referências: `docs/arquivados/resumos/📑_INDICE_DOCUMENTACAO_MONOREPO.md`, `docs/arquivados/🎉_COMPATIBILIDADE_MONOREPO_COMPLETA.md`

---

## Integrações-Chave

- PEI ↔ Plano AEE: vinculação via `pei_id`; reaproveitamento de diagnóstico.
- Gestão Escolar ↔ PEI/AEE: dashboards consolidados por escola e rede.
- Atividades ↔ Planejamento: metas pedagógicas alimentando aulas adaptadas.
- Landing ↔ Blog ↔ PEI Collab: navegação e conteúdo institucional.
- SSO com subdomínios e sessão compartilhada (planejado).

Referência: `docs/arquivados/monorepo/ESTRATEGIA_DOMINIOS_MONOREPO.md`

---

## Roadmap (30–60–90 dias)

- 30 dias:
  - Unificar dependências críticas (Radix/Shadcn), aliases e pré-bundle.
  - Finalizar UI Gestão Escolar (fases 4–5): frequência e notas.
  - Avançar Plano AEE V2: diagnóstico e anexos.
- 60 dias:
  - Atividades + Planejamento: sugestões automáticas (PEI/AEE) e exportação PDF.
  - Blog: categorias, conteúdo inicial, SEO técnico.
  - Portal do Responsável: MVP com SSO/RLS.
- 90 dias:
  - Dashboards gerenciais por rede/escola consolidados (Gestão Escolar).
  - SSO completo entre subdomínios com App Switcher.
  - Hardening de segurança e auditoria LGPD; observabilidade centralizada.

---

## Observações e Próximos Passos

- Garantir consistência de versões de UI (ex.: `@radix-ui/react-toast`) e rodar `pnpm -w install` quando atualizar dependências.
- Testar cenários inter-app (PEI ↔ AEE, Gestão ↔ PEI/AEE) com dados reais de rede/escolas.
- Definir métricas de performance e SEO por app (LCP/INP, sitemaps e canônicos).
- Manter documentação sincronizada por app a cada entrega.

---