# Gerenciamento de Dependências - PEI Collab

## Visão Geral

Este documento descreve a estratégia de gerenciamento de dependências no monorepo PEI Collab, incluindo versões padronizadas, peer dependencies e processo de atualização.

## Versões Padronizadas

### Tailwind CSS

**Versão Padrão:** `^3.4.18`

Todas as aplicações devem usar a mesma versão de Tailwind CSS para evitar conflitos de build e garantir consistência visual.

**Configuração:**
- Adicionar `tailwindcss` como `peerDependency` em `packages/ui`
- Usar `pnpm overrides` no `package.json` raiz para forçar versão única
- Todos os apps devem declarar `tailwindcss` nas `devDependencies`

### React e React DOM

**Versões Padronizadas:**
- `react`: `^18.2.0`
- `react-dom`: `^18.2.0`
- `@types/react`: `^18.3.26`
- `@types/react-dom`: `^18.3.7`

**Configuração:**
- Definidas em `pnpm.overrides` no `package.json` raiz
- Garantem compatibilidade entre todos os pacotes

### Dependências Compartilhadas

As seguintes dependências são compartilhadas entre múltiplos pacotes e devem ter versões alinhadas:

- `@supabase/supabase-js`: `^2.84.0` (raiz) ou `^2.38.4` (apps) → **Padronizar para `^2.84.0`**
- `zod`: `^3.22.4` (padrão)
- `react-hook-form`: `^7.50.0` (gestao-escolar) ou `^7.48.2` (outros) → **Padronizar para `^7.50.0`**
- `@hookform/resolvers`: `^3.3.4` (gestao-escolar) ou `^3.3.2` (outros) → **Padronizar para `^3.3.4`**
- `sonner`: `^1.7.4` (maioria) ou `^1.4.0` (gestao-escolar) → **Padronizar para `^1.7.4`**
- `tailwind-merge`: `^2.0.0` (padrão) ou `^2.2.1` (gestao-escolar) → **Padronizar para `^2.2.1`**

## Peer Dependencies

### packages/ui

O pacote `@pei/ui` declara as seguintes peer dependencies:

```json
{
  "peerDependencies": {
    "@pei/auth": "*",
    "@pei/database": "*",
    "next-themes": "^0.2.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

**Nota:** `tailwindcss` deve ser adicionado como peer dependency, pois os apps precisam configurá-lo.

## Processo de Atualização de Dependências

### 1. Verificar Versões Atuais

```bash
# Listar todas as versões de uma dependência
pnpm list tailwindcss --depth=Infinity

# Verificar peer dependency warnings
pnpm install --dry-run
```

### 2. Atualizar Versões

1. **Atualizar no package.json raiz** (se aplicável):
   - Adicionar/atualizar em `pnpm.overrides` para forçar versão única
   - Adicionar em `dependencies` se for dependência compartilhada

2. **Atualizar em packages/ui**:
   - Adicionar como `peerDependency` se necessário
   - Atualizar versões de dependências diretas

3. **Atualizar em todos os apps**:
   - Usar a mesma versão padronizada
   - Atualizar `devDependencies` para dependências de build

### 3. Instalar e Validar

```bash
# Limpar node_modules e lockfile (opcional)
pnpm clean

# Instalar dependências
pnpm install

# Validar build
pnpm build

# Verificar erros de tipo
pnpm type-check
```

### 4. Testar

```bash
# Testar em modo desenvolvimento
pnpm dev

# Testar build de produção
pnpm build
```

## Resolução de Conflitos

### Conflitos de Versão

Se houver conflitos de versão:

1. **Identificar a versão mais recente estável**
2. **Atualizar todos os pacotes para essa versão**
3. **Usar `pnpm.overrides` se necessário para forçar versão única**
4. **Testar extensivamente antes de commitar**

### Peer Dependency Warnings

Se houver warnings de peer dependencies:

1. **Verificar se a dependência está declarada corretamente**
2. **Adicionar como `peerDependency` no pacote que a expõe**
3. **Garantir que os apps que usam o pacote instalam a dependência**

## Checklist de Validação

Antes de commitar mudanças em dependências:

- [ ] Todas as versões de `tailwindcss` estão alinhadas
- [ ] `pnpm install` executa sem erros
- [ ] `pnpm build` executa com sucesso em todos os apps
- [ ] `pnpm type-check` não mostra erros novos
- [ ] Não há warnings de peer dependencies
- [ ] Testes passam (se existirem)
- [ ] Documentação atualizada (este arquivo)

## Referências

- [PNPM Workspace Documentation](https://pnpm.io/workspaces)
- [PNPM Overrides](https://pnpm.io/package_json#pnpmoverrides)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

