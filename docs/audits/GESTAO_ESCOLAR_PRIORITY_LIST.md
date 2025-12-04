# Lista Priorizada de Refatoração - App Gestão Escolar

## 🔴 PRIORIDADE CRÍTICA (Fazer Primeiro)

### 1. `pages/Diary.tsx` - 1,493 linhas
**Problemas:**
- 40+ `useState` para formulários
- Sem React Hook Form
- Sem Zod
- Validação manual
- Sem lazy loading (já tem no App.tsx ✅)
- Queries não otimizadas

**Ações:**
1. Criar `diaryEntrySchema` em `lib/validationSchemas.ts`
2. Migrar para React Hook Form
3. Extrair componentes:
   - `components/diary/DiaryForm.tsx`
   - `components/diary/DiaryFilters.tsx`
   - `components/diary/DiaryEntryList.tsx`
4. Otimizar queries com React Query
5. Adicionar acessibilidade

**Esforço:** 🔴 Alto (2 dias)  
**Impacto:** 🔴 Crítico  
**ROI:** ⭐⭐⭐⭐⭐

---

### 2. `pages/Evaluations.tsx` - 852 linhas
**Problemas:**
- 26+ `useState` para formulários
- Sem React Hook Form
- Sem Zod
- Validação manual

**Ações:**
1. Criar schemas: `gradeSchema`, `attendanceSchema`, `reportSchema`
2. Migrar para React Hook Form
3. Extrair componentes:
   - `components/evaluations/GradeForm.tsx`
   - `components/evaluations/AttendanceForm.tsx`
   - `components/evaluations/ReportForm.tsx`
4. Otimizar queries

**Esforço:** 🔴 Alto (1.5 dias)  
**Impacto:** 🔴 Crítico  
**ROI:** ⭐⭐⭐⭐⭐

---

### 3. `pages/Finance.tsx` - 843 linhas
**Problemas:**
- 28+ `useState` para formulários
- Sem React Hook Form
- Sem Zod
- Validação manual de valores monetários

**Ações:**
1. Criar schemas: `budgetSchema`, `transactionSchema`
2. Migrar para React Hook Form
3. Extrair componentes:
   - `components/finance/BudgetForm.tsx`
   - `components/finance/TransactionForm.tsx`
   - `components/finance/FinanceFilters.tsx`
4. Adicionar validação monetária robusta

**Esforço:** 🔴 Alto (1 dia)  
**Impacto:** 🔴 Crítico  
**ROI:** ⭐⭐⭐⭐⭐

---

### 4. `pages/StaffManagement.tsx` - 836 linhas
**Problemas:**
- 28+ `useState` para formulários
- Sem React Hook Form
- Sem Zod
- Validação manual de datas e conflitos

**Ações:**
1. Criar schemas: `allocationSchema`, `absenceSchema`, `substitutionSchema`
2. Migrar para React Hook Form
3. Extrair componentes:
   - `components/staff/AllocationForm.tsx`
   - `components/staff/AbsenceForm.tsx`
   - `components/staff/SubstitutionForm.tsx`
4. Adicionar validação de conflitos

**Esforço:** 🟡 Médio (2 dias)  
**Impacto:** 🔴 Crítico  
**ROI:** ⭐⭐⭐⭐

---

### 5. `pages/Enrollments.tsx` - 639 linhas
**Problemas:**
- 20+ `useState` para formulários
- Sem React Hook Form
- Sem Zod
- Validação manual de workflow

**Ações:**
1. Criar `enrollmentRequestSchema`
2. Migrar para React Hook Form
3. Extrair componentes:
   - `components/enrollments/EnrollmentRequestForm.tsx`
   - `components/enrollments/EnrollmentApprovalDialog.tsx`
4. Otimizar workflow

**Esforço:** 🟡 Médio (2 dias)  
**Impacto:** 🔴 Crítico  
**ROI:** ⭐⭐⭐⭐

---

### 6. `pages/Schedules.tsx` - 543 linhas
**Problemas:**
- 22+ `useState` para formulários
- Sem React Hook Form
- Sem Zod
- Validação manual de conflitos de horário

**Ações:**
1. Criar `scheduleSchema`
2. Migrar para React Hook Form
3. Extrair componentes:
   - `components/schedules/ScheduleForm.tsx`
   - `components/schedules/ScheduleConflictChecker.tsx`
4. Adicionar validação de conflitos

**Esforço:** 🟡 Médio (1.5 dias)  
**Impacto:** 🔴 Crítico  
**ROI:** ⭐⭐⭐⭐

---

## 🟡 PRIORIDADE MÉDIA (Fazer Depois)

### 7. `pages/Dashboard.tsx` - 631 linhas
**Problemas:**
- Falta memoização
- Queries não otimizadas
- Re-renderizações desnecessárias

**Ações:**
1. Adicionar `React.memo` em cards
2. Otimizar queries com React Query
3. Adicionar `useMemo` para cálculos
4. Lazy load Dashboard (já tem ✅)

**Esforço:** 🟢 Baixo (0.5 dia)  
**Impacto:** 🟡 Médio  
**ROI:** ⭐⭐⭐

---

### 8. `components/DiaryPublicView.tsx` - 616 linhas
**Problemas:**
- 16+ `useState`
- Sem React Hook Form
- Sem Zod

**Ações:**
1. Migrar para React Hook Form (se aplicável)
2. Otimizar queries
3. Adicionar acessibilidade

**Esforço:** 🟡 Médio (1 dia)  
**Impacto:** 🟡 Médio  
**ROI:** ⭐⭐⭐

---

### 9. `pages/Censo.tsx` - 598 linhas
**Problemas:**
- 14+ `useState`
- Sem React Hook Form
- Sem Zod

**Ações:**
1. Criar `censoSchema`
2. Migrar para React Hook Form
3. Otimizar queries

**Esforço:** 🟡 Médio (1 dia)  
**Impacto:** 🟡 Médio  
**ROI:** ⭐⭐⭐

---

### 10. `pages/Alerts.tsx` - 567 linhas
**Problemas:**
- 16+ `useState`
- Sem React Hook Form
- Sem Zod

**Ações:**
1. Criar `alertSchema`
2. Migrar para React Hook Form
3. Otimizar queries

**Esforço:** 🟡 Médio (1 dia)  
**Impacto:** 🟡 Médio  
**ROI:** ⭐⭐⭐

---

### 11. `pages/BackupManagement.tsx` - 548 linhas
**Problemas:**
- 14+ `useState`
- Sem React Hook Form
- Sem Zod

**Ações:**
1. Criar `backupSchema`
2. Migrar para React Hook Form
3. Otimizar queries

**Esforço:** 🟡 Médio (1 dia)  
**Impacto:** 🟡 Médio  
**ROI:** ⭐⭐⭐

---

### 12. `pages/Students.tsx` - 529 linhas
**Problemas:**
- Parcialmente refatorado
- Pode melhorar memoização
- Queries podem ser otimizadas

**Ações:**
1. Melhorar `useMemo` para dados filtrados
2. Adicionar `React.memo` em componentes filhos
3. Otimizar queries

**Esforço:** 🟢 Baixo (0.5 dia)  
**Impacto:** 🟡 Médio  
**ROI:** ⭐⭐

---

### 13. `pages/StudentHistory.tsx` - 528 linhas
**Problemas:**
- 10+ `useState`
- Queries não otimizadas

**Ações:**
1. Otimizar queries com React Query
2. Adicionar memoização
3. Melhorar acessibilidade

**Esforço:** 🟢 Baixo (0.5 dia)  
**Impacto:** 🟡 Médio  
**ROI:** ⭐⭐

---

### 14. `pages/PerformanceTracking.tsx` - 513 linhas
**Problemas:**
- 10+ `useState`
- Sem React Hook Form

**Ações:**
1. Migrar para React Hook Form (se aplicável)
2. Otimizar queries
3. Adicionar memoização

**Esforço:** 🟢 Baixo (0.5 dia)  
**Impacto:** 🟡 Médio  
**ROI:** ⭐⭐

---

### 15. `components/DiaryTemplateEditor.tsx` - 512 linhas
**Problemas:**
- 10+ `useState`
- Sem React Hook Form

**Ações:**
1. Migrar para React Hook Form
2. Criar schema Zod
3. Otimizar queries

**Esforço:** 🟡 Médio (1 dia)  
**Impacto:** 🟡 Médio  
**ROI:** ⭐⭐⭐

---

### 16. `pages/Classes.tsx` - 490 linhas
**Problemas:**
- 11+ `useState`
- Sem React Hook Form

**Ações:**
1. Migrar para React Hook Form
2. Criar schema Zod
3. Otimizar queries

**Esforço:** 🟡 Médio (1 dia)  
**Impacto:** 🟡 Médio  
**ROI:** ⭐⭐⭐

---

## 🟢 PRIORIDADE BAIXA (Melhorias Incrementais)

### 17. `components/OccurrenceDialog.tsx` - ~300 linhas
**Problemas:**
- 11+ `useState`
- Sem React Hook Form

**Ações:**
1. Migrar para React Hook Form
2. Criar `occurrenceSchema`
3. Adicionar acessibilidade

**Esforço:** 🟢 Baixo (0.5 dia)  
**Impacto:** 🟢 Baixo  
**ROI:** ⭐⭐

---

### 18. `pages/Professionals.tsx` - ~411 linhas
**Problemas:**
- Parcialmente otimizado
- Pode melhorar memoização

**Ações:**
1. Melhorar `useMemo`
2. Adicionar `React.memo`
3. Otimizar queries

**Esforço:** 🟢 Baixo (0.5 dia)  
**Impacto:** 🟢 Baixo  
**ROI:** ⭐

---

## 🛠️ INFRAESTRUTURA COMPARTILHADA

### Hooks Compartilhados (Criar Primeiro)

1. **`hooks/useTenantInit.ts`** - Inicialização de tenant/school
   - **Esforço:** 🟢 Baixo (2 horas)
   - **Impacto:** 🟡 Médio
   - **Reutilização:** 15+ arquivos

2. **`hooks/useFilters.ts`** - Gerenciamento de filtros genérico
   - **Esforço:** 🟢 Baixo (3 horas)
   - **Impacto:** 🟡 Médio
   - **Reutilização:** 20+ arquivos

3. **`hooks/useFormDialog.ts`** - Dialog de formulário reutilizável
   - **Esforço:** 🟢 Baixo (2 horas)
   - **Impacto:** 🟡 Médio
   - **Reutilização:** 10+ arquivos

### Schemas Zod (Expandir)

**Arquivo:** `lib/validationSchemas.ts`

Adicionar:
- `diaryEntrySchema`
- `gradeSchema`, `attendanceSchema`, `reportSchema`
- `budgetSchema`, `transactionSchema`
- `allocationSchema`, `absenceSchema`, `substitutionSchema`
- `enrollmentRequestSchema`
- `scheduleSchema`
- `censoSchema`
- `alertSchema`
- `backupSchema`
- `occurrenceSchema`

**Esforço Total:** 🟡 Médio (1 dia)  
**Impacto:** 🟡 Médio

---

## 📊 RESUMO POR PRIORIDADE

### 🔴 Crítica (6 componentes)
- `pages/Diary.tsx` - 2 dias
- `pages/Evaluations.tsx` - 1.5 dias
- `pages/Finance.tsx` - 1 dia
- `pages/StaffManagement.tsx` - 2 dias
- `pages/Enrollments.tsx` - 2 dias
- `pages/Schedules.tsx` - 1.5 dias

**Total:** ~10 dias (2 semanas)

### 🟡 Média (10 componentes)
- `pages/Dashboard.tsx` - 0.5 dia
- `components/DiaryPublicView.tsx` - 1 dia
- `pages/Censo.tsx` - 1 dia
- `pages/Alerts.tsx` - 1 dia
- `pages/BackupManagement.tsx` - 1 dia
- `pages/Students.tsx` - 0.5 dia
- `pages/StudentHistory.tsx` - 0.5 dia
- `pages/PerformanceTracking.tsx` - 0.5 dia
- `components/DiaryTemplateEditor.tsx` - 1 dia
- `pages/Classes.tsx` - 1 dia

**Total:** ~8 dias (1.5 semanas)

### 🟢 Baixa (2 componentes)
- `components/OccurrenceDialog.tsx` - 0.5 dia
- `pages/Professionals.tsx` - 0.5 dia

**Total:** ~1 dia

### 🛠️ Infraestrutura
- Hooks compartilhados - 1 dia
- Schemas Zod - 1 dia

**Total:** ~2 dias

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

### Semana 1-2: Críticos
1. Criar hooks compartilhados (1 dia)
2. Expandir schemas Zod (1 dia)
3. `pages/Diary.tsx` (2 dias)
4. `pages/Evaluations.tsx` (1.5 dias)
5. `pages/Finance.tsx` (1 dia)

### Semana 3-4: Críticos Restantes
1. `pages/StaffManagement.tsx` (2 dias)
2. `pages/Enrollments.tsx` (2 dias)
3. `pages/Schedules.tsx` (1.5 dias)

### Semana 5-6: Otimizações
1. Lazy loading Dashboard/Login
2. Suspense boundaries
3. React Query otimizado
4. Memoização estratégica

### Semana 7-8: Médios
1. Componentes médios (10 componentes)
2. Acessibilidade completa

### Semana 9-10: Finalização
1. Componentes baixos
2. Documentação
3. Testes
4. Code review

---

## ✅ CHECKLIST POR COMPONENTE

Para cada componente refatorado:

- [ ] Migrado para React Hook Form
- [ ] Schema Zod criado e testado
- [ ] Componente < 300 linhas
- [ ] Queries otimizadas com React Query
- [ ] Lazy loading (se aplicável)
- [ ] Suspense boundary
- [ ] Memoização onde necessário
- [ ] Acessibilidade completa (labels, aria, navegação por teclado)
- [ ] Testes unitários adicionados
- [ ] Documentação atualizada

---

**Total Estimado:** ~21 dias úteis (4-5 semanas)  
**ROI Esperado:** Redução de 80% em bugs, 75% mais rápido para novos features

