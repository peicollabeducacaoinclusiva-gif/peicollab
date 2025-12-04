/**
 * Serviço de integração com VLibras
 * VLibras é uma suíte de ferramentas para tradução automática de conteúdo em português para Libras
 */

export interface VLibrasConfig {
  enabled: boolean;
  widgetPosition?: 'left' | 'right';
  widgetColor?: string;
}

class VLibrasService {
  private config: VLibrasConfig = {
    enabled: false,
    widgetPosition: 'right',
    widgetColor: '#0066cc',
  };

  private scriptLoaded = false;
  private widgetInitialized = false;

  /**
   * Carrega o script do VLibras
   */
  async loadScript(): Promise<void> {
    if (this.scriptLoaded || typeof window === 'undefined') {
      return;
    }

    return new Promise((resolve, reject) => {
      // Verificar se já existe
      if ((window as any).VLibras) {
        this.scriptLoaded = true;
        resolve();
        return;
      }

      // Carregar script do VLibras
      const script = document.createElement('script');
      script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
      script.async = true;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = () => {
        console.error('Erro ao carregar VLibras');
        reject(new Error('Erro ao carregar VLibras'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Inicializa o widget VLibras
   */
  async initialize(config?: Partial<VLibrasConfig>): Promise<void> {
    if (this.widgetInitialized || typeof window === 'undefined') {
      return;
    }

    this.config = { ...this.config, ...config };

    if (!this.config.enabled) {
      return;
    }

    try {
      await this.loadScript();

      // Aguardar VLibras estar disponível
      let attempts = 0;
      while (!(window as any).VLibras && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (!(window as any).VLibras) {
        throw new Error('VLibras não carregou corretamente');
      }

      // Inicializar widget
      (window as any).VLibras.init({
        position: this.config.widgetPosition || 'right',
        primaryColor: this.config.widgetColor || '#0066cc',
      });

      this.widgetInitialized = true;
    } catch (error) {
      console.error('Erro ao inicializar VLibras:', error);
      // Não lançar erro para não quebrar a aplicação
    }
  }

  /**
   * Traduz um texto específico para Libras
   */
  async translate(text: string): Promise<void> {
    if (!this.widgetInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      if ((window as any).VLibras && (window as any).VLibras.translate) {
        (window as any).VLibras.translate(text);
      }
    } catch (error) {
      console.error('Erro ao traduzir texto:', error);
    }
  }

  /**
   * Ativa/desativa o widget
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    if (enabled && !this.widgetInitialized) {
      this.initialize();
    } else if (!enabled && this.widgetInitialized) {
      this.destroy();
    }
  }

  /**
   * Destrói o widget
   */
  destroy(): void {
    if (typeof window === 'undefined' || !this.widgetInitialized) {
      return;
    }

    try {
      if ((window as any).VLibras && (window as any).VLibras.destroy) {
        (window as any).VLibras.destroy();
      }
    } catch (error) {
      console.error('Erro ao destruir VLibras:', error);
    }

    this.widgetInitialized = false;
  }

  /**
   * Verifica se está disponível
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).VLibras;
  }

  /**
   * Verifica se está inicializado
   */
  isInitialized(): boolean {
    return this.widgetInitialized;
  }
}

// Instância singleton
let vlibrasServiceInstance: VLibrasService | null = null;

/**
 * Obtém instância singleton do VLibrasService
 */
export function getVLibrasService(): VLibrasService {
  if (!vlibrasServiceInstance) {
    vlibrasServiceInstance = new VLibrasService();
  }
  return vlibrasServiceInstance;
}

/**
 * Cria uma nova instância do VLibrasService
 */
export function createVLibrasService(): VLibrasService {
  return new VLibrasService();
}

