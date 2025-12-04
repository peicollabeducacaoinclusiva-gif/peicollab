# ⚡ Instruções de Correção Urgente - PEI Collab

**ATENÇÃO:** Siga estas instruções na ordem exata para corrigir as vulnerabilidades críticas.

---

## 🔴 PASSO 1: VERIFICAR ESTADO ATUAL (5 minutos)

### 1.1 Acessar Supabase SQL Editor

1. Acesse https://app.supabase.com
2. Selecione o projeto PEI Collab
3. Navegue para SQL Editor

### 1.2 Executar Queries de Diagnóstico

```sql
-- Query 1: Verificar RLS Status
SELECT 
  tablename,
  rowsecurity as "RLS Ativo"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('students', 'user_roles', 'peis', 'profiles', 'schools', 'tenants')
ORDER BY tablename;

-- Resultado esperado: rowsecurity = true para TODAS as tabelas
-- 🚨 Se alguma tabela mostrar false, RLS está DESABILITADO!
```

```sql
-- Query 2: Listar Políticas Ativas
SELECT 
  tablename,
  policyname,
  cmd as "Operação",
  qual as "Condição"
FROM pg_policies
WHERE tablename IN ('students', 'user_roles', 'peis', 'profiles')
ORDER BY tablename, policyname;

-- 🚨 Se ver políticas com nome "Allow all operations", VULNERABILIDADE ATIVA!
```

```sql
-- Query 3: Verificar Versão das Migrações
SELECT 
  version,
  name,
  executed_at
FROM supabase_migrations.schema_migrations
ORDER BY executed_at DESC
LIMIT 10;

-- Procure por: 20250203000001_fix_critical_rls_security
-- 🚨 Se NÃO estiver na lista, correção NÃO foi aplicada!
```

---

## 🔧 PASSO 2: APLICAR CORREÇÕES (15 minutos)

### Cenário A: RLS Desabilitado

Se Query 1 mostrou `rowsecurity = false`:

```sql
-- REABILITAR RLS IMEDIATAMENTE
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### Cenário B: Políticas Permissivas Ativas

Se Query 2 mostrou "Allow all operations":

```sql
-- REMOVER POLÍTICAS PERIGOSAS
DROP POLICY IF EXISTS "Allow all operations on students" ON public.students;
DROP POLICY IF EXISTS "Allow all operations on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow all operations on peis" ON public.peis;
DROP POLICY IF EXISTS "Allow all operations on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all operations on schools" ON public.schools;
DROP POLICY IF EXISTS "Allow all operations on tenants" ON public.tenants;
```

### Cenário C: Aplicar Migração de Correção

**IMPORTANTE:** Faça backup antes!

```sql
-- Backup das políticas atuais
CREATE TABLE backup_policies_20241104 AS
SELECT * FROM pg_policies 
WHERE tablename IN ('students', 'user_roles', 'peis', 'profiles');
```

Então aplique a migração:

1. Abra o arquivo: `supabase/migrations/20250203000001_fix_critical_rls_security.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Execute

---

## ✅ PASSO 3: TESTAR CORREÇÕES (10 minutos)

### 3.1 Verificar RLS Novamente

Execute a Query 1 novamente. Todas as tabelas devem ter `rowsecurity = true`.

### 3.2 Verificar Novas Políticas

```sql
-- Deve retornar políticas restritivas
SELECT 
  tablename,
  policyname,
  roles
FROM pg_policies
WHERE tablename = 'students';

-- Deve ver políticas como:
-- - teachers_view_assigned_students
-- - coordinators_view_school_students
-- Etc.
```

### 3.3 Testar Acesso de Professor

```sql
-- Definir contexto como um professor específico
SET request.jwt.claim.sub = '[ID_DO_PROFESSOR_TESTE]';

-- Tentar acessar alunos
SELECT * FROM students;

-- Deve retornar APENAS alunos atribuídos ao professor
-- 🚨 Se retornar TODOS os alunos, correção FALHOU!
```

---

## 🛡️ PASSO 4: CORRIGIR FORMULÁRIO DE LOGIN (20 minutos)

### 4.1 Localizar o Arquivo

Abra: `src/pages/Auth.tsx`

### 4.2 Aplicar Correção

Encontre as linhas onde `email` e `password` são definidos (aproximadamente linha 26-27):

**ANTES:**
```typescript
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
```

**DEPOIS (não mude nada aqui, está correto)**

Encontre o formulário (aproximadamente linha 217+):

**ANTES:**
```tsx
<Input
  type="email"
  id="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  // ...
/>
```

**VERIFICAR:** Certifique-se de que o `onChange` está presente e correto.

### 4.3 Garantir Submit Correto

No `handleAuth` (linha 72+), verifique:

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,  // ← Deve estar usando a variável de estado
  password, // ← Deve estar usando a variável de estado
});
```

### 4.4 Testar Login

1. Execute `npm run dev` (se não estiver rodando)
2. Acesse http://localhost:8080/auth
3. Tente fazer login com: `coord@sgc.edu.br` / `SGC@123456`
4. ✅ Deve redirecionar para dashboard
5. ❌ Se retornar "missing email or phone", problema persiste

---

## 📊 PASSO 5: AUDITORIA DE SEGURANÇA (30 minutos)

### 5.1 Verificar Logs de Acesso

```sql
-- Verificar acessos recentes suspeitos
SELECT 
  created_at,
  user_id,
  action,
  table_name
FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '7 days'
  AND action IN ('UPDATE', 'DELETE', 'INSERT')
  AND table_name IN ('user_roles', 'students', 'peis')
ORDER BY created_at DESC
LIMIT 100;
```

### 5.2 Verificar Alterações em user_roles

```sql
-- Verificar se algum usuário modificou seu próprio role
SELECT 
  ur.user_id,
  p.full_name,
  p.email,
  ur.role,
  ur.created_at
FROM user_roles ur
JOIN profiles p ON p.id = ur.user_id
WHERE ur.created_at > NOW() - INTERVAL '30 days'
ORDER BY ur.created_at DESC;

-- 🚨 Investigar qualquer role 'superadmin' criado recentemente
```

### 5.3 Verificar Acessos Anômalos a Alunos

```sql
-- Professores que acessaram muitos alunos (potencial exploração)
SELECT 
  user_id,
  COUNT(DISTINCT student_id) as total_alunos_acessados
FROM student_access
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id
HAVING COUNT(DISTINCT student_id) > 50
ORDER BY total_alunos_acessados DESC;

-- Investigar usuários com acesso a muitos alunos de escolas diferentes
```

---

## 🔒 PASSO 6: MEDIDAS PREVENTIVAS (15 minutos)

### 6.1 Ativar Logging Detalhado

No Supabase Dashboard:
1. Settings → Logs
2. Ativar "Log all queries"
3. Ativar "Log auth events"

### 6.2 Configurar Alertas

Criar alerta para:
- Alterações em `user_roles`
- Desabilitação de RLS
- Múltiplas tentativas de login falhadas

### 6.3 Documentar Incidente

Criar arquivo `INCIDENTE_SEGURANCA_20241104.md`:

```markdown
# Incidente de Segurança - 04/11/2024

## Resumo
Vulnerabilidades críticas em RLS identificadas e corrigidas.

## Ações Tomadas
1. [ ] RLS reabilitado em todas as tabelas
2. [ ] Políticas permissivas removidas
3. [ ] Políticas restritivas aplicadas
4. [ ] Testes de acesso realizados
5. [ ] Logs auditados
6. [ ] Formulário de login corrigido

## Usuários Afetados
[Listar se houver evidência de exploração]

## Notificações Necessárias
[ ] ANPD (se houve vazamento)
[ ] Clientes (se houve vazamento)
[ ] Equipe interna

## Responsável pela Correção
Nome:
Data/Hora:
```

---

## ☎️ SUPORTE

Se encontrar problemas:

1. **Erro ao aplicar migração:**
   - Verifique sintaxe SQL
   - Execute em partes menores
   - Verifique logs de erro

2. **Login ainda não funciona:**
   - Limpe cache do navegador
   - Tente em aba anônima
   - Verifique console JavaScript

3. **RLS causa erros:**
   - Verifique se usuário tem school_id
   - Verifique se user_role está correto
   - Verifique se há dados órfãos

---

## ✅ CHECKLIST FINAL

Antes de considerar correção completa:

- [ ] RLS ativo em todas as tabelas críticas
- [ ] Políticas permissivas removidas
- [ ] Políticas restritivas aplicadas e testadas
- [ ] Login funcionando para diferentes roles
- [ ] Logs auditados (sem exploração detectada)
- [ ] Documentação do incidente criada
- [ ] Equipe notificada
- [ ] Backup realizado
- [ ] Monitoramento ativado

---

**Data da Correção:** _____________  
**Responsável:** _____________  
**Tempo Total:** _____________ minutos  
**Status:** [ ] Concluído [ ] Parcialmente concluído [ ] Falhou

---

## 📝 NOTAS IMPORTANTES

1. **NÃO pule etapas** - cada verificação é crítica
2. **Faça backup** antes de qualquer alteração
3. **Documente tudo** - será necessário para conformidade
4. **Comunique a equipe** - transparência é essencial
5. **Monitore continuamente** - vulnerabilidades podem retornar

---

**EM CASO DE DÚVIDA, PARE E CONSULTE ESPECIALISTA EM SEGURANÇA!**

