# 🔐 Aplicar Novo SuperAdmin - Passo a Passo

## 🎯 Objetivo

Remover o SuperAdmin de teste (`superadmin@teste.com`) e criar um SuperAdmin real com o email `peicollabeducacaoinclusiva@gmail.com`.

## 📋 O que Será Feito

### ❌ Remover:
- Email: `superadmin@teste.com`
- UUID: `11111111-1111-1111-1111-111111111111`

### ✅ Criar:
- Email: `peicollabeducacaoinclusiva@gmail.com`
- Nome: PEI Collab - Educação Inclusiva
- Senha padrão: `Inclusao2025!`
- UUID: `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`
- Role: `superadmin`
- Acesso: **TODOS os tenants**

---

## 🚀 Como Aplicar

### Opção 1: Supabase Dashboard (Recomendado)

1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Cole o conteúdo do arquivo:
   ```
   supabase/migrations/20251111_replace_superadmin.sql
   ```
6. Clique em **Run** (Ctrl+Enter)
7. Verifique as mensagens de sucesso no console

### Opção 2: Supabase CLI

```bash
# Na raiz do projeto
cd supabase

# Aplicar a migration
supabase db push

# OU aplicar diretamente
supabase db execute -f migrations/20251111_replace_superadmin.sql
```

### Opção 3: psql (Linha de Comando)

```bash
psql "postgresql://postgres:[SUA-SENHA]@[SEU-PROJETO].supabase.co:5432/postgres" < supabase/migrations/20251111_replace_superadmin.sql
```

---

## ✅ Verificação

Após aplicar a migration, verifique se funcionou:

### Query de Verificação:

```sql
-- Ver o novo superadmin
SELECT 
  p.id,
  p.email,
  p.full_name,
  ur.role,
  p.is_active,
  p.created_at
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'superadmin';
```

### Resultado Esperado:

| email | full_name | role | is_active |
|-------|-----------|------|-----------|
| peicollabeducacaoinclusiva@gmail.com | PEI Collab - Educação Inclusiva | superadmin | true |

---

## 🔑 Novas Credenciais do SuperAdmin

### Login:
- **Email:** `peicollabeducacaoinclusiva@gmail.com`
- **Senha:** `Inclusao2025!`

### ⚠️ IMPORTANTE - Segurança:

1. **Altere a senha imediatamente** após o primeiro login
2. **Configure autenticação de 2 fatores** (se disponível)
3. **Não compartilhe** essas credenciais
4. **Use senha forte** com pelo menos:
   - 12+ caracteres
   - Letras maiúsculas e minúsculas
   - Números
   - Símbolos especiais

### Como Alterar a Senha:

#### Via SQL (Supabase Dashboard):
```sql
UPDATE auth.users
SET encrypted_password = crypt('SuaNovaSenhaForte123!@#', gen_salt('bf'))
WHERE email = 'peicollabeducacaoinclusiva@gmail.com';
```

#### Via Interface (Recomendado):
1. Faça login no PEI Collab
2. Vá em Perfil
3. Clique em "Alterar Senha"
4. Digite a senha atual e a nova senha

---

## 🧪 Testar o Novo SuperAdmin

### 1. Fazer Login no Gestão Escolar

```
http://localhost:5174/login
```

**Credenciais:**
- Email: `peicollabeducacaoinclusiva@gmail.com`
- Senha: `Inclusao2025!`

### 2. Verificar Acesso Total

Após login, você deve ter acesso a:
- ✅ Todos os alunos de todos os tenants
- ✅ Todos os usuários
- ✅ Todas as escolas
- ✅ Todos os PEIs
- ✅ Todos os dados do sistema

### 3. Testar Funcionalidades

- Acesse `/students` - Deve ver todos os alunos
- Acesse `/users` - Deve ver todos os usuários
- Acesse `/classes` - Deve ver todas as turmas
- Dashboard - Deve ver estatísticas globais

---

## 📊 Permissões do SuperAdmin

### Visualização (SELECT):
- ✅ Todos os tenants
- ✅ Todas as escolas
- ✅ Todos os alunos
- ✅ Todos os usuários (profiles)
- ✅ Todos os PEIs
- ✅ Todos os profissionais
- ✅ Todas as turmas
- ✅ Todas as disciplinas

### Gerenciamento (INSERT/UPDATE/DELETE):
- ✅ Pode criar/editar/deletar tenants
- ✅ Pode criar/editar/deletar escolas
- ✅ Pode criar/editar/deletar alunos
- ✅ Pode criar/editar/deletar usuários
- ✅ Pode gerenciar roles de qualquer usuário
- ✅ Pode aprovar/reprovar qualquer PEI

### Acesso Especial:
- ✅ Bypass de RLS em todas as tabelas
- ✅ Acesso a funções administrativas
- ✅ Acesso a logs de auditoria
- ✅ Acesso a configurações do sistema

---

## 🔒 Políticas RLS para SuperAdmin

A migration garante que o SuperAdmin tenha acesso total:

### Students:
```sql
CREATE POLICY "superadmin_view_all_students" ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

CREATE POLICY "superadmin_manage_all_students" ON public.students
  FOR ALL USING (...);
```

### Profiles:
```sql
CREATE POLICY "superadmin_see_all_profiles" ON public.profiles
  FOR SELECT USING (...);
```

---

## 📝 Checklist de Aplicação

- [ ] 1. Fazer backup do banco (recomendado)
- [ ] 2. Aplicar a migration via Supabase Dashboard ou CLI
- [ ] 3. Verificar mensagens de sucesso
- [ ] 4. Executar query de verificação
- [ ] 5. Confirmar que novo superadmin existe
- [ ] 6. Confirmar que superadmin antigo foi removido
- [ ] 7. Fazer login com novo email
- [ ] 8. Testar acesso total aos dados
- [ ] 9. **ALTERAR A SENHA PADRÃO**
- [ ] 10. Documentar nova senha em local seguro

---

## ⚠️ Avisos Importantes

### 1. Senha Padrão
A senha padrão é `Inclusao2025!` - **ALTERE IMEDIATAMENTE** após primeiro login!

### 2. Backup
Antes de aplicar, faça backup:
```bash
# Via Supabase CLI
supabase db dump > backup-antes-superadmin-$(date +%Y%m%d).sql
```

### 3. Rollback (se necessário)
Se algo der errado, você pode reverter:
```sql
-- Restaurar o superadmin antigo
-- (copie o script de criação do antigo)
```

### 4. Email de Confirmação
O email será marcado como confirmado automaticamente (`email_confirmed_at = now()`).

---

## 🎯 Resultado Esperado

Após aplicar a migration:

### ❌ NÃO funciona mais:
- Email: `superadmin@teste.com`
- Senha: `Teste123!`

### ✅ FUNCIONA:
- Email: `peicollabeducacaoinclusiva@gmail.com`
- Senha: `Inclusao2025!` (padrão)

### SuperAdmin tem:
- ✅ Acesso total a todos os dados
- ✅ Permissão para gerenciar tudo
- ✅ Bypass de todas as restrições RLS
- ✅ Acesso a todas as funcionalidades admin

---

## 📞 Suporte

**Se houver problemas:**

1. Verifique os logs no SQL Editor do Supabase
2. Execute a query de verificação
3. Verifique se o email foi criado em `auth.users`
4. Verifique se o role foi adicionado em `user_roles`

**Para resetar senha:**
```sql
UPDATE auth.users
SET encrypted_password = crypt('NovaSenha123!', gen_salt('bf'))
WHERE email = 'peicollabeducacaoinclusiva@gmail.com';
```

---

**🎉 Pronto! Seu novo SuperAdmin está configurado e pronto para uso!** 👑

