const store: Record<string, string> = {};

export default {
  async getItem(key: string) {
    return store[key] ?? null;
  },
  async setItem(key: string, value: string) {
    store[key] = value;
  },
  async removeItem(key: string) {
    delete store[key];
  },
  async getAllKeys() {
    return Object.keys(store);
  },
  async clear() {
    for (const k of Object.keys(store)) delete store[k];
  },
};
