import { supabase } from '../client';
import { auditMiddleware, type AuditEntityType } from '../audit/auditMiddleware';

export type EventType =
  | 'student.created'
  | 'student.updated'
  | 'student.deleted'
  | 'class.changed'
  | 'class.created'
  | 'class.updated'
  | 'teacher.assigned'
  | 'teacher.unassigned'
  | 'pei.created'
  | 'pei.updated'
  | 'pei.approved'
  | 'pei.returned'
  | 'aee.created'
  | 'aee.updated'
  | 'aee.session.recorded'
  | 'enrollment.created'
  | 'enrollment.updated'
  | 'enrollment.completed';

export interface EventPayload {
  event: EventType;
  timestamp: string;
  userId?: string;
  tenantId?: string;
  schoolId?: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface EventHandler {
  (payload: EventPayload): Promise<void> | void;
}

class EventBus {
  private handlers: Map<EventType, EventHandler[]> = new Map();
  private channel: ReturnType<typeof supabase.channel> | null = null;

  /**
   * Inicializa o EventBus e conecta ao Supabase Realtime
   */
  async initialize() {
    if (this.channel) return;

    this.channel = supabase.channel('system-events', {
      config: {
        broadcast: { self: true },
      },
    });

    // Escutar eventos do Realtime
    this.channel
      .on('broadcast', { event: 'system-event' }, (payload) => {
        this.handleRealtimeEvent(payload.payload as EventPayload);
      })
      .subscribe();

    return this.channel;
  }

  /**
   * Registra um handler para um tipo de evento
   */
  on(eventType: EventType, handler: EventHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Remove um handler
   */
  off(eventType: EventType, handler: EventHandler) {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emite um evento
   */
  async emit(eventType: EventType, data: Record<string, any>, metadata?: Record<string, any>) {
    const payload: EventPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
      metadata,
    };

    // Obter informações do usuário atual se disponível
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        payload.userId = user.id;
      }

      // Obter tenant_id e school_id do perfil se disponível
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id, school_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          payload.tenantId = profile.tenant_id || undefined;
          payload.schoolId = profile.school_id || undefined;
        }
      }
    } catch (error) {
      console.warn('Erro ao obter informações do usuário para evento:', error);
    }

    // Executar handlers locais
    await this.executeHandlers(payload);

    // Enviar via Realtime para outros clientes
    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'system-event',
        payload,
      });
    }

    // Registrar no banco de dados para auditoria
    await this.logEvent(payload);
  }

  /**
   * Executa handlers locais
   */
  private async executeHandlers(payload: EventPayload) {
    const handlers = this.handlers.get(payload.event) || [];
    const allHandlers = this.handlers.get('*' as EventType) || [];

    const allHandlersToExecute = [...handlers, ...allHandlers];

    await Promise.all(
      allHandlersToExecute.map(async (handler) => {
        try {
          await handler(payload);
        } catch (error) {
          console.error(`Erro ao executar handler para evento ${payload.event}:`, error);
        }
      })
    );
  }

  /**
   * Processa evento recebido via Realtime
   */
  private async handleRealtimeEvent(payload: EventPayload) {
    await this.executeHandlers(payload);
  }

  /**
   * Registra evento no banco de dados para auditoria
   * Agora usa audit_events (tabela canônica) via auditMiddleware
   */
  private async logEvent(payload: EventPayload) {
    try {
      // Mapear tipo de evento para entityType
      const getEntityType = (event: EventType): AuditEntityType => {
        if (event.includes('student')) return 'student';
        if (event.includes('pei')) return 'pei';
        if (event.includes('aee')) return 'aee';
        if (event.includes('enrollment')) return 'enrollment';
        if (event.includes('class')) return 'class';
        if (event.includes('teacher')) return 'professional';
        return 'system' as AuditEntityType;
      };

      // Mapear ação do evento
      const getAction = (event: EventType): 'INSERT' | 'UPDATE' | 'DELETE' | 'READ' => {
        if (event.includes('.created')) return 'INSERT';
        if (event.includes('.updated')) return 'UPDATE';
        if (event.includes('.deleted')) return 'DELETE';
        return 'READ';
      };

      const entityType = getEntityType(payload.event);
      const action = getAction(payload.event);
      const entityId = payload.data.id || payload.data.recordId || payload.data.entityId;

      if (payload.tenantId && entityId) {
        // Usar auditMiddleware para gravar em audit_events
        await auditMiddleware.logEvent({
          tenantId: payload.tenantId,
          entityType,
          entityId,
          action,
          metadata: {
            ...payload.metadata,
            event_type: payload.event,
            data: payload.data,
            timestamp: payload.timestamp,
          },
          actorId: payload.userId,
        }).catch(err => console.warn('Erro ao registrar evento via auditMiddleware:', err));
      } else {
        // Fallback: inserir diretamente se não tiver tenantId/entityId
        console.warn('Evento não pode ser registrado: faltando tenantId ou entityId', payload);
      }
    } catch (error) {
      console.warn('Erro ao registrar evento em audit_events:', error);
    }
  }

  /**
   * Desconecta do Realtime
   */
  disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

// Singleton
export const eventBus = new EventBus();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  eventBus.initialize().catch(console.error);
}

