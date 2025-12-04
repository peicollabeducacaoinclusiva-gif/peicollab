# 📖 Como Usar: Gestão de Professores por Turma

## 🎯 Objetivo

Configurar professores de cada turma para que sejam **automaticamente adicionados aos PEIs** dos alunos.

---

## 🚀 Passo a Passo

### 1️⃣ Aplicar Migração (PRIMEIRO)

**Via Supabase Dashboard → SQL Editor:**

Executar o arquivo completo:
```
supabase/migrations/20250203000005_add_class_teachers_auto_assignment.sql
```

---

### 2️⃣ Acessar Dashboard do Coordenador

1. Fazer login como **Coordenador**
2. Ir para o **Dashboard**
3. Procurar o botão: **"Gerenciar Professores"** (📚 BookOpen)

```
┌─────────────────────────────────────────────────┐
│ Olá, Maria Silva!                               │
│ Painel de coordenação pedagógica                │
│                                                 │
│ [Solicitar PEI] [Gerenciar Professores] [...]  │ ← AQUI!
└─────────────────────────────────────────────────┘
```

---

### 3️⃣ Selecionar Turma

Ao clicar em **"Gerenciar Professores"**, abre dialog:

```
┌─────────────────────────────────┐
│ Selecionar Turma                │
│ Ano Letivo 2024                 │
├─────────────────────────────────┤
│                                 │
│ Série:  [6º Ano        ▼]      │
│ Turma:  [A             ▼]      │
│                                 │
│         [Limpar] [Continuar]   │
└─────────────────────────────────┘
```

---

### 4️⃣ Adicionar Professores

Após selecionar turma, abre o **Gerenciador de Professores**:

```
┌──────────────────────────────────────────────────┐
│ Professores da Turma                             │
│ 6º Ano A • Ano Letivo 2024                      │
├──────────────────────────────────────────────────┤
│                                                  │
│ ⭐ Professor Principal (Disciplina Principal)   │
│ ┌────────────────────────────────────────────┐  │
│ │ Profª Maria Santos                         │  │
│ │ Português • 5h/semana                      │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ Professores das Demais Disciplinas (5)          │
│ ┌────────────────────────────────────────────┐  │
│ │ Prof. Carlos Oliveira                      │  │
│ │ Matemática • 4h/semana                     │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ── Adicionar Professor ──                       │
│ Professor:  [Selecione      ▼]                  │
│ Disciplina: [Matemática     ▼]                  │
│ Carga:      [4             ] h/semana           │
│ [ ] Responsável pelo PEI                        │
│                                                  │
│         [+ Adicionar Professor]                 │
└──────────────────────────────────────────────────┘
```

---

### 5️⃣ Preencher Formulário

**Campos:**
- **Professor**: Selecione da lista (apenas professores da escola)
- **Disciplina**: Português, Matemática, Ciências, História, etc.
- **Carga Horária**: Horas semanais (ex: 4h, 5h)
- **Responsável pelo PEI**: ✅ Marque apenas 1 (geralmente Português)

**Exemplo:**

| Professor | Disciplina | Responsável | Carga |
|-----------|-----------|-------------|-------|
| Maria Santos | Português | ✅ | 5h |
| Carlos Oliveira | Matemática | ❌ | 4h |
| Ana Costa | Ciências | ❌ | 4h |
| João Silva | História | ❌ | 3h |
| Lúcia Lima | Geografia | ❌ | 3h |
| Pedro Souza | Ed. Física | ❌ | 2h |

---

### 6️⃣ Criar PEI - Atribuição Automática! ✨

Quando você criar um PEI para um aluno desta turma:

1. Clicar em **"Solicitar PEI"**
2. Selecionar aluno do **6º Ano A**
3. Selecionar professor
4. Clicar em **"Criar PEI"**

**🎉 MAGIA ACONTECE:**
```
Sistema automaticamente adiciona:
✅ Profª Maria Santos (Português) - RESPONSÁVEL
✅ Prof. Carlos Oliveira (Matemática)
✅ Profª Ana Costa (Ciências)
✅ Prof. João Silva (História)
✅ Profª Lúcia Lima (Geografia)
✅ Prof. Pedro Souza (Ed. Física)

Todos podem visualizar e colaborar no PEI! 🎊
```

---

## 📋 Exemplo de Configuração Completa

### Escola: EMEF João Paulo II

**6º Ano A - Manhã (2024)**

```sql
-- Via SQL ou Interface

-- Professor Principal (Português)
SELECT add_teacher_to_class(
  'school-id', 2024, '6º Ano', 'A',
  'prof-maria-id', 'Português', true, 5
);

-- Matemática
SELECT add_teacher_to_class(
  'school-id', 2024, '6º Ano', 'A',
  'prof-carlos-id', 'Matemática', false, 4
);

-- Ciências
SELECT add_teacher_to_class(
  'school-id', 2024, '6º Ano', 'A',
  'prof-ana-id', 'Ciências', false, 4
);

-- ... e assim por diante
```

---

## 🔄 Casos Especiais

### Trocar Professor da Turma

```sql
-- Remover professor antigo
SELECT remove_teacher_from_class('class-teacher-id');

-- Adicionar novo professor
SELECT add_teacher_to_class(...);
```

### Adicionar Nova Disciplina

Exemplo: Adicionar "Inglês" que não existia antes:

```sql
SELECT add_teacher_to_class(
  'school-id', 2024, '6º Ano', 'A',
  'prof-lucia-id', 'Inglês', false, 2
);
```

### Copiar Professores para Outra Turma

Se 6º A e 6º B têm os mesmos professores:

```sql
SELECT copy_teachers_between_classes(
  'school-id', 2024, '6º Ano', 'A',  -- De
  'school-id', 2024, '6º Ano', 'B'   -- Para
);
```

---

## 🎓 Configuração Recomendada por Segmento

### Ensino Fundamental I (1º ao 5º Ano)
- **1 professor principal** (professor da sala)
- **Professores complementares** (Educação Física, Artes, Música)

### Ensino Fundamental II (6º ao 9º Ano)
- **Professor principal**: Português (maior carga horária)
- **Professores complementares**: 
  - Matemática
  - Ciências
  - História
  - Geografia
  - Inglês
  - Ed. Física
  - Artes

---

## ✅ Checklist de Configuração

Para cada turma:

- [ ] Definir professor principal (responsável pelo PEI)
- [ ] Adicionar professores de disciplinas obrigatórias
- [ ] Adicionar professores de disciplinas complementares
- [ ] Verificar carga horária de cada um
- [ ] Testar criando um PEI para aluno da turma
- [ ] Confirmar que todos os professores foram adicionados automaticamente

---

## 💡 Dicas

✅ **Configure no início do ano letivo** - Faça uma vez, use o ano todo!

✅ **Atualize quando necessário** - Professor mudou de turma? Atualize!

✅ **Use cópia entre turmas** - Economize tempo copiando configurações

✅ **Professor principal = maior carga horária** - Geralmente Português

✅ **Todos colaboram** - Cada professor adiciona metas da sua disciplina

---

## 🔍 Verificar Configuração

### Via SQL:
```sql
-- Ver professores da turma
SELECT * FROM get_class_teachers(
  'school-id',
  2024,
  '6º Ano',
  'A'
);

-- Ver todas as turmas configuradas
SELECT * FROM classes_with_teacher_count
WHERE school_id = 'school-id'
  AND academic_year = 2024;
```

### Via Interface:
1. Dashboard Coordenador
2. Clicar em "Gerenciar Professores"
3. Selecionar turma
4. Visualizar lista de professores

---

## 🆘 Problemas Comuns

### Professores não aparecem na lista

**Causa**: Professores não têm `school_id` ou não são da escola

**Solução**: Verificar cadastro de professores

### Professor não foi adicionado ao PEI

**Causa**: Aluno não tem matrícula ativa na turma

**Solução**: Criar matrícula para o aluno

### Não consigo marcar professor principal

**Causa**: Já existe outro professor principal na turma

**Solução**: Sistema permite apenas 1 - o anterior é desmarcado automaticamente

---

## 📞 Suporte

- **Migração**: `supabase/migrations/20250203000005_add_class_teachers_auto_assignment.sql`
- **Componente**: `src/components/coordinator/ClassTeachersSelector.tsx`
- **Documentação**: `docs/GUIA_PROFESSORES_TURMA.md`

---

**Status**: ✅ Pronto para uso!  
**Tempo de configuração**: ~10 min por turma  
**Benefício**: Atribuição automática para sempre! 🚀
































