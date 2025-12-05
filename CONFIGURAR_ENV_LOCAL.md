# ⚙️ Configurar Ambiente Local (.env)

## 🎯 Objetivo

Configurar variáveis de ambiente para rodar os apps localmente com Supabase.

---

## 📋 PRÉ-REQUISITOS

- [ ] Acesso ao Supabase Dashboard
- [ ] URL do projeto Supabase
- [ ] Chave ANON do Supabase

---

## 🔑 PASSO 1: Obter Credenciais do Supabase

### 1.1. Acessar Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Login na sua conta
3. Selecione seu projeto

### 1.2. Copiar URL e Chave

1. No menu lateral, clique em **"Settings"** (⚙️)
2. Clique em **"API"**
3. Copie os valores:
   - **Project URL**: `https://seu-projeto.supabase.co`
   - **anon public**: `eyJhbG...` (chave longa)

---

## 📝 PASSO 2: Criar Arquivos .env.local

### 2.1. Gestão Escolar

Crie o arquivo: `apps/gestao-escolar/.env.local`

```bash
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui

# URLs dos Apps (Local)
VITE_GESTAO_ESCOLAR_URL=http://localhost:5174
VITE_PEI_COLLAB_URL=http://localhost:8080

# URLs dos Apps (Produção - Após DNS)
# VITE_GESTAO_ESCOLAR_URL=https://gestao.peicollab.com.br
# VITE_PEI_COLLAB_URL=https://pei.peicollab.com.br

# OpenAI (Opcional - para IA)
VITE_OPENAI_API_KEY=sk-...

# Ambiente
VITE_ENV=development
```

### 2.2. PEI Collab

Crie o arquivo: `apps/pei-collab/.env.local`

```bash
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui

# URLs dos Apps (Local)
VITE_GESTAO_ESCOLAR_URL=http://localhost:5174
VITE_PEI_COLLAB_URL=http://localhost:8080

# URLs dos Apps (Produção - Após DNS)
# VITE_GESTAO_ESCOLAR_URL=https://gestao.peicollab.com.br
# VITE_PEI_COLLAB_URL=https://pei.peicollab.com.br

# OpenAI (Opcional - para IA)
VITE_OPENAI_API_KEY=sk-...

# Ambiente
VITE_ENV=development
```

---

## 📝 PASSO 3: Reiniciar Servidores

### 3.1. Parar Servidores Atuais

No terminal onde está rodando:
```bash
Ctrl + C
```

### 3.2. Iniciar Novamente

```bash
# Terminal 1 - Gestão Escolar
pnpm --filter @pei-collab/gestao-escolar dev

# Terminal 2 - PEI Collab
pnpm --filter @pei/pei-collab dev
```

---

## 📝 PASSO 4: Testar Conexão

### 4.1. Abrir Browser

1. Acesse: `http://localhost:5174/blog`
2. Se configurado corretamente, deve mostrar **3 posts**:
   - Bem-vindo ao PEI Collab
   - Sistema de Módulos
   - Como Criar um PEI com IA

### 4.2. Verificar Console

1. Abra DevTools (F12)
2. Vá na aba **Console**
3. Deve ver: `🔐 Token salvo para SSO entre apps`
4. **NÃO deve ter** erros de Supabase

### 4.3. Testar Login

1. Vá para: `http://localhost:5174/login`
2. Login: `coordenador@teste.com`
3. Senha: `Teste123`
4. Deve entrar no dashboard

---

## ❓ PROBLEMAS COMUNS

### Problema 1: "Failed to connect to Supabase"

**Causa**: URL ou Key incorretos  
**Solução**:
1. Verifique se copiou corretamente do Dashboard
2. Não deve ter espaços extras
3. A chave ANON é bem longa (~200 caracteres)

### Problema 2: Blog não carrega posts

**Causa**: RPC não configurada ou dados não existem  
**Solução**:
1. Verifique se a migration foi aplicada
2. Execute: `scripts/enable-test-modules.sql`
3. Verifique se os posts foram criados (já foram via SQL)

### Problema 3: "Cannot read properties of undefined"

**Causa**: Supabase client não inicializou  
**Solução**:
1. Reinicie o servidor
2. Limpe cache do browser (Ctrl+Shift+R)
3. Verifique variáveis de ambiente

### Problema 4: Servidor não reinicia

**Causa**: Processo anterior ainda rodando  
**Solução**:
```bash
# Windows (PowerShell)
Get-Process node | Stop-Process

# Depois reinicie
pnpm --filter @pei-collab/gestao-escolar dev
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

Após configurar, verifique:

### Gestão Escolar (localhost:5174)
- [ ] Landing page carrega
- [ ] `/blog` mostra 3 posts
- [ ] `/login` carrega
- [ ] Login funciona
- [ ] Dashboard carrega após login
- [ ] Módulos aparecem no menu

### PEI Collab (localhost:8080)
- [ ] Landing page carrega
- [ ] `/auth` carrega
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] AppHub mostra 3 apps
- [ ] Link "Gestão Escolar" funciona

### Console do Browser
- [ ] Sem erros em vermelho
- [ ] Mensagem "Token salvo" aparece
- [ ] Supabase conectado

---

## 🚀 ALTERNATIVA: Testar Direto em Produção

Se preferir não configurar local, você pode testar direto em produção:

### URLs Atuais (Vercel):
```
Landing: https://peicollab-kawzx69nu-pei-collab.vercel.app
Blog:    https://peicollab-kawzx69nu-pei-collab.vercel.app/blog
Login:   https://peicollab-kawzx69nu-pei-collab.vercel.app/login
```

**Em produção:**
- ✅ Supabase já está configurado (variáveis na Vercel)
- ✅ Posts devem aparecer
- ✅ Login funciona
- ✅ Módulos funcionam

---

## 📝 EXEMPLO DE .env.local COMPLETO

```bash
# ==================================================
# SUPABASE (OBRIGATÓRIO)
# ==================================================
VITE_SUPABASE_URL=https://fximylewmvsllkdczovj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk1OTI4MDAsImV4cCI6MjAwNTE2ODgwMH0.EXEMPLO

# ==================================================
# URLs DOS APPS (Escolha Local ou Produção)
# ==================================================

# Desenvolvimento Local:
VITE_GESTAO_ESCOLAR_URL=http://localhost:5174
VITE_PEI_COLLAB_URL=http://localhost:8080

# Produção (Após DNS configurado):
# VITE_GESTAO_ESCOLAR_URL=https://gestao.peicollab.com.br
# VITE_PEI_COLLAB_URL=https://pei.peicollab.com.br

# ==================================================
# OPENAI (OPCIONAL - Apenas se usar IA)
# ==================================================
# VITE_OPENAI_API_KEY=sk-proj-...

# ==================================================
# OUTROS (OPCIONAL)
# ==================================================
VITE_ENV=development
VITE_LOG_LEVEL=debug
```

---

## ✅ CONCLUSÃO

Depois de criar os arquivos `.env.local`:

1. ✅ Reinicie os servidores
2. ✅ Teste o blog (deve mostrar 3 posts)
3. ✅ Teste o login
4. ✅ Teste a navegação

**Ou teste direto em produção após DNS configurado!**

---

**Criado em**: 05/12/2025  
**Status**: 📘 GUIA PRONTO  
**Próximo**: Configurar .env.local OU testar em produção

