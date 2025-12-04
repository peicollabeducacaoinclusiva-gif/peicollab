# @pei/shared-types

> Tipos TypeScript compartilhados entre todos os apps do monorepo PEI Collab

## 📦 Instalação

Este package é automaticamente linkado via workspace do pnpm.

```bash
# Instalar dependências
pnpm install

# Build do package
cd packages/shared-types
pnpm build
```

## 🎯 Objetivo

Centralizar as interfaces TypeScript de todas as entidades do banco de dados, garantindo consistência de tipos entre os apps:
- `pei-collab`
- `gestao-escolar`
- `plano-aee`
- `planejamento`
- `atividades`

## 📚 Entidades Disponíveis

### **Student** (Aluno)
```typescript
import { Student, StudentCreateInput } from '@pei/shared-types';

const student: Student = {
  id: '...',
  full_name: 'João Silva',
  codigo_identificador: 'ALU-2025-001',
  date_of_birth: '2010-05-15',
  necessidades_especiais: true,
  tipo_necessidade: ['Autismo', 'TDAH'],
  status_matricula: 'Ativo',
  // ...
};
```

### **Staff** (Profissionais)
```typescript
import { Staff, StaffVinculo, StaffRegime } from '@pei/shared-types';

const teacher: Staff = {
  id: '...',
  full_name: 'Maria Santos',
  matricula_funcional: 'MAT-12345',
  cargo_funcao: 'Professor AEE',
  tipo_vinculo: 'Efetivo',
  regime_trabalho: '40h',
  habilitacoes: ['Libras', 'AEE', 'Braille'],
  // ...
};
```

### **GradeLevel** (Níveis de Ensino)
```typescript
import { GradeLevel, Modalidade } from '@pei/shared-types';

const gradeLevel: GradeLevel = {
  id: '...',
  codigo: 'EF-1',
  nome: '1º Ano EF',
  modalidade: 'Ensino Fundamental',
  etapa: 'Anos Iniciais',
  idade_minima: 6,
  idade_maxima: 7,
  // ...
};
```

### **Subject** (Disciplinas)
```typescript
import { Subject, AreaConhecimento } from '@pei/shared-types';

const subject: Subject = {
  id: '...',
  codigo: 'MAT',
  nome: 'Matemática',
  area_conhecimento: 'Matemática',
  carga_horaria_semanal: 5,
  // ...
};
```

### **Enrollment** (Matrículas)
```typescript
import { Enrollment, EnrollmentStatus } from '@pei/shared-types';

const enrollment: Enrollment = {
  id: '...',
  student_id: '...',
  class_id: '...',
  school_id: '...',
  ano_letivo: 2025,
  data_matricula: '2025-02-01',
  modalidade: 'Regular',
  status: 'Matriculado',
  // ...
};
```

### **Attendance** (Frequência)
```typescript
import { Attendance, AttendanceStats } from '@pei/shared-types';

const attendance: Attendance = {
  id: '...',
  student_id: '...',
  class_id: '...',
  subject_id: '...', // ou null para frequência geral
  data: '2025-02-10',
  presenca: true,
  atraso_minutos: 0,
  // ...
};
```

### **Grade** (Notas)
```typescript
import { Grade, Periodo, AvaliacaoTipo } from '@pei/shared-types';

const grade: Grade = {
  id: '...',
  enrollment_id: '...',
  subject_id: '...',
  avaliacao_tipo: 'Prova',
  periodo: '1BIM',
  nota_valor: 8.5,
  peso: 1.0,
  lancado_por: '...',
  // ...
};
```

## 🔧 Uso nos Apps

### Importação Básica
```typescript
import { 
  Student, 
  Enrollment, 
  Attendance, 
  Grade 
} from '@pei/shared-types';
```

### Importação de Enums
```typescript
import { 
  STATUS_MATRICULA,
  MODALIDADES,
  PERIODOS_LETIVOS 
} from '@pei/shared-types';
```

### Importação de Utils
```typescript
import { 
  ApiResponse,
  PaginatedResponse,
  FilterParams 
} from '@pei/shared-types';
```

## 📁 Estrutura

```
packages/shared-types/
├── src/
│   ├── entities/          # Interfaces de entidades
│   │   ├── student.ts
│   │   ├── staff.ts
│   │   ├── gradeLevel.ts
│   │   ├── subject.ts
│   │   ├── enrollment.ts
│   │   ├── attendance.ts
│   │   ├── grade.ts
│   │   └── index.ts
│   ├── enums.ts           # Constantes e enums
│   ├── utils.ts           # Tipos utilitários
│   └── index.ts           # Export central
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Build

```bash
# Desenvolvimento (watch mode)
pnpm dev

# Build de produção
pnpm build

# Limpar build
pnpm clean
```

## 📝 Adicionar Novos Tipos

1. Criar arquivo em `src/entities/` ou adicionar em existente
2. Exportar em `src/entities/index.ts`
3. Rodar `pnpm build`
4. O tipo estará disponível em todos os apps

## 🔗 Dependentes

Este package é usado por:
- `@pei/pei-collab`
- `@pei/gestao-escolar`
- `@pei/plano-aee`
- `@pei/planejamento`
- `@pei/atividades`
- `@pei/database` (queries tipadas)

---

**Versão**: 1.0.0  
**Mantido por**: Equipe PEI Collab

