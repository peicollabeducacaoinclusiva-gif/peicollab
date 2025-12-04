import { useEffect, useState } from 'react';
import { getMetricsCollector, getPerformanceMonitor } from '@pei/observability';
import type { WebVitals } from '@pei/observability';

export interface PerformanceMetrics {
  vitals: WebVitals;
  isHealthy: boolean;
  violations: string[];
}

/**
 * Hook para monitorar métricas de performance em tempo real
 */
export function usePerformanceMetrics(appName?: string): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    vitals: {},
    isHealthy: true,
    violations: [],
  });

  useEffect(() => {
    const metricsCollector = getMetricsCollector(appName);
    const performanceMonitor = getPerformanceMonitor(appName);

    // Atualizar métricas periodicamente
    const interval = setInterval(() => {
      const vitals = metricsCollector.getWebVitals();
      const violations: string[] = [];

      // Verificar violações de thresholds
      if (vitals.lcp && vitals.lcp > 2500) {
        violations.push(`LCP: ${Math.round(vitals.lcp)}ms (threshold: 2500ms)`);
      }
      if (vitals.inp && vitals.inp > 200) {
        violations.push(`INP: ${Math.round(vitals.inp)}ms (threshold: 200ms)`);
      }
      if (vitals.fcp && vitals.fcp > 1800) {
        violations.push(`FCP: ${Math.round(vitals.fcp)}ms (threshold: 1800ms)`);
      }
      if (vitals.ttfb && vitals.ttfb > 800) {
        violations.push(`TTFB: ${Math.round(vitals.ttfb)}ms (threshold: 800ms)`);
      }
      if (vitals.cls && vitals.cls > 0.1) {
        violations.push(`CLS: ${vitals.cls.toFixed(3)} (threshold: 0.1)`);
      }
      if (vitals.fid && vitals.fid > 100) {
        violations.push(`FID: ${Math.round(vitals.fid)}ms (threshold: 100ms)`);
      }

      setMetrics({
        vitals,
        isHealthy: violations.length === 0,
        violations,
      });
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [appName]);

  return metrics;
}

/**
 * Hook para obter estatísticas de performance agregadas
 */
export function usePerformanceStatistics(
  appName: string,
  tenantId?: string,
  dateRange?: { start: Date; end: Date }
) {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const performanceMonitor = getPerformanceMonitor(appName);
        const statistics = await performanceMonitor.getPerformanceStatistics(
          tenantId,
          dateRange?.start,
          dateRange?.end
        );
        setStats(statistics);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [appName, tenantId, dateRange?.start, dateRange?.end]);

  return { stats, loading, error };
}

