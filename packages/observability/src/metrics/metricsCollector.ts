import { supabase } from '@pei/database';
import { getLogger } from '../logging/logger';

export type MetricType = 'lcp' | 'inp' | 'fcp' | 'ttfb' | 'cls' | 'fid' | 'custom';

export interface PerformanceMetric {
  metric_type: MetricType;
  metric_name: string;
  value: number;
  unit: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface WebVitals {
  lcp?: number; // Largest Contentful Paint
  inp?: number; // Interaction to Next Paint
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
}

/**
 * Coletor de métricas de performance
 * Integra com Web Vitals API e coleta métricas customizadas
 */
export class MetricsCollector {
  private appName: string;
  private tenantId: string | null = null;
  private userId: string | null = null;
  private metrics: PerformanceMetric[] = [];
  private logger = getLogger();

  constructor(appName: string) {
    this.appName = appName;
    this.initializeWebVitals();
  }

  /**
   * Define o tenant_id atual
   */
  setTenantId(tenantId: string | null): void {
    this.tenantId = tenantId;
  }

  /**
   * Define o user_id atual
   */
  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  /**
   * Inicializa coleta de Web Vitals
   */
  private initializeWebVitals(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
          const lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
          this.recordMetric('lcp', 'LCP', lcp);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        this.logger.warn('LCP observer não suportado', { error });
      }

      // FCP - First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcp = entries[0].startTime;
          this.recordMetric('fcp', 'FCP', fcp);
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
      } catch (error) {
        this.logger.warn('FCP observer não suportado', { error });
      }

      // CLS - Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.recordMetric('cls', 'CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        this.logger.warn('CLS observer não suportado', { error });
      }

      // INP - Interaction to Next Paint (aproximação via FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            const fid = (entry as any).processingStart - entry.startTime;
            this.recordMetric('fid', 'FID', fid);
            // Usar FID como aproximação de INP
            this.recordMetric('inp', 'INP', fid);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        this.logger.warn('FID observer não suportado', { error });
      }
    }

    // TTFB - Time to First Byte
    if ('performance' in window && 'timing' in window.performance) {
      try {
        const timing = (window.performance as any).timing;
        const ttfb = timing.responseStart - timing.requestStart;
        if (ttfb > 0) {
          this.recordMetric('ttfb', 'TTFB', ttfb);
        }
      } catch (error) {
        this.logger.warn('TTFB não disponível', { error });
      }
    }
  }

  /**
   * Registra uma métrica
   */
  async recordMetric(
    type: MetricType,
    name: string,
    value: number,
    unit: string = 'ms',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const metric: PerformanceMetric = {
      metric_type: type,
      metric_name: name,
      value,
      unit,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      metadata,
    };

    this.metrics.push(metric);

    // Enviar para Supabase (debounced)
    this.sendMetricToSupabase(metric).catch((error) => {
      this.logger.error('Erro ao enviar métrica para Supabase', error);
    });
  }

  /**
   * Envia métrica para Supabase
   */
  private async sendMetricToSupabase(metric: PerformanceMetric): Promise<void> {
    try {
      await supabase.rpc('report_performance_metric', {
        p_app_name: this.appName,
        p_metric_type: metric.metric_type,
        p_metric_name: metric.metric_name,
        p_value: metric.value,
        p_unit: metric.unit,
        p_tenant_id: this.tenantId || null,
        p_user_id: this.userId || null,
        p_url: metric.url || null,
        p_metadata: metric.metadata || {},
      });
    } catch (error) {
      // Não lançar erro para não interromper o fluxo principal
      this.logger.debug('Erro ao enviar métrica (não crítico)', { error });
    }
  }

  /**
   * Obtém métricas coletadas
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Limpa métricas coletadas
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Obtém Web Vitals atuais
   */
  getWebVitals(): WebVitals {
    const vitals: WebVitals = {};

    for (const metric of this.metrics) {
      if (metric.metric_type === 'lcp') vitals.lcp = metric.value;
      if (metric.metric_type === 'inp') vitals.inp = metric.value;
      if (metric.metric_type === 'fcp') vitals.fcp = metric.value;
      if (metric.metric_type === 'ttfb') vitals.ttfb = metric.value;
      if (metric.metric_type === 'cls') vitals.cls = metric.value;
      if (metric.metric_type === 'fid') vitals.fid = metric.value;
    }

    return vitals;
  }
}

// Instância singleton
let metricsCollectorInstance: MetricsCollector | null = null;

/**
 * Obtém instância singleton do MetricsCollector
 */
export function getMetricsCollector(appName?: string): MetricsCollector {
  if (!metricsCollectorInstance) {
    metricsCollectorInstance = new MetricsCollector(
      appName || (typeof window !== 'undefined' ? window.location.hostname : 'unknown')
    );
  }
  return metricsCollectorInstance;
}

/**
 * Cria uma nova instância do MetricsCollector
 */
export function createMetricsCollector(appName: string): MetricsCollector {
  return new MetricsCollector(appName);
}

