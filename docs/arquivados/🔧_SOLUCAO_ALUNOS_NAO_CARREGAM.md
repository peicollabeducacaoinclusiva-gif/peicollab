# 🔧 Solução: Alunos Não Carregam

## ❌ Problema

Na rota `http://localhost:5174/students`, os alunos não são exibidos.

## 🔍 Causa Raiz

As políticas de **Row Level Security (RLS)** da tabela `students` só permitem visualização para:
- ✅ Education Secretary (secretário de educação)
- ✅ School Director (diretor escolar)

**Outros papéis são bloqueados:**
- ❌ Coordinator (coordenador)
- ❌ Teacher (professor)
- ❌ AEE Teacher (professor AEE)
- ❌ Support Professional (profissional de apoio)
- ❌ Specialist (especialista)

## ✅ Soluções

### Solução 1: Aplicar Nova Migration SQL (RECOMENDADA)

Criamos uma migration que adiciona políticas RLS para mais papéis.

**Arquivo criado:** `supabase/migrations/20251111_add_more_student_policies.sql`

#### Como aplicar:

**Opção A - Via Supabase Dashboard:**
1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo do arquivo `20251111_add_more_student_policies.sql`
5. Clique em **Run**

**Opção B - Via Supabase CLI:**
```bash
# Na raiz do projeto
supabase db push

# Ou aplicar manualmente
supabase db execute -f supabase/migrations/20251111_add_more_student_policies.sql
```

**Opção C - Via psql:**
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" < supabase/migrations/20251111_add_more_student_policies.sql
```

---

### Solução 2: Verificar Papel do Usuário

Verifique qual papel o usuário logado possui:

```sql
-- No Supabase SQL Editor
SELECT 
  p.email,
  p.full_name,
  ur.role,
  s.school_name
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN schools s ON s.id = p.school_id
WHERE p.email = 'seu@email.com';
```

**Papéis que podem ver alunos (após aplicar migration):**
- ✅ education_secretary
- ✅ school_director
- ✅ coordinator
- ✅ teacher (vê apenas alunos com PEI vinculado)
- ✅ aee_teacher
- ✅ support_professional
- ✅ specialist

---

### Solução 3: Adicionar Papel ao Usuário

Se o usuário não tem papel adequado, adicione:

```sql
-- Inserir papel de coordinator
INSERT INTO user_roles (user_id, role)
VALUES (
  (SELECT id FROM profiles WHERE email = 'seu@email.com'),
  'coordinator'
);

-- OU adicionar papel de education_secretary
INSERT INTO user_roles (user_id, role)
VALUES (
  (SELECT id FROM profiles WHERE email = 'seu@email.com'),
  'education_secretary'
);
```

---

### Solução 4: Verificar se Há Alunos Cadastrados

Confirme que existem alunos no banco:

```sql
-- Verificar total de alunos
SELECT COUNT(*) as total_alunos FROM students;

-- Ver alunos do seu tenant
SELECT 
  s.full_name,
  s.registration_number,
  sch.school_name
FROM students s
LEFT JOIN schools sch ON sch.id = s.school_id
WHERE sch.tenant_id = (
  SELECT tenant_id FROM profiles WHERE email = 'seu@email.com'
);
```

**Se não houver alunos**, cadastre alguns:

```sql
-- Cadastrar aluno de teste
INSERT INTO students (
  full_name,
  date_of_birth,
  school_id,
  tenant_id,
  registration_number
)
VALUES (
  'Aluno Teste',
  '2010-01-01',
  (SELECT id FROM schools WHERE school_name = 'Sua Escola' LIMIT 1),
  (SELECT tenant_id FROM profiles WHERE email = 'seu@email.com' LIMIT 1),
  '2024001'
);
```

---

## 🛠️ Melhorias Implementadas

### 1. Feedback de Erro Melhorado

Agora a página Students mostra mensagens de erro claras:

```typescript
// Mostra erro se query falhar
if (queryError) {
  setError(queryError.message || 'Erro ao carregar alunos');
  return;
}

// Mostra mensagem se não houver dados
if (!data || data.length === 0) {
  setError('Nenhum aluno encontrado. Verifique suas permissões...');
}
```

### 2. Botão "Tentar Novamente"

A UI agora tem um botão para recarregar os dados se houver erro.

### 3. Logs Detalhados

Erros são logados no console para debug:

```typescript
console.error('Erro ao carregar alunos:', queryError);
```

---

## 📊 Políticas RLS Adicionadas

A migration adiciona as seguintes políticas:

### 1. Coordinator
```sql
CREATE POLICY "coordinator_can_view_students" ON public.students
  FOR SELECT USING (
    is_coordinator(auth.uid()) AND 
    school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
  );
```
**Permissão:** Vê alunos da sua escola

### 2. Teacher
```sql
CREATE POLICY "teacher_can_view_own_students" ON public.students
  FOR SELECT USING (
    has_role(auth.uid(), 'teacher') AND 
    id IN (SELECT student_id FROM peis WHERE ...)
  );
```
**Permissão:** Vê apenas alunos que têm PEI vinculado a ele

### 3. AEE Teacher
```sql
CREATE POLICY "aee_teacher_can_view_students" ON public.students
  FOR SELECT USING (
    has_role(auth.uid(), 'aee_teacher') AND 
    school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
  );
```
**Permissão:** Vê todos os alunos da sua escola

### 4. Support Professional
```sql
CREATE POLICY "support_professional_can_view_students" ON public.students
  FOR SELECT USING (
    has_role(auth.uid(), 'support_professional') AND 
    id IN (SELECT student_id FROM support_professional_students ...)
  );
```
**Permissão:** Vê alunos que acompanha

### 5. Specialist
```sql
CREATE POLICY "specialist_can_view_students" ON public.students
  FOR SELECT USING (
    has_role(auth.uid(), 'specialist') AND 
    school_id IN (SELECT id FROM schools WHERE tenant_id = ...)
  );
```
**Permissão:** Vê alunos da sua rede

### 6. Política Temporária (Desenvolvimento)
```sql
CREATE POLICY "authenticated_users_can_view_tenant_students" ON public.students
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    school_id IN (SELECT id FROM schools WHERE tenant_id = ...)
  );
```
**Permissão:** Qualquer usuário autenticado vê alunos do seu tenant

⚠️ **IMPORTANTE:** Remover esta política em produção para maior segurança!

---

## 🧪 Como Testar

### 1. Aplicar a migration

```bash
supabase db push
```

### 2. Fazer logout e login novamente

```
http://localhost:5174/login
```

### 3. Acessar página de alunos

```
http://localhost:5174/students
```

### 4. Verificar no console

Abra DevTools (F12) → Console

**Se funcionar:**
- ✅ Nenhum erro no console
- ✅ Alunos aparecem na tabela

**Se ainda não funcionar:**
- ❌ Erro aparece no console
- ❌ Mensagem de erro na tela

### 5. Debug no DevTools → Network

1. Abra DevTools → Network
2. Filtre por "students"
3. Veja a request para Supabase
4. Verifique a response:
   - Se `[]` (vazio) → RLS ainda está bloqueando
   - Se tem dados → Funcionou!

---

## 🔒 Segurança em Produção

### Manter Políticas Restritas:

Em produção, considere **remover** a política temporária:

```sql
-- REMOVER EM PRODUÇÃO
DROP POLICY IF EXISTS "authenticated_users_can_view_tenant_students" ON public.students;
```

### Manter Apenas Políticas Específicas:

Mantenha apenas as políticas necessárias para cada papel:
- Education Secretary → vê todos da rede
- School Director → vê apenas sua escola  
- Coordinator → vê sua escola
- AEE Teacher → vê sua escola
- Teacher → vê apenas seus alunos com PEI
- Support Professional → vê apenas alunos que acompanha

---

## ✅ Checklist de Resolução

- [ ] 1. Aplicar migration SQL
- [ ] 2. Verificar papel do usuário logado
- [ ] 3. Verificar se há alunos cadastrados
- [ ] 4. Fazer logout e login novamente
- [ ] 5. Testar acesso à página Students
- [ ] 6. Verificar console para erros
- [ ] 7. Verificar Network tab para response
- [ ] 8. Confirmar que alunos aparecem

---

## 📞 Suporte

**Se ainda não funcionar:**

1. **Verifique o console do navegador** - Qual erro aparece?
2. **Verifique o SQL Editor do Supabase** - A migration foi aplicada?
3. **Teste query direta**:
```sql
SELECT * FROM students LIMIT 10;
```
4. **Verifique políticas ativas**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'students';
```

---

**🎯 Após aplicar a migration, os alunos devem aparecer normalmente!**

