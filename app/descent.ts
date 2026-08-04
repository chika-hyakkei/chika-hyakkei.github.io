/**
 * 奈落降下は本編セーブを触らない短い再到達ルート。
 * 進行中の降下は一時的な画面状態だけで、着地するまではRunを作らない。
 */

export type DescentLane = -1 | 0 | 1;
export type DescentEventKind = "rock" | "bat" | "flame" | "crate";
export type DescentEvent = { id: number; progress: number; lane: DescentLane; kind: DescentEventKind };
export type DescentStatus = "falling" | "landed" | "failed";

export type DescentState = {
  targetFloor: number;
  lane: DescentLane;
  integrity: number;
  progress: number;
  crates: number;
  events: DescentEvent[];
  resolvedEventIds: number[];
  status: DescentStatus;
};

export const DESCENT_MAX_PROGRESS = 120;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const nextRandom = (seed: number) => {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return [next / 4294967296, next] as const;
};
const laneFor = (value: number): DescentLane => value < 1 / 3 ? -1 : value < 2 / 3 ? 0 : 1;

/** A checkpoint is always just after a defeated boss; 1 means the route is still locked. */
export const descentTargetFloor = (safeFloor: number) => {
  const floor = Math.floor(Number(safeFloor) || 1);
  return floor >= 11 ? clamp(floor, 11, 91) : 1;
};

export const descentStartingLevel = (targetFloor: number) => clamp(Math.ceil(descentTargetFloor(targetFloor) * .5), 1, 45);
export const descentLoanTier = (targetFloor: number) => clamp(Math.floor((descentTargetFloor(targetFloor) - 1) / 20), 1, 4);

export function createDescent(targetFloor: number, inputSeed: number): DescentState {
  const safeTarget = descentTargetFloor(targetFloor);
  let seed = inputSeed >>> 0;
  const random = () => {
    const [value, next] = nextRandom(seed);
    seed = next;
    return value;
  };
  const slots = [8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112];
  const hazards: DescentEventKind[] = ["rock", "bat", "flame"];
  const events = slots.map((progress, index) => {
    const crate = index === 3 || index === 7 || index === 11;
    return {
      id: index + 1,
      progress,
      lane: laneFor(random()),
      kind: crate ? "crate" : hazards[Math.floor(random() * hazards.length)] ?? "rock",
    } satisfies DescentEvent;
  });
  return { targetFloor: safeTarget, lane: 0, integrity: 3, progress: 0, crates: 0, events, resolvedEventIds: [], status: "falling" };
}

export function moveDescentLane(state: DescentState, direction: -1 | 1): DescentState {
  if (state.status !== "falling") return state;
  return { ...state, lane: clamp(state.lane + direction, -1, 1) as DescentLane };
}

export function advanceDescent(state: DescentState): DescentState {
  if (state.status !== "falling") return state;
  const progress = Math.min(DESCENT_MAX_PROGRESS, state.progress + 1);
  const arriving = state.events.filter(event => event.progress === progress && !state.resolvedEventIds.includes(event.id));
  const hit = arriving.some(event => event.kind !== "crate" && event.lane === state.lane);
  const crates = state.crates + arriving.filter(event => event.kind === "crate" && event.lane === state.lane).length;
  const integrity = Math.max(0, state.integrity - (hit ? 1 : 0));
  const resolvedEventIds = [...state.resolvedEventIds, ...arriving.map(event => event.id)];
  const status: DescentStatus = integrity === 0 ? "failed" : progress >= DESCENT_MAX_PROGRESS ? "landed" : "falling";
  return { ...state, progress, integrity, crates, resolvedEventIds, status };
}

export const descentSupplyAward = (state: DescentState) => ({
  potions: state.integrity === 3 ? 2 : 1,
  bombs: state.crates >= 2 ? 1 : 0,
  starHoney: state.crates >= 3 ? 1 : 0,
});
