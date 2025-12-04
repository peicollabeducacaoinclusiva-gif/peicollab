# 📚 API Reference - Sistema PEI Collab

**Versão**: 3.0  
**Última Atualização**: 09/11/2025  
**Formato**: Documentação estilo Swagger/OpenAPI

---

## 🎯 Visão Geral

Este documento descreve todas as funções SQL, triggers e APIs disponíveis no sistema.

---

## 📊 FUNÇÕES SQL PÚBLICAS

### 1. Gestão Escolar

#### `get_student_academic_context(_student_id uuid)`

**Descrição**: Retorna contexto acadêmico completo do aluno

**Parâmetros**:
- `_student_id` (uuid) - ID do aluno

**Retorno** (json):
```json
{
  "turma": "6º Ano A",
  "nivel": "ensino_fundamental_2 - 6º Ano",
  "frequencia_percentual": 87.5,
  "media_geral": 7.8,
  "total_faltas": 5,
  "disciplinas_criticas": ["Matemática"]
}
```

**Exemplo de Uso**:
```sql
SELECT get_student_academic_context('uuid-do-aluno');
```

**Casos de Uso**:
- Dashboard do aluno
- Integração com PEI
- Relatórios acadêmicos

---

### 2. Plano AEE - Visitas

#### `get_plan_visits_stats(_plan_id uuid)`

**Descrição**: Retorna estatísticas de visitas escolares de um plano

**Parâmetros**:
- `_plan_id` (uuid) - ID do plano de AEE

**Retorno** (jsonb):
```json
{
  "total_visitas": 5,
  "realizadas": 3,
  "pendentes": 2,
  "ultima_visita": "2025-11-01",
  "proxima_visita": "2025-11-15"
}
```

**Exemplo de Uso**:
```sql
SELECT get_plan_visits_stats('uuid-do-plano');
```

**Casos de Uso**:
- Dashboard do plano
- Relatórios de acompanhamento
- Widgets de visitas

---

### 3. Plano AEE - Encaminhamentos

#### `get_plan_referrals_stats(_plan_id uuid)`

**Descrição**: Retorna estatísticas de encaminhamentos de um plano

**Parâmetros**:
- `_plan_id` (uuid) - ID do plano de AEE

**Retorno** (jsonb):
```json
{
  "total_encaminhamentos": 3,
  "concluidos": 1,
  "em_andamento": 2,
  "com_retorno": 1,
  "integrados_plano": 1,
  "por_especialidade": {
    "Psicólogo": 1,
    "Fonoaudiólogo": 2
  }
}
```

**Exemplo de Uso**:
```sql
SELECT get_plan_referrals_stats('uuid-do-plano');
```

---

### 4. Notificações

#### `create_aee_notification(...)`

**Descrição**: Cria uma nova notificação para um usuário

**Parâmetros**:
- `p_tenant_id` (uuid) - ID do tenant
- `p_user_id` (uuid) - ID do usuário destinatário
- `p_type` (text) - Tipo da notificação
- `p_priority` (text) - Prioridade (baixa, media, alta, urgente)
- `p_title` (text) - Título da notificação
- `p_message` (text) - Mensagem
- `p_action_url` (text, opcional) - URL para ação
- `p_action_label` (text, opcional) - Label do botão
- `p_plan_id` (uuid, opcional) - ID do plano relacionado
- `p_student_id` (uuid, opcional) - ID do aluno relacionado
- `p_metadata` (jsonb, opcional) - Dados adicionais

**Retorno**: `uuid` (ID da notificação criada)

**Exemplo de Uso**:
```sql
SELECT create_aee_notification(
  'uuid-tenant',
  'uuid-user',
  'low_attendance',
  'alta',
  '⚠️ Baixa frequência: João Silva',
  'O aluno tem apenas 65% de frequência.',
  '/planos/uuid-plano/atendimentos',
  'Ver Atendimentos',
  'uuid-plano',
  'uuid-aluno',
  '{"attendance_rate": 65, "expected_rate": 75}'::jsonb
);
```

---

#### `run_notification_checks()`

**Descrição**: Executa todas as verificações de notificações

**Parâmetros**: Nenhum

**Retorno**: void

**Verifica**:
1. Ciclos próximos do fim (7 dias)
2. Baixa frequência (< 75% em 30 dias)
3. Encaminhamentos sem resposta (> 30 dias)
4. Follow-ups de visitas
5. Limpa notificações expiradas

**Exemplo de Uso** (Cron Job):
```sql
-- Executar diariamente às 8h
SELECT cron.schedule(
    'run-aee-notifications',
    '0 8 * * *',
    $$ SELECT run_notification_checks(); $$
);
```

---

## ⚡ TRIGGERS AUTOMÁTICOS

### 1. `sync_pei_class`

**Tabela**: `enrollments`  
**Evento**: AFTER UPDATE  
**Quando**: Aluno é matriculado ou troca de turma

**Ação**:
```sql
-- Atualiza automaticamente o campo 'class_id' na tabela 'peis'
-- Se o aluno tem PEI ativo, sincroniza a turma
```

**Gatilho**:
```sql
UPDATE enrollments 
SET class_id = 'nova-turma-uuid' 
WHERE student_id = 'aluno-uuid';

-- Resultado: PEI do aluno é atualizado automaticamente
```

---

### 2. `notify_pei_attendance`

**Tabela**: `attendance`  
**Evento**: AFTER INSERT OR UPDATE  
**Quando**: Frequência é registrada

**Ação**:
```sql
-- Calcula taxa de frequência do aluno
-- Se < 75%, cria notificação automática
-- Alerta professores de AEE
```

**Gatilho**:
```sql
INSERT INTO attendance (student_id, presenca, ...) 
VALUES ('aluno-uuid', false, ...);

-- Se aluno tem < 75% presença: Notificação criada
```

---

### 3. `compare_grade_with_pei`

**Tabela**: `grades`  
**Evento**: AFTER INSERT OR UPDATE  
**Quando**: Nota é lançada

**Ação**:
```sql
-- Compara nota com metas do PEI do aluno
-- Se divergência significativa (>2 pontos), cria alerta
-- Notifica professores de AEE e gestores
```

**Gatilho**:
```sql
INSERT INTO grades (enrollment_id, nota_valor, ...) 
VALUES ('enrollment-uuid', 4.5, ...);

-- Se meta do PEI era 7.0: Alerta de divergência
```

---

### 4. `auto_create_evaluation_cycles`

**Tabela**: `plano_aee`  
**Evento**: AFTER INSERT  
**Quando**: Novo plano de AEE é criado

**Ação**:
```sql
-- Cria automaticamente 3 ciclos avaliativos
-- Ciclo I: meses 1-3
-- Ciclo II: meses 4-6
-- Ciclo III: meses 7-9
```

**Gatilho**:
```sql
INSERT INTO plano_aee (...) VALUES (...);

-- Resultado: 3 ciclos criados automaticamente
```

---

## 📋 TABELAS E SCHEMAS

### students (Expandida - Gestão Escolar)

**Campos Principais** (70+ campos):
- Identificação: `id`, `codigo_identificador`, `numero_ficha`
- Nomes: `name`, `nome_social`
- Documentos: `cpf`, `rg`, `certidao_nascimento`, `numero_nis`, `numero_sus`
- Endereço: `logradouro`, `numero_endereco`, `bairro`, `cidade`, `estado`, `cep`
- Contato: `telefone_residencial`, `telefone_celular`, `email`
- Responsáveis: `responsavel1_nome`, `responsavel1_cpf`, `responsavel1_telefone`, `responsavel1_parentesco` (e responsável 2)
- Saúde: `necessidades_especiais`, `tipo_necessidade`, `cid_diagnostico`, `medicacao_continua`
- Matrícula: `status_matricula`, `numero_matricula`, `data_matricula`
- Transporte: `usa_transporte_escolar`, `rota_transporte`

**RLS**:
- Visualização: Usuários do mesmo tenant
- Edição: Admins e gestores
- Criação: Gestores escolares

---

### enrollments (Nova - Gestão Escolar)

**Campos** (20 campos):
- IDs: `id`, `student_id`, `class_id`, `school_id`, `tenant_id`
- Matrícula: `ano_letivo`, `numero_matricula`, `data_matricula`, `status`
- Benefícios: `bolsista`, `tipo_bolsa`, `percentual_bolsa`
- Transporte: `utiliza_transporte`, `rota_transporte`, `ponto_embarque`, `ponto_desembarque`
- Material: `recebeu_material_escolar`, `recebeu_uniforme`
- Observações: `observacoes`

**Unique Constraint**: `(student_id, class_id, ano_letivo)`

---

### attendance (Nova - Gestão Escolar)

**Campos** (12 campos):
- IDs: `id`, `class_id`, `student_id`, `subject_id` (opcional)
- Data: `data` (date)
- Presença: `presenca` (boolean)
- Detalhes: `justificativa`, `observacao`
- Metadados: `tenant_id`, `created_at`, `updated_at`

**Unique Constraints**:
- Com disciplina: `(student_id, data, subject_id)`
- Sem disciplina: `(student_id, data)` WHERE `subject_id IS NULL`

**Triggers**: `notify_pei_attendance`

---

### grades (Nova - Gestão Escolar)

**Campos** (15 campos):
- IDs: `id`, `enrollment_id`, `subject_id`
- Avaliação: `periodo`, `tipo_avaliacao`
- Notas: `nota_valor` (0-10), `nota_conceito` (A-E)
- Peso: `peso` (0.5-5.0)
- Observações: `observacoes`
- Controle: `lancado_por`, `created_at`, `updated_at`

**Unique Constraint**: `(enrollment_id, subject_id, periodo, tipo_avaliacao)`

**Triggers**: `compare_grade_with_pei`

---

### aee_school_visits (Nova - Plano AEE)

**Campos** (26 campos):
- IDs: `id`, `plan_id`, `student_id`, `school_id`, `tenant_id`
- Visita: `visit_date`, `visit_time`, `duration_minutes`, `visit_type`
- Professor: `aee_teacher_id`
- Dados: `participants` (jsonb), `observations`, `class_environment`, `student_interaction`
- Orientações: `orientations_given` (jsonb), `resources_needed` (jsonb), `suggested_adaptations` (jsonb)
- Follow-up: `next_steps`, `follow_up_date`
- Status: `status`, `report_generated`, `report_url`
- Assinaturas: `signatures` (jsonb)

---

### aee_referrals (Nova - Plano AEE)

**Campos** (27 campos):
- IDs: `id`, `plan_id`, `student_id`, `school_id`, `tenant_id`
- Encaminhamento: `referral_date`, `specialist_type`, `specialist_name`, `institution`
- Contato: `contact_info` (jsonb)
- Motivo: `reason`, `symptoms_observed`, `urgency_level`
- Solicitante: `requested_by`
- Documentação: `referral_letter_url`, `attachments` (jsonb)
- Acompanhamento: `status`, `appointment_date`
- Retorno: `specialist_feedback`, `specialist_report_url`, `diagnosis_summary`, `recommendations`
- Integração: `integrated_to_plan`, `integration_notes`

---

### aee_notifications (Nova - Plano AEE)

**Campos** (20 campos):
- IDs: `id`, `tenant_id`, `user_id`
- Tipo: `notification_type`, `priority`
- Conteúdo: `title`, `message`, `action_url`, `action_label`
- Contexto: `plan_id`, `student_id`, `cycle_id`, `referral_id`, `visit_id`
- Metadados: `metadata` (jsonb)
- Status: `is_read`, `read_at`, `is_dismissed`, `dismissed_at`
- Controle: `created_at`, `expires_at`

**Tipos de Notificação**:
- `cycle_ending` - Fim de ciclo avaliativo
- `low_attendance` - Baixa frequência
- `pending_review` - Revisão pendente
- `referral_no_response` - Encaminhamento sem resposta
- `visit_follow_up` - Follow-up de visita
- `goal_deadline` - Meta próxima do prazo
- `plan_expiring` - Plano expirando
- `missing_documentation` - Documentação faltando

---

## 🔔 FUNÇÕES DE NOTIFICAÇÕES

### `check_ending_cycles()`

**Descrição**: Verifica ciclos que terminam em 7 dias ou menos

**Execução**: Diária (via cron)

**Lógica**:
```sql
FOR cada ciclo WHERE end_date <= CURRENT_DATE + 7 days
  IF não tem notificação recente (7 dias)
  THEN criar notificação
    prioridade = (dias <= 3) ? 'alta' : 'media'
```

**Notificação Criada**:
- Tipo: `cycle_ending`
- Destinatário: Professor AEE responsável
- Ação: Link para avaliar ciclo

---

### `check_low_attendance()`

**Descrição**: Verifica alunos com frequência < 75% nos últimos 30 dias

**Execução**: Diária (via cron)

**Lógica**:
```sql
FOR cada plano ativo
  calcular taxa_presenca (últimos 30 dias)
  IF taxa < 75% AND >= 4 atendimentos registrados
  THEN criar notificação
    prioridade = taxa < 50 ? 'urgente' :
                 taxa < 60 ? 'alta' : 'media'
```

**Notificação Criada**:
- Tipo: `low_attendance`
- Destinatário: Professor AEE responsável
- Metadados: `{"attendance_rate": 65, "expected_rate": 75}`

---

### `check_pending_referrals()`

**Descrição**: Verifica encaminhamentos sem resposta há mais de 30 dias

**Execução**: Diária (via cron)

**Lógica**:
```sql
FOR cada encaminhamento em status 'enviado' ou 'agendado'
  IF dias desde referral_date > 30
  AND specialist_feedback IS NULL
  THEN criar notificação
    prioridade = dias > 60 ? 'alta' : 'media'
```

---

### `check_visit_followups()`

**Descrição**: Verifica visitas com follow-up próximo ou atrasado

**Execução**: Diária (via cron)

**Lógica**:
```sql
FOR cada visita com follow_up_date
  IF follow_up_date entre (hoje - 7 dias) e (hoje + 7 dias)
  AND status = 'realizada'
  THEN criar notificação
    prioridade = atrasado ? 'alta' : 'media'
```

---

### `run_notification_checks()`

**Descrição**: Função master que executa todas as verificações

**Execução**: Diária via cron

**Fluxo**:
```sql
1. PERFORM check_ending_cycles();
2. PERFORM check_low_attendance();
3. PERFORM check_pending_referrals();
4. PERFORM check_visit_followups();
5. DELETE notificações expiradas
```

**Configuração Cron**:
```sql
SELECT cron.schedule(
    'run-aee-notifications',
    '0 8 * * *', -- Todo dia às 8h
    $$ SELECT run_notification_checks(); $$
);
```

---

## 📊 QUERIES TYPESCRIPT (@pei/database)

### Students

```typescript
// Buscar todos os alunos
export const getAllStudents = async (filters?: StudentFilters): Promise<Student[]>

// Buscar por ID
export const getStudentById = async (id: string): Promise<Student | null>

// Buscar alunos com NEE
export const getStudentsWithNEE = async (schoolId: string): Promise<StudentWithPEI[]>

// Criar aluno
export const createStudent = async (student: Partial<Student>): Promise<Student>

// Atualizar aluno
export const updateStudent = async (id: string, updates: Partial<Student>): Promise<Student>
```

### Enrollments

```typescript
// Buscar matrículas
export const getEnrollments = async (filters?: EnrollmentFilters): Promise<Enrollment[]>

// Buscar por turma
export const getEnrollmentsByClass = async (classId: string): Promise<EnrollmentExpanded[]>

// Criar matrícula
export const createEnrollment = async (enrollment: Partial<Enrollment>): Promise<Enrollment>
```

### Attendance

```typescript
// Buscar frequência por turma e data
export const getAttendanceByClassAndDate = async (
  classId: string, 
  date: string, 
  subjectId?: string
): Promise<AttendanceExpanded[]>

// Criar/atualizar frequência (upsert)
export const upsertAttendance = async (records: Partial<Attendance>[]): Promise<void>

// Buscar alunos com baixa frequência
export const getStudentsWithLowAttendance = async (schoolId: string): Promise<any[]>
```

### Grades

```typescript
// Buscar notas por matrícula e período
export const getAllGradesByEnrollment = async (
  enrollmentId: string, 
  periodo?: string
): Promise<GradeExpanded[]>

// Buscar boletim completo
export const getStudentBoletim = async (enrollmentId: string): Promise<Boletim>

// Lançar nota
export const createGrade = async (grade: Partial<Grade>): Promise<Grade>
```

---

## 🪝 HOOKS REACT QUERY

### Students

```typescript
// Hook para buscar alunos
const { data: students } = useStudents(filters);

// Hook para buscar um aluno
const { data: student } = useStudent(studentId);

// Hook para criar aluno
const createStudent = useCreateStudent();
await createStudent.mutateAsync(studentData);

// Hook para atualizar aluno
const updateStudent = useUpdateStudent();
await updateStudent.mutateAsync({ id, ...updates });
```

### Enrollments

```typescript
const { data: enrollments } = useEnrollments(filters);
const { data: enrollments } = useEnrollmentsByClass(classId);
const createEnrollment = useCreateEnrollment();
```

### Attendance

```typescript
const { data: attendance } = useAttendanceByClass(classId, date);
const upsertAttendance = useUpsertAttendance();
const { data: lowAttendance } = useStudentsWithLowAttendance(schoolId);
```

### Grades

```typescript
const { data: grades } = useGradesByEnrollment(enrollmentId, periodo);
const { data: boletim } = useStudentBoletim(enrollmentId);
const createGrade = useCreateGrade();
```

### Visits

```typescript
const { data: visits } = useSchoolVisits(planId);
const { data: stats } = useVisitsStats(planId);
const createVisit = useCreateSchoolVisit();
const completeVisit = useCompleteVisit();
```

### Referrals

```typescript
const { data: referrals } = useReferrals(planId);
const { data: pending } = usePendingReferrals(schoolId);
const createReferral = useCreateReferral();
const registerFeedback = useRegisterFeedback();
const integrateToPlan = useIntegrateReferralToPlan();
```

### Notifications

```typescript
const { data: notifications } = useNotifications();
const { data: unread } = useUnreadNotifications();
const { data: count } = useUnreadNotificationsCount();
const markAsRead = useMarkAsRead();
const dismiss = useDismissNotification();
```

---

## 🔐 AUTENTICAÇÃO E AUTORIZAÇÃO

### Funções de Permissão

```sql
-- Verificar se usuário tem role
SELECT has_role(auth.uid(), 'aee_teacher');

-- Verificar se usuário pode acessar PEI
SELECT user_can_access_pei(auth.uid(), 'uuid-pei');

-- Verificar se usuário pode acessar aluno
SELECT user_can_access_student(auth.uid(), 'uuid-student');
```

### Roles Disponíveis

| Role | Permissões |
|------|-----------|
| `superadmin` | Acesso total ao sistema |
| `tenant_admin` | Gestão da rede de escolas |
| `school_admin` | Gestão de uma escola |
| `aee_teacher` | Criação e edição de PEIs e Planos AEE |
| `teacher` | Visualização de alunos e PEIs |
| `support_professional` | Atendimentos e feedbacks |
| `family` | Visualização limitada do PEI |

---

## 🎯 ENDPOINTS SUPABASE

### Base URL
```
https://[PROJECT_ID].supabase.co
```

### Autenticação
```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Get user
const { data: { user } } = await supabase.auth.getUser();

// Logout
await supabase.auth.signOut();
```

### Tabelas (via RLS)
```typescript
// Select
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('school_id', schoolId);

// Insert
const { data } = await supabase
  .from('students')
  .insert({ name: 'João', ... });

// Update
const { data } = await supabase
  .from('students')
  .update({ name: 'João Silva' })
  .eq('id', studentId);

// Delete
const { data } = await supabase
  .from('students')
  .delete()
  .eq('id', studentId);
```

### Real-time (Subscriptions)
```typescript
// Escutar notificações em tempo real
const channel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'aee_notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      console.log('Nova notificação!', payload);
    }
  )
  .subscribe();
```

---

## 📊 ESTATÍSTICAS E MÉTRICAS

### Dashboard Queries

```typescript
// Estatísticas da escola
const stats = {
  total_alunos: COUNT(students WHERE is_active),
  alunos_nee: COUNT(students WHERE necessidades_especiais),
  taxa_presenca: AVG(attendance.presenca) * 100,
  media_geral: AVG(grades.nota_valor),
  peis_ativos: COUNT(peis WHERE is_active_version),
};
```

### Boletim do Aluno

```typescript
const boletim = await getStudentBoletim(enrollmentId);

// Retorna:
{
  student_id: 'uuid',
  student_name: 'João Silva',
  enrollment_id: 'uuid',
  ano_letivo: '2025',
  disciplinas: [
    {
      subject_id: 'uuid',
      subject_nome: 'Matemática',
      media_final: 7.5,
      situacao: 'Aprovado',
      avaliacoes: [...]
    }
  ],
  media_geral: 7.8,
  total_faltas: 3,
  taxa_presenca: 92.5
}
```

---

## 🎉 Resumo

Esta documentação cobre:

✅ **9 funções SQL** principais  
✅ **4 triggers** automáticos  
✅ **8 tabelas** novas/expandidas  
✅ **30+ queries** TypeScript  
✅ **33 hooks** React Query  
✅ **RLS** completo  
✅ **Real-time** subscriptions  

---

**Para mais detalhes técnicos**, consulte:
- Código-fonte em `packages/database/src/`
- Migrações em `supabase/migrations/`
- Tipos em `packages/shared-types/src/`
























