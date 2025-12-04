import { useState, useEffect, useCallback } from 'react';

const HISTORY_STORAGE_KEY = 'pei-collab-app-history';
const MAX_HISTORY_ITEMS = 10;

export interface AppHistoryItem {
  appId: string;
  appName: string;
  accessedAt: string;
  accessCount: number;
}

export function useAppHistory(userId: string | undefined) {
  const [history, setHistory] = useState<AppHistoryItem[]>([]);

  useEffect(() => {
    if (!userId) {
      setHistory([]);
      return;
    }

    try {
      const stored = localStorage.getItem(`${HISTORY_STORAGE_KEY}-${userId}`);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setHistory([]);
    }
  }, [userId]);

  const addToHistory = useCallback((appId: string, appName: string) => {
    if (!userId) return;

    setHistory(prev => {
      const existingIndex = prev.findIndex(item => item.appId === appId);
      let newHistory: AppHistoryItem[];

      if (existingIndex >= 0) {
        // Atualizar item existente
        newHistory = [...prev];
        newHistory[existingIndex] = {
          ...newHistory[existingIndex],
          accessedAt: new Date().toISOString(),
          accessCount: newHistory[existingIndex].accessCount + 1,
        };
        // Mover para o topo
        const item = newHistory.splice(existingIndex, 1)[0];
        newHistory.unshift(item);
      } else {
        // Adicionar novo item
        newHistory = [
          {
            appId,
            appName,
            accessedAt: new Date().toISOString(),
            accessCount: 1,
          },
          ...prev,
        ].slice(0, MAX_HISTORY_ITEMS);
      }

      try {
        localStorage.setItem(
          `${HISTORY_STORAGE_KEY}-${userId}`,
          JSON.stringify(newHistory)
        );
      } catch (error) {
        console.error('Erro ao salvar histórico:', error);
      }

      return newHistory;
    });
  }, [userId]);

  const getMostUsedApps = useCallback((limit: number = 5): AppHistoryItem[] => {
    return [...history]
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }, [history]);

  const getRecentApps = useCallback((limit: number = 5): AppHistoryItem[] => {
    return history.slice(0, limit);
  }, [history]);

  const clearHistory = useCallback(() => {
    if (!userId) return;

    setHistory([]);
    try {
      localStorage.removeItem(`${HISTORY_STORAGE_KEY}-${userId}`);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  }, [userId]);

  return {
    history,
    addToHistory,
    getMostUsedApps,
    getRecentApps,
    clearHistory,
  };
}

