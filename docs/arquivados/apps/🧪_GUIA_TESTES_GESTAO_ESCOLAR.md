# 🧪 Guia de Testes - Gestão Escolar

> **Objetivo**: Validar as integrações automáticas entre Gestão Escolar e PEI Collab  
> **Arquivo SQL**: `🧪_TESTAR_INTEGRACAO_GESTAO_PEI.sql` (na raiz do projeto)

---

## 🎯 O Que Vamos Testar

1. ✅ Schema do banco (tabelas, campos, índices, triggers)
2. ✅ Trigger de sincronização de turma (`sync_pei_class`)
3. ✅ Trigger de alertas de faltas (`notify_pei_attendance`)
4. ✅ Trigger de comparação de notas (`compare_grade_with_pei`)
5. ✅ Função de contexto acadêmico (`get_student_academic_context`)

---

## 🚀 Como Executar os Testes

### **Método 1**: Via Supabase SQL Editor (Recomendado)

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Copie o conteúdo de `🧪_TESTAR_INTEGRACAO_GESTAO_PEI.sql`
4. Execute **seção por seção** (não tudo de uma vez)
5. Valide os resultados de cada teste

### **Método 2**: Via Supabase CLI

```bash
# Executar todo o arquivo
supabase db execute -f 🧪_TESTAR_INTEGRACAO_GESTAO_PEI.sql

# Ou executar query específica
supabase db query "SELECT * FROM grade_levels LIMIT 5;"
```

---

## 📋 Checklist de Validação

### ✅ **Parte 1: Validação do Schema**

Execute as queries da **PARTE 1** do arquivo de teste.

#### 1.1 Tabelas Criadas

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('grade_levels', 'subjects', 'enrollments', 'attendance', 'grades');
```

**✅ Resultado Esperado**: 5 linhas
- grade_levels
- subjects
- enrollments
- attendance
- grades

#### 1.2 Campos Novos em students

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('codigo_identificador', 'status_matricula', 'necessidades_especiais');
```

**✅ Resultado Esperado**: 3 linhas (+ outras)

#### 1.3 Campos Novos em peis

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'peis' 
AND column_name IN ('class_id', 'enrollment_id');
```

**✅ Resultado Esperado**: 2 linhas

#### 1.4 Triggers Criados

```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_%pei%';
```

**✅ Resultado Esperado**: 3 triggers
- trigger_sync_pei_class (em enrollments)
- trigger_pei_attendance_alert (em attendance)
- trigger_compare_grade_pei (em grades)

---

### ✅ **Parte 2: Dados de Teste**

Execute as queries da **PARTE 2** para criar:
- ✅ Tenant de teste
- ✅ Escola de teste
- ✅ Turma de teste
- ✅ Aluno com necessidades especiais
- ✅ PEI ativo para o aluno
- ✅ Meta de Matemática (8.0)
- ✅ Disciplina Matemática

**IMPORTANTE**: Verifique se os dados foram criados:

```sql
-- Verificar aluno criado
SELECT id, full_name, necessidades_especiais 
FROM students 
WHERE codigo_identificador = 'ALU-2025-TEST-001';

-- Verificar PEI criado
SELECT id, student_id, is_active_version 
FROM peis 
WHERE student_id = '44444444-4444-4444-4444-444444444444'::uuid;

-- Verificar meta criada
SELECT id, description, progress_score 
FROM pei_goals 
WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid;
```

---

### ✅ **Parte 3: Teste do Trigger sync_pei_class**

**Objetivo**: Validar que ao matricular aluno, o PEI é atualizado automaticamente.

#### Passo 1: Ver estado ANTES

```sql
SELECT class_id, enrollment_id 
FROM peis 
WHERE id = '55555555-5555-5555-5555-555555555555'::uuid;
```

**Resultado Esperado**: `class_id = NULL`, `enrollment_id = NULL`

#### Passo 2: Criar matrícula

```sql
INSERT INTO enrollments (...) VALUES (...);
-- (Execute a query 3.2 do arquivo de teste)
```

#### Passo 3: Ver estado DEPOIS

```sql
SELECT class_id, enrollment_id, updated_at 
FROM peis 
WHERE id = '55555555-5555-5555-5555-555555555555'::uuid;
```

**✅ Resultado Esperado**:
- `class_id` = `'33333333-3333-3333-3333-333333333333'` ✅
- `enrollment_id` = `'88888888-8888-8888-8888-888888888888'` ✅
- `updated_at` = timestamp recente ✅

**Status**: ✅ **TRIGGER FUNCIONANDO** se os valores foram atualizados!

---

### ✅ **Parte 4: Teste do Trigger notify_pei_attendance**

**Objetivo**: Validar que ao acumular >5 faltas no mês, o professor AEE é notificado.

#### Passo 1: Contar notificações ANTES

```sql
SELECT COUNT(*) 
FROM pei_notifications 
WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid
  AND notification_type = 'attendance_alert';
```

**Resultado**: Anote o número (ex: 0)

#### Passo 2: Registrar 6 faltas

```sql
INSERT INTO attendance (...) SELECT ... FROM generate_series(0, 5);
-- (Execute a query 4.2 do arquivo de teste)
```

#### Passo 3: Contar notificações DEPOIS

```sql
SELECT COUNT(*) 
FROM pei_notifications 
WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid
  AND notification_type = 'attendance_alert';
```

**✅ Resultado Esperado**: Número MAIOR que antes (pelo menos +1)

#### Passo 4: Ver detalhes das notificações

```sql
SELECT 
  id,
  user_id,
  notification_type,
  is_read,
  created_at
FROM pei_notifications
WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid
  AND notification_type = 'attendance_alert'
ORDER BY created_at DESC;
```

**✅ Resultado Esperado**:
- Pelo menos 1 notificação
- `notification_type` = `'attendance_alert'`
- `is_read` = `false`
- `created_at` = timestamp recente

**Status**: ✅ **TRIGGER FUNCIONANDO** se notificação foi criada!

---

### ✅ **Parte 5: Teste do Trigger compare_grade_with_pei**

**Objetivo**: Validar que ao lançar nota abaixo da meta, o professor AEE é notificado.

#### Passo 1: Contar notificações ANTES

```sql
SELECT COUNT(*) 
FROM pei_notifications 
WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid
  AND notification_type = 'grade_below_goal';
```

#### Passo 2: Lançar nota ABAIXO da meta

```sql
-- Meta = 8.0 (progress_score = 80)
-- Nota = 5.5 (ABAIXO)
INSERT INTO grades (...) VALUES (..., 5.5, ...);
-- (Execute a query 5.2 do arquivo de teste)
```

#### Passo 3: Verificar notificações DEPOIS

```sql
SELECT * 
FROM pei_notifications 
WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid
  AND notification_type = 'grade_below_goal'
ORDER BY created_at DESC;
```

**✅ Resultado Esperado**:
- Pelo menos 1 notificação criada
- `notification_type` = `'grade_below_goal'`

#### Passo 4: Lançar nota ACIMA da meta (não deve alertar)

```sql
-- Nota = 9.0 (ACIMA da meta de 8.0)
INSERT INTO grades (...) VALUES (..., 9.0, ...);
-- (Execute a query 5.4 do arquivo de teste)
```

**✅ Resultado Esperado**: NÃO cria nova notificação (nota está boa)

**Status**: ✅ **TRIGGER FUNCIONANDO** se alertou para 5.5 mas não para 9.0!

---

### ✅ **Parte 6: Teste da Função get_student_academic_context**

**Objetivo**: Validar que a função retorna JSON correto com contexto acadêmico.

```sql
SELECT get_student_academic_context('44444444-4444-4444-4444-444444444444'::uuid);
```

**✅ Resultado Esperado** (JSON):

```json
{
  "turma": "5º Ano A - Teste",
  "nivel": "Ensino Fundamental - 5º ano",
  "frequencia_percentual": 0,        // 0% (6 faltas, 0 presenças)
  "media_geral": 7.25,                // Média de 5.5 e 9.0
  "disciplinas_abaixo_media": 1,      // 1 disciplina com nota < 6.0
  "faltas_mes_atual": 6,
  "em_risco": true                    // TRUE pois frequência < 75%
}
```

**Status**: ✅ **FUNÇÃO FUNCIONANDO** se retornou JSON válido!

---

## 📊 Tabela de Validação

| # | Teste | Esperado | Resultado | Status |
|---|-------|----------|-----------|--------|
| 1 | 5 tabelas criadas | 5 | ? | ⬜ |
| 2 | Campos em students | 6+ | ? | ⬜ |
| 3 | Campos em peis | 2 | ? | ⬜ |
| 4 | Triggers criados | 3 | ? | ⬜ |
| 5 | Função SQL criada | 1 | ? | ⬜ |
| 6 | sync_pei_class | class_id atualizado | ? | ⬜ |
| 7 | notify_pei_attendance | Notificação criada | ? | ⬜ |
| 8 | compare_grade_with_pei | Notificação criada | ? | ⬜ |
| 9 | get_student_academic_context | JSON válido | ? | ⬜ |

**Preencha conforme executar os testes!**

---

## 🐛 Troubleshooting

### Problema: "relation X already exists"

**Solução**: Normal! A migração é idempotente. Pode executar múltiplas vezes.

### Problema: "function get_student_academic_context does not exist"

**Solução**: Certifique-se que a migração `20250210000001_gestao_escolar_expansion.sql` foi aplicada completamente.

```sql
-- Verificar se foi aplicada
SELECT * FROM supabase_migrations.schema_migrations
WHERE version = '20250210000001';
```

### Problema: Notificações não são criadas

**Possíveis causas**:
1. PEI não está com `is_active_version = true`
2. Não há vinculação em `pei_teachers`
3. Meta não contém nome da disciplina na descrição

**Debug**:
```sql
-- 1. Verificar PEI ativo
SELECT * FROM peis WHERE id = '55555555-5555-5555-5555-555555555555'::uuid;

-- 2. Verificar professores vinculados
SELECT * FROM pei_teachers WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid;

-- 3. Verificar metas
SELECT * FROM pei_goals WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid;
```

### Problema: "violates foreign key constraint"

**Solução**: Certifique-se que as entidades pai existem antes de criar filhas:
1. Tenant → School → Class
2. Student + Class → Enrollment
3. Enrollment + Subject → Grade

---

## 🎯 Cenários de Teste Adicionais

### Teste 1: Aluno Transferido (Status Muda)

```sql
-- 1. Atualizar status do aluno
UPDATE students
SET status_matricula = 'Transferido'
WHERE id = '44444444-4444-4444-4444-444444444444'::uuid;

-- 2. O PEI deve continuar vinculado mas pode ser marcado para revisão
-- (Implementar trigger futuro se necessário)
```

### Teste 2: Múltiplas Notas (Média Ponderada)

```sql
-- Lançar várias notas com pesos diferentes
INSERT INTO grades (enrollment_id, subject_id, periodo, avaliacao_tipo, nota_valor, peso, lancado_por)
VALUES 
  ('enrollment-id', 'subject-id', '1BIM', 'Prova', 8.0, 2.0, 'user-id'),      -- Peso 2
  ('enrollment-id', 'subject-id', '1BIM', 'Trabalho', 7.0, 1.0, 'user-id'),   -- Peso 1
  ('enrollment-id', 'subject-id', '1BIM', 'Participação', 9.0, 1.0, 'user-id'); -- Peso 1

-- Calcular média ponderada esperada
-- (8.0*2 + 7.0*1 + 9.0*1) / (2+1+1) = 32/4 = 8.0

SELECT 
  subject_id,
  SUM(nota_valor * peso) / SUM(peso) as media_ponderada
FROM grades
WHERE enrollment_id = 'enrollment-id'
  AND periodo = '1BIM'
GROUP BY subject_id;

-- Resultado esperado: 8.0
```

### Teste 3: Frequência Offline → Sincronização

```sql
-- Simular registro offline (is_synced = false)
INSERT INTO attendance (class_id, student_id, data, presenca, registrado_por, is_synced)
VALUES (
  'class-id',
  'student-id',
  CURRENT_DATE,
  true,
  'user-id',
  false  -- NÃO sincronizado
);

-- Listar registros não sincronizados
SELECT * FROM attendance WHERE is_synced = false;

-- Marcar como sincronizado
UPDATE attendance SET is_synced = true WHERE is_synced = false;
```

---

## 📈 Métricas de Performance

### Query de Performance: Listar Alunos

```sql
EXPLAIN ANALYZE
SELECT * FROM students 
WHERE school_id = '22222222-2222-2222-2222-222222222222'::uuid
  AND status_matricula = 'Ativo';
```

**✅ Esperado**: < 50ms com índice `idx_students_status`

### Query de Performance: Boletim

```sql
EXPLAIN ANALYZE
SELECT 
  s.nome as disciplina,
  AVG(g.nota_valor) as media
FROM grades g
JOIN subjects s ON s.id = g.subject_id
WHERE g.enrollment_id = 'enrollment-id'
GROUP BY s.nome;
```

**✅ Esperado**: < 200ms com índice `idx_grades_enrollment`

---

## 🎯 Testes de Integração Visual (UI)

### Teste no PEI Collab

1. **Abra** o PEI Collab (`http://localhost:5173`)
2. **Faça login** como professor AEE
3. **Abra** um PEI ativo
4. **Adicione** o widget de contexto acadêmico:

```typescript
// Em apps/pei-collab/src/pages/PEIs.tsx ou similar
import { useStudentAcademicContext } from '@pei/database/hooks';

function PEIView({ peiId }) {
  const { data: pei } = usePEI(peiId);
  const { data: context } = useStudentAcademicContext(pei?.student_id);
  
  return (
    <div>
      {/* Conteúdo do PEI */}
      
      {context && (
        <Card className="mt-4">
          <CardTitle>Desempenho Acadêmico (Gestão Escolar)</CardTitle>
          <div>
            <p>Turma: {context.turma}</p>
            <p>Frequência: {context.frequencia_percentual.toFixed(1)}%</p>
            <p>Média: {context.media_geral.toFixed(2)}</p>
            {context.em_risco && (
              <Alert variant="destructive">Aluno em risco</Alert>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
```

5. **Verificar**: Widget exibe dados corretamente?

### Teste no Gestão Escolar

1. **Abra** o Gestão Escolar (`http://localhost:5174`)
2. **Vá em** Students
3. **Teste** a query:

```typescript
import { useStudentsBySchool } from '@pei/database/hooks';

const { data: students, isLoading, error } = useStudentsBySchool(schoolId, {
  status: 'Ativo',
  necessidadesEspeciais: true
});

console.log('Students:', students);
// Deve mostrar lista de alunos tipada
```

---

## 🧹 Limpeza Após Testes

Após validar tudo, você pode limpar os dados de teste:

```sql
-- CUIDADO: Isso deleta todos os dados de teste!
-- Execute apenas se tiver certeza

DELETE FROM pei_notifications WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid;
DELETE FROM grades WHERE enrollment_id = '88888888-8888-8888-8888-888888888888'::uuid;
DELETE FROM attendance WHERE student_id = '44444444-4444-4444-4444-444444444444'::uuid;
DELETE FROM pei_goals WHERE pei_id = '55555555-5555-5555-5555-555555555555'::uuid;
DELETE FROM peis WHERE id = '55555555-5555-5555-5555-555555555555'::uuid;
DELETE FROM enrollments WHERE id = '88888888-8888-8888-8888-888888888888'::uuid;
DELETE FROM students WHERE id = '44444444-4444-4444-4444-444444444444'::uuid;
DELETE FROM classes WHERE id = '33333333-3333-3333-3333-333333333333'::uuid;
DELETE FROM subjects WHERE id = '77777777-7777-7777-7777-777777777777'::uuid;
DELETE FROM schools WHERE id = '22222222-2222-2222-2222-222222222222'::uuid;
DELETE FROM tenants WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;
```

---

## ✅ Checklist Final

Após executar todos os testes, preencha:

- [ ] ✅ Schema validado (5 tabelas, campos novos, triggers)
- [ ] ✅ Dados de teste criados
- [ ] ✅ Trigger `sync_pei_class` funcionando
- [ ] ✅ Trigger `notify_pei_attendance` funcionando
- [ ] ✅ Trigger `compare_grade_with_pei` funcionando
- [ ] ✅ Função `get_student_academic_context` retorna JSON
- [ ] ✅ Performance de queries OK (< 200ms)
- [ ] ✅ Hooks testados em componente React

---

## 🎊 Resultado Final Esperado

### Se todos os testes passaram:

✅ **Integração Gestão ↔ PEI está FUNCIONAL!**

- ✅ Matrícula atualiza PEI automaticamente
- ✅ Faltas >5 geram alerta para AEE
- ✅ Notas abaixo da meta geram alerta
- ✅ Contexto acadêmico disponível no PEI

### Próximos Passos:

1. **Implementar widgets visuais** no PEI Collab
2. **Criar formulários** no Gestão Escolar (Fase 4)
3. **Testar em produção** com dados reais

---

**Tempo de Teste**: ~30 minutos  
**Complexidade**: Média  
**Resultado**: Validação completa das integrações ✨

