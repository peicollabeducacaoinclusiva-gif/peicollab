# 🚀 Resumo Rápido - Configuração Supabase para Recuperação de Senha

## ⚡ Configuração Rápida (5 minutos)

### 1. Dashboard do Supabase

Acesse: https://app.supabase.com → Seu Projeto → **Authentication** → **URL Configuration**

#### Site URL:
```
http://localhost:8080  (desenvolvimento)
https://seu-dominio.com (produção)
```

#### Redirect URLs (adicione TODAS):
```
http://localhost:8080/auth/reset-password
http://127.0.0.1:8080/auth/reset-password
http://localhost:8080
http://127.0.0.1:8080
```

**Para produção, adicione também:**
```
https://seu-dominio.com/auth/reset-password
https://seu-dominio.com
```

### 2. Verificar Código

✅ Já configurado:
- Rota `/auth/reset-password` criada
- Componente `ResetPassword.tsx` criado
- `Auth.tsx` atualizado para usar nova rota
- `config.toml` atualizado

### 3. Testar

1. Inicie o servidor: `npm run dev`
2. Acesse: `http://localhost:8080/auth`
3. Clique em "Esqueceu sua senha?"
4. Digite um email válido
5. Verifique o email e clique no link
6. Deve redirecionar para: `http://localhost:8080/auth/reset-password?code=...`

## ⚠️ Problemas Comuns

### "Invalid redirect URL"
→ Adicione a URL exata na lista de Redirect URLs no Dashboard

### Link não funciona
→ Verifique se `/auth/reset-password` está nas Redirect URLs

### Email não chega
→ Verifique spam e logs do Supabase (Authentication → Logs)

## 📚 Documentação Completa

- **Guia detalhado**: `docs/CONFIGURACAO_RECUPERACAO_SENHA.md`
- **Checklist**: `docs/CHECKLIST_RECUPERACAO_SENHA.md`

## 🔗 Links Úteis

- Dashboard Supabase: https://app.supabase.com
- Documentação: https://supabase.com/docs/guides/auth/auth-password-reset









