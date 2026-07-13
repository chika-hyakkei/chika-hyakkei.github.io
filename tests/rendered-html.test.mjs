import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Chika Hyakkei title screen", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /<title>地下百景｜無限ダンジョンRPG<\/title>/);
  assert.match(html, /倒れればすべてを失う無料レトロRPG/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("ships the complete roguelike loop", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const text of ["戦士","盗賊","僧侶","魔法使い","騎士","賢者","強打","盗む","治療","火球","盾打ち","雷撃"]) assert.match(page, new RegExp(text));
  assert.match(page, /const W = 13, H = 11/);
  assert.match(page, /function generateFloor/);
  assert.match(page, /10&&!unlocked\.includes\("knight"\)/);
  assert.match(page, /20&&!unlocked\.includes\("sage"\)/);
  assert.match(page, /chika-hyakkei-run-v1/);
  assert.match(page, /localStorage\.removeItem\(RUN_KEY\)/);
  assert.match(page, /帰還の碑/);
  assert.match(page, /坑道商人/);
  assert.match(page, /武器.*防具.*装飾/s);
  assert.match(page, /冒険を諦める/);
});
