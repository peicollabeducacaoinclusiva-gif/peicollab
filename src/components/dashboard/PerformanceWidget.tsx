// ============================================================================
// COMPONENTE: PerformanceWidget
// ============================================================================
// Widget de desempenho por disciplina
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';

interface SubjectPerformance {
  subject_id: string;
  subject_nome: string;
  media: number;
  total_alunos: number;
  aprovados: number;
}

interface PerformanceWidgetProps {
  schoolId: string;
  periodo?: string;
}

export function PerformanceWidget({ schoolId, periodo = '1' }: PerformanceWidgetProps) {
  const [performance, setPerformance] = useState<SubjectPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformance();
  }, [schoolId, periodo]);

  const loadPerformance = async () => {
    try {
      const { data: grades, error } = await supabase
        .from('grades')
        .select(`
          nota_valor,
          subject_id,
          subjects (nome),
          enrollments!inner (school_id)
        `)
        .eq('enrollments.school_id', schoolId)
        .eq('periodo', periodo)
        .not('nota_valor', 'is', null);

      if (error) throw error;

      // Agrupar por disciplina
      const groupedBySubject = (grades || []).reduce((acc: any, grade: any) => {
        const subjectId = grade.subject_id;
        if (!acc[subjectId]) {
          acc[subjectId] = {
            subject_id: subjectId,
            subject_nome: grade.subjects?.nome || 'Sem nome',
            notas: [],
          };
        }
        acc[subjectId].notas.push(grade.nota_valor);
        return acc;
      }, {});

      // Calcular estatísticas
      const performanceData = Object.values(groupedBySubject).map((subject: any) => {
        const notas = subject.notas;
        const media = notas.reduce((sum: number, n: number) => sum + n, 0) / notas.length;
        const aprovados = notas.filter((n: number) => n >= 6).length;

        return {
          subject_id: subject.subject_id,
          subject_nome: subject.subject_nome,
          media,
          total_alunos: notas.length,
          aprovados,
        };
      });

      // Ordenar por média (decrescente)
      performanceData.sort((a, b) => b.media - a.media);

      setPerformance(performanceData);
    } catch (error) {
      console.error('Erro ao carregar desempenho:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMediaColor = (media: number) => {
    if (media >= 7) return 'text-green-600';
    if (media >= 6) return 'text-blue-600';
    if (media >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMediaIcon = (media: number) => {
    if (media >= 7) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (media >= 6) return <Award className="h-4 w-4 text-blue-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Desempenho por Disciplina</CardTitle>
      </CardHeader>
      <CardContent>
        {performance.length === 0 ? (
          <p className="text-sm text-gray-500">Sem dados de notas</p>
        ) : (
          <div className="space-y-3">
            {performance.slice(0, 5).map((subj) => (
              <div key={subj.subject_id} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-sm">{subj.subject_nome}</p>
                  <p className="text-xs text-gray-600">
                    {subj.aprovados}/{subj.total_alunos} aprovados
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${getMediaColor(subj.media)}`}>
                    {subj.media.toFixed(1)}
                  </span>
                  {getMediaIcon(subj.media)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

