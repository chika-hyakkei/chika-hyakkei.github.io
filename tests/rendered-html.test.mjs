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
  assert.match(page, /catalogId:saved\.battle\.catalogId\?\?monsterForBattle/);
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
  assert.match(page, /species-\$\{baseIndexForKind\(run\.battle\.kind,run\.floor\)%10\}/);
  assert.doesNotMatch(page, /kind:Math\.min\(9/);
  assert.match(page, /rank=Math\.floor\(floor\/30\)/);
  assert.match(page, /baseName.*＋\$\{rank\}/);
  assert.match(page, /run\.battle\?\.boss\?"boss":"battle"/);
  assert.match(page, /const list=gear\.filter\(g=>g\.kind===kind\)\.sort/);
  assert.match(page, /forge=Math\.floor\(run\.floor\/20\)/);
  assert.match(page, /variant-\$\{\(Number\(run\.battle\.catalogId\.slice\(1\)\)-1\)%4\}/);
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

test("opens item and monster lists from the game UI", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const i18n = await readFile(new URL("../app/i18n.ts", import.meta.url), "utf8");
  assert.match(page, /ITEM ARCHIVE/);
  assert.match(i18n, /アイテムリスト/);
  assert.match(page, /モンスター/);
  assert.match(page, /ITEM_CATALOG\.length\}\/100/);
});

test("shows a compact all-time podium and documented update history", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const updates = await readFile(new URL("../app/updates.ts", import.meta.url), "utf8");
  assert.match(page, /ALL-TIME TOP 3/);
  assert.doesNotMatch(page, />今週<|setRankingScope|loadRanking\("weekly"\)/);
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

test("includes the documented anonymous web analytics beacon", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(layout, /static\.cloudflareinsights\.com\/beacon\.min\.js/);
  assert.match(layout, /data-cf-beacon/);
  assert.match(page, /匿名のアクセス集計を使用しています/);
});

test("preserves the core end, chest, shop, save recovery, and ranking retry paths", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const ranking = await readFile(new URL("../app/ranking.ts", import.meta.url), "utf8");
  const worker = await readFile(new URL("../ranking-api/src/index.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../ranking-api/migrations/0003_ranking_submission_id.sql", import.meta.url), "utf8");
  for (const reason of ["dead", "return", "abandon", "clear"]) assert.match(page, new RegExp(`reason===\\"${reason}\\"|finish\\(\\"${reason}\\"`));
  assert.match(page, /finalizeRunViewState\(reason,current,total,newly\)/);
  assert.match(page, /inventory\.length>=8.*gold:g\.gold\+12/s);
  assert.match(page, /old&&run\.inventory\.length>=8.*先に捨てるか売ろう.*return/s);
  assert.match(page, /loadRecoverable\(localStorage,RUN_KEY,RUN_BACKUP_KEY,RUN_QUARANTINE_KEY,normalizeRun\)/);
  assert.match(page, /submitRankingReliably\(\{submissionId:crypto\.randomUUID\(\)/);
  assert.match(ranking, /queueRanking\(submission\).*submitRanking\(submission\).*removeQueuedRanking/s);
  assert.match(worker, /INSERT OR IGNORE INTO ranking_runs/);
  assert.doesNotMatch(worker, /WHERE week_key =/);
  assert.match(migration, /CREATE UNIQUE INDEX ranking_runs_submission_id/);
});

test("uses compact ten-facet jewel gauges for player HP and MP", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/grim.css", import.meta.url), "utf8");
  assert.match(page, /function GemGauge/);
  assert.match(page, /Array\.from\(\{length:10\}/);
  assert.match(page, /<GemGauge kind="hp"/);
  assert.match(page, /<GemGauge kind="mp"/);
  assert.match(css, /\.gem-track\{display:grid;grid-template-columns:repeat\(10/);
  assert.match(css, /\.battle-player-vitals/);
});

test("guides the first ten minutes without hiding combat state", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/grim.css", import.meta.url), "utf8");
  assert.match(page, /nextGuideStep\(guideProgress/);
  assert.match(page, /FIRST DESCENT/);
  assert.match(page, /案内をもう一度/);
  assert.match(page, /function StatusBadges/);
  assert.match(page, /残り\$\{status\.turns\}ターン/);
  assert.match(page, /MP \{cost\}\{unavailable\?"・不足"/);
  assert.match(page, /階層主から逃走不可/);
  assert.match(css, /\.guide-tip\{position:fixed/);
  assert.match(css, /\.battle-actions button\.unavailable/);
});

test("connects monster tactics to combat and progressive bestiary knowledge", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const monsters = await readFile(new URL("../app/monsters.ts", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/grim.css", import.meta.url), "utf8");
  for (const mechanic of ["split","multiHit","drain","steal","shell","curseCounter","fireAbsorb","frenzy","blind","mudBlind","venomWeb","shieldWall","flameSurge","manaDrain","paralysis","bleeder","armorPierce","tripleHit","bleedCounter","paralyzeStrike","magicMirror","regenerate","curseAura","execute"]) assert.match(monsters,new RegExp(`\\b${mechanic}\\b`));
  assert.match(page, /damageMultiplierFor\(affinityTarget,damageKind\)/);
  assert.match(page, /encodedMonsterKind\(base\*4\+variant\)/);
  assert.match(page, /苔スライムが分裂/);
  assert.match(page, /炎を吸収/);
  assert.match(page, /魔法を反射/);
  assert.match(page, /MPを\$\{mpStolen\}奪われた/);
  assert.match(page, /防御で効果を1ターンに抑えた/);
  assert.match(page, /kills>=3/);
  assert.match(page, /kills>=5/);
  assert.match(page, /固有の兆候/);
  assert.match(css, /\.enemy-tactic\{/);
});
