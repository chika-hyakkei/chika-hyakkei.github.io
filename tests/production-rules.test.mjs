import assert from "node:assert/strict";
import test from "node:test";
import { createRun } from "../app/run-factory.ts";
import { gear, openChest, questProgressFor, relicOffers, enemyFor, stats } from "../app/game-rules.ts";
import { defaultMeta, normalizeMeta, normalizeRun } from "../app/game-save.ts";
import { saveRecoverable, loadRecoverable } from "../app/storage.ts";
import { updateMetaAfterRun, recoverGraveItem } from "../app/progression.ts";
import { resolveBattleAction, resolveEnemyTurn, victoryRun } from "../app/battle-engine.ts";
import { MONSTER_CATALOG, encodedMonsterKind } from "../app/monsters.ts";
import { recordRunStart, recordFloor, recordRunEnd, emptyTelemetry, normalizeTelemetry } from "../app/telemetry.ts";
import { englishGameNotice } from "../app/game-feedback.ts";
class MemoryStorage { values=new Map();getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,String(v));}removeItem(k){this.values.delete(k);} }
const combat=(trait="none",job="warrior",floor=41)=>{
 const run=createRun(job,floor,7919),index=Math.max(0,MONSTER_CATALOG.findIndex(m=>m.trait===trait));
 const b=enemyFor({id:1,x:1,y:1,kind:encodedMonsterKind(index),boss:false},floor);
 return {...run,level:50,hp:1000,mp:100,battle:b,phase:"battle"};
};
test("chests use independent rolls and make all 80 equipment IDs obtainable",()=>{
 const found=new Set();
 for(const floor of [1,21,41,61,81]){
  const base=createRun("warrior",floor,1),kinds=new Set();
  let potionDrops=0;
  for(let seed=1;seed<=10000;seed++){
   const next=openChest({...base,seed:seed*7919},1,1);
   if(next.inventory[0]){found.add(next.inventory[0].id);kinds.add(next.inventory[0].kind);}
   if(next.potions>base.potions)potionDrops++;
   assert.equal(next.chestsOpened,1);
   assert.equal(openChest(next,1,1),next);
  }
  assert.deepEqual([...kinds].sort(),["accessory","armor","weapon"]);
  assert.ok(potionDrops>1800&&potionDrops<2700);
 }
 assert.equal(found.size,80);
});
test("chest quest progress survives a floor boundary and migrates conservatively",()=>{
 const run={...createRun("warrior",3,12),quest:"chests",opened:[1,2,3]};
 const legacy=normalizeRun(run);assert.equal(legacy.chestsOpened,3);
 assert.equal(questProgressFor({...legacy,floor:4,opened:[]}).complete,true);
});
test("real save validators reject malformed fields and retain legacy items",()=>{
 const run=createRun("mage",21,10);assert.ok(normalizeRun(run));
 for(const broken of [{...run,seen:undefined},{...run,hp:null},{...run,level:NaN},{...run,phase:"battle",battle:null},{...run,enemies:[{}]},{...run,statuses:[{kind:"bad",turns:3}]}])assert.equal(normalizeRun(broken),null);
 assert.equal(normalizeMeta({...defaultMeta,bestScore:null}),null);
 const legacy={...run,runId:undefined,chestsOpened:undefined,inventory:[{id:"legacy-sword",uid:1,name:"昔の剣",tier:1,price:3,kind:"weapon",atk:1}]};
 assert.equal(normalizeRun(legacy).inventory[0].id,"legacy-sword");
 assert.ok(normalizeRun(legacy).runId.startsWith("legacy-"));
});
test("bad current state falls back to the real validated backup; bad writes never replace it",()=>{
 const storage=new MemoryStorage(),run=createRun("warrior",11,9);
 storage.setItem("current",JSON.stringify({...run,seen:null}));storage.setItem("backup",JSON.stringify(run));
 assert.equal(loadRecoverable(storage,"current","backup","bad",normalizeRun).source,"backup");
 assert.ok(storage.getItem("bad"));
 storage.setItem("current",JSON.stringify(run));
 const before=storage.getItem("current");
 assert.match(saveRecoverable(storage,"current","backup",{...run,hp:null},normalizeRun),/検査/);
 assert.equal(storage.getItem("current"),before);
 storage.setItem=()=>{throw new Error("QuotaExceeded");};
 assert.match(saveRecoverable(storage,"current","backup",{...run,hp:1},normalizeRun),/保存できません/);
 assert.equal(storage.getItem("current"),before);
});
test("relic choices never repeat and the hundredth key is an ending reward",()=>{
 const run=createRun("warrior",40,4),owned=["r1","r2","r3"];
 const choices=relicOffers({...run,relics:owned});
 assert.equal(choices.length,3);assert.equal(new Set(choices.map(x=>x.id)).size,3);assert.ok(!choices.some(x=>x.id==="r10"));
 assert.equal(relicOffers({...run,relics:Array.from({length:9},(_,i)=>"r"+(i+1))}).length,0);
 const boss=enemyFor({id:99,x:1,y:1,kind:9,boss:true},100);
 assert.ok(victoryRun({...run,floor:100},boss).relics.includes("r10"));
});
test("test mode only changes permitted job unlocks, not normal records or mastery",()=>{
 const meta={...defaultMeta,bestFloor:4,bestScore:200,mastery:{warrior:2}},run={...createRun("warrior",100,9),testMode:true,kills:99};
 const next=updateMetaAfterRun(meta,run,"clear",999999);
 assert.equal(next.bestFloor,4);assert.equal(next.bestScore,200);assert.equal(next.cleared,false);assert.equal(next.totalKills,0);assert.equal(next.mastery.warrior,2);
 assert.ok(next.unlocked.includes("alchemist"));
});
test("empty new deaths replace old graves; recovery respects eight slots",()=>{
 const item={...gear[0],uid:1},meta={...defaultMeta,grave:{floor:40,items:[item]}};
 assert.equal(updateMetaAfterRun(meta,createRun("warrior",1,1),"dead",1).grave,null);
 const full={...createRun("warrior",40,1),phase:"recoveryChoice",recovery:[item],inventory:Array.from({length:8},(_,i)=>({...item,uid:i+10}))};
 assert.equal(recoverGraveItem(full,1),full);
 const recovered=recoverGraveItem({...full,inventory:full.inventory.slice(1)},1);
 assert.equal(recovered.inventory.length,8);assert.equal(recovered.phase,"explore");
});
test("floor counts are unique per run and split standard/descent routes",()=>{
 let value=recordRunStart(emptyTelemetry(),"warrior",{runId:"one",route:"normal",startFloor:1});
 value=recordFloor(value,"warrior",10,"one");value=recordFloor(value,"warrior",10,"one");
 value=recordRunEnd(value,{runId:"one",job:"warrior",floor:10,result:"dead",kills:2,bosses:0});
 assert.equal(value.floorReached[10],1);assert.equal(value.floorReached[1],1);
 const duplicate=recordRunEnd(value,{runId:"one",job:"warrior",floor:10,result:"dead",kills:2,bosses:0});
 assert.equal(duplicate.outcomes.dead,1);
 value=recordRunStart(value,"sage",{runId:"two",route:"descent",startFloor:91});
 assert.equal(value.floorReached[1],1);assert.equal(value.routeFloorReached.descent[91],1);
 const old=normalizeTelemetry({version:1,floorReached:{"1":2}});
 assert.equal(old.legacyFloorEvents[1],2);assert.deepEqual(old.floorReached,{});
});
test("two-phase engine damages enemy first and player only on the enemy phase",()=>{
 const run=combat("multiHit"),oldHp=run.hp,oldEnemy=run.battle.hp;
 const action=resolveBattleAction(run,"attack");
 assert.equal(action.run.hp,oldHp);assert.ok(action.run.battle.hp<oldEnemy);assert.ok(action.run.pendingEnemyTurn);
 const pending=action.run.pendingEnemyTurn,reply=resolveEnemyTurn({...action.run,pendingEnemyTurn:null},pending.battle,pending.message);
 assert.ok(reply.run.hp<oldHp);assert.equal(run.battle.hp,oldEnemy);
 assert.match(englishGameNotice(reply.run),/Dealt .*Took/);
});
test("reflection, mana drain, regeneration and potion cures use actual combat state",()=>{
 const mirror=combat("magicMirror","mage"),reflected=resolveBattleAction(mirror,"skill1");
 assert.ok(reflected.run.hp<mirror.hp);assert.equal(reflected.run.battle.hp,mirror.battle.hp);
 const drain=combat("manaDrain");drain.battle.intent="attack";
 const after=resolveEnemyTurn(drain,drain.battle,"").run;assert.ok(after.mp<drain.mp);
 const regen=combat("regenerate");regen.battle={...regen.battle,intent:"guard",hp:10};
 assert.ok(resolveEnemyTurn(regen,regen.battle,"").run.battle.hp>10);
 const poisoned={...combat("multiHit"),hp:20,statuses:[{kind:"poison",turns:3}],potions:1};
 const healed=resolveBattleAction(poisoned,"potion").run;assert.deepEqual(healed.statuses,[]);assert.ok(healed.hp>20);
});
test("a change in actual attack or enemy power changes simulated damage",()=>{
 const run=combat("multiHit");
 const weak=resolveBattleAction(run,"attack").run,boosted=resolveBattleAction({...run,equipment:{...run.equipment,weapon:{...gear[0],uid:1,atk:100}}},"attack").run;
 assert.ok((boosted.battle?.hp??0)<weak.battle.hp);
 const strongEnemy={...run.battle,atk:run.battle.atk*3,intent:"attack"};
 assert.ok(resolveEnemyTurn(run,strongEnemy,"").run.hp<resolveEnemyTurn(run,{...run.battle,intent:"attack"},"").run.hp);
});
