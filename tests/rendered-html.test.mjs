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
  const music = await readFile(new URL("../app/music.ts", import.meta.url), "utf8");
  for (const text of ["戦士","盗賊","僧侶","魔法使い","騎士","賢者","強打","盗む","治療","火球","盾打ち","雷撃"]) assert.match(page, new RegExp(text));
  assert.match(page, /const W = 13, H = 11/);
  assert.match(page, /function generateFloor/);
  assert.match(page, /10&&!unlocked\.includes\("knight"\)/);
  assert.match(page, /20&&!unlocked\.includes\("sage"\)/);
  assert.match(page, /chika-hyakkei-run-v3/);
  assert.match(page, /localStorage\.removeItem\(RUN_KEY\)/);
  assert.match(page, /帰還の碑/);
  assert.match(page, /坑道商人/);
  assert.match(page, /武器.*防具.*装飾/s);
  assert.match(page, /冒険を諦める/);
  assert.match(page, /maxDistance/);
  assert.match(page, /farCells/);
  assert.match(page, /const discard=/);
  assert.match(page, /を捨てた/);
  assert.match(page, /購入後、すぐに装備します/);
  assert.match(page, /チャリーン/);
  assert.match(music, /startGameTheme/);
  assert.match(music, /"dungeon" \| "battle" \| "boss" \| "shop" \| "death"/);
  assert.match(music, /window\.setTimeout/);
  assert.match(page, /species-\$\{run\.battle\.kind%10\}/);
  assert.doesNotMatch(page, /kind:Math\.min\(9/);
  assert.match(page, /rank=Math\.floor\(floor\/30\)/);
  assert.match(page, /baseName.*＋\$\{rank\}/);
  assert.match(page, /run\.battle\?\.boss\?"boss":"battle"/);
  assert.match(page, /const list=gear\.filter\(g=>g\.kind===kind\)\.sort/);
  assert.match(page, /forge=Math\.floor\(run\.floor\/20\)/);
  assert.match(page, /variant-\$\{Math\.floor\(run\.floor\/30\)%4\}/);
  assert.match(page, /type EnemyIntent/);
  assert.match(page, /敵の次行動/);
  assert.match(page, /battleAction\("guard"\)/);
  assert.match(page, /Math\.max\(18,Math\.ceil\(st\.maxHp\*\.45\)\)/);
  assert.match(page, /g\.potions>=3/);
  assert.match(page, /shopPotionAvailable:false/);
  assert.match(page, /Math\.min\(48,12\+/);
  assert.match(page, /匿名テスト記録/);
  assert.match(page, /匿名記録をコピー/);
  assert.match(page, /recordRunStart/);
  assert.match(page, /recordRunEnd/);
});

test("stores only anonymous local playtest records", async () => {
  const telemetry = await readFile(new URL("../app/telemetry.ts", import.meta.url), "utf8");
  assert.match(telemetry, /chika-hyakkei-test-record-v1/);
  assert.match(telemetry, /installId/);
  assert.match(telemetry, /recentRuns/);
  assert.match(telemetry, /telemetryExport/);
  assert.doesNotMatch(telemetry, /email|location|fetch\(/i);
});

test("includes a static GitHub Pages deployment path", async () => {
  const script = await readFile(new URL("../scripts/build-github-pages.mjs", import.meta.url), "utf8");
  const workflow = await readFile(new URL("../.github/workflows/deploy-pages.yml", import.meta.url), "utf8");
  assert.match(script, /dist\/client/);
  assert.match(script, /resolve\(outputDir, "index\.html"\)/);
  assert.match(script, /resolve\(root, "site"\)/);
  assert.match(script, /\.nojekyll/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /npm run build:pages/);
  assert.match(workflow, /path: site/);
});

test("defines the hundred-monster catalog", async () => {
  const monsters = await readFile(new URL("../app/monsters.ts", import.meta.url), "utf8");
  assert.match(monsters, /bases\.flatMap/);
  assert.match(monsters, /\["通常",""\].*\["凶暴","狂"\].*\["呪染","呪"\].*\["深淵","深"\]/s);
  assert.match(monsters, /"百景の底王"/);
});

test("defines the hundred-item catalog", async () => {
  const items = await readFile(new URL("../app/items.ts", import.meta.url), "utf8");
  for (const category of ["weapon", "armor", "accessory", "consumable", "relic"]) assert.match(items, new RegExp(`category:\\"${category}\\"`));
  assert.match(items, /weaponFamilies\.flatMap/);
  assert.match(items, /armorFamilies\.flatMap/);
});

test("shows a compact weekly podium and documented update history", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const updates = await readFile(new URL("../app/updates.ts", import.meta.url), "utf8");
  assert.match(page, /WEEKLY TOP 3/);
  assert.match(page, /UPDATE_NOTES/);
  assert.match(page, /shopBlocked/);
  assert.match(page, /持ち物がいっぱい/);
  assert.match(updates, /記録の掲示板/);
});

test("uses the dedicated title logo in the header", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /className="site-logo"/);
  assert.match(page, /src="\/assets\/title-logo\.webp"/);
  assert.match(page, /Endless Dungeon RPG 地下百景/);
});
