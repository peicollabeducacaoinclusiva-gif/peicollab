# 📐 Padrões de Código

Convenções e padrões de código do projeto PEI Collab V3.

---

## 🎯 Princípios Gerais

- **TypeScript primeiro**: Use tipos sempre que possível
- **Componentes funcionais**: Use React Hooks, não classes
- **Código limpo**: Legível, manutenível e testável
- **Consistência**: Siga os padrões existentes no projeto

---

## 📝 TypeScript

### Tipos e Interfaces

```typescript
// ✅ Bom: Interface clara e tipada
interface Student {
  id: string;
  name: string;
  dateOfBirth: Date;
  schoolId: string;
}

// ❌ Ruim: any ou tipos genéricos demais
function processStudent(data: any) { }
```

### Evitar `any`

```typescript
// ❌ Ruim
const data: any = fetchData();

// ✅ Bom
const data: Student = fetchData();

// ✅ Bom: Se realmente não souber o tipo
const data: unknown = fetchData();
```

### Nomes de Tipos

- **Interfaces**: PascalCase, substantivos
  ```typescript
  interface UserProfile { }
  interface PeiFormData { }
  ```

- **Types**: PascalCase, substantivos
  ```typescript
  type UserRole = 'teacher' | 'coordinator';
  ```

---

## ⚛️ React

### Componentes Funcionais

```typescript
// ✅ Bom: Componente funcional com TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={variant}>
      {label}
    </button>
  );
}
```

### Hooks

```typescript
// ✅ Bom: Custom hook com tipos
function useStudent(studentId: string) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ...
  }, [studentId]);

  return { student, loading };
}
```

### Nomes de Componentes

- **Componentes**: PascalCase
  ```typescript
  export function StudentCard() { }
  export function PeiForm() { }
  ```

- **Hooks**: camelCase com prefixo `use`
  ```typescript
  export function useAuth() { }
  export function usePeiData() { }
  ```

---

## 🎨 Estilização (Tailwind CSS)

### Classes Tailwind

```tsx
// ✅ Bom: Classes organizadas
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900">Título</h2>
</div>

// ❌ Ruim: Classes inline muito longas (use variáveis)
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
```

### Componentes shadcn/ui

Use componentes do `packages/ui` quando possível:

```tsx
// ✅ Bom
import { Button } from '@pei-collab/ui';
import { Dialog, DialogContent } from '@pei-collab/ui';

// ❌ Ruim: Recriar componentes que já existem
<button className="px-4 py-2 bg-blue-500...">Clique</button>
```

---

## 🗄️ Banco de Dados

### Queries com Supabase

```typescript
// ✅ Bom: Usar funções RPC quando disponíveis
const canAccess = await supabase.rpc('user_can_access_pei', {
  pei_id: peiId,
  user_id: userId
});

// ✅ Bom: Queries tipadas
const { data, error } = await supabase
  .from('students')
  .select('id, name, school_id')
  .eq('school_id', schoolId);

// ❌ Ruim: SELECT direto em tabelas sensíveis sem RLS
const { data } = await supabase.from('students').select('*');
```

### Regras Importantes

1. **Nunca fazer SELECT direto** em `students` ou `peis` sem usar funções RPC
2. **Sempre usar RLS**: Respeitar políticas de segurança
3. **Respeitar máquina de estados**: PEI status `draft → pending → approved/returned`

---

## 📁 Estrutura de Arquivos

### Organização de Componentes

```
components/
├── StudentCard.tsx          # Componente principal
├── StudentCard.test.tsx     # Testes
└── StudentCard.types.ts     # Tipos (se necessário)
```

### Nomes de Arquivos

- **Componentes**: PascalCase
  ```
  StudentCard.tsx
  PeiForm.tsx
  ```

- **Hooks**: camelCase com prefixo `use`
  ```
  useAuth.ts
  useStudentData.ts
  ```

- **Serviços**: camelCase
  ```
  studentService.ts
  peiService.ts
  ```

- **Utilitários**: camelCase
  ```
  formatDate.ts
  validateForm.ts
  ```

---

## 🔐 Segurança

### Autenticação

```typescript
// ✅ Bom: Verificar autenticação antes de acessar dados
const { user } = useAuth();
if (!user) return <Redirect to="/login" />;

// ✅ Bom: Usar hooks de permissão
const { hasRole } = usePermissions();
if (!hasRole('teacher')) return <AccessDenied />;
```

### Dados Sensíveis

- **Nunca** expor dados sensíveis no frontend
- **Sempre** validar no backend (RLS)
- **Usar** funções RPC para acessos complexos

---

## 📝 Comentários

### Quando Comentar

```typescript
// ✅ Bom: Explica "por quê", não "o quê"
// Usamos RPC aqui porque a query direta não respeita RLS
const canAccess = await supabase.rpc('user_can_access_pei', { ... });

// ✅ Bom: Documenta funções complexas
/**
 * Calcula a média de avaliações de um PEI
 * @param evaluations - Array de avaliações
 * @returns Média arredondada para 2 casas decimais
 */
function calculateAverage(evaluations: Evaluation[]): number {
  // ...
}

// ❌ Ruim: Comenta o óbvio
// Incrementa o contador
counter++;
```

---

## 🧪 Testes

### Nomes de Testes

```typescript
// ✅ Bom: Descreve o comportamento
describe('StudentCard', () => {
  it('deve exibir nome do aluno', () => { });
  it('deve chamar onClick quando clicado', () => { });
});

// ❌ Ruim: Nome genérico
it('testa componente', () => { });
```

---

## 🚫 Anti-padrões

### ❌ Evitar

- `any` em TypeScript
- Componentes de classe (use hooks)
- Lógica de negócio em componentes (use services/hooks)
- Duplicação de código
- Comentários desnecessários
- Nomes genéricos (`data`, `item`, `obj`)

### ✅ Preferir

- Tipos explícitos
- Componentes funcionais
- Separação de responsabilidades
- Reutilização de código
- Código autoexplicativo
- Nomes descritivos

---

## 📚 Recursos

- **[Guia de Contribuição](./03_GUIA_CONTRIBUICAO.md)**
- **[Arquitetura do Sistema](./02_ARQUITETURA_SISTEMA.md)**
- **[Documentação do TypeScript](https://www.typescriptlang.org/docs/)**
- **[Documentação do React](https://react.dev/)**

---

**Última atualização**: Janeiro 2025

