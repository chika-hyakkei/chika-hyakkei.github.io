import assert from "node:assert/strict";
import test from "node:test";
import {
  DESCENT_MAX_PROGRESS,
  advanceDescent,
  createDescent,
  descentLoanTier,
  descentStartingLevel,
  descentSupplyAward,
  descentTargetFloor,
  moveDescentLane,
} from "../app/descent.ts";

test("uses only the safe post-boss checkpoint for a descent route", () => {
  assert.equal(descentTargetFloor(1), 1);
  assert.equal(descentTargetFloor(10), 1);
  assert.equal(descentTargetFloor(11), 11);
  assert.equal(descentTargetFloor(47), 47);
  assert.equal(descentTargetFloor(100), 91);
  assert.equal(descentStartingLevel(41), 21);
  assert.equal(descentLoanTier(41), 2);
});

test("creates deterministic three-lane hazards and rewards", () => {
  const first = createDescent(41, 12345);
  const second = createDescent(41, 12345);
  assert.deepEqual(first.events, second.events);
  assert.equal(first.events.length, 14);
  assert.equal(first.events.filter(event => event.kind === "crate").length, 3);
  assert.ok(first.events.every(event => [-1, 0, 1].includes(event.lane)));
  assert.deepEqual(descentSupplyAward({ ...first, integrity: 3, crates: 3 }), { potions: 2, bombs: 1, starHoney: 1 });
});

test("moves only within the three lanes and resolves passing obstacles once", () => {
  let state = createDescent(31, 9);
  state = moveDescentLane(state, -1);
  state = moveDescentLane(state, -1);
  assert.equal(state.lane, -1);
  state = moveDescentLane(state, 1);
  assert.equal(state.lane, 0);

  const event = state.events[0];
  state = { ...state, lane: event.lane };
  for (let tick = 0; tick < event.progress; tick++) state = advanceDescent(state);
  assert.equal(state.resolvedEventIds.filter(id => id === event.id).length, 1);
  if (event.kind === "crate") assert.equal(state.crates, 1);
  else assert.equal(state.integrity, 2);

  const after = advanceDescent(state);
  assert.equal(after.resolvedEventIds.filter(id => id === event.id).length, 1);
});

test("lands when at least one canopy integrity remains and fails at zero", () => {
  let landed = createDescent(21, 44);
  landed = { ...landed, progress: DESCENT_MAX_PROGRESS - 1, events: [], integrity: 1 };
  assert.equal(advanceDescent(landed).status, "landed");

  let failed = createDescent(21, 44);
  failed = { ...failed, events: [{ id: 99, progress: 1, lane: 0, kind: "rock" }], integrity: 1 };
  assert.equal(advanceDescent(failed).status, "failed");
});
