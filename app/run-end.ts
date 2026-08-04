export type RunEndReason = "dead" | "return" | "abandon" | "clear";

export type RunEndSource<Job extends string> = {
  name: string;
  job: Job;
  floor: number;
  kills: number;
  bosses: number;
  testMode: boolean;
  /** 奈落降下から始めたRunは通常ランキングへ送らない。旧Runはnormalとして扱う。 */
  route?: "normal" | "descent";
};

export type RunEndResult<Job extends string> = RunEndSource<Job> & {
  reason: RunEndReason;
  score: number;
  unlocked: Job[];
};

export function finalizeRunViewState<Job extends string>(reason: RunEndReason, current: RunEndSource<Job>, score: number, unlocked: Job[]) {
  const route = current.route ?? "normal";
  return {
    run: null,
    result: { reason, floor: current.floor, score, kills: current.kills, bosses: current.bosses, unlocked, name: current.name, job: current.job, testMode: current.testMode, route } satisfies RunEndResult<Job>,
    shouldSubmitRanking: !current.testMode && route === "normal",
  };
}
