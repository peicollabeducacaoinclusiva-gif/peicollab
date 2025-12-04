# ✅ Gestão Escolar - Fase 2 Completa

> **Data**: 09/11/2025  
> **Status**: ✅ Concluída  
> **Fase**: 2 - Package Shared Types

---

## 🎯 Objetivo da Fase 2

Criar um **package centralizado de tipos TypeScript** (`@pei/shared-types`) para garantir:
- ✅ Consistência de tipos entre todos os apps
- ✅ Autocomplete e type-safety
- ✅ Documentação inline (via JSDoc)
- ✅ Reutilização de código

---

## 📦 Package Criado: `@pei/shared-types`

### Estrutura Completa

```
packages/shared-types/
├── src/
│   ├── entities/                    # 7 arquivos
│   │   ├── student.ts              ✅ Interface Student + tipos auxiliares
│   │   ├── staff.ts                ✅ Interface Staff/Profiles
│   │   ├── gradeLevel.ts           ✅ Interface GradeLevel
│   │   ├── subject.ts              ✅ Interface Subject
│   │   ├── enrollment.ts           ✅ Interface Enrollment
│   │   ├── attendance.ts           ✅ Interface Attendance + Stats
│   │   ├── grade.ts                ✅ Interface Grade + Boletim
│   │   └── index.ts                ✅ Barrel export
│   ├── enums.ts                    ✅ Constantes e enums
│   ├── utils.ts                    ✅ Tipos utilitários
│   └── index.ts                    ✅ Export central
├── package.json                    ✅ Config do package
├── tsconfig.json                   ✅ TypeScript config
└── README.md                       ✅ Documentação completa
```

**Total de Arquivos**: 13  
**Linhas de Código**: ~650

---

## 📋 Interfaces Criadas

### 1. **Student** (Aluno) - 80+ propriedades

```typescript
export interface Student {
  // Identificação
  id: string;
  codigo_identificador?: string;
  full_name: string;
  nome_social?: string;
  
  // Documentos
  cpf?: string;
  rg?: string;
  date_of_birth: string;
  
  // Dados Pessoais
  sexo?: 'M' | 'F' | 'Outro';
  raca_cor?: string;
  tipo_sanguineo?: string;
  
  // Endereço (8 campos)
  endereco_logradouro?: string;
  endereco_numero?: string;
  // ...
  
  // Contatos (3 campos)
  telefone_principal?: string;
  email?: string;
  
  // Responsáveis (6 campos)
  mae_nome?: string;
  pai_nome?: string;
  // ...
  
  // Status
  status_matricula: 'Ativo' | 'Transferido' | 'Cancelado' | 'Concluído' | 'Abandonou';
  
  // Necessidades Especiais
  necessidades_especiais: boolean;
  tipo_necessidade?: string[];
  laudo_medico_url?: string;
  
  // Relações
  school_id: string;
  tenant_id: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Tipos auxiliares
export type StudentStatus = Student['status_matricula'];
export interface StudentCreateInput extends Omit<Student, 'id' | 'created_at' | 'updated_at'> {}
export interface StudentUpdateInput extends Partial<Omit<Student, 'id' | 'created_at'>> {}
```

**Compatibilidade**: Mantém campos antigos (`full_name`, `date_of_birth`, `special_needs`)

---

### 2. **Staff** (Profissionais) - 30+ propriedades

```typescript
export interface Staff {
  id: string;
  full_name: string;
  matricula_funcional?: string;
  
  // Função
  cargo_funcao?: string;
  tipo_vinculo?: 'Efetivo' | 'Contrato' | 'Comissionado' | 'Voluntário';
  regime_trabalho?: '20h' | '30h' | '40h' | 'Dedicação Exclusiva';
  
  // Formação
  escolaridade?: string;
  formacao?: Array<{
    curso: string;
    instituicao: string;
    ano: number;
    nivel: string;
  }>;
  habilitacoes?: string[]; // ['Libras', 'Braille', 'AEE']
  
  // Documentos e Contatos
  cpf?: string;
  email?: string;
  telefone?: string;
  
  // Status
  is_active: boolean;
  tenant_id: string;
  // ...
}
```

---

### 3. **GradeLevel** (Níveis de Ensino)

```typescript
export interface GradeLevel {
  id: string;
  codigo: string; // EI-PRE, EF-1, EJA-MOD1
  nome: string; // "Pré-escola", "1º Ano EF"
  modalidade: 'Educação Infantil' | 'Ensino Fundamental' | 'Ensino Médio' | 'EJA' | 'Educação Especial';
  etapa?: string; // Anos Iniciais, Anos Finais
  idade_minima?: number;
  idade_maxima?: number;
  carga_horaria_anual?: number;
  // ...
}
```

---

### 4. **Subject** (Disciplinas)

```typescript
export interface Subject {
  id: string;
  codigo: string; // MAT, PORT, HIST
  nome: string; // Matemática, Língua Portuguesa
  componente_curricular?: string;
  area_conhecimento?: string;
  carga_horaria_semanal?: number;
  competencias_bncc?: Record<string, any>;
  // ...
}
```

---

### 5. **Enrollment** (Matrículas)

```typescript
export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  school_id: string;
  ano_letivo: number; // 2025, 2026
  data_matricula: string;
  modalidade: 'Regular' | 'Transferência' | 'Rematrícula';
  status: 'Matriculado' | 'Transferido' | 'Cancelado' | 'Concluído' | 'Abandonou';
  // ...
}

// Com relações expandidas
export interface EnrollmentExpanded extends Enrollment {
  student?: { id: string; full_name: string; };
  class?: { id: string; class_name: string; };
  school?: { id: string; school_name: string; };
}
```

---

### 6. **Attendance** (Frequência)

```typescript
export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  subject_id?: string; // NULL = frequência geral
  data: string;
  presenca: boolean;
  atraso_minutos: number;
  saida_antecipada_minutos: number;
  justificativa?: string;
  is_synced: boolean; // Para offline PWA
  // ...
}

export interface AttendanceStats {
  total_aulas: number;
  presencas: number;
  faltas: number;
  taxa_presenca: number;
  faltas_mes_atual: number;
}
```

---

### 7. **Grade** (Notas)

```typescript
export interface Grade {
  id: string;
  enrollment_id: string;
  subject_id: string;
  avaliacao_tipo: 'Prova' | 'Trabalho' | 'Projeto' | 'Participação' | 'Recuperação' | 'Simulado';
  periodo: string; // "1BIM", "2BIM", "SEM1", "ANUAL"
  nota_valor?: number; // 0.00 a 10.00
  conceito?: string; // A-E, MB-I
  peso: number;
  lancado_por: string;
  aprovado_por?: string;
  // ...
}

export interface Boletim {
  student_id: string;
  student_name: string;
  disciplinas: Array<{
    subject_nome: string;
    media_final: number;
    situacao: 'Aprovado' | 'Reprovado' | 'Recuperação';
  }>;
  media_geral: number;
  total_faltas: number;
}
```

---

## 📐 Enums e Constantes

```typescript
import { 
  STATUS_MATRICULA,
  MODALIDADES,
  PERIODOS_LETIVOS,
  TIPOS_AVALIACAO,
  AREAS_CONHECIMENTO 
} from '@pei/shared-types';

// Uso em components
const statusOptions = Object.values(STATUS_MATRICULA);
// ['Ativo', 'Transferido', 'Cancelado', 'Concluído', 'Abandonou']

const periodos = Object.values(PERIODOS_LETIVOS);
// ['1BIM', '2BIM', '3BIM', '4BIM', 'SEM1', 'SEM2', 'ANUAL', 'REC']
```

---

## 🛠️ Tipos Utilitários

```typescript
import { 
  ApiResponse,
  PaginatedResponse,
  FilterParams,
  SortParams 
} from '@pei/shared-types';

// Response tipada
const response: ApiResponse<Student[]> = {
  data: students,
  error: null,
  count: 10
};

// Paginação
const paginated: PaginatedResponse<Student> = {
  data: students,
  total: 100,
  page: 1,
  pageSize: 10,
  totalPages: 10
};

// Filtros
const filters: FilterParams = {
  search: 'João',
  schoolId: '...',
  isActive: true
};
```

---

## 🔄 Como Usar nos Apps

### No `gestao-escolar`:

```typescript
// apps/gestao-escolar/src/pages/Students.tsx
import { Student, StudentCreateInput, STATUS_MATRICULA } from '@pei/shared-types';
import { supabase } from '@pei/database';

const createStudent = async (input: StudentCreateInput) => {
  const { data, error } = await supabase
    .from('students')
    .insert(input)
    .select()
    .single();
  
  return data as Student;
};
```

### No `pei-collab`:

```typescript
// apps/pei-collab/src/components/SelectStudent.tsx
import { Student, AttendanceStats } from '@pei/shared-types';
import { supabase } from '@pei/database';

const { data: students } = await supabase
  .from('students')
  .select('*')
  .eq('necessidades_especiais', true);

// students é tipado como Student[]
```

### No `plano-aee`:

```typescript
// apps/plano-aee/src/hooks/useStudent.ts
import { Student } from '@pei/shared-types';
import { useQuery } from '@tanstack/react-query';

const useStudent = (studentId: string) => {
  return useQuery<Student>({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      return data;
    }
  });
};
```

---

## 📊 Estatísticas

| Item | Quantidade |
|------|------------|
| **Arquivos criados** | 13 |
| **Interfaces principais** | 7 |
| **Tipos auxiliares** | 20+ |
| **Enums/Constantes** | 10 |
| **Linhas de código** | ~650 |

---

## ✅ Checklist de Conclusão

- [x] Package estruturado (`package.json`, `tsconfig.json`)
- [x] Interface `Student` (80+ props)
- [x] Interface `Staff` (30+ props)
- [x] Interface `GradeLevel`
- [x] Interface `Subject`
- [x] Interface `Enrollment` + `EnrollmentExpanded`
- [x] Interface `Attendance` + `AttendanceStats`
- [x] Interface `Grade` + `Boletim`
- [x] Enums e constantes (10 sets)
- [x] Tipos utilitários (pagination, filters, API responses)
- [x] README com exemplos de uso
- [x] Barrel exports configurados

---

## 🚀 Próximos Passos

### **Fase 3**: Hooks e Queries (Semana seguinte)
1. ⏳ Criar `packages/database/queries/students.ts`
2. ⏳ Criar `packages/database/queries/enrollments.ts`
3. ⏳ Criar `packages/database/queries/academic.ts` (attendance + grades)
4. ⏳ Usar tipos de `@pei/shared-types` em todas as queries

### **Fase 4**: Expandir UI do Gestão Escolar
1. ⏳ Formulário completo de aluno (StudentForm.tsx)
2. ⏳ Perfil detalhado (StudentProfile.tsx)
3. ⏳ Wizard de matrícula (EnrollmentWizard.tsx)

---

## 📚 Documentação Relacionada

- **Fase 1**: `docs/apps/🚧_GESTAO_ESCOLAR_FASE1_INICIADA.md`
- **Roadmap Completo**: `docs/apps/🏫_GESTAO_ESCOLAR_ROADMAP.md`
- **Resumo Apps**: `docs/apps/📊_RESUMO_APPS_MONOREPO.md`

---

**Status**: ✅ **Fase 2 Completa**  
**Progresso Geral**: **25% do Gestão Escolar** (2/8 fases)  
**Próximo**: Fase 3 - Hooks e Queries
























