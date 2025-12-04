import { offlineDB } from '@/lib/offlineDatabase';

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  networkRequests: number;
  offlineOperations: number;
}

export interface PerformanceConfig {
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  enableServiceWorker: boolean;
  enableOfflineCache: boolean;
  maxCacheSize: number; // em MB
  cacheExpiration: number; // em horas
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    networkRequests: 0,
    offlineOperations: 0
  };

  private config: PerformanceConfig = {
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableCodeSplitting: true,
    enableServiceWorker: true,
    enableOfflineCache: true,
    maxCacheSize: 100, // 100MB
    cacheExpiration: 24 // 24 horas
  };

  private constructor() {
    this.initializePerformanceMonitoring();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private initializePerformanceMonitoring(): void {
    // Monitorar tempo de carregamento
    this.monitorLoadTime();
    
    // Monitorar uso de memória
    this.monitorMemoryUsage();
    
    // Monitorar cache hit rate
    this.monitorCachePerformance();
    
    // Monitorar operações offline
    this.monitorOfflineOperations();
  }

  private monitorLoadTime(): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
        
        console.log(`📊 Tempo de carregamento: ${this.metrics.loadTime}ms`);
      });
    }
  }

  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        
        console.log(`📊 Uso de memória: ${this.metrics.memoryUsage.toFixed(2)}MB`);
      };

      // Atualizar a cada 30 segundos
      setInterval(updateMemoryUsage, 30000);
      updateMemoryUsage();
    }
  }

  private monitorCachePerformance(): void {
    let cacheHits = 0;

    offlineDB.students.hook('reading', () => {
      cacheHits++;
    });

    setInterval(() => {
      this.metrics.cacheHitRate = cacheHits;
      console.log(`📊 Cache hits monitorados: ${cacheHits}`);
    }, 60000);
  }

  private monitorOfflineOperations(): void {
    // Contar operações offline
    let offlineOps = 0;
    
    offlineDB.students.hook('creating', () => {
      offlineOps++;
    });

    offlineDB.students.hook('updating', () => {
      offlineOps++;
    });

    offlineDB.students.hook('deleting', () => {
      offlineOps++;
    });

    setInterval(() => {
      this.metrics.offlineOperations = offlineOps;
      console.log(`📊 Operações offline: ${offlineOps}`);
    }, 60000);
  }

  // Otimizações específicas para mobile
  public optimizeForMobile(): void {
    console.log('🚀 Aplicando otimizações para mobile...');

    // 1. Lazy loading de imagens
    if (this.config.enableLazyLoading) {
      this.enableLazyLoading();
    }

    // 2. Otimização de imagens
    if (this.config.enableImageOptimization) {
      this.optimizeImages();
    }

    // 3. Preload de recursos críticos
    this.preloadCriticalResources();

    // 4. Otimização de fontes
    this.optimizeFonts();

    // 5. Redução de animações em dispositivos lentos
    this.optimizeAnimations();
  }

  private enableLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observar todas as imagens com classe 'lazy'
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  private optimizeImages(): void {
    // Redimensionar imagens baseado no viewport
    const resizeImages = () => {
      const images = document.querySelectorAll('img[data-optimize]');
      const viewportWidth = window.innerWidth;
      
      images.forEach((img: any) => {
        if (viewportWidth < 768) {
          // Mobile: usar imagens menores
          img.src = img.src.replace(/w_\d+/, 'w_400');
        } else if (viewportWidth < 1024) {
          // Tablet: usar imagens médias
          img.src = img.src.replace(/w_\d+/, 'w_800');
        } else {
          // Desktop: usar imagens grandes
          img.src = img.src.replace(/w_\d+/, 'w_1200');
        }
      });
    };

    resizeImages();
    window.addEventListener('resize', resizeImages);
  }

  private preloadCriticalResources(): void {
    // Preload de componentes críticos
    const criticalComponents = [
      '/src/components/dashboards/TeacherDashboard.tsx',
      '/src/components/pei/PEIForm.tsx',
      '/src/components/shared/MobileNavigation.tsx'
    ];

    criticalComponents.forEach(component => {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = component;
      document.head.appendChild(link);
    });
  }

  private optimizeFonts(): void {
    // Preload de fontes críticas
    const fontPreloads = [
      { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
    ];

    fontPreloads.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font.href;
      link.as = font.as;
      link.type = font.type;
      link.crossOrigin = font.crossorigin;
      document.head.appendChild(link);
    });
  }

  private optimizeAnimations(): void {
    // Reduzir animações em dispositivos lentos
    if (this.isLowEndDevice()) {
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
      document.documentElement.style.setProperty('--transition-duration', '0.1s');
    }
  }

  private isLowEndDevice(): boolean {
    // Detectar dispositivos de baixo desempenho
    const connection = (navigator as any).connection;
    const memory = (performance as any).memory;
    
    // Critérios para dispositivo de baixo desempenho:
    // - Conexão lenta
    // - Pouca memória
    // - CPU lenta (baseado no user agent)
    const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
    const isLowMemory = memory && memory.jsHeapSizeLimit < 100 * 1024 * 1024; // < 100MB
    const isOldDevice = /Android [1-4]|iPhone OS [1-9]/.test(navigator.userAgent);
    
    return isSlowConnection || isLowMemory || isOldDevice;
  }

  // Gerenciamento de cache
  public async manageCache(): Promise<void> {
    if (!this.config.enableOfflineCache) return;

    try {
      // Limpar cache expirado
      await this.cleanExpiredCache();
      
      // Verificar tamanho do cache
      await this.checkCacheSize();
      
      // Otimizar cache
      await this.optimizeCache();
    } catch (error) {
      console.error('Erro ao gerenciar cache:', error);
    }
  }

  private async cleanExpiredCache(): Promise<void> {
    const expirationTime = Date.now() - (this.config.cacheExpiration * 60 * 60 * 1000);
    
    // Limpar registros expirados
    await offlineDB.students
      .where('last_modified')
      .below(expirationTime)
      .delete();
    
    await offlineDB.peis
      .where('last_modified')
      .below(expirationTime)
      .delete();
    
    console.log('🧹 Cache expirado limpo');
  }

  private async checkCacheSize(): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usedMB = (estimate.usage || 0) / 1024 / 1024;
      
      if (usedMB > this.config.maxCacheSize) {
        console.warn(`⚠️ Cache muito grande: ${usedMB.toFixed(2)}MB`);
        await this.reduceCacheSize();
      }
    }
  }

  private async reduceCacheSize(): Promise<void> {
    // Remover registros mais antigos primeiro
    const students = await offlineDB.students
      .orderBy('last_modified')
      .limit(50)
      .toArray();
    
    const peis = await offlineDB.peis
      .orderBy('last_modified')
      .limit(50)
      .toArray();
    
    // Remover 50% dos registros mais antigos
    const halfStudents = Math.floor(students.length / 2);
    const halfPeis = Math.floor(peis.length / 2);

    for (const student of students.slice(0, halfStudents)) {
      await offlineDB.students.delete(student.id);
    }

    for (const pei of peis.slice(0, halfPeis)) {
      await offlineDB.peis.delete(pei.id);
    }
    
    console.log(`🗑️ Removidos ${halfStudents + halfPeis} registros do cache`);
  }

  private async optimizeCache(): Promise<void> {
    console.log('⚡ Otimização de cache executada (índices já definidos na versão do Dexie)');
  }

  // Métodos para obter métricas
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuração de performance atualizada:', this.config);
  }

  // Relatório de performance
  public generatePerformanceReport(): string {
    const metrics = this.getMetrics();
    const config = this.getConfig();
    
    return `
      📊 RELATÓRIO DE PERFORMANCE - PEI COLLAB
      ==========================================
      
      🚀 Métricas de Performance:
      • Tempo de carregamento: ${metrics.loadTime}ms
      • Tempo de renderização: ${metrics.renderTime}ms
      • Uso de memória: ${metrics.memoryUsage.toFixed(2)}MB
      • Cache hit rate: ${metrics.cacheHitRate.toFixed(2)}%
      • Requisições de rede: ${metrics.networkRequests}
      • Operações offline: ${metrics.offlineOperations}
      
      ⚙️ Configurações:
      • Lazy loading: ${config.enableLazyLoading ? '✅' : '❌'}
      • Otimização de imagens: ${config.enableImageOptimization ? '✅' : '❌'}
      • Code splitting: ${config.enableCodeSplitting ? '✅' : '❌'}
      • Service Worker: ${config.enableServiceWorker ? '✅' : '❌'}
      • Cache offline: ${config.enableOfflineCache ? '✅' : '❌'}
      • Tamanho máximo do cache: ${config.maxCacheSize}MB
      • Expiração do cache: ${config.cacheExpiration}h
      
      📱 Otimizações Mobile:
      • Dispositivo de baixo desempenho: ${this.isLowEndDevice() ? '✅' : '❌'}
      • Conexão lenta: ${(navigator as any).connection?.effectiveType === 'slow-2g' ? '✅' : '❌'}
      • Memória limitada: ${(performance as any).memory?.jsHeapSizeLimit < 100 * 1024 * 1024 ? '✅' : '❌'}
    `;
  }
}

// Instância global do otimizador
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Hook para usar otimizações em componentes React
export const usePerformanceOptimization = () => {
  const optimizeForMobile = () => performanceOptimizer.optimizeForMobile();
  const manageCache = () => performanceOptimizer.manageCache();
  const getMetrics = () => performanceOptimizer.getMetrics();
  const getConfig = () => performanceOptimizer.getConfig();
  const updateConfig = (config: Partial<PerformanceConfig>) => performanceOptimizer.updateConfig(config);
  const generateReport = () => performanceOptimizer.generatePerformanceReport();

  return {
    optimizeForMobile,
    manageCache,
    getMetrics,
    getConfig,
    updateConfig,
    generateReport
  };
};


