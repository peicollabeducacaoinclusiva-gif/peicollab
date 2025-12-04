// ============================================================================
// COMPONENTE: AttendanceSummary
// ============================================================================
// Resumo de frequência por período
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AttendanceSummaryProps {
  classId: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}

export function AttendanceSummary({
  classId,
  studentId,
  startDate,
  endDate,
}: AttendanceSummaryProps) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [classId, studentId, startDate, endDate]);

  const loadSummary = async () => {
    try {
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('class_id', classId);

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      if (startDate) {
        query = query.gte('data', startDate);
      }

      if (endDate) {
        query = query.lte('data', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calcular estatísticas
      const total = data?.length || 0;
      const presentes = data?.filter((r) => r.presenca).length || 0;
      const ausentes = total - presentes;
      const taxa = total > 0 ? ((presentes / total) * 100).toFixed(1) : '0';

      setSummary({
        total,
        presentes,
        ausentes,
        taxa: parseFloat(taxa),
      });
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Carregando...</div>;
  }

  if (!summary) {
    return null;
  }

  const getTaxaIcon = () => {
    if (summary.taxa >= 90) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (summary.taxa >= 75) return <Minus className="h-5 w-5 text-yellow-600" />;
    return <TrendingDown className="h-5 w-5 text-red-600" />;
  };

  const getTaxaBadge = () => {
    if (summary.taxa >= 90) return 'default';
    if (summary.taxa >= 75) return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Frequência
        </CardTitle>
        {getTaxaIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{summary.taxa}%</div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
          <span>{summary.presentes} presença(s)</span>
          <span>•</span>
          <span>{summary.ausentes} falta(s)</span>
          <span>•</span>
          <span>{summary.total} total</span>
        </div>
        <div className="mt-3">
          <Badge variant={getTaxaBadge() as any}>
            {summary.taxa >= 90 ? 'Excelente' : summary.taxa >= 75 ? 'Bom' : 'Atenção'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}






























