import { offlineStorage, OfflineStudent } from '@/lib/offlineStorage';
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para gerenciar cache de dados offline
 */
export class CacheService {
  /**
   * Salva estudantes no cache local
   */
  static async cacheStudents(students: any[]) {
    try {
      const cachedStudents: OfflineStudent[] = students.map(student => ({
        ...student,
        cached_at: new Date().toISOString(),
      }));

      await offlineStorage.setItem('students', cachedStudents);
      console.log('✅ Estudantes salvos no cache:', cachedStudents.length);
    } catch (error) {
      console.error('❌ Erro ao salvar estudantes no cache:', error);
    }
  }

  /**
   * Recupera estudantes do cache local
   */
  static async getCachedStudents(): Promise<OfflineStudent[]> {
    try {
      const students = await offlineStorage.getItem<OfflineStudent[]>('students');
      return students || [];
    } catch (error) {
      console.error('❌ Erro ao recuperar estudantes do cache:', error);
      return [];
    }
  }

  /**
   * Limpa todos os dados do cache
   */
  static async clearCache() {
    try {
      await offlineStorage.clear();
      console.log('✅ Cache limpo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
    }
  }

  /**
   * Verifica se o cache está desatualizado (mais de 1 hora)
   */
  static async isCacheStale(): Promise<boolean> {
    const students = await this.getCachedStudents();
    if (students.length === 0) return true;

    const firstStudent = students[0];
    const cachedAt = new Date(firstStudent.cached_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60);

    return hoursDiff > 1; // Cache expira após 1 hora
  }

  /**
   * Salva um único PEI no cache
   */
  static async cachePEI(peiId: string, peiData: any) {
    try {
      await offlineStorage.setItem(`pei_${peiId}`, {
        ...peiData,
        cached_at: new Date().toISOString(),
      });
      console.log('✅ PEI salvo no cache:', peiId);
    } catch (error) {
      console.error('❌ Erro ao salvar PEI no cache:', error);
    }
  }

  /**
   * Recupera um PEI específico do cache
   */
  static async getCachedPEI(peiId: string): Promise<any | null> {
    try {
      return await offlineStorage.getItem(`pei_${peiId}`);
    } catch (error) {
      console.error('❌ Erro ao recuperar PEI do cache:', error);
      return null;
    }
  }
}