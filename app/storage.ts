export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type RecoverableLoad<T> = {
  value: T | null;
  source: "current" | "backup" | "none";
  error: string | null;
};

const parse = <T>(raw: string | null, normalize: (value: unknown) => T | null) => {
  if (!raw) return null;
  try { return normalize(JSON.parse(raw)); } catch { return null; }
};

export function loadRecoverable<T>(storage: StorageLike, key: string, backupKey: string, quarantineKey: string, normalize: (value: unknown) => T | null): RecoverableLoad<T> {
  const currentRaw = storage.getItem(key);
  if (!currentRaw) return { value: null, source: "none", error: null };
  const current = parse(currentRaw, normalize);
  if (current) return { value: current, source: "current", error: null };
  storage.setItem(quarantineKey, currentRaw);
  const backup = parse(storage.getItem(backupKey), normalize);
  if (backup) return { value: backup, source: "backup", error: "直前のセーブが壊れていたため、ひとつ前の状態へ戻しました。" };
  return { value: null, source: "none", error: "冒険セーブを読み込めませんでした。壊れたデータは復旧用に退避しました。" };
}

export function saveRecoverable<T>(storage: StorageLike, key: string, backupKey: string, value: T, normalize: (value: unknown) => T | null) {
  const next = JSON.stringify(value);
  const previous = storage.getItem(key);
  if (previous && previous !== next && parse(previous, normalize)) storage.setItem(backupKey, previous);
  storage.setItem(key, next);
}

export function clearRecoverable(storage: StorageLike, key: string, backupKey: string) {
  storage.removeItem(key);
  storage.removeItem(backupKey);
}
