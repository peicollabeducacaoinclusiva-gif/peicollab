'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentForm } from '@/components/students/StudentForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useStudents } from '@/hooks/useStudents';
import { useSchools } from '@/hooks/useSchools';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Search, Users } from 'lucide-react';

const categories = [
  'DI',
  'TEA',
  'AHSD',
  'DF',
  'DV',
  'Surdez',
  'TDAH',
  'Dislexia',
  'Discalculia',
  'Outro',
];

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('all');
  const [serie, setSerie] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const { students, loading, error, createStudent } = useStudents({
    search,
    categoria: categoria === 'all' ? '' : categoria,
    serie,
  });

  const { schools } = useSchools();
  const schoolOptions = useMemo(() => schools, [schools]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Meus Alunos</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seus alunos e seus documentos de forma simples e organizada.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-3xl">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Buscar por nome ou série..."
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <PermissionGate permission="canCreateStudent">
          <StudentForm
            onCreate={createStudent}
            schools={schoolOptions}
            {...(students.length === 0 && {
              open: formOpen,
              onOpenChange: setFormOpen,
            })}
          />
        </PermissionGate>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Série</Label>
          <Input
            className="w-48"
            placeholder="Ex: 3º ano"
            value={serie}
            onChange={(event) => setSerie(event.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Mostrando {students.length} aluno{students.length === 1 ? '' : 's'}.
          </p>
          {students.length ? (
            <div className="space-y-3">
              {students.map((student) => (
                <Card key={student.id} className="hover:shadow-sm">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <div className="space-y-1">
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className="text-sm font-semibold hover:underline"
                      >
                        {student.nome}
                      </Link>
                      <div className="flex flex-wrap gap-2">
                        {student.serie ? (
                          <Badge variant="secondary">Série {student.serie}</Badge>
                        ) : null}
                        {student.categoria_necessidade ? (
                          <Badge variant="outline">{student.categoria_necessidade}</Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">
                          {student.documents_count ?? 0}
                        </div>
                        <div>Documentos</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">
                          {student.goals_count ?? 0}
                        </div>
                        <div>Metas</div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/students/${student.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            (() => {
              const hasFilters = !!search || categoria !== 'all' || !!serie;
              return hasFilters ? (
                <EmptyState
                  icon={Users}
                  title="Nenhum estudante encontrado"
                  description="Os filtros não retornaram resultados. Tente ajustar a busca ou os filtros."
                />
              ) : (
                <PermissionGate
                  permission="canCreateStudent"
                  fallback={
                    <EmptyState
                      icon={Users}
                      title="Nenhum aluno cadastrado"
                      description="Não há alunos cadastrados no momento."
                    />
                  }
                >
                  <EmptyState
                    icon={Users}
                    title="Nenhum aluno cadastrado"
                    description="Adicione o primeiro aluno para começar a gerenciar documentos e metas."
                    action={{
                      label: 'Adicionar primeiro aluno',
                      onClick: () => setFormOpen(true),
                    }}
                  />
                </PermissionGate>
              );
            })()
          )}
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Dicas de acessibilidade
            </summary>
            <p className="mt-2 text-xs text-muted-foreground">
              Clique em um aluno para ver mais detalhes. Use Enter para confirmar. Pressione Tab para
              navegar entre alunos.
            </p>
          </details>
        </div>
      ) : null}
    </div>
  );
}
