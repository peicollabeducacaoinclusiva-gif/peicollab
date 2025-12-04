# 🚀 Início Rápido - Monorepo PEI Collab V3

## ⚡ Configuração em 5 Minutos

### **Passo 1: Instalar Dependências**

```bash
# No root do projeto
pnpm install
```

Se não tiver o `pnpm` instalado:
```bash
npm install -g pnpm
```

---

### **Passo 2: Configurar Variáveis de Ambiente**

Cada app precisa de um `.env` com as credenciais do Supabase:

#### **apps/pei-collab/.env**:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

#### **apps/gestao-escolar/.env**:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

#### **apps/plano-aee/.env**:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

> **Nota**: Todos os apps compartilham o **mesmo banco de dados Supabase**.

---

### **Passo 3: Aplicar Migrações no Supabase**

Abra o **Supabase Dashboard** → **SQL Editor** e execute as migrações **na ordem**:

```sql
-- ✅ 1. Profissional de Apoio
supabase/migrations/20250108000001_support_professional.sql

-- ✅ 2. Sistema de Reuniões
supabase/migrations/20250108000002_meetings_system_FIXED.sql

-- ✅ 3. Avaliações do PEI
supabase/migrations/20250108000003_pei_evaluation.sql

-- ✅ 4. Plano de AEE
supabase/migrations/20250108000004_plano_aee.sql

-- ✅ 5. Blog (opcional por ora)
supabase/migrations/20250108000005_blog.sql

-- ✅ 6. Gestão Escolar
supabase/migrations/20250108000006_gestao_escolar.sql
```

**Como Executar**:
1. Copie o conteúdo do arquivo `.sql`
2. Cole no SQL Editor
3. Clique em **Run**
4. Repita para cada migração

---

### **Passo 4: Criar Dados de Teste**

Execute este SQL no Supabase Dashboard para criar dados iniciais:

```sql
-- 1. Criar uma escola
INSERT INTO schools (school_name, address, city, state, tenant_id)
SELECT 
    'Escola Teste Monorepo',
    'Rua Teste, 123',
    'São Paulo',
    'SP',
    id
FROM tenants
WHERE is_active = true
LIMIT 1;

-- 2. Criar uma turma
INSERT INTO classes (
    class_name, 
    education_level, 
    academic_year, 
    school_id, 
    tenant_id
)
SELECT 
    '1º Ano A',
    'ensino_fundamental_1'::education_level,
    '2025',
    s.id,
    s.tenant_id
FROM schools s
WHERE s.school_name = 'Escola Teste Monorepo'
LIMIT 1;

-- 3. Criar um aluno teste
INSERT INTO students (
    full_name, 
    date_of_birth, 
    special_needs,
    school_id,
    tenant_id,
    class_id
)
SELECT 
    'Maria da Silva',
    '2010-05-15',
    'Deficiência Intelectual',
    s.id,
    s.tenant_id,
    c.id
FROM schools s
JOIN classes c ON c.school_id = s.id
WHERE s.school_name = 'Escola Teste Monorepo'
LIMIT 1;

-- 4. Criar usuário Professor AEE
-- Primeiro, crie o usuário no Auth → Users (UI)
-- E-mail: professora.aee@teste.com
-- Senha: teste123

-- Depois, vincule ao role:
INSERT INTO user_roles (user_id, role)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'professora.aee@teste.com'),
    'aee_teacher'
);

-- Atualizar perfil
UPDATE profiles
SET 
    school_id = (SELECT id FROM schools WHERE school_name = 'Escola Teste Monorepo'),
    tenant_id = (SELECT tenant_id FROM schools WHERE school_name = 'Escola Teste Monorepo')
WHERE id = (SELECT id FROM auth.users WHERE email = 'professora.aee@teste.com');
```

---

### **Passo 5: Rodar os Apps**

#### **Opção A: Rodar Todos de Uma Vez**

```bash
# No root do monorepo
pnpm dev
```

Isso vai iniciar:
- **PEI Collab**: http://localhost:8080
- **Gestão Escolar**: http://localhost:5174
- **Plano de AEE**: http://localhost:5175

#### **Opção B: Rodar Individualmente**

```bash
# Terminal 1: PEI Collab
cd apps/pei-collab
pnpm dev

# Terminal 2: Gestão Escolar
cd apps/gestao-escolar
pnpm dev

# Terminal 3: Plano de AEE
cd apps/plano-aee
pnpm dev
```

---

## 🧪 Testar a Integração

### **Teste 1: Gestão Escolar → PEI Collab**

1. Acesse **Gestão Escolar** (http://localhost:5174)
2. Login com usuário admin
3. Cadastre um novo aluno
4. Acesse **PEI Collab** (http://localhost:8080)
5. Crie um PEI para o aluno cadastrado
6. ✅ **Sucesso**: O aluno aparece na lista do PEI Collab!

---

### **Teste 2: PEI → Plano de AEE**

1. Acesse **PEI Collab** (http://localhost:8080)
2. Crie um PEI para um aluno
3. Acesse **Plano de AEE** (http://localhost:5175)
4. Login com **professora.aee@teste.com**
5. Crie um Plano de AEE vinculado ao PEI
6. Volte ao **PEI Collab**
7. Gere o relatório PDF do PEI
8. ✅ **Sucesso**: O Plano de AEE aparece como anexo no PDF!

---

### **Teste 3: Dashboard do Profissional de Apoio**

1. Execute o SQL de criação do PA (veja `🎯_CRIAR_PA_AGORA.sql`)
2. Acesse **PEI Collab** (http://localhost:8080)
3. Login com **pa@escola.com** / **teste123**
4. Navegue para o Dashboard
5. ✅ **Sucesso**: Vê os alunos atribuídos e pode registrar feedbacks!

---

### **Teste 4: Sistema de Reuniões**

1. Login como **Coordenador**
2. Acesse **Reuniões** no menu
3. Crie uma nova reunião
4. Selecione PEIs e participantes
5. Preencha a pauta
6. Registre a ata após a reunião
7. ✅ **Sucesso**: Reunião criada e ata salva!

---

## 🐛 Solução de Problemas

### **Erro: "Cannot find module '@pei/ui'"**

```bash
# Rebuild das dependências
pnpm install
turbo build
```

---

### **Erro: "infinite recursion detected in policy"**

As RLS policies foram simplificadas. Se aparecer este erro:

1. Vá ao Supabase Dashboard → **SQL Editor**
2. Execute:

```sql
-- Limpar policies antigas
DROP POLICY IF EXISTS "nome_da_policy" ON tabela;

-- Recriar com a versão simplificada da migração
```

---

### **Erro: "Could not find the column in the schema cache"**

O cache do cliente Supabase está desatualizado:

1. **Solução Rápida**: Recarregue a página (F5)
2. **Solução Permanente**: Use RPC functions para bypass do cache

---

### **Aluno não aparece no PEI Collab**

Verifique:
1. O aluno foi cadastrado na **Gestão Escolar**?
2. O aluno tem `school_id` e `tenant_id` preenchidos?
3. As RLS policies estão ativas?

```sql
-- Verificar aluno
SELECT id, full_name, school_id, tenant_id 
FROM students 
WHERE full_name = 'Nome do Aluno';

-- Verificar RLS
SELECT * FROM pg_policies WHERE tablename = 'students';
```

---

## 📚 Documentação Completa

- **Guia Completo**: `📚_GUIA_COMPLETO_MONOREPO_V3.md`
- **Migrações SQL**: `supabase/migrations/`
- **Arquitetura**: Veja o diagrama no guia completo

---

## 🎉 Pronto!

Seu monorepo está configurado e rodando! 

**Próximos Passos**:
1. Explore cada app
2. Teste a integração entre eles
3. Customize conforme sua necessidade
4. Adicione novos recursos

**Boa sorte! 🚀**

