# Brief do Projeto — Inclusão / PEI Collab

Última atualização: 2025-11-30

Este brief consolida objetivos, escopo, entregas, cronograma, arquitetura e práticas de qualidade para orientar o desenvolvimento e a implantação do ecossistema Inclusão/PEI Collab.

## Visão Geral
- Plataforma modular para gestão pedagógica, PEI, envolvimento da família e operações escolares.
- Monorepo com múltiplos apps (PEI Collab, Gestão Escolar, Portal do Responsável, Blog, Atividades, Planejamento, Plano AEE, Merenda, Transporte).
- Integrações com Supabase (auth, database, RPCs), roteamento React Router 6 e proteção via `ProtectedRoute`.
- Conformidade LGPD: consentimentos canônicos, Política de Privacidade e Termos de Uso publicados.

## Objetivos
- Centralizar fluxos pedagógicos (PEI, reuniões, avaliações) e administrativos (gestão escolar).
- Oferecer acesso seguro e transparente à família (visualização de PEI e orientações).
- Garantir observabilidade (auditoria, acessos), integridade (backups) e conformidade legal.
- Melhorar usabilidade e acessibilidade, com navegação consistente entre apps.

## Escopo
- Apps e rotas essenciais definidos no documento de navegação (`docs/MapaNavegacao.md`).
- Serviços canônicos:
  - Consentimentos: `get_user_consents` (RPC), gerenciamento/revogação, checagem ativa.
  - Auditoria e acessos: trilha de auditoria, exportação de logs.
  - Backups: agendamento/execução, verificação de integridade, restauração.
- Documentos legais: Política de Privacidade (`docs/PoliticaPrivacidade.md`) e Termos de Uso (`docs/TermosUso.md`).
- Qualidade: plano de testes, correções de TypeScript, e observabilidade.

## Principais Entregas
- Rotas unificadas dos apps com proteção e redirecionamentos.
- UI para consentimentos, visualização do PEI e reuniões.
- Serviços atualizados para consentimentos, auditoria e backup com tipos consistentes.
- Documentos legais atualizados e acessíveis no app.
- Relatórios e exportações (logs, avaliações) com filtros.

## Stakeholders e Responsabilidades
- Gestores de TI/Educação: priorizações, acesso e compliance.
- Educadores/Coordenadores: uso de PEI, reuniões e relatórios.
- Responsáveis/Família: acompanhamento de estudantes via portal e rotas família.
- Devs/QA: implementação, testes, correções de tipos, observabilidade.
- DPO/Encarregado: LGPD, consentimentos, avaliação de solicitações dos titulares.

## Cronograma e Marcos (proposta)
- Semana 1–2: alinhamento de rotas, revisão de serviços LGPD, documentos legais.
- Semana 3–4: ajustes de tipos e RPCs (backup/auditoria), estabilização de PEI Collab.
- Semana 5–6: QA integrado, testes de acessibilidade, cenários família/portal.
- Semana 7–8: observabilidade, exportações e plano de implantação por tenant.

## Riscos e Mitigações
- Divergência de tabelas LGPD (ex.: `data_consents` vs canônica): padronizar uso de RPCs (`get_user_consents`), remover dependências antigas.
- Erros TypeScript (TS2322, TS2345, TS2532, TS18048): corrigir tipos em serviços (`backupService`, `auditService`, `lgpdService`), usar `Result<T, E>` quando aplicável.
- Acesso indevido entre tenants: aplicar RLS e validações por `tenantId` em consultas.
- Disponibilidade de backups: validar integridade (checksums, quando presentes) e registro de falhas.

## Requisitos Técnicos e Arquitetura
- Monorepo PNPM, React + Vite, TypeScript, React Router 6.
- Supabase: autenticação, RLS, RPCs canônicas:
  - `get_user_consents`: base de consentimentos por usuário/estudante.
  - `check_active_consents` (ajuste para canônico, se necessário).
  - Auditoria: `get_audit_trail`, `log_access`, `get_user_access_logs`.
  - Backups: `execute_real_backup`, `list_available_backups`.
- Proteção de rotas: `ProtectedRoute` verifica sessão/permissões, com redirecionamentos.
- Navegação: mapa consolidado (`docs/MapaNavegacao.md`) com jornadas.

## Segurança e LGPD
- Consentimentos: fluxo canônico com registro, consulta e revogação; exibição clara e acessível para titulares.
- Política e Termos: publicados em `docs/PoliticaPrivacidade.md` e `docs/TermosUso.md` (preencher dados do controlador/DPO).
- Auditoria: trilhas de acesso por usuário e exportação de logs para compliance.
- RLS: segregação por tenant e papéis; minimizar superprivilégios.

## Métricas de Sucesso
- Taxa de sucesso nas tarefas principais (criar/editar PEI, registrar atas).
- Redução de erros TypeScript e incidentes de runtime em rotas críticas.
- Tempo de resposta das páginas principais (p95).
- Aderência LGPD: consentimentos registrados e revogáveis; tempo de resposta a solicitações de titulares.
- Disponibilidade de backups e taxa de restauração bem-sucedida.

## Plano de Qualidade (QA)
- Testes de navegação: roteamento, proteção e redirecionamentos.
- Testes de serviços: consentimentos, auditoria e backup (incluindo falhas).
- Acessibilidade: contrastes, navegação via teclado, labels.
- Integração: cenários família e portal, exportações e relatórios.
- Observabilidade: verificação de logs, limites de rate, alertas.

## Plano de Implantação
- Ambientes: homologação → produção (por tenant/rede).
- Feature flags: ativação gradual de módulos sensíveis (família, relatórios).
- Migrações: confirmar aplicação das migrações Supabase; validar RPCs e RLS.
- Rollback: backups verificados; trilha de mudanças rastreável.

## Dependências e Constrangimentos
- Infra Supabase e políticas RLS.
- Disponibilidade dos dados históricos e qualidade de importações.
- Treinamento de usuários para novos fluxos (PEI e família).

## Referências
- Navegação e jornadas: `docs/MapaNavegacao.md`
- Privacidade: `docs/PoliticaPrivacidade.md`
- Termos de Uso: `docs/TermosUso.md`
- Serviços e RPCs: `src/services/*`, `supabase/migrations/*`

---
Sugestão: criar rotas `/legal/privacy` e `/legal/terms` no app principal para exibir estes documentos e incluir links no rodapé.