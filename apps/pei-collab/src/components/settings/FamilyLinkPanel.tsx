import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { useFamilyLinks } from '@/hooks/useFamilyLinks';
import { useFamilyUsers } from '@/hooks/useFamilyUsers';
import { useStudents } from '@/hooks/useStudents';

export function FamilyLinkPanel() {
  const { links, loading, error, createLink, deleteLink } = useFamilyLinks();
  const { users: familyUsers } = useFamilyUsers();
  const { students } = useStudents({ search: '', categoria: '', serie: '' });
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async () => {
    setFormError(null);
    if (!selectedUser || !selectedStudent) return;
    setSubmitting(true);
    try {
      await createLink(selectedUser, selectedStudent);
      setSelectedUser('');
      setSelectedStudent('');
    } catch (err) {
      setFormError('Não foi possível criar o vínculo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vínculo família ↔ aluno</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a família" />
            </SelectTrigger>
            <SelectContent>
              {familyUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o aluno" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleCreate} disabled={!selectedUser || !selectedStudent || submitting}>
            {submitting ? 'Vinculando...' : 'Vincular'}
          </Button>
        </div>

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Vínculos existentes</h3>
          {loading ? <p>Carregando...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!loading && !error ? (
            <div className="space-y-2">
              {links.length ? (
                links.map((link) => (
                  <div
                    key={link.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{link.user_name}</Badge>
                      <span>→</span>
                      <Badge variant="outline">{link.student_nome}</Badge>
                      {link.school_nome ? (
                        <Badge variant="outline">{link.school_nome}</Badge>
                      ) : null}
                    </div>
                    <Button variant="ghost" onClick={() => deleteLink(link.id)}>
                      Remover
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum vínculo registrado.</p>
              )}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
