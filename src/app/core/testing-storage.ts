import { vi } from 'vitest';

/** Installs a fresh in-memory `localStorage` so specs do not depend on the runtime's implementation. */
export function resetLocalStorage(): void {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, String(value)),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
  });
}
