# 🔑 Credenciais de Teste - PEI Collab

## 📋 Usuários Padrão de Teste

### 🔴 Usuários Criados pela Edge Function `create-test-users`

Estes usuários são criados quando você usa o botão "Criar Usuários de Teste" no dashboard ou chama a Edge Function diretamente:

| Role | Email | Senha | Observações |
|------|-------|-------|-------------|
| **Superadmin** | `superadmin@teste.com` | `Teste123!` | Acesso total ao sistema |
| **Coordenador** | `coordenador@teste.com` | `Teste123!` | Gerencia PEIs e professores |
| **Professor** | `professor@teste.com` | `Teste123!` | Acesso básico ao sistema |
| **Professor AEE** | `aee@teste.com` | `Teste123!` | Especialista em AEE |
| **Gestor Escolar** | `gestor@teste.com` | `Teste123!` | Gerencia escola |
| **Especialista** | `especialista@teste.com` | `Teste123!` | Profissional especializado |
| **Família** | `familia@teste.com` | `Teste123!` | Acesso familiar aos PEIs |

### 🔵 Usuários Criados por Scripts

#### Script: `scripts/create-test-users-fixed.js`

| Role | Email | Senha | Observações |
|------|-------|-------|-------------|
| **Superadmin** | `admin@teste.com` | `Admin123!@#` | Administrador global |
| **Secretário Educação** | `admin@sgc.edu.br` | `SGC@123456` | Rede SGC |
| **Coordenador** | `coord@sgc.edu.br` | `SGC@123456` | Coordenador SGC |
| **Professor** | `professor@sgc.edu.br` | `SGC@123456` | Professor SGC |

#### Script: `create_test_users.js`

| Role | Email | Senha | Observações |
|------|-------|-------|-------------|
| **Superadmin** | `superadmin@example.com` | `validpassword` | Usuário de exemplo |
| **Secretário Educação** | `education_secretary@example.com` | `validpassword` | Usuário de exemplo |
| **Diretor Escolar** | `school_director@example.com` | `validpassword` | Usuário de exemplo |
| **Coordenador** | `coordinator@example.com` | `validpassword` | Usuário de exemplo |
| **Gestor Escolar** | `school_manager@example.com` | `validpassword` | Usuário de exemplo |
| **Professor AEE** | `aee_teacher@example.com` | `validpassword` | Usuário de exemplo |
| **Professor** | `teacher@example.com` | `validpassword` | Usuário de exemplo |
| **Família** | `family@example.com` | `validpassword` | Usuário de exemplo |
| **Especialista** | `specialist@example.com` | `validpassword` | Usuário de exemplo |

### 🟢 Usuários Criados por Migração SQL

#### Migração: `supabase/migrations/20250113000001_create_test_users.sql`

| Role | Email | Senha | ID UUID |
|------|-------|-------|---------|
| **Superadmin** | `superadmin@teste.com` | `Teste123!` | `11111111-1111-1111-1111-111111111111` |
| **Coordenador** | `coordenador@teste.com` | `Teste123!` | `22222222-2222-2222-2222-222222222222` |
| **Professor** | `professor@teste.com` | `Teste123!` | `33333333-3333-3333-3333-333333333333` |

### 🟡 Usuários Especiais (Coordenadores/Redes)

#### Senha Padrão para Coordenadores: `PeiCollab@2025`

Criados via scripts de importação CSV ou SQL:
- Email varia (geralmente baseado no nome do coordenador)
- Senha padrão: `PeiCollab@2025`

Exemplos:
- `erotildesrosa33@gmail.com` → Senha: `PeiCollab@2025`
- `jaquelinnesouzasilva27@gmail.com` → Senha: `PeiCollab@2025`
- `vi_garcia19@hotmail.com` → Senha: `PeiCollab@2025`

### 🟣 Usuários de Teste Manual

| Role | Email | Senha | Observações |
|------|-------|-------|-------------|
| **Superadmin** | `superadmin@teste.com` | `Teste123!` | Para testes de SSO |
| **Teste** | `teste@teste.com` | `Teste123!` | Usuário genérico |

## 🚀 Como Criar Usuários de Teste

### Opção 1: Via Dashboard (Recomendado)

1. Faça login como superadmin
2. Acesse o Dashboard
3. Use o botão **"Criar Usuários de Teste"** no componente `TestDataManager`
4. Os usuários padrão serão criados automaticamente

### Opção 2: Via Edge Function

```bash
# Chamar Edge Function diretamente
curl -X POST https://seu-projeto.supabase.co/functions/v1/create-test-users \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json"
```

### Opção 3: Via Script

```bash
# Executar script de criação
node scripts/create-test-users-fixed.js
```

### Opção 4: Via SQL (Supabase Dashboard)

Execute a migração:
```sql
-- Arquivo: supabase/migrations/20250113000001_create_test_users.sql
```

## 🔐 Senhas Padrão Mais Comuns

1. **`Teste123!`** - Usuários padrão de teste
2. **`PeiCollab@2025`** - Coordenadores e usuários importados
3. **`SGC@123456`** / **`SAN@123456`** / **`SBA@123456`** - Usuários das redes específicas
4. **`Admin123!@#`** - Superadmin alternativo
5. **`validpassword`** - Usuários de exemplo
6. **`123456`** - Alguns scripts antigos

## ⚠️ Observações Importantes

1. **Primeira Senha**: Alguns usuários criados recebem email de recuperação de senha
   - Nesses casos, a senha inicial é gerada pelo sistema
   - O usuário deve definir a senha no primeiro acesso

2. **Alteração de Senha**: É recomendado alterar senhas de teste em produção

3. **Validação de Senha**: Todas as senhas devem atender aos requisitos:
   - Mínimo 8 caracteres
   - Pelo menos uma letra maiúscula
   - Pelo menos uma letra minúscula
   - Pelo menos um número

## 📱 Testando SSO entre Apps

Para testar o SSO end-to-end, recomenda-se usar:

**Email:** `superadmin@teste.com`  
**Senha:** `Teste123!`

Este usuário tem acesso a todos os apps e permite testar a navegação completa via AppSwitcher.

## 🎯 Credenciais Recomendadas para Testes SSO

| Usuário | Email | Senha | Apps Disponíveis |
|---------|-------|-------|------------------|
| **Superadmin** | `superadmin@teste.com` | `Teste123!` | Todos os apps |
| **Secretário Educação** | `admin@sgc.edu.br` | `SGC@123456` | PEI Collab, Gestão Escolar, Blog, Transporte, Merenda |
| **Coordenador** | `coordenador@teste.com` | `Teste123!` | PEI Collab, Gestão Escolar, Plano AEE, Planejamento |
| **Professor** | `professor@teste.com` | `Teste123!` | PEI Collab, Planejamento, Atividades |
| **Família** | `familia@teste.com` | `Teste123!` | PEI Collab, Portal do Responsável |

## 🔍 Verificar Usuários Existentes

### Via SQL (Supabase Dashboard)

```sql
-- Ver todos os usuários
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.is_active
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
ORDER BY u.created_at DESC;
```

### Via Script

```bash
node scripts/check-test-users.js
```

## 📞 Suporte

Se precisar criar novos usuários de teste:
- **Dashboard**: Use o componente `TestDataManager`
- **Scripts**: Execute `scripts/create-test-users-fixed.js`
- **SQL**: Use as migrações em `supabase/migrations/`

---

**Última atualização:** Janeiro 2025

