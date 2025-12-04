# Correção do SSO entre Apps

## Problema

Após fazer login no app `landing`, os outros apps não estavam logando automaticamente. O usuário precisava fazer login novamente em cada app.

## Causa

O SSO estava sendo salvo no `landing` app quando o login era feito, mas os outros apps não estavam verificando/restaurando a sessão SSO quando eram abertos.

## Solução

### 1. Atualização do `useLogin` para salvar SSO

Modificado `packages/ui/src/hooks/useLogin.ts` para salvar a sessão via `ssoManager` além do método anterior:

```typescript
// Salvar token para SSO entre apps
if (data.session) {
  saveAuthToken(data.session);
  // Salvar também via SSO Manager para compartilhamento entre apps
  await ssoManager.saveSession(data.session, 'landing');
}
```

### 2. Atualização dos hooks `useAuth` para restaurar SSO

Todos os hooks `useAuth` foram atualizados para tentar restaurar a sessão SSO antes de verificar a sessão local:

**Apps atualizados:**
- `apps/pei-collab/src/hooks/useAuth.ts`
- `apps/landing/src/hooks/useAuth.ts`
- `apps/gestao-escolar/src/hooks/useAuth.ts`
- `apps/plano-aee/src/hooks/useAuth.ts`

**Lógica adicionada:**
```typescript
// Primeiro, tentar restaurar sessão SSO se existir
try {
  const { ssoManager } = await import('@pei/auth');
  const restoredSession = await ssoManager.restoreSession();
  if (restoredSession) {
    console.log('✅ Sessão SSO restaurada com sucesso');
    setAuthState({
      user: restoredSession.user,
      loading: false,
      error: null
    });
    return;
  }
} catch (ssoError) {
  console.log('ℹ️ Nenhuma sessão SSO encontrada, verificando sessão local...');
}

// Se não houver SSO, verificar sessão local
const { data: { session }, error } = await supabase.auth.getSession();
```

## Como Funciona

1. **Login no Landing**: Quando o usuário faz login no app `landing`, a sessão é salva via `ssoManager.saveSession()` em:
   - Cookies (para compartilhamento entre subdomínios)
   - localStorage (fallback para localhost)

2. **Abertura de Outros Apps**: Quando um app é aberto:
   - Primeiro tenta restaurar a sessão SSO via `ssoManager.restoreSession()`
   - Se encontrar, usa essa sessão e o usuário fica logado automaticamente
   - Se não encontrar, verifica a sessão local do Supabase

3. **Compartilhamento**: O SSO funciona via:
   - **Cookies**: Em produção, cookies são compartilhados entre subdomínios
   - **localStorage**: Em localhost, localStorage é usado como fallback

## Teste

Para testar:
1. Faça login no app `landing` (http://localhost:3000/login)
2. Acesse o seletor de apps (http://localhost:3000/apps)
3. Clique em qualquer app (ex: PEI Collab, Gestão Escolar, etc.)
4. O app deve abrir já logado, sem pedir login novamente

## Arquivos Modificados

- `packages/ui/src/hooks/useLogin.ts` - Adicionado salvamento via SSO
- `apps/pei-collab/src/hooks/useAuth.ts` - Adicionada restauração de SSO
- `apps/landing/src/hooks/useAuth.ts` - Adicionada restauração de SSO
- `apps/gestao-escolar/src/hooks/useAuth.ts` - Adicionada restauração de SSO
- `apps/plano-aee/src/hooks/useAuth.ts` - Adicionada restauração de SSO

