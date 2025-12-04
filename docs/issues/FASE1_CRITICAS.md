# Fase 1: Itens Críticos - Issues/Tasks

**Prioridade**: 🔴 Crítica  
**Duração Estimada**: 1-2 meses  
**Status**: 🟡 Em Planejamento

---

## Issue #1: Validação de Frequência Mínima (75%)

**Prioridade**: 🔴 P0 - Crítica  
**Esforço**: Médio (2-3 semanas)  
**Impacto**: Alto - Requisito legal obrigatório  
**Status**: 📋 Backlog

### Descrição

Implementar validação automática de frequência mínima de 75% conforme legislação brasileira. Sistema deve calcular frequência mensal/anual, gerar alertas automáticos e bloquear aprovação se frequência < 75%.

### Tarefas

- [ ] **T1.1**: Criar função RPC `calculate_student_attendance_percentage(student_id, enrollment_id, period_start, period_end)`
  - Calcular frequência mensal e anual
  - Considerar justificativas (faltas justificadas não contam)
  - Retornar: `{ attendance_percentage, total_classes, present_classes, absent_classes, justified_absences, status }`
  - Status: OK (>=75%), ALERTA (50-74%), CRÍTICO (<50%)

- [ ] **T1.2**: Criar tabela `attendance_alerts` (se não existir)
  ```sql
  CREATE TABLE attendance_alerts (
    id uuid PRIMARY KEY,
    student_id uuid REFERENCES students(id),
    enrollment_id uuid REFERENCES enrollments(id),
    period_start date,
    period_end date,
    attendance_percentage decimal(5,2),
    status text CHECK (status IN ('OK', 'ALERTA', 'CRÍTICO')),
    notified_at timestamptz,
    resolved_at timestamptz,
    created_at timestamptz DEFAULT now()
  );
  ```

- [ ] **T1.3**: Criar trigger `check_minimum_attendance()`
  - Executar após INSERT/UPDATE em `attendance`
  - Calcular frequência do mês atual
  - Se < 75%, criar/atualizar alerta em `attendance_alerts`
  - Notificar professores e coordenadores

- [ ] **T1.4**: Criar função RPC `get_students_below_attendance_threshold(school_id, threshold, period_start, period_end)`
  - Retornar lista de alunos abaixo do threshold
  - Incluir dados do aluno, turma, frequência atual

- [ ] **T1.5**: Implementar validação no sistema de aprovação
  - Verificar frequência antes de permitir aprovação
  - Bloquear aprovação se frequência < 75%
  - Mostrar mensagem clara ao usuário

- [ ] **T1.6**: Criar componente `AttendanceAlertsDashboard`
  - Lista de alunos abaixo de 75%
  - Gráficos de tendência
  - Filtros por escola, turma, período
  - Ações recomendadas

- [ ] **T1.7**: Criar serviço `attendanceService.ts`
  - Métodos: `calculateAttendance()`, `getAlerts()`, `checkMinimumAttendance()`

- [ ] **T1.8**: Testes
  - Testar cálculo com diferentes cenários
  - Testar trigger com inserções em massa
  - Testar bloqueio de aprovação

### Critérios de Aceite

- ✅ Função calcula frequência corretamente (considerando justificativas)
- ✅ Alertas são gerados automaticamente quando frequência < 75%
- ✅ Aprovação é bloqueada se frequência < 75%
- ✅ Dashboard mostra alertas de forma clara
- ✅ Notificações são enviadas para professores/coordenadores

### Arquivos a Criar/Modificar

- `supabase/migrations/YYYYMMDDHHMMSS_attendance_validation.sql`
- `apps/gestao-escolar/src/services/attendanceService.ts`
- `apps/gestao-escolar/src/components/AttendanceAlertsDashboard.tsx`
- `apps/gestao-escolar/src/pages/Alerts.tsx` (adicionar seção)

### Dependências

- Nenhuma

---

## Issue #2: Geração de Arquivo Educacenso (TXT)

**Prioridade**: 🔴 P0 - Crítica  
**Esforço**: Médio (2-3 semanas)  
**Impacto**: Alto - Necessário para envio ao MEC  
**Status**: 📋 Backlog

### Descrição

Implementar geração de arquivo TXT no layout oficial do Educacenso/Censo Escolar para envio ao MEC. Sistema deve validar dados antes de gerar e criar relatório de inconsistências.

### Tarefas

- [ ] **T2.1**: Estudar layout oficial do Educacenso
  - Documentação do MEC/INEP
  - Formatos de arquivo (TXT, delimitadores, codificação)
  - Estrutura de registros (00, 20, 30, 40, 50, 60)
  - Validações obrigatórias

- [ ] **T2.2**: Criar função RPC `generate_educacenso_file(tenant_id, school_id, academic_year)`
  - Gerar arquivo TXT no layout oficial
  - Incluir todos os registros necessários
  - Validar dados antes de gerar
  - Retornar arquivo como base64 ou texto

- [ ] **T2.3**: Criar Edge Function `educacenso-export`
  - Receber parâmetros: `{ tenantId, schoolId, academicYear }`
  - Chamar função RPC
  - Retornar arquivo para download
  - Headers corretos para download

- [ ] **T2.4**: Implementar validação de dados pré-exportação
  - Verificar campos obrigatórios
  - Validar formatos (CPF, datas, códigos INEP)
  - Verificar relacionamentos (aluno-turma, turma-escola)
  - Gerar relatório de inconsistências

- [ ] **T2.5**: Criar tabela `educacenso_exports`
  ```sql
  CREATE TABLE educacenso_exports (
    id uuid PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id),
    school_id uuid REFERENCES schools(id),
    academic_year integer,
    file_name text,
    file_size bigint,
    records_count jsonb, -- {escolas: 1, turmas: 10, alunos: 200, ...}
    validation_errors jsonb,
    exported_by uuid REFERENCES auth.users(id),
    exported_at timestamptz DEFAULT now()
  );
  ```

- [ ] **T2.6**: Criar interface de exportação
  - Página `Censo.tsx` com formulário de exportação
  - Seleção de ano letivo e escola(s)
  - Botão de exportar
  - Download do arquivo
  - Visualização de relatório de inconsistências

- [ ] **T2.7**: Criar serviço `educacensoService.ts`
  - Métodos: `validateData()`, `generateFile()`, `downloadFile()`, `getExportHistory()`

- [ ] **T2.8**: Testes
  - Testar geração com dados válidos
  - Testar validação com dados inválidos
  - Validar formato do arquivo gerado
  - Testar com arquivo real do MEC (se possível)

### Critérios de Aceite

- ✅ Arquivo gerado no formato oficial do Educacenso
- ✅ Todos os registros necessários incluídos
- ✅ Validação de dados implementada
- ✅ Relatório de inconsistências gerado
- ✅ Arquivo aceito pelo sistema do MEC (teste real)

### Arquivos a Criar/Modificar

- `supabase/functions/educacenso-export/index.ts`
- `supabase/migrations/YYYYMMDDHHMMSS_educacenso_export.sql`
- `apps/gestao-escolar/src/services/educacensoService.ts`
- `apps/gestao-escolar/src/pages/Censo.tsx`

### Dependências

- Issue #3 (Validação de Dados) - pode ser feito em paralelo

---

## Issue #3: Validação de Dados para Exportação Educacenso

**Prioridade**: 🔴 P0 - Crítica  
**Esforço**: Médio (1-2 semanas)  
**Impacto**: Alto - Evita rejeição pelo MEC  
**Status**: 📋 Backlog

### Descrição

Implementar sistema de validação de dados antes da exportação para Educacenso. Sistema deve verificar campos obrigatórios, formatos e relacionamentos, gerando relatório de inconsistências.

### Tarefas

- [ ] **T3.1**: Criar tabela `educacenso_validation_rules`
  ```sql
  CREATE TABLE educacenso_validation_rules (
    id uuid PRIMARY KEY,
    rule_code text UNIQUE NOT NULL,
    table_name text NOT NULL,
    field_name text,
    rule_type text NOT NULL, -- 'required', 'format', 'unique', 'relationship', 'range'
    rule_value jsonb, -- Valores específicos da regra
    error_message text NOT NULL,
    severity text CHECK (severity IN ('error', 'warning')),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
  );
  ```

- [ ] **T3.2**: Popular regras de validação
  - Campos obrigatórios por registro
  - Formatos (CPF, datas, códigos INEP)
  - Relacionamentos obrigatórios
  - Valores permitidos (enums)

- [ ] **T3.3**: Criar função RPC `validate_educacenso_data(tenant_id, school_id, academic_year)`
  - Validar todos os registros necessários
  - Aplicar regras de validação
  - Retornar lista de inconsistências

- [ ] **T3.4**: Criar tabela `educacenso_validation_results`
  ```sql
  CREATE TABLE educacenso_validation_results (
    id uuid PRIMARY KEY,
    validation_id uuid,
    table_name text NOT NULL,
    record_id uuid,
    record_identifier text, -- Nome/CPF para identificação
    field_name text,
    rule_code text,
    error_code text,
    error_message text NOT NULL,
    severity text CHECK (severity IN ('error', 'warning')),
    suggested_fix text,
    created_at timestamptz DEFAULT now()
  );
  ```

- [ ] **T3.5**: Implementar validações específicas
  - CPF válido (algoritmo) e único
  - Código INEP no formato correto (12 dígitos)
  - Datas válidas e dentro de ranges aceitáveis
  - Campos obrigatórios preenchidos
  - Relacionamentos válidos (aluno em turma, turma em escola)

- [ ] **T3.6**: Criar interface de validação
  - Página de validação pré-exportação
  - Lista de inconsistências agrupadas por tipo
  - Filtros por severidade, tabela, campo
  - Correção em massa (quando possível)
  - Link direto para correção

- [ ] **T3.7**: Criar serviço `validationService.ts`
  - Métodos: `validateEducacensoData()`, `getValidationResults()`, `fixValidationError()`

- [ ] **T3.8**: Testes
  - Testar todas as regras de validação
  - Testar com dados válidos e inválidos
  - Testar correção em massa

### Critérios de Aceite

- ✅ Todas as validações obrigatórias do Educacenso implementadas
- ✅ Relatório de inconsistências gerado corretamente
- ✅ Interface de correção disponível
- ✅ Validação executada antes de exportar
- ✅ Correções podem ser feitas em massa quando possível

### Arquivos a Criar/Modificar

- `supabase/migrations/YYYYMMDDHHMMSS_educacenso_validation.sql`
- `apps/gestao-escolar/src/services/validationService.ts`
- `apps/gestao-escolar/src/pages/Censo.tsx` (adicionar validação)
- `apps/gestao-escolar/src/components/ValidationResults.tsx`

### Dependências

- Nenhuma (pode ser feito em paralelo com Issue #2)

---

## Issue #4: Campos Faltantes Críticos

**Prioridade**: 🔴 P0 - Crítica  
**Esforço**: Baixo (3-5 dias)  
**Impacto**: Médio - Necessário para exportação completa  
**Status**: 📋 Backlog

### Descrição

Adicionar campos faltantes críticos nas tabelas para permitir exportação completa para Educacenso. Verificar e adicionar campos mencionados em views mas não presentes nas tabelas.

### Tarefas

- [ ] **T4.1**: Verificar campos em `schools`
  - Verificar se `municipio_ibge` existe
  - Verificar se `uf` (estado) existe
  - Verificar se `zona` existe
  - Verificar se `localizacao` existe
  - Adicionar campos faltantes

- [ ] **T4.2**: Adicionar NIS em `students` (se necessário)
  - Campo `nis` (Número de Identificação Social)
  - Índice único
  - Comentário explicativo

- [ ] **T4.3**: Verificar campo Bolsa Família
  - Verificar se `numero_bolsa_familia` existe na tabela `students`
  - Se não existir, adicionar
  - Índice para busca

- [ ] **T4.4**: Atualizar views de exportação
  - Garantir que todos os campos estão sendo exportados
  - Verificar mapeamentos corretos
  - Testar views atualizadas

- [ ] **T4.5**: Criar migração consolidada
  - Agrupar todas as alterações em uma migração
  - Incluir comentários explicativos
  - Incluir índices necessários

- [ ] **T4.6**: Testes
  - Verificar que campos foram adicionados
  - Testar views de exportação
  - Validar que dados podem ser exportados

### Critérios de Aceite

- ✅ Todos os campos obrigatórios do Educacenso presentes
- ✅ Views de exportação atualizadas
- ✅ Dados podem ser exportados sem campos vazios críticos
- ✅ Índices criados para performance

### Arquivos a Criar/Modificar

- `supabase/migrations/YYYYMMDDHHMMSS_add_missing_fields.sql`
- `supabase/migrations/20250117211257_create_inep_export_views.sql` (atualizar se necessário)

### Dependências

- Nenhuma

---

## Progresso da Fase 1

| Issue | Prioridade | Status | Progresso |
|-------|------------|--------|-----------|
| #1: Validação Frequência | P0 | 📋 Backlog | 0% |
| #2: Geração Arquivo Educacenso | P0 | 📋 Backlog | 0% |
| #3: Validação de Dados | P0 | 📋 Backlog | 0% |
| #4: Campos Faltantes | P0 | 📋 Backlog | 0% |

**Progresso Geral**: 0/4 issues (0%)

---

## Próximos Passos

1. ✅ Issues criadas
2. ⏳ Priorizar ordem de implementação
3. ⏳ Atribuir responsáveis
4. ⏳ Iniciar Issue #4 (mais simples, pode ser feito primeiro)
5. ⏳ Em paralelo: Issues #2 e #3
6. ⏳ Por último: Issue #1 (mais complexa)

---

**Última atualização**: Janeiro 2025

