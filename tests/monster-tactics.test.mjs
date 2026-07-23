import assert from "node:assert/strict";
import test from "node:test";
import { BOSS_TACTICS, MONSTER_CATALOG, baseIndexForKind, damageMultiplierFor, encodedMonsterKind, monsterForBattle } from "../app/monsters.ts";

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

test("defines separate phase-readable tactics for all ten bosses",()=>{
  assert.deepEqual(Object.keys(BOSS_TACTICS).map(Number),[10,20,30,40,50,60,70,80,90,100]);
  assert.ok(Object.values(BOSS_TACTICS).every(boss=>boss.pattern.length>=3&&boss.phasePattern.length>=3&&boss.telegraph&&boss.hint&&boss.weakness&&boss.resistance));
  assert.deepEqual(BOSS_TACTICS[20].pattern.slice(0,3),["guard","charge","heavy"]);
  assert.notDeepEqual(BOSS_TACTICS[100].pattern,BOSS_TACTICS[100].phasePattern);
});

test("gives all twenty-five bodies a tactical identity and makes four variants matter",()=>{
  const bodies=Array.from({length:25},(_,index)=>MONSTER_CATALOG[index*4]);
  assert.equal(new Set(bodies.map(monster=>monster.trait)).size,25);
  for(let base=0;base<25;base++){
    const variants=MONSTER_CATALOG.slice(base*4,base*4+4);
    assert.equal(new Set(variants.map(monster=>`${monster.weakness}/${monster.resistance}`)).size,4);
    assert.equal(new Set(variants.map(monster=>monster.pattern.join(","))).size,4);
  }
});

test("encodes new deep-floor enemies without breaking legacy enemy kinds",()=>{
  for(const index of [0,39,40,63,99]){
    const kind=encodedMonsterKind(index);
    assert.equal(monsterForBattle(kind,80).id,MONSTER_CATALOG[index].id);
    assert.equal(baseIndexForKind(kind,80),Math.floor(index/4));
  }
  assert.equal(monsterForBattle(12,50).base,"空洞兵");
});

test("keeps early tactical threat near the former numeric baseline",()=>{
  const surcharge={coil:.05,split:.3,multiHit:.14,drain:.2,steal:.05,shell:.2,curseCounter:.2,fireAbsorb:.15,frenzy:.15,blind:.15};
  const early=Array.from({length:10},(_,index)=>MONSTER_CATALOG[index*4]);
  const scores=early.map(monster=>monster.hpScale*monster.atkScale*(1+surcharge[monster.trait]));
  assert.ok(scores.every(score=>score>=.78&&score<=1.05),`early threat scores: ${scores.map(score=>score.toFixed(2)).join(", ")}`);
  assert.ok(scores.reduce((sum,score)=>sum+score,0)/scores.length<.93);
});

test("pays for deep tactical effects with lower raw stats",()=>{
  const surcharge={mudBlind:.12,venomWeb:.14,shieldWall:.18,flameSurge:.18,manaDrain:.1,paralysis:.15,bleeder:.14,armorPierce:.22,tripleHit:.22,bleedCounter:.18,paralyzeStrike:.18,magicMirror:.18,regenerate:.22,curseAura:.16,execute:.18};
  const deep=Array.from({length:15},(_,index)=>MONSTER_CATALOG[(index+10)*4]);
  const scores=deep.map(monster=>monster.hpScale*monster.atkScale*(1+surcharge[monster.trait]));
  assert.ok(scores.every(score=>score>=.8&&score<=1),`deep threat scores: ${scores.map(score=>score.toFixed(2)).join(", ")}`);
  assert.ok(scores.reduce((sum,score)=>sum+score,0)/scores.length<.93);
});
