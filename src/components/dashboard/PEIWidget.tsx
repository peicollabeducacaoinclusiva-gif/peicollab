// ============================================================================
// COMPONENTE: PEIWidget
// ============================================================================
// Widget de comparação: Alunos com PEI vs sem PEI
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardList, TrendingUp, Users } from 'lucide-react';

interface PEIComparison {
  // Com PEI
  pei_media: number;
  pei_taxa_presenca: number;
  pei_total: number;
  
  // Sem PEI (mas com NEE)
  nee_media: number;
  nee_taxa_presenca: number;
  nee_total: number;
}

interface PEIWidgetProps {
  schoolId: string;
}

export function PEIWidget({ schoolId }: PEIWidgetProps) {
  const [comparison, setComparison] = useState<PEIComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparison();
  }, [schoolId]);

  const loadComparison = async () => {
    try {
      // Buscar alunos com NEE
      const { data: students } = await supabase
        .from('students')
        .select(`
          id,
          peis!inner (
            id,
            is_active_version
          ),
          enrollments!inner (
            id
          )
        `)
        .eq('school_id', schoolId)
        .eq('necessidades_especiais', true)
        .eq('is_active', true);

      // Separar com PEI ativo e sem PEI
      const comPEI = students?.filter((s: any) => 
        s.peis.some((p: any) => p.is_active_version)
      ) || [];
      
      const semPEI = students?.filter((s: any) => 
        !s.peis.some((p: any) => p.is_active_version)
      ) || [];

      // Calcular médias e frequência para cada grupo
      const comPEIStats = await calculateGroupStats(comPEI.map((s: any) => s.enrollments[0]?.id).filter(Boolean));
      const semPEIStats = await calculateGroupStats(semPEI.map((s: any) => s.enrollments[0]?.id).filter(Boolean));

      setComparison({
        pei_media: comPEIStats.media,
        pei_taxa_presenca: comPEIStats.frequencia,
        pei_total: comPEI.length,
        nee_media: semPEIStats.media,
        nee_taxa_presenca: semPEIStats.frequencia,
        nee_total: semPEI.length,
      });
    } catch (error) {
      console.error('Erro ao carregar comparação:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGroupStats = async (enrollmentIds: string[]) => {
    if (enrollmentIds.length === 0) {
      return { media: 0, frequencia: 0 };
    }

    // Calcular média
    const { data: grades } = await supabase
      .from('grades')
      .select('nota_valor')
      .in('enrollment_id', enrollmentIds)
      .not('nota_valor', 'is', null);

    const media = grades && grades.length > 0
      ? grades.reduce((sum, g) => sum + (g.nota_valor || 0), 0) / grades.length
      : 0;

    // Calcular frequência
    const { data: attendance } = await supabase
      .from('attendance')
      .select('presenca, enrollment_id');

    const groupAttendance = attendance?.filter((a) => 
      enrollmentIds.includes(a.enrollment_id)
    ) || [];

    const frequencia = groupAttendance.length > 0
      ? (groupAttendance.filter(a => a.presenca).length / groupAttendance.length) * 100
      : 0;

    return { media, frequencia };
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Carregando...</div>;
  }

  if (!comparison || (comparison.pei_total === 0 && comparison.nee_total === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Comparativo PEI</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Sem alunos com NEE registrados</p>
        </CardContent>
      </Card>
    );
  }

  const mediaDiff = comparison.pei_media - comparison.nee_media;
  const frequenciaDiff = comparison.pei_taxa_presenca - comparison.nee_taxa_presenca;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ClipboardList className="h-4 w-4" />
          Comparativo: Com PEI vs Sem PEI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Com PEI */}
        <div className="border-l-4 border-green-500 pl-3">
          <div className="flex justify-between items-center mb-1">
            <p className="font-semibold text-sm">Com PEI Ativo</p>
            <Badge variant="outline">{comparison.pei_total} alunos</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-gray-600">Média</p>
              <p className="font-bold text-green-600">{comparison.pei_media.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Frequência</p>
              <p className="font-bold text-green-600">{comparison.pei_taxa_presenca.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Sem PEI */}
        {comparison.nee_total > 0 && (
          <div className="border-l-4 border-gray-400 pl-3">
            <div className="flex justify-between items-center mb-1">
              <p className="font-semibold text-sm">Sem PEI (NEE)</p>
              <Badge variant="outline">{comparison.nee_total} alunos</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-600">Média</p>
                <p className="font-bold text-gray-600">{comparison.nee_media.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Frequência</p>
                <p className="font-bold text-gray-600">{comparison.nee_taxa_presenca.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Diferença */}
        {comparison.nee_total > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs font-semibold text-gray-600 mb-2">Impacto do PEI:</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Média:</span>
                <span className={mediaDiff > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  {mediaDiff > 0 ? '+' : ''}{mediaDiff.toFixed(1)}
                  {mediaDiff > 0 && <TrendingUp className="inline h-3 w-3 ml-1" />}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Frequência:</span>
                <span className={frequenciaDiff > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  {frequenciaDiff > 0 ? '+' : ''}{frequenciaDiff.toFixed(1)}%
                  {frequenciaDiff > 0 && <TrendingUp className="inline h-3 w-3 ml-1" />}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

