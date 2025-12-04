import { getLogger } from '../logging/logger';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags?: Record<string, string>;
  logs?: Array<{ timestamp: number; message: string; level: string }>;
}

/**
 * Tracer para tracing distribuído
 * Rastreia requisições e operações entre apps
 */
export class Tracer {
  private traces: Map<string, TraceContext> = new Map();
  private logger = getLogger();

  /**
   * Inicia um novo trace
   */
  startTrace(operation: string, parentTraceId?: string): string {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();

    const trace: TraceContext = {
      traceId,
      spanId,
      parentSpanId: parentTraceId,
      operation,
      startTime: Date.now(),
      tags: {},
      logs: [],
    };

    this.traces.set(traceId, trace);

    this.logger.debug('Trace iniciado', {
      traceId,
      spanId,
      operation,
      parentTraceId,
    });

    return traceId;
  }

  /**
   * Finaliza um trace
   */
  endTrace(traceId: string, tags?: Record<string, string>): TraceContext | null {
    const trace = this.traces.get(traceId);
    if (!trace) {
      this.logger.warn('Trace não encontrado', { traceId });
      return null;
    }

    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;
    if (tags) {
      trace.tags = { ...trace.tags, ...tags };
    }

    this.logger.debug('Trace finalizado', {
      traceId,
      duration: trace.duration,
      operation: trace.operation,
    });

    // Remover trace após um tempo (limpeza automática)
    setTimeout(() => {
      this.traces.delete(traceId);
    }, 60000); // 1 minuto

    return trace;
  }

  /**
   * Adiciona log a um trace
   */
  addLog(traceId: string, message: string, level: string = 'info'): void {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return;
    }

    trace.logs = trace.logs || [];
    trace.logs.push({
      timestamp: Date.now(),
      message,
      level,
    });
  }

  /**
   * Adiciona tags a um trace
   */
  addTags(traceId: string, tags: Record<string, string>): void {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return;
    }

    trace.tags = { ...trace.tags, ...tags };
  }

  /**
   * Obtém um trace
   */
  getTrace(traceId: string): TraceContext | null {
    return this.traces.get(traceId) || null;
  }

  /**
   * Gera um trace ID único
   */
  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Gera um span ID único
   */
  private generateSpanId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

// Instância singleton
let tracerInstance: Tracer | null = null;

/**
 * Obtém instância singleton do Tracer
 */
export function getTracer(): Tracer {
  if (!tracerInstance) {
    tracerInstance = new Tracer();
  }
  return tracerInstance;
}

/**
 * Cria uma nova instância do Tracer
 */
export function createTracer(): Tracer {
  return new Tracer();
}

