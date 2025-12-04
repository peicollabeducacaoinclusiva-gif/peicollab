type Serializable = unknown;

interface LocalForageConfig {
  name: string;
  storeName: string;
  description?: string;
}

class LocalForageInstance {
  private storageKeyPrefix: string;

  constructor(private config: LocalForageConfig) {
    this.storageKeyPrefix = `${config.name}:${config.storeName}:`;
  }

  private buildKey(key: string) {
    return `${this.storageKeyPrefix}${key}`;
  }

  async setItem<T = Serializable>(key: string, value: T): Promise<T> {
    if (typeof window === 'undefined') {
      return value;
    }
    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(this.buildKey(key), serialized);
    } catch (error) {
      console.warn('localforage shim: erro ao salvar item', error);
    }
    return value;
  }

  async getItem<T = Serializable>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const stored = window.localStorage.getItem(this.buildKey(key));
      if (stored === null) return null;
      return JSON.parse(stored) as T;
    } catch (error) {
      console.warn('localforage shim: erro ao ler item', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(this.buildKey(key));
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    const prefix = this.storageKeyPrefix;
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const storedKey = window.localStorage.key(i);
      if (storedKey && storedKey.startsWith(prefix)) {
        keysToRemove.push(storedKey);
      }
    }
    keysToRemove.forEach((storedKey) => window.localStorage.removeItem(storedKey));
  }

  async keys(): Promise<string[]> {
    if (typeof window === 'undefined') {
      return [];
    }
    const keys: string[] = [];
    const prefix = this.storageKeyPrefix;
    for (let i = 0; i < window.localStorage.length; i++) {
      const storedKey = window.localStorage.key(i);
      if (storedKey && storedKey.startsWith(prefix)) {
        keys.push(storedKey.replace(prefix, ''));
      }
    }
    return keys;
  }
}

export const createLocalForageInstance = (config: LocalForageConfig) => new LocalForageInstance(config);

