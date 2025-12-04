# ✅ Dependência @pei/ui Corrigida no Gestão Escolar

## 🐛 Problema Identificado

**Erro:**
```
Failed to resolve import "@pei/ui" from "src/pages/Dashboard.tsx"
```

**Arquivo:** `apps/gestao-escolar/src/pages/Dashboard.tsx` (linha 7)
```typescript
import { AppSwitcher } from "@pei/ui"; // ❌ Módulo não encontrado
```

## 🔍 Causa Raiz

O app **Gestão Escolar** estava tentando importar o pacote `@pei/ui`, mas não tinha essa dependência declarada no seu `package.json`.

### Comparação com outros apps:

**Blog (✅ correto):**
```json
"dependencies": {
  "@pei/ui": "workspace:*",  // ✅ Dependência presente
  // ...
}
```

**Gestão Escolar (❌ faltando):**
```json
"dependencies": {
  "@pei/auth": "workspace:*",
  "@pei/database": "workspace:*",
  // ❌ @pei/ui não estava aqui
  // ...
}
```

## ✅ Solução Aplicada

### 1. Adicionada dependência no package.json

**Arquivo:** `apps/gestao-escolar/package.json`

```json
"dependencies": {
  "@pei/auth": "workspace:*",
  "@pei/database": "workspace:*",
  "@pei/ui": "workspace:*",          // ✅ ADICIONADO
  "@radix-ui/react-alert-dialog": "^1.0.5",
  // ...
}
```

### 2. Reinstaladas dependências

```bash
pnpm install
```

**Resultado:** Todas as dependências instaladas com sucesso! ✅

## 📊 O que é o @pei/ui?

O pacote `@pei/ui` contém componentes compartilhados entre os apps:

**Localização:** `packages/ui/`

**Componentes exportados:**
- `AppSwitcher` - Navegação entre apps do ecossistema
- Utilitários de UI
- Hooks compartilhados (use-toast)

**Usado por:**
- ✅ PEI Collab
- ✅ Blog
- ✅ Gestão Escolar (agora corrigido)
- ✅ Planejamento
- ✅ Atividades
- ✅ Plano AEE

## 🚀 Status

- ✅ Dependência adicionada
- ✅ pnpm install executado com sucesso
- ✅ Módulo @pei/ui agora disponível
- ✅ App Gestão Escolar deve rodar normalmente

## 🎯 Próximo Passo

Execute novamente:
```bash
npm run dev
```

Ou no monorepo:
```bash
turbo dev
```

O erro de importação do `@pei/ui` está resolvido! 🎉

## 📝 Nota

Este é um problema comum ao adicionar novos componentes compartilhados. Sempre que um pacote workspace (`packages/*`) for usado por um app, ele deve ser declarado nas dependências do `package.json` daquele app.

