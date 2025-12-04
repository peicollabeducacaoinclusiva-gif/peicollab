import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@pei/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';;
import { Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';

interface Student {
  id: string;
  full_name: string;
}

export default function CreatePlanoAEE() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    anamnesis_data: {},
    school_complaint: '',
    family_complaint: '',
  });

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id, tenant_id')
        .eq('id', userData.user?.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      const { data, error } = await supabase
        .from('plano_aee')
        .insert({
          ...formData,
          school_id: profile.school_id,
          tenant_id: profile.tenant_id,
          created_by: userData.user?.id,
          assigned_aee_teacher_id: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      alert('Plano de AEE criado com sucesso!');
      navigate(`/edit/${data.id}`);
    } catch (error: any) {
      console.error('Erro ao criar plano:', error);
      alert('Erro ao criar plano: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-foreground">
                Novo Plano de AEE
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Criar Plano de Atendimento Educacional Especializado</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Selecionar Aluno *
                </label>
                <select
                  value={formData.student_id}
                  onChange={(e) =>
                    setFormData({ ...formData, student_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  required
                >
                  <option value="">Selecione um aluno...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* School Complaint */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Queixa da Escola
                </label>
                <textarea
                  value={formData.school_complaint}
                  onChange={(e) =>
                    setFormData({ ...formData, school_complaint: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  rows={4}
                  placeholder="Descreva as principais queixas relatadas pela escola..."
                />
              </div>

              {/* Family Complaint */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Queixa da Família
                </label>
                <textarea
                  value={formData.family_complaint}
                  onChange={(e) =>
                    setFormData({ ...formData, family_complaint: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  rows={4}
                  placeholder="Descreva as principais queixas relatadas pela família..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Criar e Continuar'}
                </Button>
                <Link to="/">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


