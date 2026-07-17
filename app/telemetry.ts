export type TestRunResult = "dead" | "return" | "abandon" | "clear";
export type TestRun = { endedAt: string; job: string; floor: number; result: TestRunResult; kills: number; bosses: number; cause?: "enemy" | "status" };
export type TestTelemetry = {
  version: 1; installId: string; firstSeen: string; lastSeen: string; activeDays: string[]; sessions: number;
  runs: number; maxFloor: number; floorReached: Record<string, number>; jobs: Record<string, { runs: number; bestFloor: number }>; outcomes: Record<TestRunResult, number>; recentRuns: TestRun[];
};

export const TELEMETRY_KEY = "chika-hyakkei-test-record-v1";
const day = (date = new Date()) => date.toISOString().slice(0, 10);
const id = () => `t-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-5)}`;
export const emptyTelemetry = (): TestTelemetry => ({ version: 1, installId: id(), firstSeen: day(), lastSeen: day(), activeDays: [], sessions: 0, runs: 0, maxFloor: 0, floorReached: {}, jobs: {}, outcomes: { dead: 0, return: 0, abandon: 0, clear: 0 }, recentRuns: [] });
export const normalizeTelemetry = (value: Partial<TestTelemetry> | null | undefined): TestTelemetry => ({ ...emptyTelemetry(), ...value, version: 1, installId: value?.installId || id(), activeDays: Array.isArray(value?.activeDays) ? value.activeDays.slice(-90) : [], floorReached: value?.floorReached ?? {}, jobs: value?.jobs ?? {}, outcomes: { dead: 0, return: 0, abandon: 0, clear: 0, ...(value?.outcomes ?? {}) }, recentRuns: Array.isArray(value?.recentRuns) ? value.recentRuns.slice(-30) : [] });
export const touchTelemetry = (value: TestTelemetry, date = new Date()): TestTelemetry => { const today = day(date), days = value.activeDays.includes(today) ? value.activeDays : [...value.activeDays, today].slice(-90); return { ...value, lastSeen: today, activeDays: days, sessions: value.sessions + 1 }; };
export const recordRunStart = (value: TestTelemetry, job: string): TestTelemetry => ({ ...value, runs: value.runs + 1, floorReached: { ...value.floorReached, "1": (value.floorReached["1"] ?? 0) + 1 }, jobs: { ...value.jobs, [job]: { runs: (value.jobs[job]?.runs ?? 0) + 1, bestFloor: value.jobs[job]?.bestFloor ?? 0 } } });
export const recordFloor = (value: TestTelemetry, job: string, floor: number): TestTelemetry => ({ ...value, maxFloor: Math.max(value.maxFloor, floor), floorReached: { ...value.floorReached, [String(floor)]: (value.floorReached[String(floor)] ?? 0) + 1 }, jobs: { ...value.jobs, [job]: { runs: value.jobs[job]?.runs ?? 0, bestFloor: Math.max(value.jobs[job]?.bestFloor ?? 0, floor) } } });
export const recordRunEnd = (value: TestTelemetry, run: Omit<TestRun, "endedAt">): TestTelemetry => ({ ...recordFloor(value, run.job, run.floor), outcomes: { ...value.outcomes, [run.result]: (value.outcomes[run.result] ?? 0) + 1 }, recentRuns: [...value.recentRuns, { ...run, endedAt: new Date().toISOString() }].slice(-30) });
export const telemetryExport = (value: TestTelemetry) => JSON.stringify({ kind: "地下百景テスト記録", version: value.version, installId: value.installId, firstSeen: value.firstSeen, lastSeen: value.lastSeen, activeDays: value.activeDays, sessions: value.sessions, runs: value.runs, maxFloor: value.maxFloor, floorReached: value.floorReached, jobs: value.jobs, outcomes: value.outcomes, recentRuns: value.recentRuns }, null, 2);
