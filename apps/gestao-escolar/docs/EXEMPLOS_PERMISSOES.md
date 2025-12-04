# Exemplos de Uso - Sistema de Permissões

**Data:** 28/01/2025

---

## 🎯 EXEMPLOS PRÁTICOS

### 1. Verificar Permissão em Botão

```tsx
import { useCan } from '@/hooks/useCan';
import { Button } from '@/components/ui';

function StudentActions({ studentId }) {
  const { can } = useCan();
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    Promise.all([
      can('edit', 'student', { resourceId: studentId }),
      can('delete', 'student', { resourceId: studentId }),
    ]).then(([edit, del]) => {
      setCanEdit(edit);
      setCanDelete(del);
    });
  }, [can, studentId]);

  return (
    <div className="flex gap-2">
      {canEdit && <Button>Editar</Button>}
      {canDelete && <Button variant="destructive">Excluir</Button>}
    </div>
  );
}
```

### 2. Usando PermissionGate

```tsx
import { PermissionGate } from '@/components/permissions';

function StudentCard({ student }) {
  return (
    <Card>
      <CardHeader>{student.name}</CardHeader>
      <CardContent>
        <PermissionGate
          action="edit"
          resource="student"
          resourceId={student.id}
        >
          <EditButton />
        </PermissionGate>

        <PermissionGate
          action="delete"
          resource="student"
          resourceId={student.id}
          fallback={<span className="text-muted-foreground">Sem permissão para excluir</span>}
        >
          <DeleteButton />
        </PermissionGate>
      </CardContent>
    </Card>
  );
}
```

### 3. Hook Específico com Cache

```tsx
import { useCanResource } from '@/hooks/useCan';

function PEICard({ peiId }) {
  const { canView, canEdit, canApprove, canReject, loading } = useCanResource('pei', {
    resourceId: peiId
  });

  if (loading) return <Skeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>PEI #{peiId}</CardTitle>
      </CardHeader>
      <CardContent>
        {canView && <ViewButton />}
        {canEdit && <EditButton />}
        {canApprove && <ApproveButton />}
        {canReject && <RejectButton />}
      </CardContent>
    </Card>
  );
}
```

### 4. Proteger Rota Completa

```tsx
// pages/ProtectedStudentList.tsx
import { requirePermission } from '@/lib/middleware/requirePermission';
import StudentList from './StudentList';

export default requirePermission(StudentList, {
  action: 'view',
  resource: 'student',
  redirectTo: '/unauthorized'
});

// App.tsx
<Route path="/students" element={<ProtectedStudentList />} />
```

### 5. Verificação Condicional

```tsx
import { useCan } from '@/hooks/useCan';

function Dashboard() {
  const { can } = useCan();
  const [canViewNetwork, setCanViewNetwork] = useState(false);
  const [canViewSchool, setCanViewSchool] = useState(false);

  useEffect(() => {
    Promise.all([
      can('view', 'dashboard', { tenantId: tenantId }),
      can('view', 'dashboard', { schoolId: schoolId }),
    ]).then(([network, school]) => {
      setCanViewNetwork(network);
      setCanViewSchool(school);
    });
  }, [can, tenantId, schoolId]);

  return (
    <div>
      {canViewNetwork && <NetworkDashboard />}
      {canViewSchool && <SchoolDashboard />}
    </div>
  );
}
```

### 6. Verificação Múltipla (Todas)

```tsx
import { useCan } from '@/hooks/useCan';

function StudentForm({ studentId }) {
  const { canAll } = useCan();

  const handleSubmit = async () => {
    const results = await canAll([
      { action: 'edit', resource: 'student', resourceId: studentId },
      { action: 'view', resource: 'class' },
    ]);

    if (results.every(r => r)) {
      // Todas as permissões concedidas
      await submitForm();
    } else {
      alert('Sem permissão para realizar esta ação');
    }
  };

  return <Button onClick={handleSubmit}>Salvar</Button>;
}
```

### 7. Verificação Múltipla (Qualquer Uma)

```tsx
import { useCan } from '@/hooks/useCan';

function DocumentActions({ documentId }) {
  const { canAny } = useCan();

  const handleAction = async () => {
    const result = await canAny([
      { action: 'edit', resource: 'document', resourceId: documentId },
      { action: 'issue_document', resource: 'document', resourceId: documentId },
    ]);

    if (result) {
      // Tem pelo menos uma das permissões
      await performAction();
    }
  };

  return <Button onClick={handleAction}>Ações</Button>;
}
```

### 8. Emissão de Documentos

```tsx
import { PermissionGate } from '@/components/permissions';

function DocumentsPage() {
  return (
    <div>
      <PermissionGate action="issue_document" resource="document">
        <Button>Emitir Declaração</Button>
      </PermissionGate>

      <PermissionGate action="issue_document" resource="document">
        <Button>Emitir Histórico</Button>
      </PermissionGate>
    </div>
  );
}
```

### 9. Secretaria - Múltiplas Ações

```tsx
function SecretariatDashboard() {
  const { can } = useCan();
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    Promise.all([
      can('view', 'transfer'),
      can('create', 'transfer'),
      can('view', 'document'),
      can('issue_document', 'document'),
      can('view', 'occurrence'),
      can('create', 'occurrence'),
      can('view', 'ticket'),
      can('create', 'ticket'),
    ]).then(([transfers, createTransfer, docs, issueDoc, occurrences, createOcc, tickets, createTicket]) => {
      setPermissions({
        transfers,
        createTransfer,
        docs,
        issueDoc,
        occurrences,
        createOcc,
        tickets,
        createTicket,
      });
    });
  }, [can]);

  return (
    <div className="grid grid-cols-2 gap-4">
      {permissions.transfers && (
        <Card>
          <CardHeader>Transferências</CardHeader>
          {permissions.createTransfer && <Button>Criar Transferência</Button>}
        </Card>
      )}
      {permissions.docs && (
        <Card>
          <CardHeader>Documentos</CardHeader>
          {permissions.issueDoc && <Button>Emitir Documento</Button>}
        </Card>
      )}
    </div>
  );
}
```

### 10. Aprovação de PEI

```tsx
import { PermissionGate } from '@/components/permissions';

function PEIDetail({ pei }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>PEI #{pei.id}</CardTitle>
        <CardDescription>Status: {pei.status}</CardDescription>
      </CardHeader>
      <CardContent>
        {pei.status === 'pending' && (
          <>
            <PermissionGate action="approve" resource="pei" resourceId={pei.id}>
              <Button variant="default">Aprovar</Button>
            </PermissionGate>
            <PermissionGate action="reject" resource="pei" resourceId={pei.id}>
              <Button variant="destructive">Rejeitar</Button>
            </PermissionGate>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 🔧 CONFIGURAÇÃO DO DEBUG MODE

### Ativar no Desenvolvimento

```tsx
// App.tsx
import { PermissionDebugPanel } from '@/components/permissions';

function App() {
  return (
    <div>
      {/* Seu app aqui */}
      
      {process.env.NODE_ENV === 'development' && <PermissionDebugPanel />}
    </div>
  );
}
```

### Ativar Manualmente

```javascript
// Console do navegador
localStorage.setItem('permission-debug', 'true');
// Recarregar página
```

### Desativar

```javascript
localStorage.removeItem('permission-debug');
// ou
localStorage.setItem('permission-debug', 'false');
```

---

## 🎨 BOAS PRÁTICAS

1. **Use `useCanResource` quando possível** - Tem cache automático
2. **Use `PermissionGate` para componentes** - Mais declarativo
3. **Use `requirePermission` para rotas** - Proteção automática
4. **Ative DEBUG MODE em desenvolvimento** - Facilita debugging
5. **Sempre verifique `loading` antes de renderizar** - Evita flickering

---

**Status:** ✅ **Exemplos completos e prontos para uso!**

