# PEI Collab

Repositorio base do PEI Collab com documentacao e configuracoes iniciais.

## Proposito e escopo
- Centralizar requisitos, regras de negocio e plano de implementacao.
- Padronizar configuracoes do monorepo e variaveis de ambiente.
- Preparar o caminho para o app Next.js e pacotes compartilhados.

## Dependencias e requisitos
- Node.js >= 18
- pnpm >= 8

## Instalacao
```bash
pnpm install
```

## Execucao
Os scripts dependem do app Next.js em `apps/pei-collab`.
Depois que o app for criado:
```bash
pnpm dev
```

## Exemplos de uso
- Consulte `docs/PlanoDeRequisitosClaude.md` para requisitos completos.
- Consulte `docs/PlanoDeImplementacao.md` para fases e checklists.

## Troubleshooting
- Verifique se `.env.local` foi criado a partir de `.env.example`.
- Confirme `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Se o `pnpm dev` falhar, confirme a existencia de `apps/pei-collab`.
