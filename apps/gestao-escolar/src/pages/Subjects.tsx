import { useState, useEffect } from 'react';
import { supabase } from '@pei/database';
import { Plus, Search, Edit, Trash2, BookOpen } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';

interface Subject {
  id: string;
  subject_name: string;
  subject_code?: string;
  education_level: string;
  subject_type?: string;
  description?: string;
  is_active: boolean;
}

const levelLabels: Record<string, string> = {
  educacao_infantil: 'Educação Infantil',
  ensino_fundamental_1: 'Ensino Fundamental I',
  ensino_fundamental_2: 'Ensino Fundamental II',
  ensino_medio: 'Ensino Médio',
  eja: 'EJA',
};

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('education_level')
        .order('subject_name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch = subject.subject_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesLevel =
      filterLevel === 'all' || subject.education_level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  // Group by education level
  const groupedSubjects = filteredSubjects.reduce((acc, subject) => {
    const level = subject.education_level;
    if (!acc[level]) acc[level] = [];
    acc[level].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <Link to="/" className="text-sm text-primary hover:underline mb-2 block">
              ← Voltar ao Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-foreground">
              Disciplinas e Campos de Experiência
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenu />
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Disciplina
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar disciplina..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-4 py-2 border border-input rounded-md bg-background text-foreground"
          >
            <option value="all">Todas as Etapas</option>
            <option value="educacao_infantil">Educação Infantil</option>
            <option value="ensino_fundamental_1">Ensino Fundamental I</option>
            <option value="ensino_fundamental_2">Ensino Fundamental II</option>
            <option value="ensino_medio">Ensino Médio</option>
            <option value="eja">EJA</option>
          </select>
        </div>

        {/* Subjects by Level */}
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : Object.keys(groupedSubjects).length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma disciplina encontrada
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSubjects).map(([level, subjects]) => (
              <Card key={level}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {levelLabels[level] || level}
                    <span className="ml-2 text-sm text-muted-foreground font-normal">
                      ({subjects.length}{' '}
                      {subjects[0]?.subject_type === 'campo_experiencia'
                        ? 'campos de experiência'
                        : 'disciplinas'}
                      )
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="p-4 border border-border rounded-lg hover:bg-accent transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-foreground">
                            {subject.subject_name}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              subject.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {subject.is_active ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>

                        {subject.subject_code && (
                          <p className="text-xs text-muted-foreground mb-2">
                            Código: {subject.subject_code}
                          </p>
                        )}

                        {subject.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {subject.description}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

