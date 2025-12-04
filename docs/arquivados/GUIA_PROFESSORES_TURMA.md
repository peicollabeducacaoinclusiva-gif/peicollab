# 🎓 Guia: Professores por Turma e Atribuição Automática

## 📋 Como Funciona

### Antes (Manual ❌)
```
1. Coordenador cria PEI
2. Coordenador adiciona professor principal manualmente
3. Coordenador adiciona cada professor complementar um por um
4. Repetir para cada PEI... 😓
```

### Agora (Automático ✅)
```
1. Coordenador cadastra professores da turma UMA VEZ
2. Ao criar PEI, TODOS os professores são adicionados automaticamente! 🎉
```

---

## 🚀 Passo 1: Aplicar Migração

### Via Supabase Dashboard:
```sql
-- Copiar e executar o arquivo completo:
supabase/migrations/20250203000005_add_class_teachers_auto_assignment.sql
```

---

## 👥 Passo 2: Cadastrar Professores da Turma

### Exemplo: 6º Ano A - 2024

```sql
-- Professor Principal (Português)
SELECT add_teacher_to_class(
  'school-id',
  2024,
  '6º Ano',
  'A',
  'id-prof-maria',
  'Português',
  true,  -- É professor principal
  5      -- 5 horas/semana
);

-- Matemática
SELECT add_teacher_to_class(
  'school-id', 2024, '6º Ano', 'A',
  'id-prof-carlos', 'Matemática', false, 4
);

-- Ciências
SELECT add_teacher_to_class(
  'school-id', 2024, '6º Ano', 'A',
  'id-prof-ana', 'Ciências', false, 4
);

-- História
SELECT add_teacher_to_class(
  'school-id', 2024, '6º Ano', 'A',
  'id-prof-joao', 'História', false, 3
);

-- Geografia
SELECT add_teacher_to_class(
  'school-id', 2024, '6º Ano', 'A',
  'id-prof-lucia', 'Geografia', false, 3
);

-- Educação Física
SELECT add_teacher_to_class(
  'school-id', 2024, '6º Ano', 'A',
  'id-prof-pedro', 'Educação Física', false, 2
);
```

---

## ✨ Passo 3: Criar PEI - AUTOMÁTICO!

### Quando você criar um PEI:

```typescript
// Frontend - Criar PEI normalmente
const { data, error } = await supabase
  .from('peis')
  .insert({
    student_id: 'aluno-do-6a',
    school_id: 'school-id',
    tenant_id: 'tenant-id',
    status: 'draft'
  });

// 🎉 MAGIA ACONTECE!
// Trigger automático adiciona:
// ✅ Profª Maria (Português) - PRINCIPAL
// ✅ Prof. Carlos (Matemática)
// ✅ Profª Ana (Ciências)
// ✅ Prof. João (História)
// ✅ Profª Lúcia (Geografia)
// ✅ Prof. Pedro (Ed. Física)
```

---

## 🔍 Verificar Professores da Turma

```sql
-- Ver professores cadastrados
SELECT * FROM get_class_teachers(
  'school-id',
  2024,
  '6º Ano',
  'A'
);
```

---

## 📊 Exemplo Completo

### Configuração da Turma

| Professor | Disciplina | Principal | Carga Horária |
|-----------|-----------|-----------|---------------|
| Maria Santos | Português | ⭐ Sim | 5h |
| Carlos Oliveira | Matemática | Não | 4h |
| Ana Costa | Ciências | Não | 4h |
| João Silva | História | Não | 3h |
| Lúcia Lima | Geografia | Não | 3h |
| Pedro Souza | Ed. Física | Não | 2h |

### Resultado no PEI

```
PEI - João da Silva (6º Ano A)

Equipe de Professores (6):
├─ ⭐ Maria Santos (Português) - RESPONSÁVEL
│  └─ Pode editar: Diagnóstico, Planejamento, Avaliação
│
├─ Carlos Oliveira (Matemática)
│  └─ Pode editar: Planejamento (metas de Matemática), Avaliação
│
├─ Ana Costa (Ciências)
│  └─ Pode editar: Planejamento (metas de Ciências), Avaliação
│
├─ João Silva (História)
│  └─ Pode editar: Planejamento (metas de História), Avaliação
│
├─ Lúcia Lima (Geografia)
│  └─ Pode editar: Planejamento (metas de Geografia), Avaliação
│
└─ Pedro Souza (Ed. Física)
   └─ Pode editar: Planejamento (desenvolvimento motor), Avaliação
```

---

## 🎯 Casos de Uso

### Copiar Professores Entre Turmas

```sql
-- Copiar do 6º A para 6º B (mesmo ano)
SELECT copy_teachers_between_classes(
  'school-id', 2024, '6º Ano', 'A',  -- De
  'school-id', 2024, '6º Ano', 'B'   -- Para
);
```

### Preparar Turmas do Próximo Ano

```sql
-- Copiar 6º A (2024) para 7º A (2025)
-- Alunos avançam de série, mesmos professores
SELECT copy_teachers_between_classes(
  'school-id', 2024, '6º Ano', 'A',
  'school-id', 2025, '7º Ano', 'A'
);
```

### Ver Turmas com Professores

```sql
SELECT * FROM classes_with_teacher_count
WHERE school_id = 'school-id'
  AND academic_year = 2024
ORDER BY grade, class_name;
```

---

## 🖥️ Interface Frontend

### Componente Criado

**`ManageClassTeachersDialog`** - Dialog para gerenciar professores de turma

**Como usar:**

```tsx
import ManageClassTeachersDialog from "@/components/coordinator/ManageClassTeachersDialog";

// No dashboard do coordenador
<ManageClassTeachersDialog
  schoolId={schoolId}
  academicYear={2024}
  grade="6º Ano"
  className="A"
  onTeachersUpdated={() => refreshData()}
/>
```

---

## ⚙️ Configuração Recomendada

### 1. **Definir Professor Principal**

- ✅ Geralmente: Português (maior carga horária)
- ✅ Alternativa: Professor da sala (Fundamental I)
- ✅ Ele será o responsável pelo PEI

### 2. **Cadastrar Todas as Disciplinas**

- ✅ Pelo menos: Português, Matemática, Ciências
- ✅ Opcional: História, Geografia, Inglês, etc.
- ✅ Quanto mais completo, melhor a colaboração!

### 3. **Manter Atualizado**

- ✅ Atualizar quando professor mudar de turma
- ✅ Ajustar carga horária se necessário
- ✅ Adicionar novos professores que entrarem

---

## 🔐 Permissões

| Ação | Coordenador | Professor | Superadmin |
|------|------------|-----------|------------|
| Ver professores da turma | ✅ (sua escola) | ✅ (suas turmas) | ✅ |
| Adicionar professor | ✅ | ❌ | ✅ |
| Remover professor | ✅ | ❌ | ✅ |
| Definir principal | ✅ | ❌ | ✅ |

---

## 💡 Benefícios

### Para Coordenadores
- ✅ Configure UMA VEZ, use sempre
- ✅ PEIs criados já vêm com todos os professores
- ✅ Não precisa adicionar manualmente cada vez
- ✅ Copie configurações entre turmas

### Para Professores
- ✅ Acesso automático aos alunos da turma
- ✅ Contribuem com expertise da disciplina
- ✅ Colaboração real e estruturada

### Para o Sistema
- ✅ Dados consistentes
- ✅ Menos trabalho manual
- ✅ Melhor colaboração entre professores

---

## 🆘 Troubleshooting

### Professores não foram adicionados automaticamente

**Possível causa**: Aluno não tem matrícula ativa

**Solução**:
```sql
-- Verificar matrícula do aluno
SELECT * FROM student_enrollments
WHERE student_id = 'aluno-id'
  AND status = 'active';

-- Se não tiver, criar matrícula
SELECT create_student_enrollment(
  'aluno-id',
  'school-id',
  2024,
  '6º Ano',
  'A',
  'Manhã'
);
```

### Professor não aparece na lista

**Causa**: Professor não está cadastrado na turma

**Solução**: Adicionar professor via SQL ou interface

### Erro ao criar PEI

**Causa**: Trigger pode não estar ativo

**Solução**: Reaplicar migração ou verificar logs

---

## 📝 Exemplo de Fluxo Completo

```
1. INÍCIO DO ANO LETIVO
   └─ Coordenador cadastra professores de todas as turmas

2. DURANTE O ANO
   ├─ Coordenador solicita PEI para aluno
   └─ Sistema adiciona automaticamente TODOS os professores

3. COLABORAÇÃO
   ├─ Professor Principal: preenche diagnóstico
   ├─ Prof. Matemática: adiciona metas de Matemática
   ├─ Prof. Ciências: adiciona estratégias de Ciências
   └─ Todos avaliam progresso na sua disciplina

4. RESULTADO
   └─ PEI completo e colaborativo! 🎉
```

---

**Documentação**: `docs/MULTIPLOS_PROFESSORES_PEI.md`  
**Migração**: `supabase/migrations/20250203000005_add_class_teachers_auto_assignment.sql`  
**Componente**: `src/components/coordinator/ManageClassTeachersDialog.tsx`

