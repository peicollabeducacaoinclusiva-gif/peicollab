import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { StudentHistory } from '../../services/unifiedStudentService';

interface StudentAcademicHistoryProps {
  history: StudentHistory[];
}

export function StudentAcademicHistory({ history }: StudentAcademicHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico Escolar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Nenhum histórico encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico Escolar</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ano Letivo</TableHead>
              <TableHead>Série/Turma</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.academic_year}</TableCell>
                <TableCell>{item.grade || '-'}</TableCell>
                <TableCell>{item.shift || '-'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.status === 'active'
                        ? 'default'
                        : item.status === 'completed'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {item.status === 'active'
                      ? 'Ativo'
                      : item.status === 'completed'
                        ? 'Concluído'
                        : item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.created_at
                    ? format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

