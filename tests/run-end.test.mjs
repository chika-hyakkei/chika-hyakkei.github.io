import assert from "node:assert/strict";
import test from "node:test";
import { finalizeRunViewState } from "../app/run-end.ts";

test("completes 100 normal run endings without retaining the active run", () => {
  const reasons = ["dead", "return", "abandon", "clear"];
  for (let index = 0; index < 100; index++) {
    const reason = reasons[index % reasons.length];
    const current = { name: `冒険${index}`, job: "warrior", floor: index % 100 + 1, kills: index, bosses: Math.floor(index / 10), testMode: false };
    const transition = finalizeRunViewState(reason, current, 1000 + index, index >= 20 ? ["knight", "sage"] : []);
    assert.equal(transition.run, null);
    assert.equal(transition.result.reason, reason);
    assert.equal(transition.result.floor, current.floor);
    assert.equal(transition.result.score, 1000 + index);
    assert.equal(transition.shouldSubmitRanking, true);
  }
});

test("keeps test-mode endings out of the online ranking", () => {
  const transition = finalizeRunViewState("clear", { name: "TESTER", job: "mage", floor: 100, kills: 100, bosses: 10, testMode: true }, 999999, []);
  assert.equal(transition.run, null);
  assert.equal(transition.result.reason, "clear");
  assert.equal(transition.shouldSubmitRanking, false);
});
