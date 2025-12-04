# Diagnóstico: Erro ao Recuperar Senha

## Problema Reportado

Erro ao tentar recuperar a senha do email `danielbruno84@gmail.com`.

## Erro Identificado

**Erro 500** no console do navegador ao tentar enviar email de recuperação de senha.

## Possíveis Causas

### 1. Email Não Cadastrado no Sistema

**Sintoma:** Erro 500 ao tentar recuperar senha

**Causa:** O Supabase pode retornar erro 500 quando o email não está cadastrado, dependendo da configuração.

**Solução:**
- Verificar se o email está cadastrado no sistema
- Se não estiver, o administrador deve criar a conta via dashboard
- Melhorar mensagem de erro para indicar isso claramente

### 2. Rate Limiting do Supabase

**Sintoma:** Erro 500 após múltiplas tentativas

**Causa:** Supabase limita tentativas de recuperação de senha por segurança.

**Solução:**
- Aguardar alguns minutos antes de tentar novamente
- Mensagem de erro já implementada: "Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente."

### 3. Configuração de Redirect URL

**Sintoma:** Erro 500 ao enviar email

**Causa:** URL de redirecionamento não está na lista de URLs permitidas do Supabase.

**Verificação:**
- Verificar `supabase/config.toml` - `additional_redirect_urls`
- Verificar se a URL de produção está configurada corretamente

### 4. Email Não Confirmado

**Sintoma:** Erro ao tentar recuperar senha

**Causa:** Com as mudanças recentes, emails podem não estar confirmados.

**Solução:**
- Executar script de migração para confirmar emails existentes
- Verificar se o email tem `email_confirmed_at` preenchido

### 5. Problema com Serviço de Email do Supabase

**Sintoma:** Erro 500 genérico

**Causa:** Problema temporário no serviço de email do Supabase.

**Solução:**
- Verificar status do Supabase
- Tentar novamente mais tarde
- Verificar logs do Supabase

## Melhorias Implementadas

### 1. Tratamento de Erros Melhorado

**Arquivo:** `src/pages/Auth.tsx`

**Mudanças:**
- Mensagens de erro mais específicas
- Tratamento para rate limiting
- Tratamento para email não encontrado
- Tratamento para email não confirmado
- Tratamento para email inválido

**Código:**
```typescript
if (error) {
  // Tratamento específico de erros comuns
  if (error.message.includes('For security purposes') || error.message.includes('rate limit')) {
    throw new Error('Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.');
  } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
    throw new Error('Este email não está cadastrado no sistema. Verifique o email ou entre em contato com o administrador.');
  } else if (error.message.includes('email not confirmed')) {
    throw new Error('Este email ainda não foi confirmado. Entre em contato com o administrador para ativar sua conta.');
  } else if (error.message.includes('invalid email')) {
    throw new Error('Email inválido. Verifique o formato do email.');
  } else {
    console.error('Erro ao enviar email de recuperação:', error);
    throw new Error(`Erro ao enviar email: ${error.message || 'Erro desconhecido. Tente novamente mais tarde.'}`);
  }
}
```

### 2. Mensagem de Sucesso Melhorada

**Mudança:**
- Adicionada instrução para verificar pasta de spam
- Mensagem mais clara sobre o que fazer após receber o email

## Próximos Passos para Diagnóstico

### 1. Verificar se Email Está Cadastrado

**Query SQL:**
```sql
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'danielbruno84@gmail.com';
```

**Ou via Supabase Dashboard:**
- Authentication → Users
- Buscar por `danielbruno84@gmail.com`

### 2. Verificar Logs do Supabase

**Ações:**
- Acessar Supabase Dashboard
- Ir para Logs → API Logs
- Filtrar por erro 500
- Verificar mensagem de erro específica

### 3. Testar com Outro Email

**Teste:**
- Tentar recuperar senha com email conhecido que está cadastrado
- Verificar se o erro persiste

### 4. Verificar Configuração de Email

**Verificações:**
- Supabase Dashboard → Settings → Auth
- Verificar se SMTP está configurado
- Verificar se há limites de email atingidos

## Soluções Recomendadas

### Solução Imediata

1. **Verificar se o email está cadastrado:**
   - Se não estiver, criar conta via administrador
   - Se estiver, verificar se está ativo

2. **Executar script de migração:**
   ```bash
   node scripts/migrate-confirm-user-emails.js
   ```
   - Isso confirma emails de usuários existentes

3. **Verificar logs do Supabase:**
   - Identificar erro específico
   - Aplicar correção baseada no erro

### Solução de Longo Prazo

1. **Melhorar feedback ao usuário:**
   - ✅ Já implementado: mensagens de erro mais específicas
   - Adicionar verificação prévia se email existe (opcional)

2. **Monitoramento:**
   - Adicionar logging de erros de recuperação de senha
   - Alertas para erros frequentes

3. **Documentação:**
   - Guia para administradores sobre criação de usuários
   - Processo de recuperação de senha documentado

## Como Verificar o Problema

### Via Navegador (DevTools)

1. Abrir DevTools (F12)
2. Ir para aba Console
3. Tentar recuperar senha
4. Verificar mensagem de erro específica
5. Ir para aba Network
6. Filtrar por "recover" ou "reset"
7. Verificar resposta do servidor

### Via Supabase Dashboard

1. Acessar Supabase Dashboard
2. Ir para Authentication → Users
3. Buscar por `danielbruno84@gmail.com`
4. Verificar status da conta
5. Verificar se email está confirmado

### Via Logs

1. Supabase Dashboard → Logs
2. Filtrar por erro 500
3. Verificar timestamp da tentativa
4. Analisar mensagem de erro completa

## Contato e Suporte

Se o problema persistir:

1. Verificar logs do Supabase para erro específico
2. Verificar se email está cadastrado
3. Verificar configuração de SMTP
4. Tentar com outro email cadastrado
5. Verificar rate limiting

## Status

- ✅ Tratamento de erros melhorado
- ✅ Mensagens mais específicas implementadas
- ⏳ Aguardando diagnóstico específico do erro 500
- ⏳ Verificação se email está cadastrado necessária

