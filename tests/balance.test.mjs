import assert from "node:assert/strict";
import test from "node:test";
import { BUILDS, JOBS, runBalanceSimulation, simulateRun, summarizeBalance } from "../scripts/balance-simulator.mjs";

test("runs every job, build, and strategy across more than ten thousand fixed campaigns", () => {
  const report = runBalanceSimulation({ seedsPerCohort: 400 });
  assert.equal(report.totalRuns, JOBS.length * BUILDS.length * 2 * 400);
  assert.ok(report.totalRuns >= 10000);
  assert.equal(report.cohorts.length, JOBS.length * BUILDS.length * 2);
});

test("fixed-seed balance stays inside the target bands", () => {
  const summary = summarizeBalance(runBalanceSimulation({ seedsPerCohort: 1000 }));
  assert.ok(summary.novice.clearRate >= .03 && summary.novice.clearRate <= .05, `first-run rate ${(summary.novice.clearRate * 100).toFixed(2)}%`);
  assert.ok(summary.forecast.clearRate >= .10 && summary.forecast.clearRate <= .15, `forecast rate ${(summary.forecast.clearRate * 100).toFixed(2)}%`);
  assert.ok(summary.novice.points[50].reachedRate > .12, "novice 50F should remain realistically reachable");
  assert.ok(summary.forecast.points[50].reachedRate > .30, "forecast 50F should remain realistically reachable");
});

test("records resources, time, and a concrete death cause deterministically", () => {
  const first = simulateRun(7919, "mage", "forecast", "guard");
  const second = simulateRun(7919, "mage", "forecast", "guard");
  assert.deepEqual(first, second);
  assert.ok(["clear", "burst", "attrition", "status", "mp_exhaustion"].includes(first.cause));
  assert.ok(first.minutes > 0);
  assert.ok(first.potions >= 0 && first.potions <= 3);
  assert.ok(first.supplies >= 0 && first.supplies <= 5);
});
