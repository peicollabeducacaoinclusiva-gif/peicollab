# ⚡ Teste Rápido - Execute Agora!

> **Tempo**: 10 minutos  
> **Objetivo**: Validar integrações Gestão ↔ PEI

---

## 🚀 Passo a Passo (10 Minutos)

### **1. Abrir Supabase Dashboard** (1 min)
1. Vá em https://supabase.com
2. Selecione seu projeto
3. Clique em **SQL Editor**

---

### **2. Validar Schema** (2 min)

Cole e execute:

```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('grade_levels', 'subjects', 'enrollments', 'attendance', 'grades')
ORDER BY table_name;
```

**✅ Resultado**: Deve mostrar **5 linhas** (as 5 novas tabelas)

---

### **3. Criar Dados de Teste** (3 min)

Cole e execute (uma query de cada vez):

```sql
-- 3.1 Tenant
INSERT INTO tenants (id, network_name, is_active)
VALUES ('11111111-1111-1111-1111-111111111111'::uuid, 'Rede Teste', true)
ON CONFLICT (id) DO NOTHING;

-- 3.2 Escola
INSERT INTO schools (id, tenant_id, school_name, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Escola Teste',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 3.3 Turma
INSERT INTO classes (id, school_id, tenant_id, class_name, education_level, grade, academic_year, is_active)
VALUES (
  '33333333-3333-3333-3333-333333333333'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '5º Ano A Teste',
  'ensino_fundamental_1', -- 1º ao 5º ano
  '5º ano',
  '2025',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 3.4 Aluno
INSERT INTO students (id, school_id, tenant_id, name, date_of_birth, status_matricula, necessidades_especiais, is_active)
VALUES (
  '44444444-4444-4444-4444-444444444444'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'João Teste',
  '2012-05-15',
  'Ativo',
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 3.5 PEI Ativo
INSERT INTO peis (id, student_id, school_id, tenant_id, status, is_active_version)
VALUES (
  '55555555-5555-5555-5555-555555555555'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'approved',
  true
)
ON CONFLICT (id) DO NOTHING;
```

**✅ Resultado**: Dados criados sem erros

---

### **4. Testar Trigger #1: Sincronização de Turma** (2 min)

```sql
-- ANTES: Ver PEI sem turma
SELECT id, class_id, enrollment_id 
FROM peis 
WHERE id = '55555555-5555-5555-5555-555555555555'::uuid;
-- Esperado: class_id = NULL

-- Criar matrícula (dispara trigger)
INSERT INTO enrollments (
  id, student_id, class_id, school_id, ano_letivo, status, data_matricula
)
VALUES (
  '88888888-8888-8888-8888-888888888888'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  2025,
  'Matriculado',
  CURRENT_DATE
)
ON CONFLICT (id) DO UPDATE SET status = 'Matriculado';

-- DEPOIS: Ver PEI com turma
SELECT id, class_id, enrollment_id 
FROM peis 
WHERE id = '55555555-5555-5555-5555-555555555555'::uuid;
```

**✅ Resultado Esperado**: `class_id` e `enrollment_id` PREENCHIDOS! ✨

---

### **5. Testar Trigger #2: Alerta de Faltas** (2 min)

```sql
-- Registrar 6 faltas no mês
INSERT INTO attendance (class_id, student_id, data, presenca, registrado_por)
SELECT
  '33333333-3333-3333-3333-333333333333'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid,
  date_trunc('month', CURRENT_DATE) + (i || ' days')::interval,
  false, -- FALTA
  (SELECT id FROM auth.users LIMIT 1)
FROM generate_series(0, 5) AS i
WHERE NOT EXISTS (
  SELECT 1 FROM attendance
  WHERE student_id = '44444444-4444-4444-4444-444444444444'::uuid
    AND data = date_trunc('month', CURRENT_DATE) + (i || ' days')::interval
);

-- Ver notificações criadas
SELECT COUNT(*), notification_type 
FROM pei_notifications
WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid
GROUP BY notification_type;
```

**✅ Resultado Esperado**: Pelo menos 1 notificação `attendance_alert`! 🚨

---

## ✅ Checklist Rápida

Execute e marque:

- [ ] ✅ 5 tabelas criadas?
- [ ] ✅ Dados de teste criados?
- [ ] ✅ Trigger sync_pei_class funcionou? (class_id preenchido)
- [ ] ✅ Trigger notify_pei_attendance funcionou? (notificação criada)

**Se todos ✅**: **INTEGRAÇÕES FUNCIONANDO!** 🎉

---

## 🎯 Se Der Erro

1. Verifique se a migração foi aplicada:
   ```sql
   SELECT version FROM supabase_migrations.schema_migrations 
   WHERE version LIKE '2025021%'
   ORDER BY version DESC;
   ```

2. Verifique triggers:
   ```sql
   SELECT trigger_name FROM information_schema.triggers 
   WHERE trigger_name LIKE 'trigger_%pei%';
   ```

3. Consulte: `docs/apps/🧪_GUIA_TESTES_GESTAO_ESCOLAR.md` (guia detalhado)

---

## 🎊 Resultado Final

Se todos os testes passaram:

✅ **Sistema Gestão Escolar integrado com PEI Collab!**
- Matrículas atualizam PEI automaticamente
- Faltas geram alertas em tempo real
- Notas são comparadas com metas
- Contexto acadêmico disponível

**Pronto para Fase 4**: Implementar UI! 🚀

---

**Tempo Total**: 10 minutos  
**Dificuldade**: Fácil  
**Impacto**: Validação completa das integrações ✨

