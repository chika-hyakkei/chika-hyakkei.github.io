import assert from "node:assert/strict";
import test from "node:test";
import { clearRecoverable, loadRecoverable, saveRecoverable } from "../app/storage.ts";

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const normalize = value => value && typeof value === "object" && Number.isInteger(value.floor) ? value : null;

test("loads the current valid save", () => {
  const storage = new MemoryStorage();
  storage.setItem("run", JSON.stringify({ floor: 8 }));
  assert.deepEqual(loadRecoverable(storage, "run", "backup", "bad", normalize), { value: { floor: 8 }, source: "current", error: null });
});

test("quarantines a broken current save and restores its valid backup", () => {
  const storage = new MemoryStorage();
  storage.setItem("run", "{broken");
  storage.setItem("backup", JSON.stringify({ floor: 7 }));
  const result = loadRecoverable(storage, "run", "backup", "bad", normalize);
  assert.equal(result.source, "backup");
  assert.equal(result.value.floor, 7);
  assert.equal(storage.getItem("bad"), "{broken");
});

test("backs up the previous valid state before saving and clears both active copies", () => {
  const storage = new MemoryStorage();
  storage.setItem("run", JSON.stringify({ floor: 4 }));
  saveRecoverable(storage, "run", "backup", { floor: 5 }, normalize);
  assert.deepEqual(JSON.parse(storage.getItem("backup")), { floor: 4 });
  assert.deepEqual(JSON.parse(storage.getItem("run")), { floor: 5 });
  clearRecoverable(storage, "run", "backup");
  assert.equal(storage.getItem("run"), null);
  assert.equal(storage.getItem("backup"), null);
});
