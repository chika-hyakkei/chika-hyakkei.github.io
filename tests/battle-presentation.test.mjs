import test from "node:test";
import assert from "node:assert/strict";
import {
  ENEMY_IMPACT_DELAY_MS,
  PLAYER_IMPACT_DELAY_MS,
  battlePresentation,
} from "../app/battle-presentation.ts";

test("maps every command to its own pose without reading translated labels", () => {
  assert.deepEqual(battlePresentation("attack", "warrior"), { pose: "attack", fx: "slash" });
  assert.deepEqual(battlePresentation("guard", "mage"), { pose: "guard", fx: "" });
  assert.deepEqual(battlePresentation("potion", "thief"), { pose: "potion", fx: "heal" });
  assert.deepEqual(battlePresentation("bomb", "priest"), { pose: "bomb", fx: "blast" });
  assert.deepEqual(battlePresentation("flee", "knight"), { pose: "flee", fx: "" });
});

test("uses guard, healing, and magic poses for the matching job skills", () => {
  assert.deepEqual(battlePresentation("skill2", "warrior"), { pose: "guard", fx: "" });
  assert.deepEqual(battlePresentation("skill1", "priest"), { pose: "potion", fx: "heal" });
  assert.deepEqual(battlePresentation("skill2", "priest"), { pose: "guard", fx: "" });
  assert.deepEqual(battlePresentation("skill1", "mage"), { pose: "magic", fx: "magic" });
  assert.deepEqual(battlePresentation("skill1", "sage"), { pose: "magic", fx: "heal" });
  assert.deepEqual(battlePresentation("skill2", "sage"), { pose: "magic", fx: "magic" });
  assert.deepEqual(battlePresentation("skill1", "knight"), { pose: "guard", fx: "" });
  assert.deepEqual(battlePresentation("skill1", "samurai"), { pose: "attack", fx: "slash" });
  assert.deepEqual(battlePresentation("skill2", "samurai"), { pose: "guard", fx: "" });
  assert.deepEqual(battlePresentation("skill1", "alchemist"), { pose: "bomb", fx: "blast" });
  assert.deepEqual(battlePresentation("skill2", "alchemist"), { pose: "potion", fx: "heal" });
});

test("keeps player and enemy impact delays inside their animation windows", () => {
  assert.ok(PLAYER_IMPACT_DELAY_MS >= 220 && PLAYER_IMPACT_DELAY_MS <= 380);
  assert.ok(ENEMY_IMPACT_DELAY_MS >= 180 && ENEMY_IMPACT_DELAY_MS <= 300);
});
test("input is blocked for either animation beat, pending logic and foreground overlays",async()=>{
  const {canIssueBattleCommand}=await import("../app/battle-presentation.ts");
  const run={phase:"battle",battle:{},pendingEnemyTurn:null};
  assert.equal(canIssueBattleCommand(run,"idle",false,false),true);
  for(const phase of ["player","enemy"])assert.equal(canIssueBattleCommand(run,phase,false,false),false);
  assert.equal(canIssueBattleCommand(run,"idle",true,false),false);
  assert.equal(canIssueBattleCommand(run,"idle",false,true),false);
  assert.equal(canIssueBattleCommand({...run,pendingEnemyTurn:{}},"idle",false,false),false);
});
