# 📖 GUIA DE USO DA API

**Sistema**: PEI Collab V3  
**Versão**: 3.0  
**Documentação**: Swagger/OpenAPI completa

---

## 🚀 Início Rápido

### 1. Autenticação

```typescript
import { supabase } from '@/lib/supabase';

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'senha-segura'
});

// Obter token
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

### 2. Fazer Requisição

```typescript
// Exemplo: Buscar alunos
const { data: students, error } = await supabase
  .from('students')
  .select('*')
  .eq('school_id', schoolId);
```

---

## 📋 EXEMPLOS DE USO

### Gestão de Alunos

#### Criar Aluno

```typescript
const { data, error } = await supabase
  .from('students')
  .insert({
    name: 'João Silva',
    date_of_birth: '2012-05-15',
    school_id: 'uuid-school',
    tenant_id: 'uuid-tenant',
    codigo_identificador: 'ALU2025001',
    necessidades_especiais: true,
    tipo_necessidade: ['TDAH', 'Dislexia'],
    cpf: '123.456.789-00',
    logradouro: 'Rua das Flores',
    numero_endereco: '123',
    cidade: 'São Paulo',
    estado: 'SP',
    responsavel1_nome: 'Maria Silva',
    responsavel1_telefone: '(11) 98765-4321',
  })
  .select()
  .single();
```

#### Buscar Alunos com NEE

```typescript
const { data, error } = await supabase
  .from('students')
  .select(`
    *,
    peis (
      id,
      status,
      is_active_version
    )
  `)
  .eq('school_id', schoolId)
  .eq('necessidades_especiais', true)
  .eq('is_active', true);
```

#### Obter Contexto Acadêmico

```typescript
const { data, error } = await supabase
  .rpc('get_student_academic_context', {
    _student_id: studentId
  });

console.log(data);
// {
//   turma: "6º Ano A",
//   frequencia_percentual: 87.5,
//   media_geral: 7.8
// }
```

---

### Matrículas

#### Criar Matrícula

```typescript
const { data, error } = await supabase
  .from('enrollments')
  .insert({
    student_id: 'uuid-aluno',
    class_id: 'uuid-turma',
    school_id: 'uuid-school',
    tenant_id: 'uuid-tenant',
    ano_letivo: '2025',
    numero_matricula: '2025001',
    data_matricula: '2025-02-01',
    status: 'Matriculado',
    bolsista: true,
    tipo_bolsa: 'Social',
    percentual_bolsa: 50,
    utiliza_transporte: true,
    rota_transporte: 'Rota 1',
  })
  .select()
  .single();
```

#### Buscar Matrículas de uma Turma

```typescript
const { data, error } = await supabase
  .from('enrollments')
  .select(`
    *,
    student:students (
      id,
      name,
      codigo_identificador,
      necessidades_especiais
    )
  `)
  .eq('class_id', classId)
  .eq('status', 'Matriculado')
  .order('student.name');
```

---

### Frequência

#### Registrar Frequência (Upsert)

```typescript
const attendanceData = [
  {
    class_id: 'uuid-turma',
    student_id: 'uuid-aluno-1',
    data: '2025-11-09',
    presenca: true,
    tenant_id: 'uuid-tenant',
  },
  {
    class_id: 'uuid-turma',
    student_id: 'uuid-aluno-2',
    data: '2025-11-09',
    presenca: false,
    justificativa: 'Consulta médica',
    tenant_id: 'uuid-tenant',
  },
];

const { error } = await supabase
  .from('attendance')
  .upsert(attendanceData, {
    onConflict: 'student_id,data,class_id'
  });
```

#### Buscar Frequência

```typescript
const { data, error } = await supabase
  .from('attendance')
  .select(`
    *,
    student:students (
      id,
      name
    )
  `)
  .eq('class_id', classId)
  .eq('data', '2025-11-09');
```

---

### Notas

#### Lançar Notas

```typescript
const gradesData = [
  {
    enrollment_id: 'uuid-matricula-1',
    subject_id: 'uuid-matematica',
    periodo: '1',
    tipo_avaliacao: 'prova',
    nota_valor: 8.5,
    peso: 2,
    lancado_por: userId,
  },
  {
    enrollment_id: 'uuid-matricula-2',
    subject_id: 'uuid-matematica',
    periodo: '1',
    tipo_avaliacao: 'prova',
    nota_conceito: 'A',
    peso: 2,
    lancado_por: userId,
  },
];

const { error } = await supabase
  .from('grades')
  .upsert(gradesData, {
    onConflict: 'enrollment_id,subject_id,periodo,tipo_avaliacao'
  });
```

#### Buscar Boletim do Aluno

```typescript
import { getStudentBoletim } from '@pei/database/queries';

const boletim = await getStudentBoletim(enrollmentId);

console.log(boletim);
// {
//   student_name: "João Silva",
//   media_geral: 7.8,
//   taxa_presenca: 92.5,
//   disciplinas: [
//     {
//       subject_nome: "Matemática",
//       media_final: 8.5,
//       situacao: "Aprovado"
//     }
//   ]
// }
```

---

### Visitas Escolares

#### Criar Visita

```typescript
const { data, error } = await supabase
  .from('aee_school_visits')
  .insert({
    plan_id: 'uuid-plano',
    student_id: 'uuid-aluno',
    school_id: 'uuid-school',
    tenant_id: 'uuid-tenant',
    visit_date: '2025-11-09',
    visit_time: '10:00',
    duration_minutes: 90,
    visit_type: 'acompanhamento',
    aee_teacher_id: userId,
    observations: 'Aluno demonstrou boa integração...',
    class_environment: 'Sala acessível, sem barreiras.',
    orientations_given: [
      {
        categoria: 'Didática',
        descricao: 'Usar recursos visuais',
        prioridade: 'Alta'
      }
    ],
    status: 'rascunho',
  })
  .select()
  .single();
```

#### Buscar Estatísticas

```typescript
const { data, error } = await supabase
  .rpc('get_plan_visits_stats', {
    _plan_id: planId
  });
```

---

### Encaminhamentos

#### Criar Encaminhamento

```typescript
const { data, error } = await supabase
  .from('aee_referrals')
  .insert({
    plan_id: 'uuid-plano',
    student_id: 'uuid-aluno',
    school_id: 'uuid-school',
    tenant_id: 'uuid-tenant',
    specialist_type: 'Fonoaudiólogo',
    specialist_name: 'Dra. Maria Santos',
    institution: 'Clínica ABC',
    reason: 'Dificuldades na articulação de fonemas...',
    urgency_level: 'media',
    requested_by: userId,
    contact_info: {
      telefone: '(21) 98765-4321',
      email: 'maria@clinica.com'
    },
    status: 'enviado',
  })
  .select()
  .single();
```

#### Registrar Retorno do Especialista

```typescript
const { data, error } = await supabase
  .from('aee_referrals')
  .update({
    specialist_feedback: 'Avaliação realizada...',
    diagnosis_summary: 'CID R48.8 - Dislalia',
    recommendations: 'Terapia 2x por semana...',
    feedback_received_date: new Date().toISOString(),
    status: 'concluido',
  })
  .eq('id', referralId)
  .select()
  .single();
```

---

### Notificações

#### Buscar Notificações Não Lidas

```typescript
const { data, error } = await supabase
  .from('aee_notifications')
  .select('*')
  .eq('is_read', false)
  .eq('is_dismissed', false)
  .order('priority')
  .order('created_at', { ascending: false });
```

#### Marcar como Lida

```typescript
const { error } = await supabase
  .from('aee_notifications')
  .update({
    is_read: true,
    read_at: new Date().toISOString()
  })
  .eq('id', notificationId);
```

#### Escutar em Real-time

```typescript
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
      console.log('Nova notificação!', payload.new);
      // Atualizar UI
    }
  )
  .subscribe();
```

---

## 🔐 PERMISSÕES E RLS

### Verificar Permissões

```sql
-- Verificar role do usuário
SELECT has_role(auth.uid(), 'aee_teacher');

-- Verificar acesso ao PEI
SELECT user_can_access_pei(auth.uid(), 'uuid-pei');
```

### RLS por Tabela

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| students | Tenant | Admin | Admin | Admin |
| enrollments | Tenant | Admin | Admin | Admin |
| attendance | Tenant | Teacher | Teacher | Admin |
| grades | Tenant | Teacher | Teacher | Admin |
| aee_school_visits | Tenant | AEE Teacher | AEE Teacher | AEE Teacher |
| aee_referrals | Tenant | AEE Teacher | AEE Teacher | AEE Teacher |
| aee_notifications | Own | System | Own | Own |

---

## ⚡ RATE LIMITS

Supabase impõe rate limits padrão:
- **100 req/s** por IP (free tier)
- **1000 req/s** (pro tier)
- **Real-time**: 100 conexões simultâneas (free tier)

---

## 🎯 BOAS PRÁTICAS

### 1. Use React Query (Cache Automático)

```typescript
// ✅ Bom: Usa cache
const { data } = useStudents(filters);

// ❌ Evitar: Request direto sempre
const students = await supabase.from('students').select();
```

### 2. Use Upsert para Evitar Conflitos

```typescript
// ✅ Bom: Upsert
await supabase
  .from('attendance')
  .upsert(data, { onConflict: 'student_id,data,class_id' });

// ❌ Evitar: Insert que pode duplicar
await supabase.from('attendance').insert(data);
```

### 3. Use Funções SQL para Lógica Complexa

```typescript
// ✅ Bom: Função SQL otimizada
const stats = await supabase.rpc('get_plan_visits_stats', { _plan_id: id });

// ❌ Evitar: Múltiplas queries no frontend
const visits = await supabase.from('visits').select();
const stats = calculateStatsInJS(visits); // Lento
```

---

## 📊 SWAGGER UI

Para visualizar a documentação Swagger interativa:

1. **Online**: Use [Swagger Editor](https://editor.swagger.io/)
2. **Cole** o conteúdo de `swagger.yaml`
3. **Explore** endpoints e schemas

Ou instale localmente:

```bash
npm install -g swagger-ui-watcher
swagger-ui-watcher docs/api/swagger.yaml
```

---

## 🎉 Documentação Completa!

Agora você tem:

✅ **Swagger/OpenAPI** formal (swagger.yaml)  
✅ **Guia de uso** com exemplos práticos  
✅ **Referência API** detalhada  
✅ **Schemas** completos  
✅ **Exemplos** de código  
✅ **Boas práticas**  

---

**Próximos Passos**:
1. Aplicar migrações: `🚀_APLICAR_MIGRACOES_FINAIS.md`
2. Executar testes: `tests/e2e/README.md`
3. Deploy em produção

🚀 **API PRONTA PARA USO!**
























