# Configuração do Link para Landing Page

## Visão Geral

O Splash do PEI Collab agora possui links para a Landing Page institucional em duas localidades:
- **Header**: Botão "Sobre o Projeto" (visível em telas médias/grandes)
- **Footer**: Link "Sobre o Projeto" na seção "Produto"

## Configuração da URL

A URL da landing é configurada através da constante `LANDING_URL` no arquivo `src/pages/Splash.tsx`.

### Variável de Ambiente

Crie um arquivo `.env` na raiz do app pei-collab com:

```bash
VITE_LANDING_URL=http://localhost:5174
```

### Ambientes

**Desenvolvimento Local:**
```bash
VITE_LANDING_URL=http://localhost:5174
```

**Produção:**
```bash
VITE_LANDING_URL=https://seu-dominio-landing.com
```

Se a variável não for definida, o padrão será `http://localhost:5174`.

## Comportamento

- Os links abrem a landing em uma **nova aba** (`target="_blank"`)
- Não interrompem a sessão do usuário no PEI Collab
- Design discreto que não compete com o CTA principal

## Implementação

```typescript
// Constante no topo de Splash.tsx
const LANDING_URL = import.meta.env.VITE_LANDING_URL || 'http://localhost:5174';

// Uso no código
onClick={() => window.open(LANDING_URL, '_blank')}
```

