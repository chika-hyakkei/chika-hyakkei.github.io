/**
 * Real-rule checkpoint audit, not a claimed 100-floor clear-rate model.
 * Uses exactly the run factory, enemies, equipment and two-phase battle functions
 * used by the UI. The policy reads the telegraph and previews one action.
 */
import { pathToFileURL } from "node:url";
import { JOB_IDS } from "../shared/jobs.ts";
import { createCheckpointRun } from "../app/run-factory.ts";
import { stats, enemyFor, SKILL_COSTS } from "../app/game-rules.ts";
import { resolveBattleAction, resolveEnemyTurn, resolveSupply } from "../app/battle-engine.ts";
export const CHECKPOINTS=[11,21,31,41,51,61,71,81,91];
export function chooseAction(run) {
  const st=stats(run),b=run.battle;
  let modes=["attack","guard"];
  if(run.mp>=SKILL_COSTS[run.job][0]&&(!(run.job==="priest"||run.job==="sage")||run.hp<st.maxHp*.45))modes.push("skill1");
  if(run.mp>=SKILL_COSTS[run.job][1]&&(run.job!=="alchemist"||run.hp<st.maxHp*.45))modes.push("skill2");
  if(run.potions&&run.hp<st.maxHp*.58)modes.push("potion");
  if(run.bombs)modes.push("bomb");
  let best="attack",bestScore=-Infinity;
  for(const mode of modes) {
    const resolved=resolveBattleAction(run,mode);
    let next=resolved.run,death=resolved.death;
    if(next.pendingEnemyTurn){const p=next.pendingEnemyTurn;const reply=resolveEnemyTurn({...next,pendingEnemyTurn:null},p.battle,p.message,p.skip);next=reply.run;death=reply.death;}
    const inflicted=Math.max(0,b.hp-(next.battle?.hp??0)),health=next.hp-run.hp;
    const score=death?-1e8:inflicted+health*(run.hp<st.maxHp*.45?2:1.15)+(next.mp-run.mp)*1.8-(run.potions-next.potions)*st.maxHp*.22-(run.bombs-next.bombs)*b.maxHp*.15+(resolved.victory?b.maxHp:0);
    if(score>bestScore){bestScore=score;best=mode;}
  }
  return best;
}
export function simulateCheckpoint(seed,job,floor,{potions=0}={}) {
  let run=createCheckpointRun({job,floor,seed,name:"AUDIT",runId:"audit-"+seed+"-"+job,quest:"slay",award:{potions,bombs:0,starHoney:0}});
  const initialStats=stats(run),enemies=run.enemies.filter(e=>!e.boss).slice(0,2);
  let turns=0,cause=null,defeated=0;
  for(const enemy of enemies) {
    run={...run,phase:"battle",battle:enemyFor(enemy,floor),pendingEnemyTurn:null,guard:0};
    for(let i=0;i<80&&run.phase==="battle";i++) {
      const action=chooseAction(run);let result=resolveBattleAction(run,action);run=result.run;turns++;
      if(result.death){cause=result.death.cause;break;}
      if(result.victory){defeated++;break;}
      if(run.pendingEnemyTurn){const pending=run.pendingEnemyTurn;result=resolveEnemyTurn({...run,pendingEnemyTurn:null},pending.battle,pending.message,pending.skip);run=result.run;
        if(result.death){cause=result.death.cause;break;}if(result.victory){defeated++;break;}}
    }
    if(cause||run.phase==="battle")break;
  }
  return {seed,job,floor,defeated,hp:run.hp,mp:run.mp,potions:run.potions,turns,cause:cause??(defeated<2?"stalemate":null),initial:initialStats};
}
export function runCombatAudit(seeds=10000) {
  const cohorts={};
  for(let seed=1;seed<=seeds;seed++){
    const floor=CHECKPOINTS[(seed-1)%CHECKPOINTS.length];
    for(const job of JOB_IDS){
      const result=simulateCheckpoint(seed*7919,job,floor),key=job+"-"+floor;
      const row=cohorts[key]??={job,floor,trials:0,oneBattle:0,twoBattles:0,hpTotal:0,mpTotal:0,minHp:Infinity,causes:{}};
      row.trials++;row.oneBattle+=Number(result.defeated>=1);row.twoBattles+=Number(result.defeated===2);
      row.hpTotal+=result.hp;row.mpTotal+=result.mp;row.minHp=Math.min(row.minHp,result.hp);
      if(result.cause)row.causes[result.cause]=(row.causes[result.cause]??0)+1;
    }
  }
  return {kind:"production-rules-checkpoint-audit",seeds,totalTrials:seeds*JOB_IDS.length,scenario:"Two actual normal encounters after landing; no potions, bombs, supplies, floor recovery or relics. Telegraph-aware one-step policy, not human play or full-campaign clear rate.",
    cohorts:Object.values(cohorts).map(r=>({...r,oneBattleRate:r.oneBattle/r.trials,twoBattleRate:r.twoBattles/r.trials,meanHp:r.hpTotal/r.trials,meanMp:r.mpTotal/r.trials}))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const seeds=Number(process.argv.find(x=>x.startsWith("--seeds="))?.split("=")[1]??10000);
  console.log(JSON.stringify(runCombatAudit(seeds),null,2));
}
