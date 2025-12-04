# 👤 Criar Profissional de Apoio - Guia Visual

**Como criar pelo Dashboard do Supabase (3 minutos)**

---

## 📝 PASSO 1: Criar Usuário no Supabase

### 1.1 Acessar Authentication

```
Supabase Dashboard
  → Authentication (menu esquerdo)
  → Users (aba)
  → [Add User] (botão verde no canto superior direito)
```

### 1.2 Preencher Dados

**No formulário que abrir:**

```
Email: pa@teste.com
Password: Pa@123456
☑️ Auto Confirm User (MARQUE ESTE CHECKBOX!)
```

**Clique em:** `Create User`

### 1.3 Copiar UUID

Após criar, você verá o usuário na lista.

**Clique no usuário** → Você verá os detalhes

**Copie o ID (UUID)** - algo como: `550e8400-e29b-41d4-a716-446655440000`

---

## 📝 PASSO 2: Executar SQL de Configuração

### No SQL Editor, cole isto (SUBSTITUA O UUID):

```sql
-- ⚠️ COLE O UUID QUE VOCÊ COPIOU NA LINHA ABAIXO
DO $$
DECLARE
    v_user_id uuid := 'COLE-O-UUID-AQUI'; -- ⚠️ SUBSTITUA AQUI!
    v_student_id uuid;
    v_student_name text;
BEGIN
    -- Criar profile
    INSERT INTO profiles (id, full_name, email, is_active)
    VALUES (
        v_user_id, 
        'Profissional de Apoio', 
        'pa@teste.com', 
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = 'Profissional de Apoio',
        email = 'pa@teste.com',
        is_active = true;

    -- Adicionar role
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'support_professional')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Buscar primeiro aluno
    SELECT id, name INTO v_student_id, v_student_name
    FROM students
    WHERE is_active = true
    LIMIT 1;

    -- Vincular ao aluno
    INSERT INTO support_professional_students (
        support_professional_id,
        student_id,
        assigned_by
    )
    VALUES (v_user_id, v_student_id, v_user_id)
    ON CONFLICT DO NOTHING;

    -- Criar 7 feedbacks de exemplo
    FOR i IN 1..7 LOOP
        INSERT INTO support_professional_feedbacks (
            student_id,
            support_professional_id,
            feedback_date,
            socialization_score,
            autonomy_score,
            behavior_score,
            comments
        )
        VALUES (
            v_student_id,
            v_user_id,
            CURRENT_DATE - i,
            3 + floor(random() * 3)::int,
            3 + floor(random() * 3)::int,
            3 + floor(random() * 3)::int,
            'Feedback dia ' || (8 - i)
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Confirmação
    RAISE NOTICE '✅ PA configurado com sucesso!';
    RAISE NOTICE '📧 Email: pa@teste.com';
    RAISE NOTICE '🔑 Senha: Pa@123456';
    RAISE NOTICE '👦 Aluno: %', v_student_name;
    RAISE NOTICE '📊 7 feedbacks criados';
END $$;
```

**Clique em RUN** ✅

---

## 📝 PASSO 3: Fazer Login

### 3.1 Logout do Usuário Atual

```
http://localhost:8080
Clique em "Sair" (canto superior direito)
```

### 3.2 Fazer Login com PA

```
http://localhost:8080/login

Email: pa@teste.com
Senha: Pa@123456

[Entrar]
```

### 3.3 Dashboard do PA Aparece!

Você será redirecionado automaticamente para o Dashboard do Profissional de Apoio!

---

## ✅ O Que Você Vai Ver

```
┌────────────────────────────────────────┐
│ Dashboard do Profissional de Apoio     │
├────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│ │Aluno │ │Feed  │ │Semana│ │Média │  │
│ │  1   │ │  7   │ │  7   │ │ 4.2  │  │
│ └──────┘ └──────┘ └──────┘ └──────┘  │
├────────────────────────────────────────┤
│ Alunos Atribuídos                      │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ João Silva - 3º Ano A           │   │
│ │ [Ver PEI]                       │   │
│ └─────────────────────────────────┘   │
├────────────────────────────────────────┤
│ [Registrar Feedback | Histórico]       │
│                                         │
│ Clique no aluno acima para começar!    │
└────────────────────────────────────────┘
```

---

## 🎯 Checklist Visual

### No Supabase Dashboard:

- [ ] **Authentication** → **Users**
- [ ] Clique em **Add User**
- [ ] Email: `pa@teste.com`
- [ ] Senha: `Pa@123456`
- [ ] ☑️ **Auto Confirm User** (IMPORTANTE!)
- [ ] Clique **Create User**
- [ ] Copie o **UUID** do usuário criado

### No SQL Editor:

- [ ] Cole o SQL do PASSO 2
- [ ] Substitua `COLE-O-UUID-AQUI` pelo UUID copiado
- [ ] Clique em **RUN**
- [ ] Veja mensagem de sucesso

### No App:

- [ ] Acesse http://localhost:8080
- [ ] Clique em **Sair**
- [ ] Faça login com: `pa@teste.com` / `Pa@123456`
- [ ] Dashboard do PA aparece automaticamente

---

## 🆘 Se Tiver Dúvida em Algum Passo

Me diga onde parou e eu te ajudo!

---

**🚀 Comece pelo PASSO 1: Criar usuário no Dashboard!**

