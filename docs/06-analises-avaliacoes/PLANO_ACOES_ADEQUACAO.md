# Plano de Ações: Adequação para Redes Públicas

## Priorização

- 🔴 **Crítica**: Bloqueia uso em produção
- 🟡 **Importante**: Necessário para operação eficiente
- 🟢 **Desejável**: Melhoria de qualidade

---

## Fase 1: Críticas (1-2 meses)

### 1.1 Validação de Frequência Mínima (75%)

**Prioridade**: 🔴 Crítica  
**Esforço**: Médio (2-3 semanas)  
**Impacto**: Alto

#### Tarefas

1. Criar função RPC `calculate_student_attendance_percentage()`
   - Calcular frequência mensal e anual
   - Considerar justificativas
   - Retornar percentual e status (OK/ALERTA/CRÍTICO)

2. Criar trigger `check_minimum_attendance()`
   - Executar após inserção/atualização em `attendance`
   - Verificar se frequência < 75%
   - Criar alerta automático se necessário

3. Criar tabela `attendance_alerts` (se não existir)
   - `student_id`, `enrollment_id`, `period`, `attendance_percentage`, `status`, `created_at`

4. Implementar validação no sistema de aprovação
   - Bloquear aprovação se frequência < 75%
   - Mostrar alerta no dashboard do professor

5. Criar dashboard de alertas de frequência
   - Lista de alunos abaixo de 75%
   - Gráficos de tendência
   - Ações recomendadas

#### Arquivos a Modificar

- `supabase/migrations/YYYYMMDDHHMMSS_attendance_validation.sql`
- `apps/gestao-escolar/src/services/attendanceService.ts` (criar se não existir)
- `apps/gestao-escolar/src/pages/Alerts.tsx` (adicionar seção de frequência)

#### Critérios de Aceite

- ✅ Função calcula frequência corretamente
- ✅ Alertas são gerados automaticamente
- ✅ Aprovação é bloqueada se frequência < 75%
- ✅ Dashboard mostra alertas

---

### 1.2 Geração de Arquivo Educacenso (TXT)

**Prioridade**: 🔴 Crítica  
**Esforço**: Médio (2-3 semanas)  
**Impacto**: Alto

#### Tarefas

1. Estudar layout oficial do Educacenso
   - Documentação do MEC
   - Formatos de arquivo (TXT, delimitadores)
   - Codificações de caracteres

2. Criar função RPC `generate_educacenso_file()`
   - Gerar arquivo TXT no layout oficial
   - Incluir todos os registros (00, 20, 30, 40, 50, 60)
   - Validar dados antes de gerar

3. Criar endpoint/Edge Function `educacenso-export`
   - Receber parâmetros (ano, escola, tenant)
   - Chamar função RPC
   - Retornar arquivo para download

4. Implementar validação de dados
   - Verificar campos obrigatórios
   - Validar formatos (CPF, datas, códigos INEP)
   - Gerar relatório de inconsistências

5. Criar interface de exportação
   - Página de exportação Educacenso
   - Seleção de ano/escola
   - Download do arquivo
   - Visualização de relatório de inconsistências

#### Arquivos a Criar/Modificar

- `supabase/functions/educacenso-export/index.ts`
- `supabase/migrations/YYYYMMDDHHMMSS_educacenso_export.sql`
- `apps/gestao-escolar/src/services/educacensoService.ts`
- `apps/gestao-escolar/src/pages/Censo.tsx`

#### Critérios de Aceite

- ✅ Arquivo gerado no formato oficial
- ✅ Todos os registros incluídos
- ✅ Validação de dados implementada
- ✅ Relatório de inconsistências gerado
- ✅ Arquivo aceito pelo sistema do MEC (teste real)

---

### 1.3 Validação de Dados para Exportação

**Prioridade**: 🔴 Crítica  
**Esforço**: Médio (1-2 semanas)  
**Impacto**: Alto

#### Tarefas

1. Criar tabela `educacenso_validation_rules`
   - `rule_code`, `table_name`, `field_name`, `rule_type`, `rule_value`, `error_message`

2. Criar função RPC `validate_educacenso_data()`
   - Validar todos os campos obrigatórios
   - Verificar formatos
   - Retornar lista de inconsistências

3. Criar tabela `educacenso_validation_results`
   - `validation_id`, `table_name`, `record_id`, `field_name`, `error_code`, `error_message`, `severity`

4. Implementar validações específicas
   - CPF válido e único
   - Código INEP no formato correto (12 dígitos)
   - Datas válidas
   - Campos obrigatórios preenchidos

5. Criar interface de validação
   - Página de validação pré-exportação
   - Lista de inconsistências
   - Correção em massa (quando possível)

#### Arquivos a Criar/Modificar

- `supabase/migrations/YYYYMMDDHHMMSS_educacenso_validation.sql`
- `apps/gestao-escolar/src/services/validationService.ts`
- `apps/gestao-escolar/src/pages/Censo.tsx` (adicionar validação)

#### Critérios de Aceite

- ✅ Todas as validações implementadas
- ✅ Relatório de inconsistências gerado
- ✅ Interface de correção disponível
- ✅ Validação executada antes de exportar

---

### 1.4 Campos Faltantes Críticos

**Prioridade**: 🔴 Crítica  
**Esforço**: Baixo (3-5 dias)  
**Impacto**: Médio

#### Tarefas

1. Verificar campos em `schools`
   - Adicionar `municipio_ibge` se não existir
   - Adicionar `uf` se não existir
   - Adicionar `zona` se não existir
   - Adicionar `localizacao` se não existir

2. Adicionar NIS em `students` (se necessário)
   - Campo `nis` (Número de Identificação Social)
   - Índice único

3. Verificar campo Bolsa Família
   - Se `numero_bolsa_familia` não existe na tabela, adicionar
   - Índice para busca

4. Atualizar views de exportação
   - Garantir que todos os campos estão sendo exportados

#### Arquivos a Modificar

- `supabase/migrations/YYYYMMDDHHMMSS_add_missing_fields.sql`
- `supabase/migrations/20250117211257_create_inep_export_views.sql` (atualizar se necessário)

#### Critérios de Aceite

- ✅ Todos os campos obrigatórios do Educacenso presentes
- ✅ Views de exportação atualizadas
- ✅ Dados podem ser exportados sem campos vazios críticos

---

## Fase 2: Importantes (3-4 meses)

### 2.1 Histórico Escolar Consolidado

**Prioridade**: 🟡 Importante  
**Esforço**: Alto (4-5 semanas)  
**Impacto**: Alto

#### Tarefas

1. Criar view `student_complete_history`
   - Consolidar matrículas, notas, frequência
   - Ordenar por ano letivo
   - Calcular médias e totais

2. Criar função RPC `get_student_history()`
   - Retornar histórico completo de um aluno
   - Formato JSON estruturado

3. Implementar geração de PDF
   - Template de histórico escolar oficial
   - Incluir todas as informações
   - Assinatura digital (futuro)

4. Criar interface de visualização
   - Página de histórico do aluno
   - Visualização online
   - Download em PDF

#### Arquivos a Criar/Modificar

- `supabase/migrations/YYYYMMDDHHMMSS_student_history_view.sql`
- `apps/gestao-escolar/src/services/historyService.ts`
- `apps/gestao-escolar/src/pages/StudentHistory.tsx`
- Template PDF (criar)

#### Critérios de Aceite

- ✅ Histórico completo e consolidado
- ✅ PDF gerado no formato oficial
- ✅ Interface de visualização funcional

---

### 2.2 Workflow de Transferência

**Prioridade**: 🟡 Importante  
**Esforço**: Médio (3-4 semanas)  
**Impacto**: Médio

#### Tarefas

1. Criar tabela `student_transfers`
   - `student_id`, `from_school_id`, `to_school_id`, `transfer_date`, `reason`, `documents`, `status`

2. Implementar fluxo de transferência
   - Solicitação de transferência
   - Aprovação da escola de origem
   - Aprovação da escola de destino
   - Conclusão da transferência

3. Gerar documentos de transferência
   - PDF de transferência
   - Histórico parcial
   - Declarações necessárias

4. Atualizar matrícula automaticamente
   - Criar nova matrícula na escola de destino
   - Encerrar matrícula na escola de origem
   - Manter histórico

#### Arquivos a Criar/Modificar

- `supabase/migrations/YYYYMMDDHHMMSS_student_transfers.sql`
- `apps/gestao-escolar/src/services/transferService.ts`
- `apps/gestao-escolar/src/pages/Transfers.tsx` (criar)

#### Critérios de Aceite

- ✅ Fluxo completo de transferência
- ✅ Documentos gerados automaticamente
- ✅ Histórico mantido corretamente

---

### 2.3 Sistema de Recuperação Completo

**Prioridade**: 🟡 Importante  
**Esforço**: Médio (3-4 semanas)  
**Impacto**: Médio

#### Tarefas

1. Criar tabela `recovery_sessions`
   - `enrollment_id`, `subject_id`, `period`, `start_date`, `end_date`, `status`, `final_grade`

2. Implementar cálculo de necessidade de recuperação
   - Verificar média do período
   - Identificar disciplinas abaixo da média
   - Criar sessões de recuperação automaticamente

3. Workflow de recuperação
   - Criação de sessão
   - Registro de atividades
   - Avaliação final
   - Cálculo de nova média

4. Integração com sistema de notas
   - Atualizar média após recuperação
   - Manter histórico

#### Arquivos a Criar/Modificar

- `supabase/migrations/YYYYMMDDHHMMSS_recovery_system.sql`
- `apps/gestao-escolar/src/services/recoveryService.ts`
- `apps/gestao-escolar/src/pages/Recovery.tsx` (criar)

#### Critérios de Aceite

- ✅ Cálculo automático de necessidade
- ✅ Workflow completo implementado
- ✅ Integração com notas funcionando

---

## Fase 3: Desejáveis (5-6 meses)

### 3.1 Relatórios Obrigatórios Completos

**Prioridade**: 🟢 Desejável  
**Esforço**: Alto (5-6 semanas)  
**Impacto**: Médio

#### Tarefas

1. Relatório de Frequência
   - Mensal e anual
   - Por escola, turma, aluno
   - Formato oficial

2. Relatório de Rendimento
   - Bimestral e anual
   - Médias, aprovações, reprovações
   - Formato oficial

3. Relatório de Abandono
   - Identificação de alunos em risco
   - Ações tomadas
   - Estatísticas

4. Exportação em formatos oficiais
   - PDF para impressão
   - Excel para análise
   - TXT para sistemas externos

#### Arquivos a Criar/Modificar

- `apps/gestao-escolar/src/services/reportService.ts` (expandir)
- `apps/gestao-escolar/src/pages/Reports.tsx` (expandir)
- Templates de relatórios

#### Critérios de Aceite

- ✅ Todos os relatórios gerados
- ✅ Formatos oficiais respeitados
- ✅ Exportação funcionando

---

### 3.2 Otimização de Performance

**Prioridade**: 🟢 Desejável  
**Esforço**: Médio (3-4 semanas)  
**Impacto**: Baixo (mas importante para escalabilidade)

#### Tarefas

1. Testes de performance
   - Criar dataset de teste (10k+ alunos)
   - Testar queries principais
   - Identificar gargalos

2. Otimizações
   - Particionamento de tabelas grandes
   - Cache de queries frequentes
   - Índices adicionais

3. Monitoramento
   - Implementar logging de performance
   - Alertas de queries lentas
   - Dashboard de métricas

#### Arquivos a Criar/Modificar

- Scripts de teste de performance
- `supabase/migrations/YYYYMMDDHHMMSS_performance_optimizations.sql`
- Sistema de monitoramento

#### Critérios de Aceite

- ✅ Sistema suporta 10k+ alunos
- ✅ Queries principais < 1s
- ✅ Monitoramento implementado

---

## Cronograma Resumido

| Fase | Duração | Itens | Status |
|------|---------|-------|--------|
| **Fase 1: Críticas** | 1-2 meses | 4 itens | 🔴 Prioridade |
| **Fase 2: Importantes** | 3-4 meses | 3 itens | 🟡 Seguinte |
| **Fase 3: Desejáveis** | 5-6 meses | 2 itens | 🟢 Futuro |

**Total Estimado**: 6-8 meses para implementação completa

---

## Recursos Necessários

### Equipe

- **1 Desenvolvedor Backend** (SQL, Supabase)
- **1 Desenvolvedor Frontend** (React, TypeScript)
- **1 Analista de Negócios** (Validação de requisitos)

### Infraestrutura

- Ambiente de testes com dados reais
- Acesso a documentação oficial do Educacenso
- Parceria com secretaria de educação para validação

---

## Riscos e Mitigações

### Riscos

1. **Mudanças no layout do Educacenso**
   - Mitigação: Manter código flexível, versionar layouts

2. **Performance com grande volume**
   - Mitigação: Testes desde o início, otimizações progressivas

3. **Validação de requisitos legais**
   - Mitigação: Consultar especialistas, validar com secretarias

---

**Última atualização**: Janeiro 2025

