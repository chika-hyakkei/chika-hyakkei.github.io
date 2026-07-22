import assert from "node:assert/strict";
import test from "node:test";
import { BOSS_TACTICS, MONSTER_CATALOG, damageMultiplierFor, monsterForBattle } from "../app/monsters.ts";

test("gives the first twenty floors ten distinct tactical enemies",()=>{
  const early=Array.from({length:10},(_,index)=>MONSTER_CATALOG[index*4]);
  assert.equal(MONSTER_CATALOG.length,100);
  assert.equal(new Set(early.map(monster=>monster.trait)).size,10);
  assert.ok(early.every(monster=>monster.trait!=="none"&&monster.telegraph&&monster.hint&&monster.pattern.length>=3));
  assert.equal(monsterForBattle(0,1).base,"洞ミミズ");
  assert.equal(monsterForBattle(9,20).base,"深層の目");
});

test("changes patterns across variants instead of only changing names",()=>{
  const worm=MONSTER_CATALOG.slice(0,4);
  assert.equal(new Set(worm.map(monster=>monster.pattern.join(","))).size,4);
  assert.ok(worm[1].atkScale>worm[0].atkScale);
  assert.ok(worm[2].pattern.includes("status"));
});

test("makes weakness helpful and resistance meaningful",()=>{
  const fireEater=MONSTER_CATALOG.find(monster=>monster.base==="火喰い虫"&&monster.variant==="通常");
  assert.ok(fireEater);
  assert.equal(damageMultiplierFor(fireEater,"ice"),1.35);
  assert.equal(damageMultiplierFor(fireEater,"fire"),.55);
  assert.equal(damageMultiplierFor(fireEater,"physical"),1);
});

test("defines separate phase-readable tactics for the first two bosses",()=>{
  assert.deepEqual(Object.keys(BOSS_TACTICS).map(Number),[10,20]);
  assert.ok(BOSS_TACTICS[10].pattern.includes("status"));
  assert.deepEqual(BOSS_TACTICS[20].pattern.slice(0,3),["guard","charge","heavy"]);
});

test("keeps early tactical threat near the former numeric baseline",()=>{
  const surcharge={coil:.05,split:.3,multiHit:.14,drain:.2,steal:.05,shell:.2,curseCounter:.2,fireAbsorb:.15,frenzy:.15,blind:.15};
  const early=Array.from({length:10},(_,index)=>MONSTER_CATALOG[index*4]);
  const scores=early.map(monster=>monster.hpScale*monster.atkScale*(1+surcharge[monster.trait]));
  assert.ok(scores.every(score=>score>=.78&&score<=1.05),`early threat scores: ${scores.map(score=>score.toFixed(2)).join(", ")}`);
  assert.ok(scores.reduce((sum,score)=>sum+score,0)/scores.length<.93);
});
