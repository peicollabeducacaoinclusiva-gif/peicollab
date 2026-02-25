# Plano de Implementacao (por fases)

Este plano organiza a implementacao do PEI Collab em fases (MVP → v1 → v2),
alinhado aos requisitos e complementacoes tecnicas existentes.

## Objetivo e escopo

- Guiar a construcao do sistema com foco em seguranca, governanca e RBAC.
- Garantir aderencia a RLS, maquina de estados e versionamento por RPC.
- Entregar MVP funcional, evoluir para v1 e v2 com recursos completos.

## Premissas e regras criticas

- Dados sensiveis so via RPC: `user_can_access_pei`, `has_role`, `create_pei_version`.
- Nao sugerir SELECT direto em `students` ou `peis`.
- Respeitar a maquina de estados do PEI: `rascunho → em_validacao → aprovado/arquivado`.
- Nunca permitir UPDATE em PEIs com status `aprovado` (criar nova versao via RPC).
- Stack: TypeScript + React + Supabase Client + Tailwind + shadcn/ui.

## Estrutura alvo do repositorio

- Monorepo com `apps/pei-collab` para o Next.js e `packages/*` para compartilhados.
- Pastas esperadas conforme o guia: `src/components`, `src/pages` (ou `app`), `src/hooks`,
  `src/lib`, `supabase/functions`.

## Fase 0 — Preparacao e governanca

**Objetivo:** alinhar configs, documentacao e padroes de qualidade.

Checklist:

- [ ] Padronizar variaveis de ambiente para Next.js e Supabase.
- [ ] Ajustar configuracoes de build/deploy para monorepo (Vercel/Turbo).
- [ ] Definir padroes de lint/format/teste e onde rodam no pipeline.
- [ ] Criar README do modulo principal com instalacao e uso.
- [ ] Criar ADRs para decisoes arquiteturais relevantes.

Entregaveis:

- `docs/PlanoDeImplementacao.md` (este arquivo).
- Atualizacoes em configs da raiz para aderencia tecnica.

## Fase 1 — MVP (Fundacao)

**Objetivo:** sistema funcional com auth, RLS, RBAC e base de dados.

Checklist:

- [ ] Setup do Next.js (TypeScript, Tailwind, ESLint, App Router).
- [ ] Dependencias essenciais (Supabase, shadcn/ui, form/validacao).
- [ ] Schema SQL completo (2.1–2.9) e RLS habilitado.
- [ ] Auth (login/registro) com metadata de role no signUp.
- [ ] Supabase Client (browser + server) e middleware de sessao.
- [ ] RBAC base (authorize + usePermissions + PermissionGate).
- [ ] Layout do dashboard com sidebar e navbar por role.

Testes minimos:

- [ ] Isolamento multi-tenant (2 redes diferentes).
- [ ] RLS aplicado em leitura e escrita.

Arquivos e pontos de implementacao:

- `src/lib/supabase/client.ts` e `src/lib/supabase/server.ts` com `@supabase/ssr`.
- `src/middleware.ts` para refresh de sessao e protecao de rotas.
- `src/lib/rbac.ts`, `src/hooks/usePermissions.ts`, `src/components/auth/PermissionGate.tsx`.
- `src/app/(auth)/login/page.tsx` e `src/app/(auth)/register/page.tsx`.
- `src/app/(dashboard)/layout.tsx` com sidebar e navbar controladas por role.

## Fase 2 — v1 (Funcionalidades nucleo)

**Objetivo:** estudantes, templates e editor dinamico.

Checklist:

- [ ] CRUD de estudantes com filtros e PermissionGate.
- [ ] Vinculo familia↔aluno via `family_students`.
- [ ] Template engine (listar/editar/versao) com admin_rede.
- [ ] DocumentEditor para Estudo de Caso com auto-save.
- [ ] Tipos do Supabase gerados e tipos enriquecidos.

Testes minimos:

- [ ] Professor nao ve dados de outra escola.
- [ ] RLS em students/templates/documents.

Arquivos e pontos de implementacao:

- `src/app/(dashboard)/students/page.tsx` e componentes `src/components/students/*`.
- `src/app/(dashboard)/templates/*` e componentes de template.
- `src/components/documents/DocumentEditor.tsx` + `FieldRenderer.tsx`.
- `src/types/database.ts` (gerado) e `src/types/index.ts` (enriquecido).

Fluxos principais:

- CRUD de estudantes com `PermissionGate` e RLS validando escopo.
- Edicao de templates restrita a `admin_rede`, com incremento de versao.
- DocumentEditor com auto-save somente em `rascunho` e bloqueio em outros status.

## Fase 3 — v2 (PEI, versionamento e governanca)

**Objetivo:** metas, PEI completo, versionamento e auditoria.

Checklist:

- [ ] Metas (PAEE) com progresso e vinculo a documentos.
- [ ] PEI com historico de versoes e criacao via RPC.
- [ ] Participacao da familia (comentarios e ciencia).
- [ ] Fluxo de validacao com motivo de rejeicao.
- [ ] Audit logs em acoes criticas.
- [ ] Views materializadas e refresh agendado.
- [ ] Notificacoes in-app (Realtime).

Testes minimos:

- [ ] Versionamento apenas para documentos aprovados.
- [ ] Familia apenas comenta e da ciencia.
- [ ] Logs e notificacoes gerados conforme eventos.

Arquivos e pontos de implementacao:

- `src/app/(dashboard)/students/[id]/goals/*` e `src/components/goals/*`.
- `src/components/documents/DocumentVersionHistory.tsx`.
- `src/app/api/documents/[id]/versions/route.ts` chamando `create_document_version`.
- `src/components/family/FamilyComments.tsx` e `FamilyAcknowledgement.tsx`.
- `src/hooks/useNotifications.ts` e `NotificationBell` na navbar.

Regras de negocio:

- Criar nova versao somente para documento `aprovado`, via RPC.
- Metas sao copiadas por `goal_links`, nunca duplicadas.
- Familia apenas comenta e da ciencia em documentos de seus filhos.

## Ajustes de configuracao na raiz (aderencia aos docs)

Os ajustes abaixo alinham a base tecnica com o guia de requisitos:

- Padronizar variaveis em `.env.example` e `env.production.example` para Next.js.
- Ajustar `vercel.json` para build/saida do app Next.js no monorepo.
- Refinar `turbo.json` para considerar variaveis de ambiente no cache.
- Garantir `.gitignore` cobrindo segredos e `.env*` (ja atendido).

## Referencias

- `docs/PlanoDeRequisitosClaude.md`
- `docs/Complementacao.md`
