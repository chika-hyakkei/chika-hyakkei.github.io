import assert from "node:assert/strict";
import test from "node:test";
import { emptyGuideProgress, nextGuideStep, normalizeGuideProgress } from "../app/onboarding.ts";

test("guides first-time players through move, intent, guard, status, and healing in context", () => {
  const progress=emptyGuideProgress();
  assert.equal(nextGuideStep(progress,{active:true,phase:"explore"}),"move");
  progress.move=true;
  assert.equal(nextGuideStep(progress,{active:true,phase:"battle",intent:"attack"}),"intent");
  progress.intent=true;
  assert.equal(nextGuideStep(progress,{active:true,phase:"battle",intent:"heavy"}),"guard");
  progress.guard=true;
  assert.equal(nextGuideStep(progress,{active:true,phase:"battle",intent:"attack",hasStatus:true}),"status");
  progress.status=true;
  assert.equal(nextGuideStep(progress,{active:true,phase:"battle",intent:"attack",hp:10,maxHp:30,potions:1}),"heal");
  progress.heal=true;
  assert.equal(nextGuideStep(progress,{active:true,phase:"battle",intent:"attack",hp:10,maxHp:30,potions:1}),null);
});

test("normalizes old or malformed guide progress without blocking play", () => {
  assert.deepEqual(normalizeGuideProgress({move:true,intent:1}),{move:true,intent:true,guard:false,heal:false,status:false});
  assert.deepEqual(normalizeGuideProgress(null),emptyGuideProgress());
});
