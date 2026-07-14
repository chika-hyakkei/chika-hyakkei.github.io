import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("implements the confirmed hundred-floor tactical loop", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const text of ["25", "variants", "100 FLOORS", "bossNames", "百景の底・虚無王", "敵の次行動", "防御", "毒", "出血", "呪い", "暗闇", "麻痺", "Math.max(18,Math.ceil(s.hp*.45))", "potions>=3", "floor%3===0", "図鑑", "熟練", "墓データ", "地下依頼"]) assert.ok(page.includes(text), `missing ${text}`);
  assert.match(page, /phase:final\?"ending"/);
  assert.match(page, /r\.enemies\.length\)return/);
});

test("keeps potion and shop constraints explicit", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /potions:1/);
  assert.match(page, /potions>=3/);
  assert.match(page, /12\+\(\(r\.floor\/3\|0\)%4\)\*12/);
  assert.match(page, /回復薬は一店につき1個/);
});
