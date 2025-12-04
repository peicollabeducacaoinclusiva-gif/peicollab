# ⚡ Guia Rápido - PEI Collab Monorepo

## Setup em 5 Minutos

### 1. Instalação

```bash
# Clone e instale
git clone https://github.com/peicollabeducacaoinclusiva-gif/peicollab.git
cd pei-collab
pnpm install
```

### 2. Configure o Banco de Dados

```bash
# Aplicar migrações (IMPORTANTE: Execute na ordem!)
cd packages/database
pnpm db:push

# Ou execute diretamente no Supabase Dashboard:
# 1. supabase/migrations/20250108000001_support_professional.sql
# 2. supabase/migrations/20250108000002_meetings_system.sql
# 3. supabase/migrations/20250108000003_pei_evaluation.sql
# 4. supabase/migrations/20250108000004_plano_aee.sql
# 5. supabase/migrations/20250108000005_blog.sql
```

### 3. Inicie o Desenvolvimento

```bash
# Da raiz do projeto
pnpm dev
```

Os apps estarão disponíveis em:
- PEI Collab: http://localhost:5173
- Gestão Escolar: http://localhost:5174
- Plano AEE: http://localhost:5175
- Blog: http://localhost:5176

## Comandos Essenciais

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Inicia todos os apps |
| `pnpm build` | Builda todos os apps |
| `pnpm lint` | Verifica linting |
| `pnpm type-check` | Verifica tipos TypeScript |
| `pnpm clean` | Limpa builds |

## Testar Novas Funcionalidades

### 1. Profissional de Apoio

```bash
# 1. Criar usuário com role support_professional no Supabase
# 2. Vincular ao aluno (como diretor)
# 3. Login com o PA e acessar dashboard
# 4. Registrar feedback diário
```

### 2. Sistema de Reuniões

```bash
# 1. Login como coordenador
# 2. Acessar "Reuniões" no menu
# 3. Criar nova reunião
# 4. Adicionar participantes e PEIs
# 5. Registrar ata após a reunião
```

### 3. Avaliação de PEI

```bash
# 1. Login como professor
# 2. Abrir um PEI
# 3. Acessar aba "Avaliações"
# 4. Preencher avaliação do ciclo
```

### 4. Plano de AEE

```bash
# 1. Login como aee_teacher
# 2. Acessar app Plano AEE (porta 5175)
# 3. Criar novo plano vinculado a um PEI
# 4. Preencher seções
```

## Estrutura de Arquivos

```
pei-collab/
├── apps/
│   ├── pei-collab/src/
│   │   ├── components/
│   │   │   ├── dashboards/
│   │   │   │   └── SupportProfessionalDashboard.tsx ⭐ NOVO
│   │   │   └── support/
│   │   │       ├── DailyFeedbackForm.tsx ⭐ NOVO
│   │   │       └── FeedbackHistory.tsx ⭐ NOVO
│   │   └── pages/
│   │       ├── CreateMeeting.tsx ⭐ NOVO
│   │       ├── MeetingMinutes.tsx ⭐ NOVO
│   │       └── EvaluationSchedule.tsx ⭐ NOVO
│   └── ...outros apps
└── packages/
    ├── ui/          # Componentes compartilhados
    ├── database/    # Supabase client
    ├── auth/        # Autenticação
    └── config/      # Configs
```

## Troubleshooting Rápido

### Erro de Dependências

```bash
rm -rf node_modules
pnpm install
```

### Erro de Build

```bash
pnpm clean
pnpm build
```

### Erro de Tipos TypeScript

```bash
pnpm type-check
```

### Erro no Banco de Dados

```bash
# Verificar se as migrações foram aplicadas
# Executar manualmente no Supabase Dashboard
```

## Próximos Passos

1. ✅ **Testar localmente**: Verifique todas as funcionalidades
2. ✅ **Criar dados de teste**: Usuários, alunos, PEIs
3. ✅ **Validar permissões**: Teste cada role
4. ✅ **Deploy**: Faça deploy dos apps necessários
5. ✅ **Documentar**: Atualize documentação conforme necessário

## Suporte

- GitHub Issues: [Link para issues](https://github.com/peicollabeducacaoinclusiva-gif/peicollab/issues)
- Email: peicollabeducacaoinclusiva@gmail.com

---

**Pronto para usar! 🚀**

