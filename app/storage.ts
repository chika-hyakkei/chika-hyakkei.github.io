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
  try {
  const currentRaw = storage.getItem(key);
  if (!currentRaw) return { value: null, source: "none", error: null };
  const current = parse(currentRaw, normalize);
  if (current) return { value: current, source: "current", error: null };
  try { storage.setItem(quarantineKey, currentRaw); } catch { /* A full disk must not prevent reading the backup. */ }
  const backup = parse(storage.getItem(backupKey), normalize);
  if (backup) return { value: backup, source: "backup", error: "直前のセーブが壊れていたため、ひとつ前の状態へ戻しました。" };
  return { value: null, source: "none", error: "冒険セーブを読み込めませんでした。壊れたデータは復旧用に退避しました。" };
  } catch { return { value: null, source: "none", error: "端末の保存領域を読み取れません。ブラウザの保存設定を確認してください。" }; }
}

export function saveRecoverable<T>(storage: StorageLike, key: string, backupKey: string, value: T, normalize: (value: unknown) => T | null) {
  try {
    const normalized = normalize(value);
    if (!normalized) return "保存内容の検査に失敗したため、正常な前回セーブを保持しました。";
    const next = JSON.stringify(normalized), previous = storage.getItem(key);
    if (previous && previous !== next && parse(previous, normalize)) storage.setItem(backupKey, previous);
    storage.setItem(key, next);
    return null;
  } catch { return "端末へ保存できません。空き容量・ブラウザの保存設定を確認してください。前回セーブは保持しています。"; }
}

export function clearRecoverable(storage: StorageLike, key: string, backupKey: string) {
  try { storage.removeItem(key); storage.removeItem(backupKey); } catch { /* Storage can be disabled by the browser. */ }
}
