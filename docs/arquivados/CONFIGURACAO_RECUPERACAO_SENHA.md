# 🔐 Configuração de Recuperação de Senha - Supabase

Este guia explica como configurar corretamente o Supabase para o fluxo de recuperação de senha.

## 📋 Pré-requisitos

- Acesso ao Dashboard do Supabase
- URL da aplicação em produção (se aplicável)

## 🔧 Configuração no Dashboard do Supabase

### 1. Acessar Configurações de Autenticação

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Authentication** → **URL Configuration**

### 2. Configurar Site URL

**Site URL** (URL principal do site):
```
http://localhost:8080
```

Para produção, use:
```
https://seu-dominio.com
```

### 3. Configurar Redirect URLs

Adicione as seguintes URLs na lista **Redirect URLs**:

#### Desenvolvimento Local:
```
http://localhost:8080/auth/reset-password
http://127.0.0.1:8080/auth/reset-password
http://localhost:8080
http://127.0.0.1:8080
```

#### Produção:
```
https://seu-dominio.com/auth/reset-password
https://seu-dominio.com
```

**⚠️ IMPORTANTE:** A rota `/auth/reset-password` DEVE estar na lista de Redirect URLs, caso contrário o Supabase não permitirá o redirecionamento.

### 4. Configurar Email Templates (Opcional)

1. Vá em **Authentication** → **Email Templates**
2. Selecione **Reset Password**
3. Personalize o template se desejar

O template padrão já funciona, mas você pode personalizar com:
- Logo da sua aplicação
- Cores da marca
- Texto personalizado

**Exemplo de template personalizado:**
```html
<h2>Recuperação de Senha</h2>
<p>Clique no link abaixo para redefinir sua senha:</p>
<p><a href="{{ .ConfirmationURL }}">Redefinir Senha</a></p>
<p>Este link expira em 1 hora.</p>
```

### 5. Configurar Configurações de Email

1. Vá em **Authentication** → **Settings**
2. Verifique as seguintes configurações:

- **Enable email confirmations**: Pode estar desabilitado para recuperação de senha
- **Enable email change confirmations**: Recomendado habilitar
- **Secure email change**: Recomendado habilitar

### 6. Configurar SMTP (Produção)

Para produção, configure um provedor SMTP personalizado:

1. Vá em **Authentication** → **Settings** → **SMTP Settings**
2. Configure com seu provedor SMTP (SendGrid, Mailgun, etc.)

**Exemplo com SendGrid:**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [sua API key do SendGrid]
Sender email: noreply@seu-dominio.com
Sender name: PEI Collab
```

## 🔍 Verificação da Configuração

### Teste Local

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Acesse: `http://localhost:8080/auth`

3. Clique em "Esqueceu sua senha?"

4. Digite um email válido

5. Verifique o email recebido

6. Clique no link - deve redirecionar para:
```
http://localhost:8080/auth/reset-password?code=...
```

### Teste em Produção

1. Certifique-se de que a URL de produção está configurada no Supabase
2. Teste o fluxo completo de recuperação
3. Verifique os logs no Dashboard do Supabase em **Logs** → **Auth Logs**

## 🐛 Troubleshooting

### Problema: Link não redireciona para `/auth/reset-password`

**Solução:**
1. Verifique se `/auth/reset-password` está na lista de Redirect URLs
2. Verifique se a URL está exatamente como configurada (sem trailing slash)
3. Limpe o cache do navegador

### Problema: "Invalid redirect URL"

**Solução:**
1. Adicione a URL exata na lista de Redirect URLs
2. Certifique-se de que não há espaços ou caracteres especiais
3. Use `http://` para desenvolvimento e `https://` para produção

### Problema: Link expira muito rápido

**Solução:**
1. No arquivo `supabase/config.toml`, ajuste:
```toml
[auth]
recovery_link_expiry = 7200  # 2 horas em segundos
```

2. Ou configure no Dashboard do Supabase em **Authentication** → **Settings**

### Problema: Email não chega

**Solução:**
1. Verifique a pasta de spam
2. Verifique os logs do Supabase em **Logs** → **Auth Logs**
3. Configure SMTP personalizado para produção
4. Verifique se o email está cadastrado no sistema

## 📝 Configuração no Código

O código já está configurado para usar a rota `/auth/reset-password`. Verifique:

1. **`src/pages/Auth.tsx`** - Linha ~536:
```typescript
const redirectUrl = `${window.location.origin}/auth/reset-password`;
```

2. **`src/App.tsx`** - Rota configurada:
```typescript
<Route path="/auth/reset-password" element={<ResetPassword />} />
```

3. **`src/pages/ResetPassword.tsx`** - Componente dedicado para reset

## 🔒 Segurança

- Links de recuperação expiram após 1 hora (configurável)
- Cada link só pode ser usado uma vez
- Links expirados mostram mensagem amigável ao usuário
- Validação de senha forte (mínimo 8 caracteres, maiúscula, minúscula, número)

## 📚 Referências

- [Documentação Supabase - Password Recovery](https://supabase.com/docs/guides/auth/auth-password-reset)
- [Documentação Supabase - URL Configuration](https://supabase.com/docs/guides/auth/auth-redirects)









