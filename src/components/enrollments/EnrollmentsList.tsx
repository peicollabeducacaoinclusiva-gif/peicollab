// ============================================================================
// COMPONENTE: EnrollmentsList
// ============================================================================
// Lista de matrículas com filtros e ações
// ============================================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEnrollments } from '@pei/database/hooks';
import { Search, UserPlus, Edit, Trash2 } from 'lucide-react';

interface EnrollmentsListProps {
  schoolId: string;
  onNewEnrollment: () => void;
  onEditEnrollment?: (enrollment: any) => void;
}

export function EnrollmentsList({
  schoolId,
  onNewEnrollment,
  onEditEnrollment,
}: EnrollmentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: enrollments, isLoading } = useEnrollments();

  const filteredEnrollments = enrollments?.filter((enrollment) => {
    const matchesSearch =
      !searchTerm ||
      enrollment.student?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      Matriculado: { variant: 'default', label: 'Matriculado' },
      Transferido: { variant: 'secondary', label: 'Transferido' },
      Cancelado: { variant: 'destructive', label: 'Cancelado' },
      Concluido: { variant: 'outline', label: 'Concluído' },
    };
    const badge = variants[status] || variants.Matriculado;
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando matrículas...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header com filtros */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-2 flex-1 max-w-md">
          <Input
            placeholder="Buscar aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            Todas
          </Button>
          <Button
            variant={statusFilter === 'Matriculado' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('Matriculado')}
          >
            Matriculados
          </Button>
          <Button
            variant={statusFilter === 'Transferido' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('Transferido')}
          >
            Transferidos
          </Button>
        </div>

        <Button onClick={onNewEnrollment}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nova Matrícula
        </Button>
      </div>

      {/* Tabela */}
      {filteredEnrollments && filteredEnrollments.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Ano Letivo</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{enrollment.student?.name}</p>
                      {enrollment.student?.codigo_identificador && (
                        <p className="text-xs text-gray-500">
                          {enrollment.student.codigo_identificador}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {enrollment.class?.class_name}
                    {enrollment.bolsista && (
                      <span className="ml-2 text-xs text-yellow-600">🎓</span>
                    )}
                    {enrollment.utiliza_transporte && (
                      <span className="ml-1 text-xs text-blue-600">🚌</span>
                    )}
                  </TableCell>
                  <TableCell>{enrollment.ano_letivo}</TableCell>
                  <TableCell>
                    {enrollment.numero_matricula || '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                  <TableCell>
                    {enrollment.data_matricula &&
                      new Date(enrollment.data_matricula).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onEditEnrollment && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditEnrollment(enrollment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Nenhuma matrícula encontrada</p>
          <Button onClick={onNewEnrollment}>
            Realizar primeira matrícula
          </Button>
        </div>
      )}

      {/* Estatísticas */}
      {filteredEnrollments && filteredEnrollments.length > 0 && (
        <div className="grid grid-cols-4 gap-4 pt-4">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold">{enrollments?.length || 0}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Matriculados</p>
            <p className="text-2xl font-bold text-green-600">
              {enrollments?.filter((e) => e.status === 'Matriculado').length || 0}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Bolsistas</p>
            <p className="text-2xl font-bold text-yellow-600">
              {enrollments?.filter((e) => e.bolsista).length || 0}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Transporte</p>
            <p className="text-2xl font-bold text-blue-600">
              {enrollments?.filter((e) => e.utiliza_transporte).length || 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}






























