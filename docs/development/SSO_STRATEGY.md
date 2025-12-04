# Estratégia SSO (Single Sign-On) - PEI Collab

## Visão Geral

O sistema PEI Collab implementa SSO para permitir que usuários autenticados em um app (ex: Landing) possam acessar outros apps (ex: Gestão Escolar, PEI Collab) sem precisar fazer login novamente.

## Arquitetura

### Componentes Principais

1. **SSOManager** (`packages/auth/src/sso/ssoManager.ts`)
   - Gerenciador central de sessão SSO
   - Singleton pattern para garantir uma única instância
   - Gerencia cookies e localStorage

2. **CookieManager** (`packages/auth/src/sso/cookieManager.ts`)
   - Gerenciamento de cookies compartilhados entre subdomínios
   - Detecção automática de domínio base
   - Fallback para localStorage em desenvolvimento

3. **SSOService** (`apps/landing/src/services/ssoService.ts`)
   - Interface de alto nível para apps
   - Métodos para login, logout e navegação entre apps

### Fluxo de Autenticação

```
1. Usuário faz login no app Landing
   ↓
2. SSOManager salva sessão em:
   - Cookie compartilhado (produção)
   - localStorage (desenvolvimento/fallback)
   ↓
3. Usuário navega para outro app (ex: Gestão Escolar)
   ↓
4. App detecta cookie/localStorage SSO
   ↓
5. SSOManager restaura sessão no Supabase
   ↓
6. Usuário autenticado automaticamente
```

## Configuração de Domínios

### Desenvolvimento (localhost)

- **Domínio base:** Não aplicável (localhost não suporta cookies compartilhados)
- **Estratégia:** localStorage compartilhado via `window.postMessage` ou storage events
- **Configuração:** Automática, não requer configuração adicional

### Produção (Subdomínios)

- **Domínio base:** `.peicollab.com.br` (exemplo)
- **Subdomínios:** 
  - `landing.peicollab.com.br`
  - `gestao.peicollab.com.br`
  - `pei.peicollab.com.br`
  - `aee.peicollab.com.br`
- **Cookies:** Configurados com `domain=.peicollab.com.br` para compartilhamento

### Exemplo de Configuração

```typescript
// Cookie compartilhado entre subdomínios
setCookie('pei-sso-session', sessionData, {
  domain: '.peicollab.com.br',  // Compartilhado entre todos os subdomínios
  path: '/',
  secure: true,                  // HTTPS apenas
  sameSite: 'lax',              // Proteção CSRF
  maxAge: 60 * 60 * 24 * 7,    // 7 dias
});
```

## Implementação por App

### Landing (App Principal)

```typescript
import { ssoService } from '@/services/ssoService';

// Login
const { session, error } = await ssoService.signIn(email, password);

// Logout
await ssoService.signOut();

// Verificar sessão
const hasSession = await ssoService.hasActiveSession();
```

### Outros Apps

```typescript
import { ssoManager } from '@pei/auth';

// Na inicialização do app
useEffect(() => {
  const restoreSession = async () => {
    const session = await ssoManager.restoreSession();
    if (session) {
      // Usuário autenticado via SSO
      // Carregar perfil, etc.
    }
  };
  restoreSession();
}, []);
```

## Segurança

### Cookies

- **Secure:** Sempre `true` em produção (HTTPS apenas)
- **SameSite:** `lax` (proteção CSRF, permite navegação entre apps)
- **HttpOnly:** Não aplicável (precisa ser acessível via JavaScript)

### Tokens

- **Access Token:** Expira em ~1 hora, armazenado em cookie
- **Refresh Token:** Expira em ~30 dias, armazenado em cookie separado
- **Validação:** Verificação automática de expiração antes de uso

### Proteções

1. **Validação de Domínio:** Cookies só funcionam em domínios configurados
2. **Expiração Automática:** Tokens expirados são automaticamente removidos
3. **Refresh Automático:** Sistema tenta refresh antes de considerar sessão inválida
4. **Limpeza em Logout:** Todos os cookies e localStorage são limpos

## Testes

### Testes E2E

Arquivo: `tests/e2e/sso-flow.spec.ts`

**Cenários:**
1. Login no app Landing
2. Navegação para app Gestão Escolar
3. Verificação de autenticação automática
4. Logout em um app
5. Verificação de logout em todos os apps

### Testes Manuais

1. **Desenvolvimento:**
   ```bash
   # Terminal 1: Landing
   cd apps/landing && pnpm dev
   
   # Terminal 2: Gestão Escolar
   cd apps/gestao-escolar && pnpm dev
   
   # Testar:
   # 1. Login em http://localhost:3000
   # 2. Navegar para http://localhost:5174
   # 3. Verificar se está autenticado
   ```

2. **Produção:**
   - Configurar domínios reais
   - Testar cookies compartilhados
   - Validar HTTPS

## Troubleshooting

### Cookies não compartilhados

**Problema:** Login em um app não funciona em outro

**Soluções:**
1. Verificar domínio base: `ssoManager.getDomainInfo()`
2. Verificar se cookies estão habilitados: `areCookiesEnabled()`
3. Em desenvolvimento, verificar localStorage
4. Verificar console para erros de CORS

### Sessão não restaurada

**Problema:** App não detecta sessão SSO existente

**Soluções:**
1. Verificar se `ssoManager.restoreSession()` está sendo chamado
2. Verificar se cookies/localStorage contêm dados válidos
3. Verificar se refresh token ainda é válido
4. Verificar logs do Supabase Auth

### Token expirado

**Problema:** Sessão expira rapidamente

**Soluções:**
1. Verificar configuração de expiração no Supabase
2. Verificar se refresh automático está funcionando
3. Aumentar `maxAge` dos cookies se necessário

## Configuração do Supabase

### Redirect URLs

Configurar em `supabase/config.toml` ou no dashboard:

```toml
[auth]
site_url = "https://landing.peicollab.com.br"
additional_redirect_urls = [
  "https://gestao.peicollab.com.br",
  "https://pei.peicollab.com.br",
  "https://aee.peicollab.com.br",
  # ... outros apps
]
```

### JWT Settings

- **JWT Expiry:** 3600 segundos (1 hora) - padrão
- **Refresh Token Rotation:** Habilitado
- **Refresh Token Reuse Detection:** Habilitado

## Melhorias Futuras

1. **OAuth Providers:** Integração com Google, Microsoft, etc.
2. **SAML:** Suporte a SAML para redes educacionais
3. **MFA:** Multi-factor authentication
4. **Session Management:** Dashboard para gerenciar sessões ativas
5. **Analytics:** Rastreamento de uso de SSO

## Referências

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP: Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

