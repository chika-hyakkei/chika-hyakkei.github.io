import assert from "node:assert/strict";
import test from "node:test";
import {runCombatAudit,simulateCheckpoint} from "../scripts/combat-audit.mjs";
test("production rules audit covers 10000 fixed seeds, all eight jobs and nine checkpoints",()=>{
 const report=runCombatAudit(10000);
 assert.equal(report.totalTrials,80000);assert.equal(report.cohorts.length,72);
 for(const cohort of report.cohorts){
  assert.ok(cohort.trials>=1000);
  assert.ok(cohort.oneBattleRate>=.85,cohort.job+" "+cohort.floor+" first battle: "+cohort.oneBattleRate);
  assert.ok(cohort.twoBattleRate>=.65,cohort.job+" "+cohort.floor+" second battle: "+cohort.twoBattleRate);
 }
});
test("checkpoint simulation reproduces state, resources and causal outcomes",()=>{
 const first=simulateCheckpoint(12345,"mage",91),second=simulateCheckpoint(12345,"mage",91);
 assert.deepEqual(first,second);assert.ok(first.hp>=0);assert.ok(first.mp>=0);assert.equal(first.potions,0);
 assert.ok([null,"heavy","enemy","status","reflect","stalemate"].includes(first.cause));
});
