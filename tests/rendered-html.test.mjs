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
  for (const text of ["戦士","盗賊","僧侶","魔法使い","騎士","賢者","侍","錬金術師","強打","盗む","治療","火球","盾打ち","雷撃","居合斬り","爆薬調合"]) assert.match(page, new RegExp(text));
  assert.match(page, /const W = 13, H = 11/);
  assert.match(page, /function generateFloor/);
  assert.match(page, /current\.floor>=10&&!unlocked\.includes\("knight"\)/);
  assert.match(page, /current\.floor>=20&&!unlocked\.includes\("sage"\)/);
  assert.match(page, /current\.floor>=50&&!unlocked\.includes\("samurai"\)/);
  assert.match(page, /current\.floor>=80&&!unlocked\.includes\("alchemist"\)/);
  assert.match(page, /testPower:saved\.testPower\?\?saved\.testMode\?\?false/);
  assert.match(page, /run\.testMode&&run\.testPower/);
  assert.match(page, /const startTestNormal=/);
  assert.match(page, /testMode:true,testPower:false/);
  assert.match(page, /meta\.unlocked\.includes\(k\)\|\|\(testGate&&testPassword===\"HYAKKEI100\"\)/);
  assert.match(page, /if\(!meta\.unlocked\.includes\(job\)\)\{setTestGate\(true\);return;\}/);
  assert.match(page, /jumpTestFloor=\(value:number,forcePower=false\)/);
  assert.match(page, /powered=forcePower\|\|g\.testPower/);
  assert.match(page, /jumpTestFloor\(run\.floor,true\)/);
  assert.match(page, /className="test-mode-entry"/);
  assert.match(page, />T<\/button>/);
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
  assert.match(page, /const list=gear\.filter\(g=>g\.kind===kind&&Math\.abs\(g\.tier-tier\)<=1\)/);
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

test("renders a detailed treasure chest and keeps battle backgrounds free of a center seam", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/grim.css", import.meta.url), "utf8");
  assert.match(page, /className="chest-mark" aria-hidden="true"><i\/><i\/><i\/>/);
  assert.match(css, /\.chest-mark:before/);
  assert.match(css, /\.chest-mark:after/);
  assert.match(css, /\.chest-mark i:nth-child\(1\)/);
  assert.doesNotMatch(css, /\.battle\.modal:before\{[^}]*transparent 49%/);
  assert.doesNotMatch(css, /\.shell:not\(\.depth-0\) \.battle\.modal:before\{[^}]*transparent 49%/);
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
  for (const category of ["weapon", "armor", "accessory", "consumable", "relic"]) assert.match(items, new RegExp(`category:\\s*\\"${category}\\"`));
  assert.match(items, /weaponFamilies\.flatMap/);
  assert.match(items, /armorFamilies\.flatMap/);
  for (const passive of ["vampire", "critical", "guardCounter", "mpFlow", "statusResist", "lastStand"]) assert.match(items, new RegExp(`\\b${passive}\\b`));
});

test("opens item and monster lists from the game UI", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const i18n = await readFile(new URL("../app/i18n.ts", import.meta.url), "utf8");
  assert.match(page, /ITEM ARCHIVE/);
  assert.match(i18n, /アイテムリスト/);
  assert.match(page, /モンスター/);
  assert.match(page, /found\}\/100 \{pick\(locale,"入手","found"\)\}/);
});

test("connects equipment master data, build comparison, combat procs, and item discovery", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /equipmentItems\.map/);
  assert.match(page, /itemDiscovery:saved\.itemDiscovery\?\?\{\}/);
  assert.match(page, /normalizeOwnedGear/);
  assert.match(page, /inventory:\(saved\.inventory\?\?\[\]\)\.map\(normalizeOwnedGear\)/);
  assert.match(page, /未入手・効果は未記録/);
  assert.match(page, /const gearDelta=/);
  assert.match(page, /現在装備と比較/);
  for (const proc of ["吸血でHP", "MP循環で", "瀕死強化！", "会心！", "状態耐性", "防御反撃"]) assert.match(page, new RegExp(proc));
});

test("makes all ten consumables obtainable, saved, visible, and usable in battle", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const items = await readFile(new URL("../app/items.ts", import.meta.url), "utf8");
  for (const id of ["c2","c4","c5","c6","c7","c8","c9","c10"]) assert.match(page, new RegExp(`\\"${id}\\"`));
  for (const name of ["万能薬","火炎瓶","氷結札","雷鳴玉","煙玉","解呪札","止血布","星蜜"]) {
    assert.match(items, new RegExp(name));
  }
  assert.match(page, /supplies,combo/);
  assert.match(page, /rawSupplies=saved\.supplies/);
  assert.match(page, /道具袋は\$\{SUPPLY_LIMIT\}個まで/);
  assert.match(page, /setShowBattleItems/);
  assert.match(page, /5 \/ I で開閉/);
  assert.match(page, /const useSupply=/);
  assert.match(page, /queueEnemyTurn\(\{\.\.\.next,statuses:\[\]\}/);
  assert.match(page, /damageKind:DamageKind=id==="c4"\?"fire"/);
  assert.match(page, /id==="c5"&&r<\.35/);
  assert.match(page, /phase:"explore",battle:null/);
  assert.match(page, /MPを\$\{recovered\}回復した/);
  assert.match(page, /supplyUnavailableReason/);
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

test("makes normal run endings actionable and keeps retry progress derived from the run", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(page, /type DeathCause = "heavy" \| "status" \| "reflect" \| "enemy"/);
  assert.match(page, /const questProgressFor=/);
  assert.match(page, /function RunResultCard/);
  assert.match(page, /回収候補：/);
  assert.match(page, /次の称号/);
  assert.match(page, /className=\{`quest-ribbon/);
  assert.match(page, /result&&!result\.testMode&&<RunResultCard/);
  assert.match(page, /compact onRetry=\{start\}/);
  assert.match(css, /\.start-panel>\.result\{display:none\}/);
  assert.match(css, /\.run-result/);
  assert.match(css, /\.quest-ribbon/);
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

test("drives battle poses by command id and delays visible HP changes until impact", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const presentation = await readFile(new URL("../app/battle-presentation.ts", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/grim.css", import.meta.url), "utf8");
  assert.match(page, /battlePresentation\(mode,run\?\.job\?\?"warrior"\)/);
  assert.doesNotMatch(page, /label\.includes\("防御"\)/);
  assert.match(page, /setShownPlayerHp/);
  assert.match(page, /ENEMY_IMPACT_DELAY_MS/);
  assert.match(page, /setShownEnemyHp/);
  assert.match(page, /PLAYER_IMPACT_DELAY_MS/);
  for (const pose of ["attack", "guard", "magic", "potion", "bomb", "flee"]) {
    assert.match(presentation, new RegExp(`pose: "${pose}"`));
  }
  assert.match(css, /\.turn-player\.action-potion/);
  assert.match(css, /\.turn-player\.action-bomb/);
  assert.match(css, /\.turn-player\.action-flee/);
});

test("guides the first ten minutes without hiding combat state", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/grim.css", import.meta.url), "utf8");
  assert.match(page, /nextGuideStep\(guideProgress/);
  assert.match(page, /FIRST DESCENT/);
  assert.match(page, /案内をもう一度/);
  assert.match(page, /function StatusBadges/);
  assert.match(page, /statusCopy\(locale,status\.kind\)/);
  assert.match(page, /status\.turns\}T/);
  assert.match(page, /MP \{cost\}\{unavailable\?pick\(locale,"・不足"," · Low"\):""\}/);
  assert.match(page, /階層主から逃走不可/);
  assert.match(css, /\.guide-tip\{position:fixed/);
  assert.match(css, /\.battle-actions button\.unavailable/);
});

test("ships the complete English route and stable-id content localization", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/en/page.tsx", import.meta.url), "utf8");
  const content = await readFile(new URL("../app/content-localization.ts", import.meta.url), "utf8");
  const exporter = await readFile(new URL("../scripts/build-github-pages.mjs", import.meta.url), "utf8");
  assert.match(route, /export \{ default \} from "\.\.\/page"/);
  assert.match(page, /englishPath=\/\\\/en\\\/\?\$\//);
  for (const helper of ["localizedItem","localizedMonster","localizedBossTactic","localizedBattleName","localizedDepth"]) {
    assert.match(page, new RegExp(`${helper}\\(`));
    assert.match(content, new RegExp(`function ${helper}\\(`));
  }
  assert.match(content, /const monsterBases = \[/);
  assert.match(content, /const depthNames = \[/);
  assert.match(exporter, /resolve\(outputDir, "en", "index\.html"\)/);
});

test("provides an installable offline shell without intercepting ranking traffic", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  const serviceWorker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.icons.some((icon) => icon.src === "/favicon.svg"));
  assert.match(layout, /manifest\.webmanifest/);
  assert.match(layout, /apple-mobile-web-app-capable/);
  assert.match(page, /serviceWorker\.register\("\/sw\.js"/);
  assert.match(serviceWorker, /cache\.addAll\(CORE_URLS\)/);
  assert.match(serviceWorker, /request\.mode === "navigate"/);
  assert.match(serviceWorker, /url\.pathname === "\/ranking-config\.js"/);
  assert.match(serviceWorker, /self\.clients\.claim\(\)/);
});

test("makes continuing after a boss primary and protects return with confirmation", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/grim.css", import.meta.url), "utf8");
  const continueAt = page.indexOf('className="primary continue-descent"');
  const returnAt = page.indexOf('className="return-request"');
  assert.ok(continueAt >= 0 && returnAt > continueAt);
  assert.match(page, /setConfirmReturn\(true\)/);
  assert.match(page, /className="danger-confirm" onClick=\{\(\)=>finish\("return"\)\}/);
  assert.match(page, /setConfirmReturn\(false\)/);
  assert.match(css, /\.milestone-choice \.continue-descent/);
  assert.match(css, /\.return-confirm/);
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
