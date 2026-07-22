export type RunEndReason = "dead" | "return" | "abandon" | "clear";

export type RunEndSource<Job extends string> = {
  name: string;
  job: Job;
  floor: number;
  kills: number;
  bosses: number;
  testMode: boolean;
};

export type RunEndResult<Job extends string> = RunEndSource<Job> & {
  reason: RunEndReason;
  score: number;
  unlocked: Job[];
};

export function finalizeRunViewState<Job extends string>(reason: RunEndReason, current: RunEndSource<Job>, score: number, unlocked: Job[]) {
  return {
    run: null,
    result: { reason, floor: current.floor, score, kills: current.kills, bosses: current.bosses, unlocked, name: current.name, job: current.job, testMode: current.testMode } satisfies RunEndResult<Job>,
    shouldSubmitRanking: !current.testMode,
  };
}
