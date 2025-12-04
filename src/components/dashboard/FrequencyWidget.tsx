// ============================================================================
// COMPONENTE: FrequencyWidget
// ============================================================================
// Widget de frequência com tendências
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface FrequencyByMonth {
  month: string;
  taxa: number;
}

interface FrequencyWidgetProps {
  schoolId: string;
}

export function FrequencyWidget({ schoolId }: FrequencyWidgetProps) {
  const [frequencyData, setFrequencyData] = useState<FrequencyByMonth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFrequencyTrend();
  }, [schoolId]);

  const loadFrequencyTrend = async () => {
    try {
      // Últimos 6 meses
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);

      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('data, presenca')
        .gte('data', startDate.toISOString().split('T')[0]);

      if (error) throw error;

      // Agrupar por mês
      const groupedByMonth = (attendance || []).reduce((acc: any, record) => {
        const month = record.data.substring(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = { total: 0, presencas: 0 };
        }
        acc[month].total++;
        if (record.presenca) acc[month].presencas++;
        return acc;
      }, {});

      // Calcular taxas
      const trend = Object.entries(groupedByMonth)
        .map(([month, data]: [string, any]) => ({
          month,
          taxa: (data.presencas / data.total) * 100,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setFrequencyData(trend);
    } catch (error) {
      console.error('Erro ao carregar tendência de frequência:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Carregando...</div>;
  }

  const latestTaxa = frequencyData[frequencyData.length - 1]?.taxa || 0;
  const previousTaxa = frequencyData[frequencyData.length - 2]?.taxa || 0;
  const trend = latestTaxa - previousTaxa;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Tendência de Frequência</span>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {frequencyData.length === 0 ? (
          <p className="text-sm text-gray-500">Sem dados de frequência</p>
        ) : (
          <div className="space-y-4">
            {/* Taxa atual */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{latestTaxa.toFixed(1)}%</p>
                <p className="text-xs text-gray-600">Mês atual</p>
              </div>
              <div className="flex items-center gap-2">
                {trend > 0 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-semibold">
                      +{trend.toFixed(1)}%
                    </span>
                  </>
                ) : trend < 0 ? (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-red-600 font-semibold">
                      {trend.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <span className="text-gray-600">Estável</span>
                )}
              </div>
            </div>

            {/* Mini gráfico */}
            <div className="space-y-1">
              {frequencyData.slice(-6).map((data) => (
                <div key={data.month} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-16">
                    {getMonthName(data.month)}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        data.taxa >= 90
                          ? 'bg-green-500'
                          : data.taxa >= 75
                          ? 'bg-blue-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${data.taxa}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-12 text-right">
                    {data.taxa.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

