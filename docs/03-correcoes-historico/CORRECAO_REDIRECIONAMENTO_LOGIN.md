# Correção do Redirecionamento Após Login

## Problema

Após o login bem-sucedido, a mensagem "Login realizado com sucesso!" aparecia, mas o usuário não era redirecionado para `/apps`.

## Causa

Havia dois mecanismos de redirecionamento que podiam conflitar:
1. O callback `onSuccess` do hook `useLogin`
2. O listener `onAuthStateChange` no `useEffect`

Além disso, o `useEffect` estava tentando redirecionar em dois momentos diferentes, o que podia causar conflitos.

## Solução

1. **Simplificação do `useEffect`**: Removido o listener `onAuthStateChange` duplicado, mantendo apenas a verificação inicial de sessão
2. **Aumento do timeout**: Aumentado de 100ms para 300ms para garantir que o toast apareça antes do redirecionamento
3. **Uso de `replace: true`**: Adicionado `replace: true` no `navigate` para evitar adicionar entrada no histórico
4. **Logs de debug**: Adicionados `console.log` temporários para facilitar debug

## Mudanças Realizadas

### `packages/ui/src/components/shared/LoginForm.tsx`

- Simplificado o `useEffect` para verificar apenas sessão existente ao montar
- Removido o listener `onAuthStateChange` duplicado
- Aumentado timeout de 100ms para 300ms no `onSuccess`
- Adicionado `replace: true` no `navigate`

### `apps/landing/src/pages/Login.tsx`

- Adicionado `replace: true` no `navigate` do `handleSuccess`
- Adicionado timeout de 100ms para garantir ordem de execução
- Adicionado `console.log` para debug

## Teste

Após essas mudanças, o fluxo deve ser:
1. Usuário faz login
2. Toast "Login realizado com sucesso!" aparece
3. Após 300ms, redireciona para `/apps`
4. Usuário vê o seletor de aplicativos

