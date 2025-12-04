# Mapa de Navegação e Jornadas do Usuário

Este documento consolida as rotas principais por aplicação e apresenta diagramas simplificados das jornadas de navegação.

## Visão Geral de Apps e Rotas

- Landing (`apps/landing`)
  - `/` Home
  - `/login` Login
  - `/apps` Seletor de Apps
  - `/redes` Selecionar Rede
  - `/sobre` Sobre
  - `/entrar` Redireciona para `/login`

- PEI Collab (principal) (`apps/pei-collab/src/App.tsx`)
  - Autenticação e início
    - `/` Splash
    - `/auth` Login
    - `/login` Login
    - `/auth/reset-password` Recuperação de senha
    - `*` NotFound
  - Dashboard e navegação
    - `/home` Dashboard
    - `/dashboard` Dashboard
    - `/profile` Perfil
    - `/settings` Configurações
    - `/notifications` Notificações
  - PEI e reuniões
    - `/peis` Lista de PEIs
    - `/pei/new` Criar PEI
    - `/pei/edit` Editar PEI
    - `/pei/:peiId/orientations` Orientações do PEI
    - `/pei/:peiId/meetings` Reuniões do PEI
    - `/meetings` Painel de reuniões
    - `/meetings/create` Criar reunião
    - `/meetings/:meetingId` Detalhes da reunião
    - `/meetings/:meetingId/minutes` Atas da reunião
  - Estudantes e relatórios
    - `/students` Lista de estudantes
    - `/reports` Relatórios gerais
    - `/evaluations/schedule` Agendar avaliações
    - `/reports/evaluations` Relatório de avaliações
  - Acesso da família
    - `/family` Acesso família (convite/link padrão)
    - `/secure-family` Acesso família seguro (token)
    - `/family/pei/:peiId` Visualização do PEI pela família
  - Auxiliares e debug
    - `/teste`, `/debuguser`
    - `/debug/database`, `/debug/usability`, `/debug/notifications`

- Gestão Escolar (`apps/gestao-escolar/src/App.tsx`)
  - `/login` Login
  - `/` Dashboard (protegido)
  - Observação: rotas internas (ex.: `/students`, `/import`, `/export`) são protegidas e acessadas via menus do dashboard.

- Portal do Responsável (`apps/portal-responsavel/src/App.tsx`)
  - `/login` Login
  - `/` Dashboard (protegido)
  - `/students/:id` Detalhe do estudante
  - `/students/:id/attendance` Frequência
  - `/students/:id/grades` Notas
  - `/students/:id/documents` Documentos
  - `/enrollments` Matrículas

- Transporte Escolar (`apps/transporte-escolar/src/App.tsx`)
  - `/login` Login
  - `/` Dashboard (protegido)

- Merenda Escolar (`apps/merenda-escolar/src/App.tsx`)
  - `/login` Login
  - `/` Dashboard (protegido)

- Blog (`apps/blog/src/App.tsx`)
  - `/` Home
  - `/post/:slug` Visualização de post
  - `/login` Login
  - `/admin` Dashboard Admin (protegido)
  - `/admin/post/new` Criar post (protegido)
  - `/admin/post/edit/:id` Editar post (protegido)

- Atividades (`apps/atividades/src/App.tsx`)
  - `/login` Login
  - `/` Redireciona para `/dashboard`
  - `/dashboard` Dashboard (protegido)
  - `/explorar` Explorar atividades (protegido)
  - `/criar` Criar atividade (protegido)
  - `/minhas-atividades` Minhas atividades (protegido)
  - `/favoritas` Favoritas (protegido)

- Plano AEE (`apps/plano-aee/src/App.tsx`)
  - `/login` Login
  - `/` Dashboard (protegido)
  - `/create` Criar plano (protegido)
  - `/edit/:id` Editar plano (protegido)
  - `/view/:id` Visualizar plano (protegido)

- Planejamento (`apps/planejamento/src/App.tsx`)
  - `/login` Login
  - `/` Redireciona para `/dashboard`
  - `/dashboard` Dashboard (protegido)
  - `/planos-curso` Planos de curso (protegido)
  - `/planos-curso/novo` Criar plano de curso (protegido)
  - `/planos-aula` Planos de aula (protegido)
  - `/planos-aula/novo` Criar plano de aula (protegido)
  - `/biblioteca-atividades` Biblioteca de atividades (protegido)

---

## Diagrama — Ecossistema de Apps

```mermaid
flowchart LR
  subgraph Landing
    L_home["/ (Home)"]
    L_login["/login"]
    L_apps["/apps"]
    L_redes["/redes"]
    L_sobre["/sobre"]
    L_entrar["/entrar → /login"]
    L_home --> L_entrar --> L_login
    L_home --> L_apps
    L_home --> L_redes
    L_home --> L_sobre
  end

  subgraph PEI_Collab
    P_splash["/ (Splash)"]
    P_auth["/auth, /login"]
    P_dash["/dashboard, /home"]
    P_peis["/peis"]
    P_pei_new["/pei/new"]
    P_pei_edit["/pei/edit"]
    P_orient["/pei/:peiId/orientations"]
    P_meetings["/meetings"]
    P_meeting_new["/meetings/create"]
    P_meeting_view["/meetings/:meetingId"]
    P_minutes["/meetings/:meetingId/minutes"]
    P_students["/students"]
    P_reports["/reports"]
    P_eval_sched["/evaluations/schedule"]
    P_eval_report["/reports/evaluations"]
    P_family["/family"]
    P_secure_family["/secure-family"]
    P_family_pei["/family/pei/:peiId"]
    P_profile["/profile"]
    P_settings["/settings"]
    P_notif["/notifications"]
    P_splash --> P_auth --> P_dash
    P_dash --> P_peis --> P_pei_new
    P_peis --> P_pei_edit
    P_peis --> P_orient
    P_dash --> P_meetings --> P_meeting_new
    P_meetings --> P_meeting_view --> P_minutes
    P_dash --> P_students
    P_dash --> P_reports
    P_dash --> P_eval_sched
    P_dash --> P_eval_report
    P_dash --> P_profile
    P_dash --> P_settings
    P_dash --> P_notif
    P_family --> P_family_pei
    P_secure_family --> P_family_pei
  end

  subgraph Portal_Responsavel
    R_login["/login"]
    R_dash["/"]
    R_student["/students/:id"]
    R_att["/students/:id/attendance"]
    R_grades["/students/:id/grades"]
    R_docs["/students/:id/documents"]
    R_enroll["/enrollments"]
    R_login --> R_dash
    R_dash --> R_student --> R_att
    R_student --> R_grades
    R_student --> R_docs
    R_dash --> R_enroll
  end

  subgraph Gestao_Escolar
    G_login["/login"]
    G_dash["/"]
    G_login --> G_dash
  end

  subgraph Outros
    T_login["Transporte: /login"]
    T_dash["Transporte: /"]
    M_login["Merenda: /login"]
    M_dash["Merenda: /"]
    B_home["Blog: /"]
    B_post["Blog: /post/:slug"]
    B_login["Blog: /login"]
    B_admin["Blog: /admin (prot.)"]
    B_new["Blog: /admin/post/new (prot.)"]
    B_edit["Blog: /admin/post/edit/:id (prot.)"]
    A_login["Atividades: /login"]
    A_dash["Atividades: /dashboard"]
    A_explore["Atividades: /explorar"]
    A_create["Atividades: /criar"]
    A_mine["Atividades: /minhas-atividades"]
    A_favs["Atividades: /favoritas"]
    PA_login["Plano AEE: /login"]
    PA_dash["Plano AEE: /"]
    PA_create["Plano AEE: /create"]
    PA_edit["Plano AEE: /edit/:id"]
    PA_view["Plano AEE: /view/:id"]
    PL_login["Planejamento: /login"]
    PL_dash["Planejamento: /dashboard"]
    PL_cursos["Planejamento: /planos-curso"]
    PL_cursos_novo["Planejamento: /planos-curso/novo"]
    PL_aula["Planejamento: /planos-aula"]
    PL_aula_novo["Planejamento: /planos-aula/novo"]
    PL_biblio["Planejamento: /biblioteca-atividades"]

    T_login --> T_dash
    M_login --> M_dash
    B_home --> B_post
    B_login --> B_admin --> B_new
    B_admin --> B_edit
    A_login --> A_dash --> A_explore
    A_dash --> A_create
    A_dash --> A_mine
    A_dash --> A_favs
    PA_login --> PA_dash --> PA_create
    PA_dash --> PA_edit
    PA_dash --> PA_view
    PL_login --> PL_dash --> PL_cursos --> PL_cursos_novo
    PL_dash --> PL_aula --> PL_aula_novo
    PL_dash --> PL_biblio
  end

  L_apps --- P_splash
  L_apps --- G_login
  L_apps --- R_login
  L_apps --- T_login
  L_apps --- M_login
  L_apps --- B_home
  L_apps --- A_login
  L_apps --- PA_login
  L_apps --- PL_login
```

---

## Jornadas do Usuário

- Onboarding (usuário geral)
  - Entra no Landing (`/`) → clica em “Entrar” (`/entrar → /login`) → autentica.
  - Acessa o Seletor de Apps (`/apps`) ou é levado ao app padrão do perfil.
  - Chega ao Dashboard do app escolhido e usa atalhos principais.

- Professor/Coordenador (PEI Collab)
  - Login (`/auth` ou `/login`) → Dashboard (`/dashboard`).
  - Cria/edita PEI (`/pei/new` ou `/pei/edit`) → Adiciona orientações (`/pei/:peiId/orientations`).
  - Agenda reunião (`/meetings/create`) → Registra atas (`/meetings/:meetingId/minutes`).
  - Consulta estudantes (`/students`) e relatórios (`/reports`, `/reports/evaluations`) → Ajusta notificações e perfil (`/notifications`, `/profile`).

- Família/Responsável (PEI Collab + Portal do Responsável)
  - Recebe link de acesso seguro (`/secure-family` ou `/family`) → Visualiza PEI (`/family/pei/:peiId`) e orientações.
  - No Portal: Dashboard (`/`) → Detalhes do estudante → Frequência, Notas, Documentos, Matrículas.

- Administrador/Secretaria (Gestão Escolar)
  - Login (`/login`) → Dashboard protegido (`/`).
  - Executa tarefas de gestão via menus (alunos, profissionais, turmas, importação/exportação).

- Planejamento Pedagógico
  - Login (`/login`) → Dashboard (`/dashboard`).
  - Planos de curso (`/planos-curso/novo`) e de aula (`/planos-aula/novo`).
  - Biblioteca de atividades (`/biblioteca-atividades`).
  - Em Atividades: Explora (`/explorar`), cria (`/criar`), organiza catálogo (`/minhas-atividades`, `/favoritas`).

- Conteúdo/Comunicação (Blog)
  - Visitante: navega por posts (`/post/:slug`).
  - Editor/Admin: Login (`/login`) → Admin (`/admin`) → cria/edita posts.

---

## Observações

- Rotas protegidas usam `ProtectedRoute` (autenticação e, em alguns apps, verificação de permissões/tenant).
- Há duplicidades intencionais de caminhos para facilitar navegação (`/home` e `/dashboard` no PEI Collab).
- Páginas de debug auxiliam QA e suporte (`/debug/*`).
- Fallback para rotas desconhecidas: `*` → `NotFound`.

## Referências (arquivos de rotas)

- `apps/pei-collab/src/App.tsx`
- `src/App.tsx` (base — algumas rotas espelham o app principal)
- `apps/gestao-escolar/src/App.tsx`
- `apps/landing/src/App.tsx`
- `apps/portal-responsavel/src/App.tsx`
- `apps/transporte-escolar/src/App.tsx`
- `apps/merenda-escolar/src/App.tsx`
- `apps/blog/src/App.tsx`
- `apps/atividades/src/App.tsx`
- `apps/plano-aee/src/App.tsx`
- `apps/planejamento/src/App.tsx`