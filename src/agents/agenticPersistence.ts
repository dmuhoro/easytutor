export class AgenticPersistence {
  private static fallback = new Map<string, string>();

  static async read<T>(key: string): Promise<T | null> {
    const storage = this.getWebStorage();

    try {
      const raw = storage?.getItem(key) ?? null;
      if (!raw) {
        return this.parseFallback<T>(key);
      }

      this.fallback.set(key, raw);
      return JSON.parse(raw) as T;
    } catch {
      return this.parseFallback<T>(key);
    }
  }

  static async write<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    this.fallback.set(key, serialized);
    const storage = this.getWebStorage();

    try {
      storage?.setItem(key, serialized);
    } catch {
      // The in-memory fallback keeps offline continuity available for current runtime.
    }
  }

  static async remove(key: string): Promise<void> {
    this.fallback.delete(key);
    const storage = this.getWebStorage();

    try {
      storage?.removeItem(key);
    } catch {
      // Best effort cleanup only.
    }
  }

  private static parseFallback<T>(key: string): T | null {
    const raw = this.fallback.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  private static getWebStorage(): Storage | null {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return globalThis.localStorage;
    }

    return null;
  }
}
