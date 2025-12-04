# Sistema de Permissões Refatorado - Plano Técnico

**Data:** 28/01/2025  
**Status:** 🟢 **100% Completo**

---

## 📋 OBJETIVO

Criar um sistema de permissões unificado, fácil de usar e com ferramentas de debug para facilitar o desenvolvimento e manutenção.

---

## ✅ COMPONENTES CRIADOS

### 1. Serviço Centralizado (`permissionsService.ts`) ✅

**Localização:** `apps/gestao-escolar/src/services/permissionsService.ts`

**Funcionalidades:**
- ✅ Verificação universal de permissões
- ✅ Matriz de permissões por role (11 roles)
- ✅ Suporte a permissões granulares (integração com RPC `has_permission`)
- ✅ Verificação múltipla (`canAll`, `canAny`)
- ✅ TypeScript completo com tipos exportados

**Tipos:**
- `PermissionAction`: view, create, edit, delete, export, issue_document, approve, reject, manage
- `PermissionResource`: student, pei, aee, class, enrollment, document, transfer, occurrence, ticket, school, network, user, dashboard, report
- `UserRole`: 11 roles diferentes

### 2. Hook Universal `useCan()` ✅

**Localização:** `apps/gestao-escolar/src/hooks/useCan.ts`

**Funcionalidades:**
- ✅ Hook principal para verificação de permissões
- ✅ Hook específico `useCanResource()` com cache
- ✅ Integração com React Query para cache automático
- ✅ API simples e intuitiva

**Exemplo de uso:**
```tsx
const { can } = useCan();
const hasPermission = await can('edit', 'student', { resourceId: '123' });
```

### 3. Componente `PermissionGate` ✅

**Localização:** `apps/gestao-escolar/src/components/permissions/PermissionGate.tsx`

**Funcionalidades:**
- ✅ Renderiza children apenas se tiver permissão
- ✅ Fallback customizável
- ✅ Integração com DEBUG MODE
- ✅ Mensagens de erro informativas

**Exemplo de uso:**
```tsx
<PermissionGate action="edit" resource="student" resourceId={studentId}>
  <EditButton />
</PermissionGate>
```

### 4. DEBUG MODE ✅

**Localização:** `apps/gestao-escolar/src/hooks/usePermissionDebug.ts` + `PermissionDebugPanel.tsx`

**Funcionalidades:**
- ✅ Painel flutuante para visualizar verificações de permissão
- ✅ Log de todas as verificações (permitidas/negadas)
- ✅ Estatísticas em tempo real
- ✅ Ativado via localStorage (`permission-debug: true`)
- ✅ Botão flutuante para ativar/desativar

**Como usar:**
```tsx
// No App.tsx, adicione:
import { PermissionDebugPanel } from '@/components/permissions';

// No JSX:
{process.env.NODE_ENV === 'development' && <PermissionDebugPanel />}
```

### 5. Middleware de Segurança ✅

**Localização:** `apps/gestao-escolar/src/lib/middleware/requirePermission.tsx`

**Funcionalidades:**
- ✅ HOC para proteger rotas
- ✅ Redirecionamento automático se sem permissão
- ✅ Fallback customizável
- ✅ Loading state durante verificação

**Exemplo de uso:**
```tsx
const ProtectedStudentList = requirePermission(StudentList, {
  action: 'view',
  resource: 'student',
  redirectTo: '/unauthorized'
});
```

---

## 🎯 MATRIZ DE PERMISSÕES

### Roles Implementados (11)

1. **superadmin** - Acesso total a tudo
2. **education_secretary** - Gestão de rede
3. **school_director** - Gestão de escola
4. **coordinator** - Coordenação pedagógica
5. **teacher** - Professor regular
6. **aee_teacher** - Professor AEE
7. **specialist** - Especialista
8. **support_professional** - Profissional de apoio
9. **secretary** - Secretário escolar
10. **family** - Responsável/família
11. **student** - Estudante

### Recursos Implementados (14)

- student
- pei
- aee
- class
- enrollment
- document
- transfer
- occurrence
- ticket
- school
- network
- user
- dashboard
- report

### Ações Implementadas (9)

- view
- create
- edit
- delete
- export
- issue_document
- approve
- reject
- manage

---

## 📖 DOCUMENTAÇÃO DE USO

### Verificação Simples

```tsx
import { useCan } from '@/hooks/useCan';

function MyComponent() {
  const { can } = useCan();
  const [hasEditPermission, setHasEditPermission] = useState(false);

  useEffect(() => {
    can('edit', 'student').then(setHasEditPermission);
  }, [can]);

  return hasEditPermission ? <EditButton /> : null;
}
```

### Verificação com Resource ID

```tsx
const { can } = useCan();
const canEdit = await can('edit', 'student', { resourceId: studentId });
```

### Hook Específico com Cache

```tsx
import { useCanResource } from '@/hooks/useCan';

function StudentCard({ studentId }) {
  const { canEdit, canDelete, loading } = useCanResource('student', {
    resourceId: studentId
  });

  if (loading) return <Skeleton />;

  return (
    <div>
      {canEdit && <EditButton />}
      {canDelete && <DeleteButton />}
    </div>
  );
}
```

### Componente PermissionGate

```tsx
import { PermissionGate } from '@/components/permissions';

<PermissionGate 
  action="edit" 
  resource="student" 
  resourceId={studentId}
  fallback={<Alert>Sem permissão</Alert>}
>
  <EditButton />
</PermissionGate>
```

### Proteção de Rotas

```tsx
import { requirePermission } from '@/lib/middleware/requirePermission';

const ProtectedRoute = requirePermission(StudentList, {
  action: 'view',
  resource: 'student',
  redirectTo: '/unauthorized'
});

// No App.tsx:
<Route path="/students" element={<ProtectedRoute />} />
```

### DEBUG MODE

1. **Ativar no código:**
```tsx
// App.tsx
{process.env.NODE_ENV === 'development' && <PermissionDebugPanel />}
```

2. **Ou via localStorage:**
```javascript
localStorage.setItem('permission-debug', 'true');
```

3. **Botão flutuante aparecerá no canto inferior direito**

---

## 🔄 INTEGRAÇÃO COM BACKEND

O sistema integra com:
- ✅ `get_user_primary_role()` - RPC para buscar role principal
- ✅ `has_permission()` - RPC para permissões granulares
- ✅ Tabela `role_permissions` - Permissões por papel
- ✅ Tabela `user_permissions` - Permissões específicas por usuário

---

## ✅ CHECKLIST

### Funcionalidades Core
- [x] Serviço centralizado de permissões
- [x] Hook universal `useCan()`
- [x] Hook específico `useCanResource()`
- [x] Componente `PermissionGate`
- [x] Middleware `requirePermission`
- [x] DEBUG MODE com painel visual
- [x] Matriz de permissões completa (11 roles x 14 resources)
- [x] TypeScript completo
- [x] Documentação técnica

---

**Status:** 🟢 **Sistema de Permissões 100% completo e pronto para uso!**

