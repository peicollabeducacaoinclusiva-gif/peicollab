# 👥 Usuários de Teste - PEI Collab Demo

**Atualizado em:** 04/11/2024  
**Ambiente:** Desenvolvimento/Demo  
**Status:** ✅ Disponível para testes

---

## 📋 Tipos de Usuários do Sistema

O PEI Collab possui **8 tipos diferentes de usuários**, cada um com permissões e funcionalidades específicas:

| # | Role | Nome Exibido | Nível de Acesso |
|---|------|--------------|-----------------|
| 1 | `superadmin` | Super Administrador | 🔴 Sistema Completo |
| 2 | `education_secretary` | Secretário de Educação | 🟠 Rede de Ensino |
| 3 | `school_director` | Diretor Escolar | 🟡 Escola |
| 4 | `coordinator` | Coordenador Pedagógico | 🟡 Escola |
| 5 | `teacher` | Professor | 🟢 Alunos Atribuídos |
| 6 | `aee_teacher` | Professor AEE | 🟢 Alunos Atribuídos |
| 7 | `specialist` | Especialista | 🔵 Consulta |
| 8 | `family` | Família | 🔵 Próprio Filho |

---

## 🌐 REDES DE ENSINO DEMO

### 🏛️ 1. São Gonçalo dos Campos (SGC)
**Tenant ID:** `62d992ab-ef6b-4d13-b9c9-6cdfdcb59451`

#### 👨‍💼 Secretário de Educação
```
📧 Email:    admin@sgc.edu.br
🔑 Senha:    SGC@123456
👤 Nome:     Administrador SGC
🎭 Role:     education_secretary
🔒 Acesso:   Toda a rede SGC
```

#### 🎯 Coordenador Pedagógico
```
📧 Email:    coord@sgc.edu.br
🔑 Senha:    SGC@123456
👤 Nome:     Coordenador SGC
🎭 Role:     coordinator
🔒 Acesso:   Escola vinculada
```

---

### 🏛️ 2. Santanópolis (SAN)
**Tenant ID:** `08f6772d-97ae-43bf-949d-bed4c6c038de`

#### 👨‍💼 Secretário de Educação
```
📧 Email:    admin@sant.edu.br
🔑 Senha:    SAN@123456
👤 Nome:     Administrador SAN
🎭 Role:     education_secretary
🔒 Acesso:   Toda a rede SAN
```

#### 🎯 Coordenador Pedagógico
```
📧 Email:    coord@sant.edu.br
🔑 Senha:    SAN@123456
👤 Nome:     Coordenador SAN
🎭 Role:     coordinator
🔒 Acesso:   Escola vinculada
```

---

### 🏛️ 3. Santa Bárbara (SBA)
**Tenant ID:** `77d9af39-0f4d-4702-9692-62277e13e42e`

#### 👨‍💼 Secretário de Educação
```
📧 Email:    admin@sba.edu.br
🔑 Senha:    SBA@123456
👤 Nome:     Administrador SBA
🎭 Role:     education_secretary
🔒 Acesso:   Toda a rede SBA
```

#### 🎯 Coordenador Pedagógico
```
📧 Email:    coord@sba.edu.br
🔑 Senha:    SBA@123456
👤 Nome:     Coordenador SBA
🎭 Role:     coordinator
🔒 Acesso:   Escola vinculada
```

---

## 🧪 USUÁRIOS DE TESTE GENÉRICOS

### 🔴 Super Administrador
```
📧 Email:    admin@teste.com
🔑 Senha:    Teste123
👤 Nome:     Administrador Sistema
🎭 Role:     superadmin
🔒 Acesso:   TODOS os dados do sistema
```

### 🟠 Secretário de Educação (Teste)
```
📧 Email:    secretario@teste.com
🔑 Senha:    Teste123
👤 Nome:     Secretário de Educação
🎭 Role:     education_secretary
🔒 Acesso:   Tenant de teste
```

### 🟡 Diretor Escolar
```
📧 Email:    diretor@teste.com
🔑 Senha:    Teste123
👤 Nome:     Diretor da Escola
🎭 Role:     school_director
🔒 Acesso:   Escola de teste
```

### 🟢 Professor
```
📧 Email:    professor@teste.com
🔑 Senha:    Teste123
👤 Nome:     Professor da Escola
🎭 Role:     teacher
🔒 Acesso:   Alunos atribuídos
```

---

## 🎓 USUÁRIOS ESPECÍFICOS (Se criados)

### Coordenadora Fernanda
```
📧 Email:    coord.fernanda@escola.com
🔑 Senha:    Teste123!
🎭 Role:     coordinator
```

### Gestor Carlos
```
📧 Email:    carlos.gestor@escola.com
🔑 Senha:    123456
🎭 Role:     school_director
```

### Coordenadora Maria
```
📧 Email:    maria.coordenadora@escola.com
🔑 Senha:    123456
🎭 Role:     coordinator
```

---

## 🎯 MATRIZ DE PERMISSÕES POR TIPO DE USUÁRIO

| Funcionalidade | Superadmin | Secretary | Director | Coordinator | Teacher | Family |
|----------------|------------|-----------|----------|-------------|---------|--------|
| **Ver todos PEIs** | ✅ | ✅ Rede | ✅ Escola | ✅ Escola | ❌ | ❌ |
| **Criar PEI** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Aprovar PEI** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Gerenciar Escolas** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Gerenciar Usuários** | ✅ | ✅ Rede | ✅ Escola | ⚠️ Limitado | ❌ | ❌ |
| **Gerenciar Turmas** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Ver Alunos** | ✅ Todos | ✅ Rede | ✅ Escola | ✅ Escola | ✅ Atribuídos | ✅ Filho |
| **Upload Logo Rede** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Relatórios Rede** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Relatórios Escola** | ✅ | ✅ | ✅ | ✅ | ⚠️ Limitado | ❌ |
| **Gerar Token Família** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 🧪 COMO TESTAR

### 1. Testar Login
```bash
# Iniciar servidor
npm run dev

# Acessar
http://localhost:8080/auth
```

### 2. Testar como Secretário de Educação
```
1. Acesse http://localhost:8080/auth
2. Login com: admin@sgc.edu.br / SGC@123456
3. Você verá:
   - Dashboard executivo
   - Todas as escolas da rede SGC
   - Estatísticas consolidadas
   - Opção de upload de logo
   - Gerenciamento de professores
```

### 3. Testar como Coordenador
```
1. Acesse http://localhost:8080/auth
2. Login com: coord@sgc.edu.br / SGC@123456
3. Você verá:
   - Dashboard gerencial
   - Fila de validação de PEIs
   - Alunos da sua escola
   - Opção de solicitar PEIs
   - Gerenciamento de turmas
```

### 4. Testar como Professor
```
1. Acesse http://localhost:8080/auth
2. Login com: professor@teste.com / Teste123
3. Você verá:
   - Meus alunos (apenas atribuídos)
   - Meus PEIs
   - Criar novo PEI
   - Estatísticas pessoais
```

---

## 🔐 SEGURANÇA

### ⚠️ IMPORTANTE - Senhas de Teste

Estas são **senhas de desenvolvimento/teste**. Nunca use em produção!

**Senhas encontradas:**
- `SGC@123456` - Rede São Gonçalo
- `SAN@123456` - Rede Santanópolis
- `SBA@123456` - Rede Santa Bárbara
- `Teste123` - Usuários de teste genéricos
- `Teste123!` - Variação
- `123456` - Usuários antigos (INSEGURO!)

### 🔒 Para Produção

1. ❌ **NUNCA** use estas senhas
2. ✅ Gere senhas aleatórias fortes
3. ✅ Implemente rotação de senhas
4. ✅ Use 2FA para administradores
5. ✅ Monitore tentativas de login

---

## 🔄 Como Criar Novos Usuários de Teste

### Via Script (Recomendado)
```bash
node scripts/verify-and-create-users.js
```

### Via Supabase Dashboard
```
1. Acesse https://app.supabase.com
2. Vá para Authentication > Users
3. Clique em "Add User"
4. Preencha email/senha
5. Adicione metadata: full_name, tenant_id
6. Crie entrada em profiles
7. Crie entrada em user_roles
```

### Via SQL
```sql
-- 1. Criar no auth.users
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('novo@email.com', crypt('senha123', gen_salt('bf')), NOW());

-- 2. Criar profile
INSERT INTO profiles (id, full_name, tenant_id, school_id, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'novo@email.com'),
  'Nome Completo',
  'tenant-id',
  'school-id',
  true
);

-- 3. Criar role
INSERT INTO user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'novo@email.com'),
  'coordinator'
);
```

---

## 📊 DADOS DE TESTE

### Escolas Disponíveis
- **Escola Municipal João da Silva**
  - ID: `00000000-0000-0000-0000-000000000002`
  - Tenant: Demo

### Alunos de Teste
Verifique com:
```sql
SELECT id, name, school_id FROM students LIMIT 10;
```

### PEIs de Teste
Verifique com:
```sql
SELECT id, student_id, status, assigned_teacher_id 
FROM peis 
WHERE is_active_version = true;
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Usuário não encontrado"
```bash
# Verificar se usuário existe
node scripts/check-test-users.js
```

### Erro: "Conta inativa"
```sql
-- Ativar usuário
UPDATE profiles 
SET is_active = true 
WHERE id = 'user-id';
```

### Erro: "Escola não vinculada"
```sql
-- Vincular escola
UPDATE profiles 
SET school_id = 'school-id' 
WHERE id = 'user-id';
```

### Erro: "Role não encontrada"
```sql
-- Adicionar role
INSERT INTO user_roles (user_id, role)
VALUES ('user-id', 'coordinator')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
```

---

## 📞 SUPORTE

**Documentação Completa:**
- `DOCUMENTACAO_ATUALIZADA_PEI_COLLAB.md`
- `Projeto/Fluxos de Usuário por Perfil.md`

**Scripts Úteis:**
- `scripts/verify-and-create-users.js` - Criar usuários
- `scripts/check-test-users.js` - Verificar usuários
- `scripts/populate-user-roles.js` - Popular roles

---

**Última Atualização:** 04/11/2024  
**Total de Usuários Demo:** 9 usuários em 3 redes  
**Status:** ✅ Pronto para testes

