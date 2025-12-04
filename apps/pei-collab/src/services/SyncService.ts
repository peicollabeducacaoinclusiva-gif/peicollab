// src/services/SyncService.ts

/**
 * Interface para representar um conflito de sincronização
 */
interface SyncConflict {
  localVersion: any;
  remoteVersion: any;
  resolvedVersion: any;
  strategy: 'local' | 'remote' | 'merge' | 'manual';
}

/**
 * Serviço de Sincronização Offline-First com Estratégia de Resolução de Conflitos
 */
class SyncService {
  /**
   * Resolve um conflito de sincronização entre a versão local e remota.
   * @param tableName Nome da tabela (coleção) onde ocorreu o conflito.
   * @param localData Dados da versão local (IndexedDB).
   * @param remoteData Dados da versão remota (Supabase/PostgreSQL).
   * @returns Um objeto SyncConflict com a versão resolvida e a estratégia utilizada.
   */
  async resolveConflict(
    tableName: string,
    localData: any,
    remoteData: any
  ): Promise<SyncConflict> {
    // 1. Estratégia Padrão: Vencedor é o que tem o 'updated_at' mais recente
    if (localData.updated_at && remoteData.updated_at) {
      const localTime = new Date(localData.updated_at).getTime();
      const remoteTime = new Date(remoteData.updated_at).getTime();

      if (localTime > remoteTime) {
        return {
          localVersion: localData,
          remoteVersion: remoteData,
          resolvedVersion: localData,
          strategy: 'local' // A versão local é mais recente
        };
      }
    }
    
    // 2. Estratégia Específica para PEIs: Merge Inteligente
    if (tableName === 'peis') {
      return {
        localVersion: localData,
        remoteVersion: remoteData,
        resolvedVersion: this.mergePEI(localData, remoteData),
        strategy: 'merge' // Merge de campos específicos
      };
    }
    
    // 3. Fallback: Versão remota (assumindo que o servidor é a fonte de verdade mais segura)
    return {
      localVersion: localData,
      remoteVersion: remoteData,
      resolvedVersion: remoteData,
      strategy: 'remote'
    };
  }
  
  /**
   * Realiza um merge inteligente para a tabela 'peis', focando em campos JSON.
   * @param local Versão local do PEI.
   * @param remote Versão remota do PEI.
   * @returns O objeto PEI mesclado.
   */
  private mergePEI(local: any, remote: any) {
    // Assumimos que a estrutura principal (metadados) da versão remota é mantida,
    // mas os dados de conteúdo (diagnosis, planning, evaluation) são mesclados.
    // Uma estratégia simples é manter o que foi alterado localmente, mas sinalizar para revisão.
    
    // Merge dos campos JSON (Deep Merge seria ideal, mas aqui fazemos um shallow merge e sinalizamos)
    const mergedDiagnosis = this.mergeJSON(local.diagnosis_data, remote.diagnosis_data);
    const mergedPlanning = this.mergeJSON(local.planning_data, remote.planning_data);
    const mergedEvaluation = this.mergeJSON(local.evaluation_data, remote.evaluation_data);

    return {
      ...remote, // Começa com a versão remota
      diagnosis_data: mergedDiagnosis,
      planning_data: mergedPlanning,
      evaluation_data: mergedEvaluation,
      updated_at: new Date().toISOString(),
      sync_conflict: true, // Flag para forçar revisão manual no frontend
      sync_notes: 'Conflito de PEI resolvido por merge automático. Revisão manual recomendada.'
    };
  }

  /**
   * Função utilitária para merge de objetos JSON (simplificado).
   * Em um cenário real, uma biblioteca de deep merge seria usada.
   * Aqui, priorizamos o objeto local para campos que não existem no remoto,
   * e o remoto para campos que existem em ambos (simplificação).
   */
  private mergeJSON(local: any, remote: any): any {
    if (!local) return remote;
    if (!remote) return local;
    
    return {
      ...remote,
      ...local
    };
  }
}

// 7. Otimização do PWA: Configuração otimizada para vite-plugin-pwa
// (A configuração real deve ser aplicada em vite.config.ts)

/**
 * Configuração PWA sugerida para vite.config.ts
 */
const PWA_CONFIG = {
  registerType: 'prompt', // Melhor UX que autoUpdate
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
  manifest: {
    name: 'PEI Collab',
    short_name: 'PEICollab',
    description: 'Plataforma de Gestão de PEIs',
    theme_color: '#2563eb',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    icons: [
      { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ],
    shortcuts: [
      {
        name: 'Criar PEI',
        short_name: 'Novo PEI',
        description: 'Criar novo Plano Educacional',
        url: '/peis/create',
        icons: [{ src: '/icons/create-pei.png', sizes: '96x96' }]
      },
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        url: '/dashboard',
        icons: [{ src: '/icons/dashboard.png', sizes: '96x96' }]
      }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      // Cache para assets do Supabase (ex: avatares, anexos)
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/(storage|rest)\/v1\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'supabase-assets-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias
          }
        }
      },
      // Cache para APIs de dados
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/api/data/'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-data-cache',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24 // 1 dia
          },
          networkTimeoutSeconds: 10 // Tempo limite de 10 segundos para a rede
        }
      }
    ]
  }
};

export default SyncService;
export { PWA_CONFIG };
export type { SyncConflict };
