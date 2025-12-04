-- ============================================================================
-- SQL RÁPIDO: Transformar Usuário Existente em PA
-- ============================================================================
-- Copie e cole TODO este bloco no Supabase SQL Editor e clique em RUN
-- ============================================================================

DO $$
DECLARE
    v_user_id uuid;
    v_email text;
    v_student_id uuid;
    v_student_name text;
BEGIN
    -- Buscar primeiro usuário disponível
    SELECT id, email INTO v_user_id, v_email
    FROM auth.users
    WHERE email LIKE '%test%' OR email LIKE '%teacher%'
    LIMIT 1;
    
    -- Se não encontrou, pegar qualquer um
    IF v_user_id IS NULL THEN
        SELECT id, email INTO v_user_id, v_email
        FROM auth.users
        LIMIT 1;
    END IF;

    -- Adicionar role de PA
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'support_professional')
    ON CONFLICT DO NOTHING;

    -- Buscar aluno
    SELECT id, name INTO v_student_id, v_student_name
    FROM students
    WHERE is_active = true
    LIMIT 1;

    -- Vincular
    INSERT INTO support_professional_students (
        support_professional_id, student_id, assigned_by
    )
    VALUES (v_user_id, v_student_id, v_user_id)
    ON CONFLICT DO NOTHING;

    -- Criar 7 feedbacks
    FOR i IN 1..7 LOOP
        INSERT INTO support_professional_feedbacks (
            student_id, support_professional_id, feedback_date,
            socialization_score, autonomy_score, behavior_score,
            comments
        )
        VALUES (
            v_student_id, v_user_id, CURRENT_DATE - i,
            3 + floor(random() * 3)::int,
            3 + floor(random() * 3)::int,
            3 + floor(random() * 3)::int,
            'Feedback automático dia ' || i
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Resultado
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅✅✅ PA CRIADO COM SUCESSO! ✅✅✅';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📧 FAÇA LOGIN COM:';
    RAISE NOTICE '   %', v_email;
    RAISE NOTICE '';
    RAISE NOTICE '👦 Aluno vinculado: %', v_student_name;
    RAISE NOTICE '📊 7 feedbacks criados';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 http://localhost:8080/login';
    RAISE NOTICE '';
END $$;
```

---

## ⚡ Execute Agora!

**Copie TODO o SQL acima** → Cole no Supabase SQL Editor → Clique em **RUN**

Você verá uma mensagem como:

```
✅✅✅ PA CRIADO COM SUCESSO! ✅✅✅

📧 FAÇA LOGIN COM:
   teacher@test.com

👦 Aluno vinculado: João Silva
📊 7 feedbacks criados

🚀 http://localhost:8080/login
```

---

## 🧪 Depois de Executar

### 1. Anote o Email

O SQL mostrará qual email usar para login.

### 2. Faça Login

```
1. Acesse: http://localhost:8080/login
2. Email: (o que apareceu na mensagem)
3. Senha: (a senha que esse usuário já tem)
   - Se for teacher@test.com = Teacher@123
   - Se for coordinator@test.com = Coord@123
```

### 3. Dashboard do PA Aparece!

Você verá:
- ✅ "Dashboard do Profissional de Apoio"
- ✅ Card: 1 aluno atribuído
- ✅ Card: 7 feedbacks
- ✅ Card do aluno
- ✅ Botão "Ver PEI"

### 4. Testar Histórico

```
1. Clique no card do aluno
2. Clique na aba "Histórico"
3. Você verá:
   - 📈 Gráfico de evolução (7 dias)
   - 📋 Lista de 7 feedbacks
   - 🎨 Badges coloridos por score
```

### 5. Registrar Novo Feedback

```
1. Clique na aba "Registrar Feedback"
2. Selecione data de hoje
3. Ajuste os 3 sliders
4. Adicione comentário
5. Clique em "Registrar Feedback"
6. Volte para "Histórico"
7. Veja o novo feedback no gráfico!
```

---

## 📊 O Que Você Vai Ver

### Dashboard do PA:

```
┌────────────────────────────────────────┐
│ Dashboard do Profissional de Apoio     │
├────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│ │Alunos: 1│ │Feed: 7  │ │Semana:7│  │
│ └─────────┘ └─────────┘ └─────────┘  │
├────────────────────────────────────────┤
│ [Card do Aluno]                        │
│ João Silva - 3º Ano A                  │
│ [Ver PEI]                              │
├────────────────────────────────────────┤
│ [Registrar Feedback | Histórico]       │
│                                         │
│ [Gráfico com 7 pontos] 📈              │
│ Linha: Socialização (verde)            │
│ Linha: Autonomia (azul)                │
│ Linha: Comportamento (laranja)         │
│                                         │
│ [Lista de 7 Feedbacks]                 │
└────────────────────────────────────────┘
```

---

## ✅ Checklist

- [ ] Executou SQL_RAPIDO_CRIAR_PA.sql
- [ ] Viu mensagem com email
- [ ] Anotou o email
- [ ] Fez logout do usuário atual
- [ ] Fez login com o email do PA
- [ ] Dashboard do PA apareceu
- [ ] Viu cards de estatísticas
- [ ] Viu aluno vinculado
- [ ] Abriu aba "Histórico"
- [ ] Viu gráfico com 7 feedbacks
- [ ] Registrou novo feedback
- [ ] Novo feedback aparece no histórico

---

**🚀 Execute o SQL agora e me diga qual email apareceu!**

**Arquivo**: `SQL_RAPIDO_CRIAR_PA.sql` (copie TODO o conteúdo)

