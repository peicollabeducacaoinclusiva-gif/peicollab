# 🔐 Autenticação e Segurança

Documentação sobre autenticação, roles, permissões e RLS.

---

## 🔑 Autenticação

### Supabase Auth

O projeto usa **Supabase Auth** para autenticação:

- **Email/Senha**: Login tradicional
- **SSO** (futuro): Single Sign-On
- **Sessões**: Gerenciadas pelo Supabase

### Hooks de Autenticação

```typescript
import { useAuth } from '@pei-collab/auth';

function MyComponent() {
  const { user, loading, signOut } = useAuth();
  
  if (loading) return <Loading />;
  if (!user) return <LoginForm />;
  
  return <Dashboard />;
}
```

---

## 👥 Roles e Permissões

### Hierarquia de Roles

```
superadmin (acesso total)
  ↓
education_secretary (rede de ensino)
  ↓
coordinator (coordenador)
  ↓
school_manager (diretor)
  ↓
aee_teacher (professor AEE)
teacher (professor)
  ↓
family (família)
specialist (especialista)
support_professional (PA)
```

### Verificar Roles

```typescript
import { usePermissions } from '@pei-collab/auth';

function MyComponent() {
  const { hasRole, hasAnyRole } = usePermissions();
  
  // Verificar role específica
  if (hasRole('teacher')) {
    // Apenas professores
  }
  
  // Verificar múltiplas roles
  if (hasAnyRole(['teacher', 'aee_teacher'])) {
    // Professores ou professores AEE
  }
}
```

### Tabela `user_roles`

Usuários podem ter **múltiplos roles**:

```sql
-- Um usuário pode ser professor E coordenador
INSERT INTO user_roles (user_id, role) VALUES
  ('user-id', 'teacher'),
  ('user-id', 'coordinator');
```

---

## 🛡️ Row Level Security (RLS)

### O Que É RLS?

**Row Level Security** é uma feature do PostgreSQL que permite controlar acesso a nível de linha. Cada usuário só vê os dados que tem permissão.

### Políticas RLS

#### Exemplo: Alunos

```sql
-- Usuários veem apenas alunos da sua escola
CREATE POLICY "Users can view students from their school" 
ON "public"."students"
FOR SELECT
USING (
  school_id IN (
    SELECT school_id FROM "public"."user_schools" 
    WHERE user_id = auth.uid()
  )
);
```

#### Exemplo: PEIs

```sql
-- Professores veem apenas PEIs dos seus alunos
CREATE POLICY "Teachers can view their students' PEIs" 
ON "public"."peis"
FOR SELECT
USING (
  assigned_teacher_id = auth.uid()
  OR student_id IN (
    SELECT id FROM "public"."students"
    WHERE school_id IN (
      SELECT school_id FROM "public"."user_schools" 
      WHERE user_id = auth.uid()
    )
  )
);
```

### Regras Importantes

1. **RLS sempre habilitado** em tabelas sensíveis
2. **Nunca desabilitar RLS** em produção
3. **Testar políticas** antes de fazer deploy

---

## 🔒 Funções RPC de Segurança

### `user_can_access_pei`

Verifica se usuário pode acessar um PEI:

```typescript
const { data } = await supabase.rpc('user_can_access_pei', {
  pei_id: peiId,
  user_id: userId
});

if (data) {
  // Usuário tem acesso
}
```

**⚠️ Sempre use esta função** antes de acessar dados de PEI.

### `has_role`

Verifica se usuário tem uma role:

```typescript
const { data } = await supabase.rpc('has_role', {
  user_id: userId,
  role_name: 'teacher'
});
```

### `create_pei_version`

Cria nova versão de PEI respeitando máquina de estados:

```typescript
const { data } = await supabase.rpc('create_pei_version', {
  pei_id: peiId,
  new_data: peiData
});
```

---

## 🚫 Regras de Segurança

### ❌ NUNCA Fazer

1. **SELECT direto** em `students` ou `peis` sem usar RPC
2. **Desabilitar RLS** em produção
3. **Expor dados sensíveis** no frontend
4. **Confiar apenas no frontend** para segurança
5. **UPDATE em PEIs approved** (respeitar máquina de estados)

### ✅ SEMPRE Fazer

1. **Usar funções RPC** para acessos complexos
2. **Validar no backend** (RLS + RPC)
3. **Verificar permissões** antes de ações sensíveis
4. **Testar políticas RLS** localmente
5. **Respeitar máquina de estados** do PEI

---

## 🔍 Debugging RLS

### Verificar Políticas

```sql
-- Listar todas as políticas de uma tabela
SELECT * FROM pg_policies 
WHERE tablename = 'students';
```

### Testar Acesso

```sql
-- Executar como usuário específico
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-id';
SELECT * FROM students;
```

### Logs

Ver logs do Supabase Dashboard → Logs → Postgres Logs

---

## 📚 Recursos

- **[Banco de Dados](./05_BANCO_DADOS.md)**
- **[Padrões de Código](./04_PADROES_CODIGO.md)**
- **[Documentação RLS do Supabase](https://supabase.com/docs/guides/auth/row-level-security)**

---

**Última atualização**: Janeiro 2025

