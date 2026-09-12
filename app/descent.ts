/** Deterministic, frame-rate-independent rules for the checkpoint route. */
export type DescentEventKind = "rock" | "bat" | "crate";
export type DescentEvent = { id: number; progress: number; x: number; radius: number; kind: DescentEventKind };
export type DescentStatus = "ready" | "falling" | "landed" | "failed";
export type DescentState = {
  targetFloor: number; x: number; integrity: number; progress: number; crates: number;
  events: DescentEvent[]; resolvedEventIds: number[]; status: DescentStatus;
  invulnerableUntil: number; lastEvent: "hit" | "crate" | null; lastEventAt: number;
};
export type DescentInput = { axis?: number; targetX?: number };
export const DESCENT_MAX_PROGRESS = 20_000;
export const DESCENT_LOOKAHEAD_MS = 2800;
export const DESCENT_PLAYER_RADIUS = .065;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const nextRandom = (seed: number) => {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return [next / 4294967296, next] as const;
};
/** Checkpoints are post-boss floors, never a mid-sector or unearned boss floor. */
export const descentTargetFloor = (safeFloor: number) => {
  const floor = Math.floor(Number(safeFloor) || 1);
  return floor >= 11 ? clamp(Math.floor((floor - 1) / 10) * 10 + 1, 11, 91) : 1;
};
// Loan values are tested against the same stats/enemy rules as the main game.
export const descentStartingLevel = (floor: number) => clamp(Math.ceil(descentTargetFloor(floor) * 1.65), 1, 151);
export const descentLoanTier = (floor: number) => clamp(Math.ceil(descentTargetFloor(floor) / 20), 1, 5);

export function createDescent(targetFloor: number, inputSeed: number): DescentState {
  let seed = inputSeed >>> 0;
  const random = () => { const [r, next] = nextRandom(seed); seed = next; return r; };
  const events: DescentEvent[] = [];
  // Visible opening, then one readable obstacle at a time. Every obstacle leaves
  // a wide escape corridor. Supplies never overlap another hazard.
  for (let i = 0; i < 21; i++) {
    const crate = i % 4 === 3, ledge = i % 4 === 0;
    events.push({ id: i + 1, progress: 2000 + i * 820,
      x: ledge ? (i % 8 === 0 ? -.65 : .65) : Math.round((random() * 1.4 - .7) * 100) / 100,
      radius: crate ? .09 : ledge ? .42 : .13,
      kind: crate ? "crate" : ledge || random() < .55 ? "rock" : "bat" });
  }
  return { targetFloor: descentTargetFloor(targetFloor), x: 0, integrity: 3, progress: 0,
    crates: 0, events, resolvedEventIds: [], status: "ready", invulnerableUntil: 0,
    lastEvent: null, lastEventAt: -1000 };
}

export function advanceDescent(state: DescentState, input: DescentInput = {}, deltaMs = 1000 / 60): DescentState {
  if (state.status !== "falling" || !Number.isFinite(deltaMs) || deltaMs <= 0) return state;
  const progress = Math.min(DESCENT_MAX_PROGRESS, state.progress + deltaMs);
  const elapsed = progress - state.progress, axis = clamp(input.axis ?? 0, -1, 1);
  const target = Number.isFinite(input.targetX) ? clamp(input.targetX!, -.86, .86) : state.x;
  const distance = 2.4 * elapsed / 1000;
  const x = clamp(axis ? state.x + axis * distance : state.x + clamp(target - state.x, -distance, distance), -.86, .86);
  let integrity = state.integrity, crates = state.crates, invulnerableUntil = state.invulnerableUntil;
  let lastEvent = state.lastEvent, lastEventAt = state.lastEventAt;
  const resolvedEventIds = [...state.resolvedEventIds];
  for (const event of state.events) {
    if (event.progress <= state.progress || event.progress > progress || resolvedEventIds.includes(event.id)) continue;
    resolvedEventIds.push(event.id);
    // Horizontal movement reaches its target early if the pointer is close.
    const crossingDistance = 2.4 * (event.progress - state.progress) / 1000;
    const crossingX = clamp(axis ? state.x + axis * crossingDistance : state.x + clamp(target-state.x, -crossingDistance, crossingDistance), -.86, .86);
    if (Math.abs(crossingX - event.x) > event.radius + DESCENT_PLAYER_RADIUS) continue;
    if (event.kind === "crate") { crates++; lastEvent = "crate"; lastEventAt = event.progress; }
    else if (event.progress >= invulnerableUntil) {
      integrity--; invulnerableUntil = event.progress + 1100;
      lastEvent = "hit"; lastEventAt = event.progress;
      if (!integrity) return { ...state, x: crossingX, progress: event.progress, integrity: 0, crates,
        invulnerableUntil, lastEvent, lastEventAt, resolvedEventIds, status: "failed" };
    }
  }
  return { ...state, x, progress, integrity, crates, invulnerableUntil, lastEvent, lastEventAt,
    resolvedEventIds, status: progress >= DESCENT_MAX_PROGRESS ? "landed" : "falling" };
}

export const descentSupplyAward = (state: DescentState) => ({
  potions: state.integrity === 3 || state.crates >= 3 ? 3 : 2,
  bombs: state.crates >= 2 ? 2 : 1,
  starHoney: state.crates >= 4 ? 2 : 1,
});
