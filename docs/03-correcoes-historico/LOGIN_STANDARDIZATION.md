# Padronização das Telas de Login

Este documento descreve as padronizações aplicadas nas telas de login de todos os apps do monorepo.

## Componente Padrão

Todos os apps (exceto Portal do Responsável) usam o componente `LoginForm` do pacote `@pei/ui`:

```tsx
import { LoginForm } from '@pei/ui';

<LoginForm
  appName="Nome do App"
  appSubtitle="Subtítulo do App"
  appLogo="/logo.png"
  redirectTo="/"
  validateProfile={true}
  requireSchoolId={false}
  showForgotPassword={true}
/>
```

## Design Padrão

### Visual
- **Background**: Imagem de professores/educadores com overlay gradiente (indigo-900/90 → purple-900/85 → blue-900/90)
- **Card**: Fundo branco com backdrop-blur (`bg-white backdrop-blur-sm`)
- **Logo**: Centralizado no topo do card, altura de 20 (h-20)
- **Título**: "Entrar" em negrito, cor preta (#000000)
- **Subtítulo**: Texto descritivo do app, cor preta (#000000)
- **Botão**: Gradiente indigo-600 → purple-600 com hover
- **Inputs**: Com ícones (Mail e Lock) à esquerda
- **Labels**: Negrito, cor preta (#000000)

### CSS Padronizado

Todos os apps usam as mesmas variáveis CSS:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
  /* ... outras variáveis padrão */
}

.dark {
  --primary: 217.2 91.2% 59.8%;
  --ring: 224.3 76.3% 48%;
  /* ... outras variáveis padrão */
}
```

### Estrutura CSS Base

Todos os apps têm a mesma estrutura base no `index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Variáveis CSS padrão */
  }
  
  .dark {
    /* Variáveis CSS para modo escuro */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## Apps Padronizados

| App | Porta | Status | Observações |
|-----|-------|--------|-------------|
| **Gestão Escolar** | 5174 | ✅ | Usa LoginForm padrão |
| **Plano de AEE** | 5175 | ✅ | Usa LoginForm padrão |
| **Planejamento** | 5176 | ✅ | Usa LoginForm padrão |
| **Blog** | 5177 | ✅ | Usa LoginForm padrão |
| **Atividades** | 5178 | ✅ | Usa LoginForm padrão |
| **Portal do Responsável** | 5180 | ✅ | Login customizado (código de acesso) |
| **Transporte Escolar** | 5181 | ✅ | Usa LoginForm padrão |
| **Merenda Escolar** | 5182 | ✅ | Usa LoginForm padrão |

## Correções Aplicadas

### 1. CSS - Cores Primárias
- **Transporte Escolar**: Corrigido `--primary` e `--ring` para valores padrão
- **Merenda Escolar**: Corrigido `--primary` e `--ring` para valores padrão

### 2. CSS - Border Border
- **Merenda Escolar**: Alterado de `border-color: hsl(var(--border))` para `@apply border-border`

### 3. Logos
- **Blog**: Adicionado `appLogo="/logo.png"`
- **Plano de AEE**: Adicionado `appLogo="/logo.png"`

### 4. Portal do Responsável
- Visual padronizado para seguir o mesmo padrão do LoginForm
- Imports atualizados para usar `@pei/ui` e `sonner`
- Mantido login customizado (código de acesso + data de nascimento)

## Verificação

Para verificar se todas as telas estão padronizadas:

1. Acesse cada app na sua porta correspondente
2. Verifique se o visual está consistente:
   - Mesmo background com gradiente
   - Card branco com backdrop-blur
   - Logo centralizado
   - Botão com gradiente indigo-purple
   - Inputs com ícones
   - Labels em negrito e preto

## Notas

- O Portal do Responsável mantém um login customizado porque usa código de acesso ao invés de email/senha
- Todos os apps compartilham o mesmo componente `LoginForm` do `@pei/ui`, garantindo consistência
- As variáveis CSS foram padronizadas para garantir que cores e estilos sejam consistentes em todos os apps

