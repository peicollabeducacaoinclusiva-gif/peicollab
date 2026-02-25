import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { roleLabels } from '@/lib/rbac';
import type { ManagedUser } from '@/hooks/useUserManagement';

type UserManagementTableProps = {
  users: ManagedUser[];
  onToggleActive: (userId: string, active: boolean) => Promise<void>;
};

export function UserManagementTable({ users, onToggleActive }: UserManagementTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggle = async (userId: string, active: boolean) => {
    setUpdatingId(userId);
    await onToggleActive(userId, active);
    setUpdatingId(null);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Escola</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{roleLabels[user.role as keyof typeof roleLabels] ?? user.role}</Badge>
              </TableCell>
              <TableCell>{user.school_nome ?? '-'}</TableCell>
              <TableCell>
                <Badge variant={user.active ? 'secondary' : 'destructive'}>
                  {user.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggle(user.id, !user.active)}
                  disabled={updatingId === user.id}
                >
                  {updatingId === user.id ? 'Atualizando...' : user.active ? 'Desativar' : 'Ativar'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
