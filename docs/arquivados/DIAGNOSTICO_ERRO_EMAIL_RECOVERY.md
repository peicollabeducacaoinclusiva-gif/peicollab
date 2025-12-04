# 🔍 Diagnóstico: Erro 500 no Envio de Email de Recuperação

## ❌ Problema Identificado

Ao tentar enviar o email de recuperação de senha, a requisição retorna **erro 500**:

```
POST https://fximylewmvsllkdczovj.supabase.co/auth/v1/recover?redirect_to=http%3A%2F%2Flocalhost%3A8080%2Fauth
Status: 500 Internal Server Error
```

## 🔍 Possíveis Causas

### 1. **Configuração SMTP/Resend Incorreta**

O Supabase pode não estar conseguindo se conectar ao Resend ou as credenciais estão incorretas.

**Verificar:**
- ✅ API Key do Resend está correta no Supabase Dashboard
- ✅ Domínio `peicollab.com.br` está verificado no Resend
- ✅ Sender email `team@peicollab.com.br` está configurado e verificado

### 2. **Domínio não Verificado no Resend**

O domínio `peicollab.com.br` precisa estar completamente verificado no Resend antes de poder enviar emails.

**Verificar no Resend Dashboard:**
- Status do domínio: deve estar "Verified"
- DNS records: SPF, DKIM, DMARC devem estar configurados
- Sender email: `team@peicollab.com.br` deve estar aprovado

### 3. **Configuração no Supabase Dashboard**

**Verificar em Authentication → Settings → SMTP Settings:**

```
SMTP Host: smtp.resend.com
SMTP Port: 465 (SSL) ou 587 (TLS)
SMTP User: resend
SMTP Password: [API Key do Resend]
Sender Email: team@peicollab.com.br
Sender Name: PeiCollab
```

### 4. **Rate Limiting do Resend**

O Resend pode estar bloqueando requisições por rate limiting.

**Verificar:**
- Limite de emails por dia/mês no plano do Resend
- Se há muitas tentativas recentes

### 5. **Template de Email não Configurado**

O Supabase pode estar tentando usar um template que não existe ou está malformado.

**Verificar:**
- Authentication → Email Templates → Reset Password
- Template deve estar configurado corretamente

## 🛠️ Soluções

### Solução 1: Verificar Configuração SMTP no Supabase

1. Acesse **Supabase Dashboard** → **Authentication** → **Settings**
2. Role até **SMTP Settings**
3. Verifique se está usando:
   - **Provider**: Custom SMTP
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (SSL) ou `587` (TLS)
   - **Username**: `resend`
   - **Password**: `[Sua API Key do Resend]`
   - **Sender email**: `team@peicollab.com.br`
   - **Sender name**: `PeiCollab`

### Solução 2: Verificar Domínio no Resend

1. Acesse **Resend Dashboard** → **Domains**
2. Verifique se `peicollab.com.br` está:
   - ✅ Verificado (status: Verified)
   - ✅ Com todos os DNS records corretos:
     - SPF record
     - DKIM record
     - DMARC record (opcional mas recomendado)

### Solução 3: Testar API do Resend Diretamente

Crie um script de teste para verificar se o Resend está funcionando:

```javascript
// test-resend.js
import { Resend } from 'resend';

const resend = new Resend('re_YOUR_API_KEY');

async function testEmail() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'team@peicollab.com.br',
      to: 'danielbruno84@gmail.com',
      subject: 'Teste de Email - PEI Collab',
      html: '<h1>Teste</h1><p>Este é um email de teste.</p>',
    });

    if (error) {
      console.error('❌ Erro:', error);
    } else {
      console.log('✅ Email enviado:', data);
    }
  } catch (err) {
    console.error('❌ Erro ao enviar:', err);
  }
}

testEmail();
```

### Solução 4: Verificar Logs do Supabase

1. Acesse **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Procure por erros relacionados a:
   - `email_send_failed`
   - `smtp_error`
   - `resend_error`

### Solução 5: Usar Email de Teste do Resend

Se o domínio ainda não estiver verificado, use o email de teste do Resend:

```
Sender Email: onboarding@resend.dev
```

**⚠️ Limitação**: Só funciona para emails verificados no Resend (para desenvolvimento).

### Solução 6: Verificar Template de Email

1. Acesse **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Selecione **Reset Password**
3. Verifique se o template está configurado
4. Se não estiver, copie o template de `docs/EstruturaEmailsSupabase.md`

## 📋 Checklist de Verificação

- [ ] API Key do Resend está correta no Supabase
- [ ] Domínio `peicollab.com.br` está verificado no Resend
- [ ] DNS records (SPF, DKIM) estão configurados corretamente
- [ ] Sender email `team@peicollab.com.br` está aprovado
- [ ] SMTP settings no Supabase estão corretas
- [ ] Template de email está configurado
- [ ] Não há rate limiting bloqueando
- [ ] Logs do Supabase não mostram erros específicos

## 🔧 Comandos Úteis

### Verificar Status do Domínio no Resend (via API)

```bash
curl -X GET "https://api.resend.com/domains" \
  -H "Authorization: Bearer re_YOUR_API_KEY"
```

### Testar Envio de Email (via API do Resend)

```bash
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer re_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "team@peicollab.com.br",
    "to": "danielbruno84@gmail.com",
    "subject": "Teste",
    "html": "<h1>Teste</h1>"
  }'
```

## 📞 Próximos Passos

1. **Verificar logs do Supabase** para ver o erro específico
2. **Testar API do Resend diretamente** para isolar o problema
3. **Verificar status do domínio** no Resend Dashboard
4. **Confirmar configuração SMTP** no Supabase Dashboard

---

**Última atualização:** Janeiro 2025









