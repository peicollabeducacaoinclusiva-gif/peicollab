# Redirecionamento Direto para Dashboard com SSO

## Objetivo
Quando o usuário seleciona um app na página de seleção de apps, ele deve ser redirecionado diretamente para o **Dashboard** do app, não para a tela de login. O SSO deve fazer o login automático.

## Implementação

### 1. Mapeamento de Rotas de Dashboard
Cada app tem uma rota de dashboard específica:
- **PEI Collab**: `/dashboard`
- **Gestão Escolar**: `/` (raiz)
- **Plano de AEE**: `/` (raiz)
- **Planejamento**: `/dashboard`
- **Blog**: `/` (raiz)
- **Atividades**: `/` (raiz)
- **Portal do Responsável**: `/` (raiz)
- **Transporte Escolar**: `/` (raiz)
- **Merenda Escolar**: `/` (raiz)

### 2. Modificações Realizadas

#### `apps/landing/src/pages/AppSelector.tsx`
- Adicionada função `getAppDashboardRoute()` para mapear cada app à sua rota de dashboard
- Modificado `handleAppClick()` para:
  - Redirecionar para a rota de dashboard do app (não apenas a URL base)
  - Salvar sessão SSO antes de redirecionar
  - Abrir em nova aba mantendo a landing page aberta

#### `apps/gestao-escolar/src/components/ProtectedRoute.tsx`
- Adicionada verificação de SSO **antes** de verificar sessão normal
- Usa `ssoManager.restoreSession()` para restaurar sessão SSO
- Se SSO for restaurado, define a sessão no Supabase automaticamente

#### `apps/pei-collab/src/pages/Auth.tsx`
- Adicionada verificação de SSO **antes** de verificar sessão normal
- Se SSO for restaurado, redireciona automaticamente para `/dashboard`

#### `packages/ui/src/components/shared/ProtectedRoute.tsx`
- Adicionada verificação de SSO **antes** de verificar sessão normal
- Usado por apps como `plano-aee` e outros que usam `@pei/ui`

## Fluxo de Funcionamento

1. **Usuário faz login na Landing** → Sessão SSO é salva
2. **Usuário seleciona um app** → `handleAppClick()` é chamado
3. **Sessão SSO é salva novamente** → Garante que está atualizada
4. **Redireciona para dashboard do app** → Ex: `http://localhost:8080/dashboard`
5. **App carrega** → `ProtectedRoute` ou `Auth.tsx` verifica SSO
6. **SSO restaura sessão** → `ssoManager.restoreSession()` encontra a sessão
7. **Sessão é definida no Supabase** → `supabase.auth.setSession()`
8. **Usuário acessa dashboard** → Sem precisar fazer login novamente

## Benefícios

✅ **Experiência do usuário melhorada**: Acesso direto ao dashboard sem passar pelo login
✅ **SSO funcionando**: Login automático entre apps
✅ **Mantém landing page aberta**: Apps abrem em nova aba
✅ **Histórico de acesso**: Cada acesso é registrado para estatísticas

## Teste

1. Faça login na landing page
2. Selecione um app (ex: PEI Collab)
3. Verifique se:
   - Abre em nova aba
   - Redireciona para `/dashboard` (não `/login`)
   - Usuário já está logado automaticamente
   - Dashboard carrega corretamente




