# 🔧 Solução: Error sending recovery email

## ❌ Erro

Ao tentar recuperar senha, aparece o erro:
```
Error sending recovery email
```

Status HTTP: **500 Internal Server Error**

## 🔍 Diagnóstico Rápido

Execute o script de teste para verificar se o Resend está funcionando:

```bash
# 1. Adicione sua API Key do Resend no .env
echo "RESEND_API_KEY=re_sua_api_key_aqui" >> .env

# 2. Execute o teste
node scripts/test-resend-email.js danielbruno84@gmail.com
```

## ✅ Solução Passo a Passo

### Passo 1: Verificar API Key do Resend

1. Acesse [Resend Dashboard](https://resend.com/api-keys)
2. Copie sua **API Key** (começa com `re_`)
3. Adicione no arquivo `.env`:
   ```
   RESEND_API_KEY=re_sua_api_key_aqui
   ```

### Passo 2: Verificar Domínio no Resend

1. Acesse [Resend Dashboard](https://resend.com/domains)
2. Verifique se `peicollab.com.br` está:
   - ✅ **Status: Verified**
   - ✅ Com DNS records configurados:
     - **SPF**: `v=spf1 include:resend.com ~all`
     - **DKIM**: Configurado automaticamente pelo Resend
     - **DMARC**: (opcional) `v=DMARC1; p=none;`

**⚠️ Se o domínio não estiver verificado:**
- Adicione os registros DNS no seu provedor de domínio
- Aguarde a verificação (pode levar algumas horas)

### Passo 3: Configurar SMTP no Supabase

1. Acesse **Supabase Dashboard** → **Authentication** → **Settings**
2. Role até **SMTP Settings**
3. Configure:

```
Enable Custom SMTP: ✅ ON

SMTP Host: smtp.resend.com
SMTP Port: 465
SMTP User: resend
SMTP Password: [Cole sua API Key do Resend aqui - re_xxxxx]
Sender Email: team@peicollab.com.br
Sender Name: PeiCollab
```

**⚠️ Importante:**
- Use a porta **465** (SSL) ou **587** (TLS)
- O **SMTP Password** é a sua **API Key completa** (não apenas o token)
- O **Sender Email** deve ser do domínio verificado

### Passo 4: Verificar Sender Email no Resend

1. Acesse [Resend Dashboard](https://resend.com/emails)
2. Verifique se `team@peicollab.com.br` está aprovado
3. Se não estiver, adicione em **Settings** → **Senders**

### Passo 5: Testar Configuração

Execute o script de teste:

```bash
node scripts/test-resend-email.js seu-email@exemplo.com
```

Se o teste funcionar, o problema está na configuração do Supabase.

### Passo 6: Verificar Logs do Supabase

1. Acesse **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Procure por erros relacionados a:
   - `smtp_error`
   - `email_send_failed`
   - `resend_error`

## 🚨 Problemas Comuns

### Problema 1: "Domain not verified"

**Solução:**
- Verifique se o domínio está verificado no Resend
- Confirme que os DNS records estão corretos
- Aguarde a propagação DNS (pode levar até 48h)

### Problema 2: "Invalid API key"

**Solução:**
- Verifique se copiou a API Key completa
- Confirme que não há espaços extras
- Gere uma nova API Key se necessário

### Problema 3: "Sender email not approved"

**Solução:**
- Adicione o sender email no Resend Dashboard
- Use apenas emails do domínio verificado
- Aguarde a aprovação

### Problema 4: "Rate limit exceeded"

**Solução:**
- Verifique seu plano no Resend
- Aguarde alguns minutos
- Considere fazer upgrade do plano se necessário

## 📋 Checklist Final

Antes de testar novamente, verifique:

- [ ] API Key do Resend está correta no Supabase
- [ ] Domínio `peicollab.com.br` está verificado no Resend
- [ ] DNS records (SPF, DKIM) estão configurados
- [ ] Sender email `team@peicollab.com.br` está aprovado
- [ ] SMTP settings no Supabase estão corretas:
  - [ ] Host: `smtp.resend.com`
  - [ ] Port: `465` ou `587`
  - [ ] User: `resend`
  - [ ] Password: API Key completa
- [ ] Template de email está configurado no Supabase

## 🧪 Teste Manual

1. Acesse `http://localhost:8080/auth`
2. Clique em "Esqueceu sua senha?"
3. Digite um email válido
4. Clique em "Enviar Link"
5. Verifique:
   - ✅ Se aparece mensagem de sucesso
   - ✅ Se o email chega na caixa de entrada
   - ❌ Se aparece erro, verifique os logs

## 📞 Se Ainda Não Funcionar

1. **Verifique os logs do Supabase:**
   - Dashboard → Logs → Auth Logs
   - Procure por erros específicos

2. **Teste a API do Resend diretamente:**
   ```bash
   node scripts/test-resend-email.js seu-email@exemplo.com
   ```

3. **Verifique a configuração SMTP:**
   - Confirme que está usando a API Key completa
   - Verifique se não há espaços ou caracteres extras

4. **Entre em contato com o suporte:**
   - Resend: support@resend.com
   - Supabase: support@supabase.com

---

**Última atualização:** Janeiro 2025









