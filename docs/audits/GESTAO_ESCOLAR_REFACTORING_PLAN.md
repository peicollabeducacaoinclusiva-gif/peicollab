# Plano de Refatoração Detalhado - App Gestão Escolar

## 📋 Visão Geral

Este documento detalha o plano de execução para elevar a qualidade do código do app Gestão Escolar, priorizando impacto e esforço.

---

## 🎯 FASE 1: Estancar o Sangramento (Semana 1-2)

### 1.1 `pages/Diary.tsx` - Prioridade MÁXIMA

**Status Atual:**
- 1,493 linhas
- 40+ `useState`
- Sem React Hook Form
- Sem Zod
- Validação manual
- Sem lazy loading
- Queries não otimizadas

**Plano de Refatoração:**

#### Passo 1: Criar Schema Zod (2 horas)
```typescript
// lib/validationSchemas.ts
export const diaryEntrySchema = z.object({
  class_id: z.string().uuid('Selecione uma turma'),
  subject_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  lesson_number: z.string().optional(),
  lesson_topic: z.string().min(3, 'Tópico deve ter pelo menos 3 caracteres'),
  content_taught: z.string().optional(),
  activities: z.string().optional(),
  homework_assigned: z.string().optional(),
  observations: z.string().optional(),
});
```

#### Passo 2: Migrar para React Hook Form (4 horas)
```typescript
// pages/Diary.tsx
const form = useForm<DiaryEntryFormData>({
  resolver: zodResolver(diaryEntrySchema),
  defaultValues: {
    class_id: '',
    subject_id: '',
    date: new Date().toISOString().split('T')[0],
    // ...
  },
});
```

#### Passo 3: Extrair Componentes (6 horas)
- `components/diary/DiaryForm.tsx` - Formulário principal
- `components/diary/DiaryFilters.tsx` - Filtros
- `components/diary/DiaryEntryList.tsx` - Lista de entradas
- `components/diary/DiaryEntryCard.tsx` - Card de entrada

#### Passo 4: Otimizar Queries (2 horas)
```typescript
// Usar React Query
const { data: entries } = useQuery({
  queryKey: ['diary-entries', filters],
  queryFn: () => loadEntries(filters),
  staleTime: 2 * 60 * 1000, // 2 minutos
});
```

#### Passo 5: Adicionar Acessibilidade (2 horas)
- Labels em todos os inputs
- `aria-describedby` para hints
- Skip links
- Indicadores de foco

**Tempo Total:** ~16 horas (2 dias)

---

### 1.2 `pages/Evaluations.tsx` - Prioridade ALTA

**Status Atual:**
- 852 linhas
- 26+ `useState`
- Sem React Hook Form
- Sem Zod
- Validação manual

**Plano de Refatoração:**

#### Passo 1: Criar Schemas Zod (2 horas)
```typescript
export const gradeSchema = z.object({
  student_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  period: z.string(),
  grade_value: z.string().optional(),
  conceptual_grade: z.string().optional(),
  descriptive_grade: z.string().optional(),
});

export const attendanceSchema = z.object({
  student_id: z.string().uuid(),
  total_classes: z.string().regex(/^\d+$/, 'Deve ser um número'),
  present_classes: z.string().regex(/^\d+$/, 'Deve ser um número'),
});
```

#### Passo 2: Migrar para React Hook Form (3 horas)
- Criar formulários separados para Grade, Attendance, Report

#### Passo 3: Extrair Componentes (4 horas)
- `components/evaluations/GradeForm.tsx`
- `components/evaluations/AttendanceForm.tsx`
- `components/evaluations/ReportForm.tsx`
- `components/evaluations/EvaluationFilters.tsx`

#### Passo 4: Otimizar Queries (2 horas)
- Usar React Query para grades, attendance, reports

**Tempo Total:** ~11 horas (1.5 dias)

---

### 1.3 `pages/Finance.tsx` - Prioridade ALTA

**Status Atual:**
- 843 linhas
- 28+ `useState`
- Sem React Hook Form
- Sem Zod
- Validação manual de valores monetários

**Plano de Refatoração:**

#### Passo 1: Criar Schemas Zod (2 horas)
```typescript
export const budgetSchema = z.object({
  category: z.enum(['merenda', 'transporte', ...]),
  allocated_amount: z.string().regex(/^\d+\.?\d{0,2}$/, 'Valor inválido'),
  description: z.string().optional(),
});

export const transactionSchema = z.object({
  transaction_type: z.enum(['receita', 'despesa']),
  category: z.string(),
  description: z.string().min(3, 'Descrição obrigatória'),
  amount: z.string().regex(/^\d+\.?\d{0,2}$/, 'Valor inválido'),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
```

#### Passo 2: Migrar para React Hook Form (3 horas)
- Criar formulários separados para Budget e Transaction

#### Passo 3: Extrair Componentes (4 horas)
- `components/finance/BudgetForm.tsx`
- `components/finance/TransactionForm.tsx`
- `components/finance/FinanceFilters.tsx`
- `components/finance/FinanceSummary.tsx`

**Tempo Total:** ~9 horas (1 dia)

---

## 🎯 FASE 2: Consolidar Padrões (Semana 3-4)

### 2.1 Criar Hooks Compartilhados

#### `hooks/useTenantInit.ts` (2 horas)
```typescript
export function useTenantInit() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lógica de inicialização consolidada
  }, []);

  return { tenantId, schoolId, loading };
}
```

#### `hooks/useFilters.ts` (3 horas)
```typescript
export function useFilters<T extends Record<string, any>>(
  initialFilters: T
) {
  const [filters, setFilters] = useState<T>(initialFilters);
  
  const updateFilter = (key: keyof T, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  return { filters, updateFilter, resetFilters };
}
```

### 2.2 Consolidar Schemas Zod

Expandir `lib/validationSchemas.ts` com todos os schemas necessários.

### 2.3 Refatorar Componentes Restantes

- `pages/StaffManagement.tsx` (2 dias)
- `pages/Enrollments.tsx` (2 dias)
- `pages/Schedules.tsx` (1.5 dias)

---

## ⚡ FASE 3: Otimizações de Performance (Semana 5-6)

### 3.1 Implementar Lazy Loading

**Arquivo:** `App.tsx`

```typescript
import { lazy, Suspense } from 'react';
import { PageLoading } from '@/components/PageLoading';

const Diary = lazy(() => import('./pages/Diary'));
const Evaluations = lazy(() => import('./pages/Evaluations'));
const Finance = lazy(() => import('./pages/Finance'));
// ... todas as rotas

// No Router
<Suspense fallback={<PageLoading />}>
  <Routes>
    <Route path="/diary" element={<Diary />} />
    {/* ... */}
  </Routes>
</Suspense>
```

### 3.2 Otimizar React Query

**Arquivo:** `hooks/useStudents.ts`

```typescript
export function useUpdateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateStudent,
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      queryClient.invalidateQueries(['unified-student']);
    },
    onMutate: async (newStudent) => {
      // Optimistic update
      await queryClient.cancelQueries(['students']);
      const previous = queryClient.getQueryData(['students']);
      queryClient.setQueryData(['students'], (old: any) => {
        // Update logic
      });
      return { previous };
    },
    onError: (err, newStudent, context) => {
      queryClient.setQueryData(['students'], context?.previous);
    },
  });
}
```

---

## ♿ FASE 4: Acessibilidade (Semana 7-8)

### 4.1 Adicionar Labels em Todos os Formulários

**Padrão a seguir:**

```typescript
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel htmlFor={field.name}>
        Nome do Campo
        {required && <span aria-label="obrigatório">*</span>}
      </FormLabel>
      <FormControl>
        <Input
          id={field.name}
          aria-describedby={hintId}
          aria-invalid={!!errors.fieldName}
          {...field}
        />
      </FormControl>
      {hint && (
        <FormDescription id={hintId}>{hint}</FormDescription>
      )}
      <FormMessage />
    </FormItem>
  )}
/>
```

### 4.2 Adicionar Skip Links

**Arquivo:** `App.tsx`

```typescript
import { SkipLinks } from '@pei/ui';

<SkipLinks
  links={[
    { id: 'skip-to-content', label: 'Pular para o conteúdo', targetId: 'main-content' },
    { id: 'skip-to-navigation', label: 'Pular para a navegação', targetId: 'main-navigation' },
  ]}
/>
```

---

## 📊 Cronograma de Execução

| Semana | Fase | Componentes | Esforço | Impacto |
|--------|------|-------------|---------|---------|
| 1-2 | FASE 1 | Diary, Evaluations, Finance | 🔴 Alto | 🔴 Crítico |
| 3-4 | FASE 2 | StaffManagement, Enrollments, Schedules | 🟡 Médio | 🔴 Crítico |
| 5-6 | FASE 3 | Lazy loading, React Query, Memoização | 🟡 Médio | 🟡 Médio |
| 7-8 | FASE 4 | Acessibilidade, Componentes médios | 🟢 Baixo | 🟡 Médio |
| 9-10 | FASE 5 | Limpeza, Documentação, Testes | 🟢 Baixo | 🟢 Baixo |

---

## ✅ Checklist de Validação

Para cada componente refatorado, validar:

- [ ] Migrado para React Hook Form
- [ ] Schema Zod criado e testado
- [ ] Componente < 300 linhas
- [ ] Queries otimizadas
- [ ] Lazy loading (se aplicável)
- [ ] Suspense boundary
- [ ] Memoização onde necessário
- [ ] Acessibilidade completa
- [ ] Testes unitários
- [ ] Documentação atualizada

---

**Documento de referência para execução da refatoração**

