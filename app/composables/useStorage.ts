type StorageType = 'local' | 'session';

export function useStorage(type: StorageType = 'local') {
  const storage = type === 'local' ? window.localStorage : window.sessionStorage;

  function getItem(key: string): string | null {
    return storage.getItem(key);
  }

  function setItem(key: string, value: unknown) {
    const stringified = typeof value === 'string' ? value : JSON.stringify(value);

    storage.setItem(key, stringified);
  }

  function removeItem(key: string) {
    storage.removeItem(key);
  }

  function clear() {
    storage.clear();
  }

  return {
    getItem,
    setItem,
    removeItem,
    clear,
  };
}
