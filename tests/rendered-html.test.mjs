import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
const read=path=>readFile(new URL("../"+path,import.meta.url),"utf8");
test("server-renders the published game shell",async()=>{
 const url=new URL("../dist/server/index.js",import.meta.url);url.searchParams.set("test",process.pid+"-"+Date.now());
 const {default:worker}=await import(url.href),response=await worker.fetch(new Request("http://localhost/",{headers:{accept:"text/html"}}),{ASSETS:{fetch:async()=>new Response("Not found",{status:404})}},{waitUntil(){},passThroughOnException(){}});
 assert.equal(response.status,200);const html=await response.text();assert.match(html,/<html lang="ja">/);assert.match(html,/地下百景/);assert.doesNotMatch(html,/codex-preview|react-loading-skeleton/);
});
test("UI calls the shared tested battle, reward, save and checkpoint rules",async()=>{
 const page=await read("app/page.tsx");
 for(const name of ["resolveBattleAction","resolveEnemyTurn","resolveSupply","openChest","createCheckpointRun","updateMetaAfterRun","recoverGraveItem"])assert.match(page,new RegExp(name+"\\("));
 assert.match(page,/RUN_QUARANTINE_KEY,normalizeRun/);assert.match(page,/META_QUARANTINE_KEY,normalizeMeta/);
 assert.doesNotMatch(page,/const enemyRetaliates=|const win=|const openChest=/);
 assert.match(page,/canBattleInput\(\)/);assert.match(page,/battleInputLocked/);
 assert.match(page,/ENEMY_IMPACT_DELAY_MS/);assert.match(page,/PLAYER_IMPACT_DELAY_MS/);
 assert.match(page,/finished\.route!=="normal"/);assert.match(page,/submitRankingReliably/);
});
test("descent has pointer steering, held keys, RAF, pause, a clear legend and a real explorer sprite",async()=>{
 const view=await read("app/descent-game.tsx"),css=await read("app/descent.css");
 for(const required of ["requestAnimationFrame","cancelAnimationFrame","setPointerCapture","keydown","keyup","visibilitychange","descent-legend","hero-front-a.png","DIVE!"])assert.ok(view.includes(required),required);
 assert.match(css,/touch-action:none/);assert.match(css,/max-height:96dvh/);assert.doesNotMatch(view,/moveDescentLane|descent-lane/);
});
test("retains title assets, compact gauges, archives, keyboard controls and guarded return",async()=>{
 const page=await read("app/page.tsx"),css=await read("app/grim.css");
 for(const required of ["title-logo.webp","GemGauge","ItemList","Bestiary","UPDATE_NOTES","ALL-TIME TOP 3","test-mode-entry","danger-confirm","setConfirmReturn(true)"])assert.ok(page.includes(required),required);
 assert.ok(page.indexOf('className="primary continue-descent"')<page.indexOf('className="return-request"'));
 assert.match(await read("app/globals.css"),/title-adventure\.jpg/);
 assert.match(css,/\.chest-mark:before/);assert.doesNotMatch(css,/\.battle\.modal:before\{[^}]*transparent 49%/);
});
test("keeps the English route and analytics separate from offline game assets",async()=>{
 assert.match(await read("app/en/page.tsx"),/export \{ default \} from "\.\.\/page"/);
 const layout=await read("app/layout.tsx"),sw=await read("public/sw.js"),exporter=await read("scripts/build-github-pages.mjs");
 assert.match(layout,/static\.cloudflareinsights\.com/);assert.match(layout,/manifest\.webmanifest/);
 assert.match(sw,/url\.pathname === "\/ranking-config\.js"/);assert.match(sw,/await cache\.put/);
 assert.match(exporter,/assetPaths/);assert.match(exporter,/createHash/);assert.match(exporter,/CORE_URLS/);
});
test("publication checks the types and full regression suite before uploading",async()=>{
 const workflow=await read(".github/workflows/deploy-pages.yml");
 assert.match(workflow,/npm run typecheck/);assert.match(workflow,/npm test/);
 assert.ok(workflow.indexOf("npm test")<workflow.indexOf("upload-pages-artifact"));
});
