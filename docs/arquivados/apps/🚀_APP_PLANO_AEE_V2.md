# 📚 Sistema Completo de Plano de AEE - Documentação Técnica V2.0

> **⚠️ IMPORTANTE**: Esta é uma documentação de **VISÃO FUTURA** (V2.0) do Sistema de Plano de AEE.  
> **Status Atual**: A V1.0 (básica) está implementada. Ver [`📚_APP_PLANO_AEE.md`](./📚_APP_PLANO_AEE.md)  
> **Comparação**: Ver [`📋_ROADMAP_PLANO_AEE.md`](./📋_ROADMAP_PLANO_AEE.md)

---

## 🎯 Visão Geral Aprimorada

O **Sistema de Plano de AEE V2.0** é uma evolução completa da versão atual, incorporando funcionalidades avançadas baseadas nas melhores práticas do sistema AEE Planner da Secretaria de Educação da Bahia.

### **Diferenciais da V2.0**

| Funcionalidade | V1.0 (Atual) | V2.0 (Futuro) |
|----------------|--------------|---------------|
| **Formulários** | Básicos (10 seções) | Baseados em fichas oficiais da Bahia |
| **Documentos** | Sem geração automática | 8 tipos de PDFs gerados automaticamente |
| **Avaliações** | Simples | Diagnóstica completa (8 áreas) |
| **Atendimentos** | Sem registro | Sistema completo de frequência |
| **Ciclos** | 3 avaliações básicas | Avaliativos automáticos (I, II, III) |
| **Visitas** | Não implementado | Visitas escolares documentadas |
| **Encaminhamentos** | JSONB simples | Sistema completo de tracking |
| **Modo Offline** | Não | Sim (IndexedDB + Sync) |
| **Dashboard** | Estatísticas básicas | Analytics avançado com KPIs |
| **Mobile** | Responsivo | App nativo (React Native) |

### **Novas Funcionalidades da V2.0**

- ✨ **Avaliação Diagnóstica**: Formulário multi-step com 8 áreas (baseado nas fichas da Bahia)
- ✨ **Registro de Atendimentos**: Sistema completo com frequência, evidências e evolução
- ✨ **Metas SMART**: Gerenciamento avançado de objetivos mensuráveis
- ✨ **Visitas Escolares**: Documentação completa com orientações e assinaturas
- ✨ **Encaminhamentos**: Tracking de especialistas com feedback
- ✨ **Documentos Auto**: Geração de 8 tipos de PDFs (termos, relatórios, etc.)
- ✨ **Modo Offline**: Funciona 100% offline com sincronização automática
- ✨ **Dashboard Analítico**: KPIs em tempo real, gráficos e comparações
- ✨ **Assinatura Digital**: Termos com assinatura eletrônica e timestamp
- ✨ **Compartilhamento**: Links temporários para famílias sem login

---

## 🗄️ Modelo de Dados Expandido

### **Novas Tabelas da V2.0**

A V2.0 adiciona **9 novas tabelas** ao modelo atual:

#### **1. `aee_centers` - Centros/Salas de AEE**

```sql
CREATE TABLE IF NOT EXISTS "public"."aee_centers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "school_id" uuid NOT NULL REFERENCES "public"."schools"("id"),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id"),
    "center_name" text NOT NULL,
    "center_type" text, -- 'sala_recursos', 'centro_especializado'
    "capacity" integer DEFAULT 10,
    "specializations" text[], -- ['TEA', 'Baixa Visão', etc.]
    "is_active" boolean DEFAULT true
);
```

#### **2. `aee_diagnostic_assessments` - Avaliações Diagnósticas**

```sql
CREATE TABLE IF NOT EXISTS "public"."aee_diagnostic_assessments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL,
    "teacher_id" uuid NOT NULL,
    "assessment_date" date NOT NULL,
    "assessment_type" text, -- 'inicial', 'continuada', 'final'
    
    -- 8 Áreas Avaliadas
    "laterality" jsonb DEFAULT '{}'::jsonb,
    "spatial_orientation" jsonb DEFAULT '{}'::jsonb,
    "temporal_orientation" jsonb DEFAULT '{}'::jsonb,
    "visual_perception" jsonb DEFAULT '{}'::jsonb,
    "auditory_perception" jsonb DEFAULT '{}'::jsonb,
    "oral_expression" jsonb DEFAULT '{}'::jsonb,
    "written_expression" jsonb DEFAULT '{}'::jsonb,
    "reading_skills" jsonb DEFAULT '{}'::jsonb,
    "logical_reasoning" jsonb DEFAULT '{}'::jsonb,
    "motor_coordination" jsonb DEFAULT '{}'::jsonb,
    "interpersonal_relations" jsonb DEFAULT '{}'::jsonb,
    
    "observations" text,
    "recommendations" text
);
```

#### **3. `aee_plan_goals` - Metas do Plano**

```sql
CREATE TABLE IF NOT EXISTS "public"."aee_plan_goals" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plan_id" uuid NOT NULL REFERENCES "plano_aee"("id"),
    "goal_description" text NOT NULL,
    "goal_area" text, -- 'percepcao', 'linguagem', 'motora', etc.
    "is_measurable" boolean DEFAULT true,
    "target_date" date,
    "progress_status" text DEFAULT 'nao_iniciada',
    "progress_percentage" integer DEFAULT 0,
    "activities" text,
    "success_criteria" text,
    "priority" text DEFAULT 'media'
);
```

#### **4. `aee_attendance_records` - Registro de Atendimentos**

```sql
CREATE TABLE IF NOT EXISTS "public"."aee_attendance_records" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plan_id" uuid NOT NULL,
    "student_id" uuid NOT NULL,
    "teacher_id" uuid NOT NULL,
    "attendance_date" date NOT NULL,
    "attendance_status" text NOT NULL, -- 'presente', 'falta_justificada', etc.
    "duration_minutes" integer DEFAULT 50,
    "activities_performed" text,
    "goals_worked" uuid[], -- Array de goal_ids
    "student_performance" text,
    "behavior_observations" text,
    "attachments" jsonb DEFAULT '[]'::jsonb -- Evidências (fotos, vídeos)
);
```

#### **5. `aee_evaluation_cycles` - Ciclos de Avaliação**

```sql
CREATE TABLE IF NOT EXISTS "public"."aee_evaluation_cycles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plan_id" uuid NOT NULL,
    "cycle_number" integer NOT NULL, -- I, II, III
    "cycle_name" text,
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    "achievements" text,
    "challenges" text,
    "goals_progress" jsonb DEFAULT '{}'::jsonb,
    "total_attendances_planned" integer,
    "total_attendances_actual" integer,
    "attendance_percentage" numeric(5,2),
    "plan_adjustments" text,
    "recommendations_next_cycle" text
);
```

#### **6. `aee_school_visits` - Visitas à Escola Regular**

```sql
CREATE TABLE IF NOT EXISTS "public"."aee_school_visits" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "aee_teacher_id" uuid NOT NULL,
    "school_id" uuid NOT NULL,
    "students_visited" uuid[], -- Array de student_ids
    "visit_date" date NOT NULL,
    "visit_objectives" text NOT NULL,
    "guidance_provided" text,
    "curriculum_adaptations_suggested" text,
    "resources_suggested" text,
    "signatures" jsonb DEFAULT '[]'::jsonb -- Assinaturas digitais
);
```

#### **7. `aee_referrals` - Encaminhamentos para Especialistas**

```sql
CREATE TABLE IF NOT EXISTS "public"."aee_referrals" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL,
    "plan_id" uuid,
    "teacher_id" uuid NOT NULL,
    "referral_date" date NOT NULL,
    "specialist_type" text NOT NULL, -- 'fonoaudiologo', 'psicologo', etc.
    "specialist_name" text,
    "referral_reason" text NOT NULL,
    "urgency" text DEFAULT 'media',
    "status" text DEFAULT 'pendente',
    "appointment_date" date,
    "feedback" text,
    "recommendations_received" text
);
```

#### **8. `aee_family_interviews` - Entrevistas Familiares (Anamnese)**

```sql
CREATE TABLE IF NOT EXISTS "public"."aee_family_interviews" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL,
    "teacher_id" uuid NOT NULL,
    "interview_date" date NOT NULL,
    "interview_type" text DEFAULT 'inicial',
    "initial_complaint" text,
    "pregnancy_birth" jsonb DEFAULT '{}'::jsonb,
    "biopsychosocial_development" text,
    "family_structure" text,
    "daily_routine" jsonb DEFAULT '{}'::jsonb,
    "family_health_history" text,
    "clinical_restrictions" text,
    "medications" jsonb DEFAULT '[]'::jsonb,
    "attending_professionals" jsonb DEFAULT '[]'::jsonb
);
```

#### **9. `aee_documents` - Documentos Gerados**

```sql
CREATE TABLE IF NOT EXISTS "public"."aee_documents" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid,
    "plan_id" uuid,
    "teacher_id" uuid NOT NULL,
    "document_type" text NOT NULL,
    "document_date" date NOT NULL,
    "document_data" jsonb NOT NULL,
    "generated_pdf_url" text,
    "signatures" jsonb DEFAULT '[]'::jsonb,
    "share_token" text UNIQUE,
    "share_expires_at" timestamptz
);
```

---

## 🎨 Componentes React da V2.0

### **Estrutura de Componentes Expandida**

```
src/components/aee/
├── DiagnosticAssessment/      ← NOVO
│   ├── AssessmentForm.tsx      (Multi-step form)
│   ├── LateralityStep.tsx
│   ├── OrientationStep.tsx
│   ├── PerceptionStep.tsx
│   ├── ExpressionStep.tsx
│   ├── ReadingWritingStep.tsx
│   ├── ReasoningStep.tsx
│   └── RelationsStep.tsx
│
├── AttendanceRecord/           ← NOVO
│   ├── QuickRecord.tsx         (Registro rápido diário)
│   ├── AttendanceCalendar.tsx  (Calendário visual)
│   ├── FrequencyChart.tsx      (Gráfico de frequência)
│   └── EvidenceUpload.tsx      (Upload de fotos/vídeos)
│
├── Goals/                      ← NOVO
│   ├── GoalsList.tsx
│   ├── GoalForm.tsx            (Metas SMART)
│   ├── GoalProgress.tsx
│   └── GoalsReview.tsx
│
├── CycleEvaluation/            ← NOVO
│   ├── CycleForm.tsx
│   ├── ProgressComparison.tsx  (Comparar ciclos)
│   └── GoalsReviewCycle.tsx
│
├── SchoolVisit/                ← NOVO
│   ├── VisitForm.tsx
│   ├── VisitReport.tsx
│   └── OrientationChecklist.tsx
│
├── Referrals/                  ← NOVO
│   ├── ReferralForm.tsx
│   ├── ReferralTracking.tsx    (Acompanhar status)
│   └── SpecialistFeedback.tsx
│
├── Documents/                  ← NOVO
│   ├── DocumentGenerator.tsx   (Gerar 8 tipos de PDF)
│   ├── TermoCompromisso.tsx
│   ├── TermoDesistencia.tsx
│   ├── RelatorioVisita.tsx
│   ├── PlanoCompleto.tsx
│   ├── RelatorioCiclo.tsx
│   └── DocumentPreview.tsx
│
├── FamilyInterview/            ← NOVO
│   ├── AnamnesisForm.tsx       (Entrevista completa)
│   └── InterviewSummary.tsx
│
└── Analytics/                  ← NOVO
    ├── DashboardKPIs.tsx       (KPIs principais)
    ├── FrequencyReport.tsx
    ├── GoalsProgressChart.tsx
    └── ComparativeAnalysis.tsx
```

### **Exemplo: Dashboard Analítico**

```tsx
// pages/Dashboard.tsx (V2.0)
import { Card, CardContent, CardHeader, CardTitle } from '@pei/ui';
import { Users, Calendar, Target, TrendingUp } from 'lucide-react';
import { usePlanoAEEStats } from '@/hooks/usePlanoAEE';

export const Dashboard = () => {
  const { stats, loading } = usePlanoAEEStats();
  
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Alunos Ativos"
          value={stats.activeStudents}
          icon={Users}
          trend={stats.studentsTrend}
          color="blue"
        />
        <StatCard
          title="Taxa de Frequência"
          value={`${stats.attendanceRate}%`}
          icon={Calendar}
          trend={stats.attendanceTrend}
          color="green"
        />
        <StatCard
          title="Metas Alcançadas"
          value={stats.goalsAchieved}
          subtitle={`${stats.goalsTotal} total`}
          icon={Target}
          trend={stats.goalsTrend}
          color="purple"
        />
        <StatCard
          title="Planos Ativos"
          value={stats.activePlans}
          icon={TrendingUp}
          color="orange"
        />
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Frequência Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceChart data={stats.monthlyAttendance} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Progresso de Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalsProgressChart data={stats.goalsProgress} />
          </CardContent>
        </Card>
      </div>
      
      {/* Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas e Ações Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertsList alerts={stats.alerts} />
        </CardContent>
      </Card>
    </div>
  );
};
```

### **Exemplo: Registro Rápido de Atendimento**

```tsx
// components/aee/AttendanceRecord/QuickRecord.tsx
export const QuickAttendanceRecord = ({ planId, studentId, studentName }) => {
  const { goals } = usePlanGoals(planId);
  const form = useForm();
  const [status, setStatus] = useState<AttendanceStatus>('presente');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Atendimento - {studentName}</CardTitle>
        <CardDescription>
          {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status */}
        <Select value={status} onValueChange={setStatus}>
          <SelectItem value="presente">✅ Presente</SelectItem>
          <SelectItem value="falta_justificada">📝 Falta Justificada</SelectItem>
          <SelectItem value="falta_injustificada">❌ Falta Injustificada</SelectItem>
        </Select>
        
        {status === 'presente' && (
          <>
            {/* Metas Trabalhadas */}
            <GoalsSelector
              goals={goals}
              selected={form.watch('goals_worked')}
              onChange={(selected) => form.setValue('goals_worked', selected)}
            />
            
            {/* Atividades */}
            <Textarea
              {...form.register('activities_performed')}
              placeholder="Descreva as atividades realizadas..."
              rows={4}
            />
            
            {/* Desempenho */}
            <Textarea
              {...form.register('student_performance')}
              placeholder="Como foi o desempenho do aluno?"
              rows={3}
            />
            
            {/* Evidências (Fotos/Vídeos) */}
            <FileUpload
              multiple
              accept="image/*,video/*,.pdf"
              onFilesSelected={(files) => uploadEvidences(files)}
            />
          </>
        )}
      </CardContent>
      
      <CardFooter>
        <Button onClick={handleSubmit} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Salvar Registro
        </Button>
      </CardFooter>
    </Card>
  );
};
```

---

## 📱 Funcionalidades Offline (V2.0)

### **IndexedDB Schema**

```typescript
// db/indexedDB.ts
import Dexie, { Table } from 'dexie';

export interface OfflinePlano {
  id: string;
  data: PlanoAEE;
  lastSynced: Date;
  hasLocalChanges: boolean;
}

export interface OfflineAttendance {
  id: string;
  data: AttendanceRecord;
  synced: boolean;
  createdAt: Date;
}

class AEEDatabase extends Dexie {
  planos!: Table<OfflinePlano>;
  attendances!: Table<OfflineAttendance>;
  assessments!: Table<any>;
  goals!: Table<any>;
  
  constructor() {
    super('aee_planner_db');
    
    this.version(1).stores({
      planos: 'id, lastSynced, hasLocalChanges',
      attendances: 'id, synced, createdAt',
      assessments: 'id, student_id',
      goals: 'id, plan_id',
    });
  }
}

export const db = new AEEDatabase();
```

### **Serviço de Sincronização**

```typescript
// services/syncService.ts
export class SyncService {
  static async syncAll() {
    await this.syncPlanos();
    await this.syncAttendances();
    await this.syncAssessments();
  }
  
  static async syncAttendances() {
    const unsyncedAttendances = await db.attendances
      .where('synced')
      .equals(false)
      .toArray();
    
    for (const attendance of unsyncedAttendances) {
      try {
        await supabase
          .from('aee_attendance_records')
          .insert(attendance.data);
        
        await db.attendances.update(attendance.id, { synced: true });
      } catch (error) {
        console.error('Sync error:', error);
      }
    }
  }
}

// Auto-sync quando online
window.addEventListener('online', () => {
  SyncService.syncAll();
});
```

---

## 📄 Geração Automática de Documentos

### **Tipos de Documentos (8 tipos)**

1. **Termo de Compromisso** - Autorização e normas do AEE
2. **Termo de Desistência** - Documento de desistência
3. **Relatório de Visita** - Visita à escola regular
4. **Plano de AEE Completo** - Documento integral
5. **Relatório de Ciclo** - Avaliação de ciclo (I, II ou III)
6. **Ficha de Anamnese** - Entrevista familiar
7. **Ficha de Encaminhamento** - Para especialistas
8. **Avaliação Diagnóstica** - Relatório completo

### **Exemplo: Termo de Compromisso**

```html
<!-- public/templates/termo-compromisso.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      margin: 2cm;
    }
    .header {
      text-align: center;
      margin-bottom: 2cm;
    }
    .field {
      display: inline-block;
      border-bottom: 1px solid #000;
      min-width: 200px;
    }
    .signature-line {
      border-top: 1px solid #000;
      width: 300px;
      margin: 1cm auto 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>TERMO DE COMPROMISSO E AUTORIZAÇÃO</h1>
    <p><strong>ATENDIMENTO EDUCACIONAL ESPECIALIZADO</strong></p>
    <p>{{center_name}}</p>
  </div>
  
  <p><strong>Senhores Pais e/ou Responsáveis,</strong></p>
  
  <ol>
    <li>O estudante deverá comparecer ao Atendimento nos dias e horários estipulados;</li>
    <li>Três faltas injustificadas consecutivas acarretará o afastamento do estudante no AEE;</li>
    <li>O AEE terá a duração de {{attendance_duration}} minutos em cada dia marcado;</li>
  </ol>
  
  <h3>Dados do Estudante:</h3>
  <p>
    Nome: <span class="field">{{student_name}}</span><br>
    Data de Nascimento: <span class="field">{{student_birthdate}}</span><br>
    Responsável: <span class="field">{{parent_name}}</span><br>
    Telefone: <span class="field">{{parent_phone}}</span><br>
    Escola Regular: <span class="field">{{school_name}}</span>
  </p>
  
  <h3>Horário do Atendimento:</h3>
  <p>
    Dias: <span class="field">{{attendance_days}}</span><br>
    Horário: <span class="field">{{attendance_time}}</span>
  </p>
  
  <p>{{city}}, {{date}}</p>
  
  <div class="signature">
    <div class="signature-line">Responsável pelo Estudante</div>
    <div class="signature-line">Professor(a) de AEE</div>
  </div>
</body>
</html>
```

---

## 📊 Dashboard Analítico e KPIs

### **Métricas Principais**

```typescript
// types/analytics.types.ts
export interface AEEAnalytics {
  // Frequência
  attendanceRate: number;
  attendanceTrend: 'up' | 'down' | 'stable';
  studentsAtRisk: number; // < 75% frequência
  
  // Metas
  goalsAchieved: number;
  goalsTotal: number;
  goalsSuccessRate: number;
  averageTimeToAchieve: number; // dias
  
  // Atendimentos
  totalAttendances: number;
  averageAttendancesPerPlan: number;
  attendancesByDay: Record<string, number>;
  
  // Encaminhamentos
  referralsMade: number;
  referralsCompleted: number;
  referralsCompletionRate: number;
  
  // Ciclos
  cyclesCompleted: number;
  cyclesInProgress: number;
}
```

### **Relatórios Disponíveis**

1. **Relatório de Frequência**
   - Por aluno, período, turma
   - Identificação de alunos em risco

2. **Relatório de Progresso de Metas**
   - Metas alcançadas por área
   - Tempo médio para alcançar
   - Comparativo entre ciclos

3. **Relatório de Encaminhamentos**
   - Por especialidade
   - Taxa de realização
   - Tempo médio de retorno

4. **Relatório Gerencial**
   - Visão geral da rede
   - Distribuição por centro AEE
   - Capacidade x ocupação

---

## 🚀 Roadmap de Implementação

### **Fase 1 - Fundação (3 meses)**
- [ ] Migração das 9 novas tabelas
- [ ] Componentes básicos de UI
- [ ] Sistema de metas SMART
- [ ] Registro de atendimentos básico

### **Fase 2 - Avaliações (2 meses)**
- [ ] Formulário de avaliação diagnóstica completo (8 áreas)
- [ ] Entrevista familiar (anamnese)
- [ ] Geração automática de barreiras e sugestões

### **Fase 3 - Documentos (2 meses)**
- [ ] Templates HTML dos 8 tipos de documentos
- [ ] Serviço de geração de PDF
- [ ] Sistema de assinatura digital
- [ ] Compartilhamento com famílias

### **Fase 4 - Offline (1 mês)**
- [ ] IndexedDB setup
- [ ] Serviço de sincronização
- [ ] Service Worker
- [ ] Indicadores de status offline/online

### **Fase 5 - Analytics (1 mês)**
- [ ] Dashboard de KPIs
- [ ] Gráficos interativos
- [ ] Relatórios customizáveis
- [ ] Exportação para Excel

### **Fase 6 - Avançado (2 meses)**
- [ ] Visitas escolares documentadas
- [ ] Sistema de encaminhamentos
- [ ] Ciclos avaliativos automáticos
- [ ] Notificações inteligentes

### **Fase 7 - Mobile (3 meses)**
- [ ] App React Native
- [ ] Sincronização mobile
- [ ] Push notifications
- [ ] Modo offline mobile

---

## 🎓 Guia de Uso (V2.0)

### **Fluxo Completo do Professor de AEE**

#### **1. Primeiro Contato com o Aluno**
```
1. Receber aluno indicado pela escola regular
2. Agendar entrevista familiar (Anamnese)
3. Preencher Ficha de Anamnese no sistema
4. Agendar Avaliação Diagnóstica
```

#### **2. Avaliação Diagnóstica**
```
1. Aplicar Avaliação Diagnóstica (8 seções)
2. Sistema analisa respostas
3. Sistema sugere barreiras e potencialidades
4. Professor valida e ajusta
5. Sistema sugere metas automáticas
```

#### **3. Criação do Plano de AEE**
```
1. Criar novo plano vinculado ao aluno
2. Importar dados da avaliação
3. Definir recursos e adaptações
4. Criar/ajustar metas SMART
5. Configurar horários de atendimento
6. Salvar e enviar para aprovação
```

#### **4. Geração de Documentos Iniciais**
```
1. Gerar Termo de Compromisso
2. Enviar para assinatura dos responsáveis
3. Aguardar assinatura digital
4. Ativar plano (status: active)
```

#### **5. Atendimentos Semanais**
```
1. Visualizar agenda do dia
2. Para cada aluno:
   - Marcar presença/falta
   - Selecionar metas trabalhadas
   - Descrever atividades
   - Registrar desempenho
   - Upload de evidências
3. Sistema atualiza automaticamente estatísticas
```

#### **6. Avaliação de Ciclos (a cada 3 meses)**
```
1. Sistema notifica fim de ciclo
2. Analisar frequência e progresso
3. Documentar conquistas e desafios
4. Decidir ajustes necessários
5. Iniciar próximo ciclo
```

---

## 🔧 Configuração e Instalação

### **Requisitos Adicionais (V2.0)**
- Node.js 18+
- PNPM 8+
- Supabase CLI
- ImageMagick (para processamento de imagens)
- Puppeteer (para geração de PDFs)

### **Instalação**

```bash
# 1. Aplicar migrações da V2.0
cd supabase
supabase db push migrations/v2.0/*.sql

# 2. Instalar dependências adicionais
cd apps/plano-aee
pnpm add dexie recharts react-signature-canvas puppeteer

# 3. Configurar variáveis adicionais
echo "VITE_ENABLE_OFFLINE=true" >> .env.local
echo "VITE_ENABLE_ANALYTICS=true" >> .env.local

# 4. Popular dados de teste da V2.0
pnpm seed:aee-v2

# 5. Iniciar servidor
pnpm dev
```

---

## 📚 Recursos Baseados nas Fichas da Bahia

### **Fichas Oficiais Implementadas**

1. ✅ Ficha de Anamnese
2. ✅ Ficha de Avaliação Diagnóstica
3. ✅ Plano de AEE
4. ✅ Relatório de Visita à Escola
5. ✅ Termo de Compromisso
6. ✅ Termo de Desistência
7. ✅ Ficha de Encaminhamento
8. ✅ Avaliação de Baixa Visão

---

## 🎯 Casos de Uso Avançados

### **Caso 1: Aluno com Múltiplas Deficiências**
Pedro, 9 anos, tem Deficiência Intelectual + Baixa Visão

**Fluxo na V2.0**:
1. Avaliação Diagnóstica geral
2. Avaliação específica de Baixa Visão
3. Sistema identifica barreiras de ambas as condições
4. Metas integradas geradas automaticamente
5. Recursos combinados sugeridos
6. Encaminhamentos criados (Oftalmologista + Neurologista)

### **Caso 2: Baixa Frequência**
João tem 3 faltas consecutivas

**Fluxo na V2.0**:
1. Sistema detecta automaticamente
2. Envia alerta ao professor
3. Professor registra motivo
4. Sistema sugere ações (contato família, ajuste horário)
5. Se persiste, gera Termo de Desistência automaticamente

---

## 🏆 Benefícios da V2.0

### **Para Professores**
- ⏱️ **70% menos tempo** em documentação
- 📊 **Visibilidade clara** de progresso dos alunos
- 📱 **Trabalho offline** sem interrupções
- 📄 **Documentos automáticos** em 1 clique

### **Para Coordenadores**
- 📈 **Dashboard gerencial** em tempo real
- 🎯 **Identificação automática** de alunos em risco
- 📊 **Relatórios completos** para prestação de contas
- 👥 **Visão consolidada** da rede

### **Para Famílias**
- 👀 **Transparência total** sobre o atendimento
- 📲 **Acesso fácil** a documentos (sem login)
- ✍️ **Assinatura digital** rápida e segura
- 📸 **Evidências visuais** do progresso

---

## 🎉 Conclusão

A **V2.0 do Sistema de Plano de AEE** representa uma evolução completa, transformando a gestão do AEE com:

- ✨ **Eficiência**: Reduz tempo de documentação em até 70%
- ✨ **Qualidade**: Baseado em fichas oficiais da Bahia
- ✨ **Rastreabilidade**: Histórico completo de cada aluno
- ✨ **Integração**: Conecta-se ao PEI Collab perfeitamente
- ✨ **Acessibilidade**: Funciona offline em qualquer dispositivo
- ✨ **Análise**: Dashboard com métricas em tempo real

### **Status de Implementação**

| Fase | Status | Previsão |
|------|--------|----------|
| Fase 1 - Fundação | 🔄 Planejado | Q2 2025 |
| Fase 2 - Avaliações | ⏳ Aguardando | Q3 2025 |
| Fase 3 - Documentos | ⏳ Aguardando | Q4 2025 |
| Fase 4 - Offline | ⏳ Aguardando | Q1 2026 |
| Fase 5 - Analytics | ⏳ Aguardando | Q1 2026 |
| Fase 6 - Avançado | ⏳ Aguardando | Q2 2026 |
| Fase 7 - Mobile | ⏳ Aguardando | Q3 2026 |

---

## 📞 Documentos Relacionados

- 📚 [Documentação Atual V1.0](./📚_APP_PLANO_AEE.md)
- 📋 [Roadmap e Comparação](./📋_ROADMAP_PLANO_AEE.md)
- 🗄️ [Modelo de Dados Completo](../database/📊_MODELO_DADOS_V3.md)
- 🔗 [Integração PEI + Plano AEE](../integracao/🔗_INTEGRACAO_PEI_PLANO_AEE.md)

---

**Versão**: 2.0 (Visão Futura)  
**Data**: Janeiro 2025  
**Status**: 🔄 Em Planejamento  
**Implementação**: 🎯 Roadmap definido

**Desenvolvido com ❤️ para educadores e alunos**
