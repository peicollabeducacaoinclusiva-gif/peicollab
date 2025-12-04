# 👤 Passo a Passo: Criar Profissional de Apoio

**Email desejado:** `pa@teste.com`  
**Senha:** `Pa@123456`

---

## 🎯 MÉTODO 1: Pelo Dashboard do Supabase (RÁPIDO - 2 minutos)

### Passo 1: Criar Usuário

1. Acesse: **Supabase Dashboard**
2. Vá em: **Authentication** → **Users**
3. Clique em: **Add User** (botão verde)
4. Preencha:
   - **Email:** `pa@teste.com`
   - **Password:** `Pa@123456`
   - **Auto Confirm:** ✅ SIM (marque o checkbox)
5. Clique em **Create User**

### Passo 2: Copiar o UUID

Após criar, você verá o usuário na lista.
- Clique no usuário
- **Copie o UUID** (ID do usuário)

### Passo 3: Executar SQL

No **SQL Editor**, copie e cole (substitua o UUID):

```sql
-- Substitua COLE-UUID-AQUI pelo UUID que você copiou
DO $$
DECLARE
    v_user_id uuid := 'COLE-UUID-AQUI'; -- ⚠️ COLE O UUID AQUI
    v_student_id uuid;
    v_student_name text;
BEGIN
    -- Criar profile
    INSERT INTO profiles (id, full_name, email, is_active)
    VALUES (v_user_id, 'Profissional de Apoio - Teste', 'pa@teste.com', true)
    ON CONFLICT (id) DO NOTHING;

    -- Adicionar role
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'support_professional')
    ON CONFLICT DO NOTHING;

    -- Buscar primeiro aluno
    SELECT id, name INTO v_student_id, v_student_name
    FROM students
    WHERE is_active = true
    LIMIT 1;

    -- Vincular ao aluno
    INSERT INTO support_professional_students (
        support_professional_id,
        student_id,
        assigned_by,
        notes
    )
    VALUES (
        v_user_id,
        v_student_id,
        v_user_id,
        'Vinculação de teste'
    )
    ON CONFLICT DO NOTHING;

    -- Criar 7 feedbacks de exemplo
    INSERT INTO support_professional_feedbacks (
        student_id,
        support_professional_id,
        feedback_date,
        socialization_score,
        autonomy_score,
        behavior_score,
        comments
    )
    VALUES
        (v_student_id, v_user_id, CURRENT_DATE - 7, 3, 3, 4, 'Adaptação inicial'),
        (v_student_id, v_user_id, CURRENT_DATE - 6, 3, 4, 4, 'Melhorou autonomia'),
        (v_student_id, v_user_id, CURRENT_DATE - 5, 4, 4, 5, 'Excelente!'),
        (v_student_id, v_user_id, CURRENT_DATE - 4, 4, 4, 4, 'Mantendo progresso'),
        (v_student_id, v_user_id, CURRENT_DATE - 3, 5, 5, 5, 'Melhor dia!'),
        (v_student_id, v_user_id, CURRENT_DATE - 2, 4, 4, 4, 'Bom desenvolvimento'),
        (v_student_id, v_user_id, CURRENT_DATE - 1, 4, 5, 5, 'Ótimo!')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '';
    RAISE NOTICE '✅ PROFISSIONAL DE APOIO CRIADO!';
    RAISE NOTICE '';
    RAISE NOTICE '📧 Email: pa@teste.com';
    RAISE NOTICE '🔑 Senha: Pa@123456';
    RAISE NOTICE '👦 Aluno: %', v_student_name;
    RAISE NOTICE '📊 Feedbacks: 7 criados';
    RAISE NOTICE '';
END $$;
```

---

## 🎯 MÉTODO 2: Usar Usuário Existente (MAIS RÁPIDO - 30 segundos)

Execute apenas este SQL:

```sql
-- Adiciona role de PA ao primeiro professor encontrado
DO $$
DECLARE
    v_user_id uuid;
    v_email text;
    v_student_id uuid;
    v_student_name text;
BEGIN
    -- Pegar primeiro professor
    SELECT ur.user_id, u.email
    INTO v_user_id, v_email
    FROM user_roles ur
    JOIN auth.users u ON u.id = ur.user_id
    WHERE ur.role = 'teacher'
    LIMIT 1;

    -- Adicionar role de PA
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'support_professional')
    ON CONFLICT DO NOTHING;

    -- Buscar aluno
    SELECT id, name INTO v_student_id, v_student_name
    FROM students WHERE is_active = true LIMIT 1;

    -- Vincular
    INSERT INTO support_professional_students (
        support_professional_id,
        student_id,
        assigned_by
    )
    VALUES (v_user_id, v_student_id, v_user_id)
    ON CONFLICT DO NOTHING;

    -- Criar feedbacks
    INSERT INTO support_professional_feedbacks (
        student_id, support_professional_id, feedback_date,
        socialization_score, autonomy_score, behavior_score, comments
    )
    SELECT v_student_id, v_user_id, CURRENT_DATE - i,
           3 + (random() * 2)::int, 3 + (random() * 2)::int, 3 + (random() * 2)::int,
           'Feedback dia ' || i
    FROM generate_series(1, 7) i
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ PA Criado! Email: %', v_email;
    RAISE NOTICE '👦 Aluno: %', v_student_name;
END $$;
```

**Clique em RUN** ✅

Depois faça login com o email mostrado!

---

## 📋 Resumo das Opções

### OPÇÃO 1: Criar novo usuário `pa@teste.com`
**Vantagem:** Email específico  
**Desvantagem:** Precisa criar pelo Dashboard primeiro  
**Tempo:** 2-3 minutos

### OPÇÃO 2: Usar usuário existente (RECOMENDO!)
**Vantagem:** Automático e rápido  
**Desvantagem:** Usa email de usuário existente  
**Tempo:** 30 segundos

---

## 🚀 Qual Você Prefere?

### A) Criar novo com pa@teste.com
**Ação:**
1. Criar usuário no Dashboard (Passo 1 acima)
2. Executar SQL do Passo 3 (substituindo UUID)

### B) Usar usuário existente (RÁPIDO!)
**Ação:**
1. Execute o SQL do MÉTODO 2
2. Anote o email mostrado
3. Faça login

---

## 🎯 Recomendação

**Use o MÉTODO 2** (usuário existente)!

É instantâneo e você pode testar imediatamente. O email não importa para o teste, o importante é validar a funcionalidade!

---

**Execute o SQL do MÉTODO 2 e me diga qual email apareceu!** 🚀
