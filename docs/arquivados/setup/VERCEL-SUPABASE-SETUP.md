# 🚀 Configuração Supabase para Vercel - PEI Collab

**Data:** 30 de Outubro de 2025  
**Versão:** 2.1.1

---

## 📋 Pré-requisitos

✅ Aplicação já implantada na Vercel  
✅ Projeto Supabase criado  
✅ Acesso ao Supabase Dashboard  
✅ Acesso ao Vercel Dashboard

---

## 🎯 Passo 1: Obter Credenciais do Supabase

### 1.1. Acessar Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione seu projeto (ou crie um novo)

### 1.2. Copiar Credenciais de Produção

1. No menu lateral, clique em **Settings** (⚙️)
2. Clique em **API** (no menu Settings)
3. Anote as seguintes informações:

```
✅ Project URL
   Exemplo: https://fximylewmvsllkdczovj.supabase.co

✅ anon/public key
   Essa é a chave que vai no frontend (segura para expor)

✅ service_role key (OPCIONAL - apenas para scripts administrativos)
   ⚠️ NUNCA exponha essa chave no frontend!
```

**Exemplo das credenciais que você verá:**

```env
Project URL: https://fximylewmvsllkdczovj.supabase.co
anon/public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY0NzIsImV4cCI6MjA3NzI3MjQ3Mn0.3FqQqUfVgD3hIh1daa3R1JjouGZ4D4ONR6SmcL9Qids
```

---

## 🔧 Passo 2: Configurar Variáveis de Ambiente na Vercel

### 2.1. Acessar Configurações da Vercel

1. Acesse: https://vercel.com/dashboard
2. Clique no seu projeto **PEI Collab**
3. No menu superior, clique em **Settings**
4. No menu lateral esquerdo, clique em **Environment Variables**

### 2.2. Adicionar Variáveis de Ambiente

Adicione as seguintes variáveis **uma por uma**:

#### ✅ Variável 1: VITE_SUPABASE_URL

```
Key:   VITE_SUPABASE_URL
Value: https://fximylewmvsllkdczovj.supabase.co
       (Cole a Project URL do seu projeto)

Environment: Production, Preview, Development (marque todos)
```

#### ✅ Variável 2: VITE_SUPABASE_ANON_KEY

```
Key:   VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
       (Cole a anon/public key do seu projeto)

Environment: Production, Preview, Development (marque todos)
```

#### ✅ Variável 3: VITE_APP_URL (Opcional mas Recomendado)

```
Key:   VITE_APP_URL
Value: https://seu-app.vercel.app
       (URL pública da sua aplicação na Vercel)

Environment: Production, Preview, Development (marque todos)
```

---

## 🗄️ Passo 3: Configurar Banco de Dados

### 3.1. Aplicar Migrações

Você tem **duas opções**:

#### **Opção A: Via Supabase Dashboard (Recomendado para iniciantes)**

1. No Supabase Dashboard, clique em **SQL Editor** (no menu lateral)
2. Clique em **New Query**
3. Copie e cole o conteúdo de cada arquivo de migração em ordem:

**Ordem de execução das migrações:**

```sql
-- 1. Schema base
supabase/migrations/20250113000000_simple_schema_v2.sql

-- 2. Funções avançadas
supabase/migrations/20250113000003_advanced_maintenance_functions.sql

-- 3. Schema completo
supabase/migrations/20250113000004_schema_complete_v2.sql

-- 4. Melhorias V2.2
supabase/migrations/20250113000005_v2_2_improvements.sql

-- 5. Fix RLS Profiles
supabase/migrations/20250113000006_fix_profiles_rls.sql

-- 6. Fix RLS User Roles
supabase/migrations/20250113000007_fix_user_roles_rls.sql

-- 7. Disable RLS User Roles (se necessário)
supabase/migrations/20250113000008_disable_user_roles_rls.sql

-- 8. Disable RLS Students (se necessário)
supabase/migrations/20250113000009_disable_students_rls.sql
```

4. Para cada arquivo:
   - Clique em **Run** (ou pressione `Ctrl+Enter`)
   - Aguarde a mensagem "Success. No rows returned"
   - Avance para o próximo

#### **Opção B: Via Supabase CLI (Recomendado para desenvolvedores)**

```bash
# 1. Instalar Supabase CLI (se ainda não tem)
npm install -g supabase

# 2. Fazer login
supabase login

# 3. Link com seu projeto
supabase link --project-ref fximylewmvsllkdczovj
# (Use o project-ref do seu projeto)

# 4. Aplicar todas as migrações
supabase db push

# 5. Verificar se funcionou
supabase db diff
```

---

## 👤 Passo 4: Criar Usuários de Teste (Opcional mas Recomendado)

### 4.1. Criar Usuários no Supabase Dashboard

1. No Supabase Dashboard, clique em **Authentication** (no menu lateral)
2. Clique em **Users**
3. Clique em **Add User** → **Create new user**
4. Preencha:

```
Email: professor@exemplo.com
Password: SenhaSegura123!
Auto Confirm User: ✅ (marque essa opção!)
```

5. Repita para criar vários usuários de teste (um de cada role)

### 4.2. Atribuir Roles aos Usuários

Após criar os usuários, você precisa atribuir roles na tabela `profiles`:

1. No Supabase Dashboard, clique em **Table Editor**
2. Selecione a tabela `profiles`
3. Encontre o usuário criado
4. Edite o campo `role` e defina um dos seguintes valores:

```
- superadmin
- coordinator
- teacher
- school_manager
- aee_teacher
- specialist
- education_secretary
- school_director
- family
```

### 4.3. Criar Profile Automaticamente

Se o sistema não criou o profile automaticamente:

1. Clique em **SQL Editor**
2. Execute este SQL (substitua os IDs):

```sql
-- Pegue o user_id do usuário criado na tabela auth.users
-- Depois insira o perfil correspondente
INSERT INTO profiles (id, full_name, role, tenant_id)
VALUES (
  'USER_ID_AQUI',  -- Pegue de auth.users
  'Nome do Usuário',
  'teacher',       -- Escolha o role
  'TENANT_ID_AQUI' -- Criar um tenant ou usar existente
);

-- Depois insira o role na tabela user_roles
INSERT INTO user_roles (user_id, role)
VALUES (
  'USER_ID_AQUI',
  'teacher'
);
```

---

## 🔐 Passo 5: Configurar Row Level Security (RLS)

### 5.1. Verificar se RLS Está Ativado

As migrações já incluem as políticas RLS. Verifique se estão ativas:

1. No Supabase Dashboard, clique em **Table Editor**
2. Para cada tabela importante, verifique se há um **🔒** ao lado do nome
3. Se não houver, execute:

```sql
ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;
```

### 5.2. Políticas RLS Importantes

As seguintes políticas devem estar ativas (já incluídas nas migrações):

✅ `profiles` - Acesso baseado em tenant  
✅ `user_roles` - Acesso baseado em tenant  
✅ `students` - Acesso baseado em school/tenant  
✅ `peis` - Acesso baseado em role  
✅ `pei_comments` - Acesso baseado em role/PEI  
✅ `family_access_tokens` - Acesso baseado em tenant  

---

## 🔔 Passo 6: Configurar VAPID Keys (Opcional - Notificações Push)

### 6.1. Gerar VAPID Keys

```bash
# No seu terminal local
npm run generate:vapid
```

Isso vai gerar duas chaves:

```
Public Key:  BN8x...
Private Key: 3Qj8...
```

### 6.2. Adicionar VAPID Keys na Vercel

Volte ao **Vercel Dashboard** → **Environment Variables**:

```
Key:   VITE_VAPID_PUBLIC_KEY
Value: BN8x...

Key:   VITE_VAPID_PRIVATE_KEY
Value: 3Qj8...

Environment: Production, Preview, Development
```

### 6.3. Configurar no Supabase (Opcional)

1. No Supabase Dashboard, vá em **Authentication** → **Settings**
2. Scroll até **Push Notifications**
3. Configure as VAPID keys geradas

---

## 🚀 Passo 7: Deploy e Teste

### 7.1. Fazer Deploy na Vercel

```bash
# Na sua máquina local
git push origin main
```

A Vercel vai automaticamente:
- ✅ Detectar o push
- ✅ Rebuild com as novas variáveis de ambiente
- ✅ Fazer deploy da nova versão

### 7.2. Verificar Deployment

1. Acesse sua aplicação na Vercel
2. Abra o **Console do Navegador** (F12)
3. Verifique se não há erros relacionados ao Supabase

### 7.3. Teste de Login

1. Acesse a página de login
2. Tente fazer login com um dos usuários de teste criados
3. Verifique se consegue acessar o dashboard

---

## ✅ Checklist Final

Antes de considerar tudo pronto, verifique:

- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Migrações aplicadas no Supabase
- [ ] RLS ativado nas tabelas principais
- [ ] Pelo menos um usuário de teste criado
- [ ] Teste de login bem-sucedido
- [ ] Dashboard carrega sem erros
- [ ] Console do navegador sem erros críticos

---

## 🛠️ Troubleshooting

### Problema: "Invalid API key"

**Solução:**
1. Verifique se copiou a chave correta (anon/public, não service_role)
2. Confirme que adicionou `VITE_` no início do nome da variável
3. Faça um novo deploy na Vercel

### Problema: "Row Level Security blocks access"

**Solução:**
1. No Supabase Dashboard → Authentication → Policies
2. Verifique se as políticas estão criadas
3. Execute novamente as migrações de RLS

### Problema: "User profile not found"

**Solução:**
1. Crie o profile manualmente na tabela `profiles`
2. Assigne o role na tabela `user_roles`
3. Verifique se `tenant_id` está correto

### Problema: "Connection refused" ou "Network error"

**Solução:**
1. Verifique se o Supabase está online
2. Confirme que a URL está correta
3. Verifique firewall/proxy (se aplicável)

---

## 📞 Suporte

### Recursos Úteis

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Logs do Supabase:** Dashboard → Logs
- **Logs da Vercel:** Dashboard → Deployment → Functions Logs

### Contatos

- **GitHub Issues:** Reporte bugs e problemas
- **Supabase Support:** https://supabase.com/support
- **Vercel Support:** https://vercel.com/support

---

## 🎉 Próximos Passos

Após concluir a configuração:

1. ✅ **Teste todas as funcionalidades** com diferentes roles
2. ✅ **Configure backup automático** do banco de dados
3. ✅ **Configure monitoramento** (logs, alertas, métricas)
4. ✅ **Documente processos** para sua equipe
5. ✅ **Configure CI/CD** para deploys automáticos

---

**🎊 Parabéns! Seu PEI Collab está configurado e pronto para produção!**

