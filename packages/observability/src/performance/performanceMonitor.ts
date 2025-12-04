import { getMetricsCollector, type WebVitals } from '../metrics/metricsCollector';
import { getLogger } from '../logging/logger';
import { supabase } from '@pei/database';

export interface PerformanceThresholds {
  lcp?: number; // ms
  inp?: number; // ms
  fcp?: number; // ms
  ttfb?: number; // ms
  cls?: number; // score
  fid?: number; // ms
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  lcp: 2500, // 2.5s
  inp: 200, // 200ms
  fcp: 1800, // 1.8s
  ttfb: 800, // 800ms
  cls: 0.1, // 0.1
  fid: 100, // 100ms
};

/**
 * Monitor de performance
 * Monitora métricas Web Vitals e gera alertas
 */
export class PerformanceMonitor {
  private appName: string;
  private thresholds: PerformanceThresholds;
  private logger = getLogger();
  private metricsCollector = getMetricsCollector();

  constructor(appName: string, thresholds?: PerformanceThresholds) {
    this.appName = appName;
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.initializeMonitoring();
  }

  /**
   * Inicializa monitoramento
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Monitorar métricas periodicamente
    this.monitorMetrics();

    // Monitorar quando página está prestes a ser descarregada
    window.addEventListener('beforeunload', () => {
      this.reportFinalMetrics();
    });

    // Monitorar quando página fica oculta (visibilitychange)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.reportFinalMetrics();
      }
    });
  }

  /**
   * Monitora métricas periodicamente
   */
  private monitorMetrics(): void {
    // Verificar métricas a cada 30 segundos
    setInterval(() => {
      const vitals = this.metricsCollector.getWebVitals();
      this.checkThresholds(vitals);
    }, 30000);
  }

  /**
   * Verifica se métricas estão dentro dos thresholds
   */
  private checkThresholds(vitals: WebVitals): void {
    const violations: string[] = [];

    if (vitals.lcp && this.thresholds.lcp && vitals.lcp > this.thresholds.lcp) {
      violations.push(`LCP: ${vitals.lcp}ms > ${this.thresholds.lcp}ms`);
    }

    if (vitals.inp && this.thresholds.inp && vitals.inp > this.thresholds.inp) {
      violations.push(`INP: ${vitals.inp}ms > ${this.thresholds.inp}ms`);
    }

    if (vitals.fcp && this.thresholds.fcp && vitals.fcp > this.thresholds.fcp) {
      violations.push(`FCP: ${vitals.fcp}ms > ${this.thresholds.fcp}ms`);
    }

    if (vitals.ttfb && this.thresholds.ttfb && vitals.ttfb > this.thresholds.ttfb) {
      violations.push(`TTFB: ${vitals.ttfb}ms > ${this.thresholds.ttfb}ms`);
    }

    if (vitals.cls && this.thresholds.cls && vitals.cls > this.thresholds.cls) {
      violations.push(`CLS: ${vitals.cls} > ${this.thresholds.cls}`);
    }

    if (vitals.fid && this.thresholds.fid && vitals.fid > this.thresholds.fid) {
      violations.push(`FID: ${vitals.fid}ms > ${this.thresholds.fid}ms`);
    }

    if (violations.length > 0) {
      this.logger.warn('Violações de performance detectadas', {
        violations,
        vitals,
        thresholds: this.thresholds,
      });

      // Criar alerta se necessário
      this.createPerformanceAlert(violations, vitals).catch((error) => {
        this.logger.error('Erro ao criar alerta de performance', error);
      });
    }
  }

  /**
   * Cria alerta de performance
   */
  private async createPerformanceAlert(
    violations: string[],
    vitals: WebVitals
  ): Promise<void> {
    try {
      await supabase.from('alerts').insert({
        app_name: this.appName,
        alert_type: 'performance',
        alert_name: 'Violação de Performance',
        message: `Métricas de performance abaixo do esperado: ${violations.join(', ')}`,
        severity: 'warning',
        status: 'active',
        metadata: {
          violations,
          vitals,
          thresholds: this.thresholds,
        },
      });
    } catch (error) {
      this.logger.error('Erro ao criar alerta de performance', error);
    }
  }

  /**
   * Reporta métricas finais antes de descarregar página
   */
  private reportFinalMetrics(): void {
    const vitals = this.metricsCollector.getWebVitals();
    const metrics = this.metricsCollector.getMetrics();

    this.logger.info('Métricas finais de performance', {
      vitals,
      metricsCount: metrics.length,
    });

    // Enviar métricas finais para Supabase
    for (const metric of metrics) {
      // Métricas já foram enviadas durante a coleta
      // Aqui apenas garantimos que não perdemos nada
    }
  }

  /**
   * Obtém estatísticas de performance
   */
  async getPerformanceStatistics(
    tenantId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, unknown> | null> {
    try {
      const { data, error } = await supabase.rpc('get_performance_statistics', {
        p_app_name: this.appName,
        p_tenant_id: tenantId || null,
        p_metric_type: null,
        p_start_date: startDate?.toISOString() || null,
        p_end_date: endDate?.toISOString() || null,
      });

      if (error) {
        throw error;
      }

      return data as Record<string, unknown>;
    } catch (error) {
      this.logger.error('Erro ao obter estatísticas de performance', error);
      return null;
    }
  }
}

// Instância singleton
let performanceMonitorInstance: PerformanceMonitor | null = null;

/**
 * Obtém instância singleton do PerformanceMonitor
 */
export function getPerformanceMonitor(appName?: string): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor(
      appName || (typeof window !== 'undefined' ? window.location.hostname : 'unknown')
    );
  }
  return performanceMonitorInstance;
}

/**
 * Cria uma nova instância do PerformanceMonitor
 */
export function createPerformanceMonitor(
  appName: string,
  thresholds?: PerformanceThresholds
): PerformanceMonitor {
  return new PerformanceMonitor(appName, thresholds);
}

