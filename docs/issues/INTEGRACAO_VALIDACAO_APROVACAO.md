# Integração de Validação de Aprovação - Frontend

**Status**: ✅ Implementado  
**Data**: Janeiro 2025

---

## O que foi implementado

### 1. Hook `useAttendanceApproval`

**Arquivo**: `apps/gestao-escolar/src/hooks/useAttendanceApproval.ts`

Hook React que valida aprovação de aluno baseado em frequência:

```typescript
const { validateApproval, validating } = useAttendanceApproval();

const result = await validateApproval(
  studentId,
  enrollmentId,
  academicYear
);

if (!result.canApprove) {
  // Bloquear aprovação
  // result.reason contém a mensagem
}
```

**Funcionalidades**:
- ✅ Valida frequência antes de aprovar
- ✅ Bloqueia aprovação se frequência < 75%
- ✅ Mostra toast com mensagem de erro
- ✅ Retorna dados de frequência

---

### 2. Componente `ApprovalGuard`

**Arquivo**: `apps/gestao-escolar/src/components/ApprovalGuard.tsx`

Componente guard que valida frequência antes de permitir aprovação:

```typescript
<ApprovalGuard
  studentId={studentId}
  enrollmentId={enrollmentId}
  academicYear={academicYear}
  onApprovalBlocked={(reason, percentage) => {
    // Callback quando aprovação é bloqueada
  }}
>
  {({ canApprove, validating, onValidate }) => (
    <Button 
      onClick={async () => {
        await onValidate();
        if (canApprove) {
          // Prosseguir com aprovação
        }
      }}
      disabled={validating}
    >
      Aprovar
    </Button>
  )}
</ApprovalGuard>
```

**Funcionalidades**:
- ✅ Validação automática
- ✅ Mostra alerta se bloqueado
- ✅ Render prop pattern para flexibilidade

---

## Como usar

### Opção 1: Usar o Hook diretamente

```typescript
import { useAttendanceApproval } from '@/hooks/useAttendanceApproval';

function ApproveButton({ studentId, enrollmentId }) {
  const { validateApproval, validating } = useAttendanceApproval();
  
  const handleApprove = async () => {
    const result = await validateApproval(studentId, enrollmentId);
    
    if (!result.canApprove) {
      // Já mostra toast automaticamente
      return; // Bloquear aprovação
    }
    
    // Prosseguir com aprovação
    await approveStudent(studentId, enrollmentId);
  };
  
  return (
    <Button onClick={handleApprove} disabled={validating}>
      Aprovar
    </Button>
  );
}
```

### Opção 2: Usar o Componente Guard

```typescript
import { ApprovalGuard } from '@/components/ApprovalGuard';

function ApproveStudentPage({ studentId, enrollmentId }) {
  return (
    <ApprovalGuard
      studentId={studentId}
      enrollmentId={enrollmentId}
    >
      {({ canApprove, validating, onValidate }) => (
        <div>
          <Button 
            onClick={async () => {
              await onValidate();
              if (canApprove) {
                await approveStudent(studentId, enrollmentId);
              }
            }}
            disabled={validating}
          >
            Aprovar Aluno
          </Button>
        </div>
      )}
    </ApprovalGuard>
  );
}
```

---

## Onde integrar

### Locais potenciais para integração:

1. **Página de Avaliações** (`apps/gestao-escolar/src/pages/Evaluations.tsx`)
   - Ao finalizar notas e aprovar aluno

2. **Página de Histórico do Aluno** (`apps/gestao-escolar/src/pages/StudentHistory.tsx`)
   - Ao finalizar ano letivo

3. **Componente de Notas Finais** (se existir)
   - Ao calcular e aprovar aluno

4. **Relatórios de Aprovação** (`apps/gestao-escolar/src/services/reportService.ts`)
   - Ao gerar relatório de aprovação

---

## Validação da Interface de Alertas

### Status: ✅ Interface Implementada

**Arquivo**: `apps/gestao-escolar/src/components/AttendanceAlertsDashboard.tsx`

**Funcionalidades**:
- ✅ Lista de alunos abaixo do threshold
- ✅ Filtros por status (Todos, Críticos, Alertas)
- ✅ Estatísticas (Total, Críticos, Alertas)
- ✅ Gráfico de distribuição
- ✅ Detalhes de cada alerta
- ✅ Integrado na página `/alerts` (tab "Frequência (75%)")

**Testes necessários**:
- [ ] Acessar página `/alerts`
- [ ] Verificar tab "Frequência (75%)"
- [ ] Testar carregamento de alertas
- [ ] Validar filtros
- [ ] Verificar gráficos
- [ ] Testar responsividade

---

## Próximos Passos

1. ✅ Hook e componente criados
2. ⏳ Integrar em páginas de aprovação
3. ⏳ Testar interface de alertas
4. ⏳ Documentar uso para desenvolvedores

---

**Última atualização**: Janeiro 2025

