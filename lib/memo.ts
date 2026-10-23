import "server-only";

interface Entry {
  at: number;
  value: Promise<unknown>;
}

interface Global {
  __qncMemo?: Map<string, Entry>;
}
const g = globalThis as unknown as Global;
const store = (g.__qncMemo ??= new Map<string, Entry>());

/** Remember a promise for `ttl` milliseconds, process-wide. A rejected promise is forgotten at once. */
export function memo<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as Promise<T>;
  const value = fn();
  store.set(key, { at: Date.now(), value });
  value.catch(() => {
    if (store.get(key)?.value === value) store.delete(key);
  });
  return value;
}

export function clearMemo(prefix?: string) {
  if (!prefix) return store.clear();
  for (const k of [...store.keys()]) if (k.startsWith(prefix)) store.delete(k);
}
