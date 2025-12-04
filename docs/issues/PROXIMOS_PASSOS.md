# Próximos Passos - Fase 1

**Status Atual**: Migrações aplicadas, iniciando testes e validações

---

## ✅ Concluído

1. ✅ Issues criadas e documentadas
2. ✅ Migrações SQL criadas
3. ✅ Serviços e componentes frontend criados
4. ✅ **Migrações aplicadas no banco de dados**

---

## 🟡 Em Andamento

### Issue #1: Validação de Frequência (90% completo)

**Faltam**:
- [ ] Testar funções RPC com dados reais
- [ ] Testar triggers
- [ ] Validar frontend
- [ ] Integrar validação de aprovação

---

## 📋 Próximas Ações (Ordem de Prioridade)

### 1. Testar Funções RPC (URGENTE)

**Objetivo**: Validar que todas as funções estão funcionando corretamente

**Tarefas**:
- [ ] Testar `calculate_student_attendance_percentage()` com dados reais
- [ ] Testar `check_and_create_attendance_alert()` 
- [ ] Testar `get_students_below_attendance_threshold()`
- [ ] Testar `can_approve_student()`
- [ ] Testar `check_school_educacenso_fields()`

**Como testar**:
```sql
-- Exemplo de teste
SELECT calculate_student_attendance_percentage(
  (SELECT id FROM students WHERE name IS NOT NULL LIMIT 1),
  (SELECT id FROM enrollments LIMIT 1),
  '2025-01-01'::date,
  '2025-01-31'::date
);
```

**Estimativa**: 1-2 horas

---

### 2. Testar Triggers (URGENTE)

**Objetivo**: Validar que triggers criam alertas automaticamente

**Tarefas**:
- [ ] Inserir frequência e verificar se alerta é criado
- [ ] Atualizar frequência e verificar se alerta é atualizado
- [ ] Testar com frequência >= 75% (não deve criar alerta)
- [ ] Testar com frequência < 75% (deve criar alerta)

**Como testar**:
```sql
-- Inserir frequência
INSERT INTO attendance (student_id, data, presenca, justificativa)
VALUES (
  (SELECT id FROM students LIMIT 1),
  CURRENT_DATE,
  false,
  NULL
);

-- Verificar alerta
SELECT * FROM attendance_alerts 
WHERE student_id = (SELECT id FROM students LIMIT 1)
ORDER BY created_at DESC;
```

**Estimativa**: 1 hora

---

### 3. Validar Frontend (IMPORTANTE)

**Objetivo**: Garantir que interface está funcionando

**Tarefas**:
- [ ] Acessar página `/alerts`
- [ ] Verificar se tab "Frequência (75%)" aparece
- [ ] Testar carregamento de alertas
- [ ] Validar filtros (todos, críticos, alertas)
- [ ] Testar gráficos e visualizações
- [ ] Verificar responsividade

**Estimativa**: 2-3 horas

---

### 4. Integrar Validação de Aprovação (CRÍTICO)

**Objetivo**: Bloquear aprovação se frequência < 75%

**Tarefas**:
- [ ] Localizar código de aprovação no sistema
- [ ] Adicionar chamada a `can_approve_student()` antes de aprovar
- [ ] Bloquear aprovação se `can_approve = false`
- [ ] Mostrar mensagem clara ao usuário
- [ ] Testar fluxo completo

**Código exemplo**:
```typescript
// No componente de aprovação
const handleApprove = async () => {
  // Validar frequência
  const validation = await attendanceService.canApproveStudent(
    studentId,
    enrollmentId,
    academicYear
  );

  if (!validation.can_approve) {
    toast.error(validation.reason);
    return;
  }

  // Continuar com aprovação...
};
```

**Estimativa**: 2-3 horas

---

### 5. Iniciar Issue #2: Geração Arquivo Educacenso

**Objetivo**: Começar implementação da exportação

**Tarefas**:
- [ ] Estudar layout oficial do Educacenso
- [ ] Documentar estrutura de arquivo TXT
- [ ] Criar função RPC básica
- [ ] Criar Edge Function

**Estimativa**: 1-2 semanas

---

### 6. Iniciar Issue #3: Validação de Dados

**Objetivo**: Começar sistema de validação

**Tarefas**:
- [ ] Criar tabela `educacenso_validation_rules`
- [ ] Popular regras básicas
- [ ] Criar função de validação

**Estimativa**: 1 semana

---

## Ordem Recomendada de Execução

1. **Testar Funções RPC** (1-2h) - Validar backend
2. **Testar Triggers** (1h) - Validar automação
3. **Validar Frontend** (2-3h) - Validar interface
4. **Integrar Validação Aprovação** (2-3h) - Completar Issue #1
5. **Iniciar Issue #2** (paralelo) - Começar exportação
6. **Iniciar Issue #3** (paralelo) - Começar validação

**Tempo total estimado**: 6-9 horas para completar Issue #1

---

## Riscos e Mitigações

### Risco 1: Funções podem ter erros de sintaxe
**Mitigação**: Testar todas as funções antes de usar em produção

### Risco 2: Triggers podem impactar performance
**Mitigação**: Monitorar performance, adicionar índices se necessário

### Risco 3: Frontend pode não carregar dados
**Mitigação**: Verificar RLS policies, testar com diferentes usuários

### Risco 4: Validação pode quebrar fluxo existente
**Mitigação**: Implementar gradualmente, com feature flag

---

## Métricas de Sucesso

### Issue #1 (Validação Frequência)
- ✅ Funções criadas
- ✅ Triggers criados
- ⏳ Funções testadas
- ⏳ Triggers testados
- ⏳ Frontend validado
- ⏳ Validação de aprovação integrada

---

**Última atualização**: Janeiro 2025

