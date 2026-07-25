import { CHECKPOINTS, runBalanceSimulation, summarizeBalance } from "./balance-simulator.mjs";

const report = runBalanceSimulation({ seedsPerCohort: 1000 });
const summary = summarizeBalance(report);
console.log(`地下百景 第5段階固定シード計測（合計 ${report.totalRuns.toLocaleString("ja-JP")}走）`);

for (const [strategy, label] of [["novice", "初見相当"], ["forecast", "予告活用"]]) {
  const row = summary[strategy];
  console.log(`\n${label}: ${row.runs.toLocaleString("ja-JP")}走 / 100階踏破 ${(row.clearRate * 100).toFixed(2)}%`);
  for (const floor of CHECKPOINTS) {
    const point = row.points[floor];
    console.log(
      `${String(floor).padStart(3)}F 到達 ${(point.reachedRate * 100).toFixed(2)}%` +
      ` / HP ${(point.hpRate * 100).toFixed(1)}% / MP ${(point.mpRate * 100).toFixed(1)}%` +
      ` / 薬 ${point.potions.toFixed(2)} / 道具 ${point.supplies.toFixed(2)}` +
      ` / ${point.minutes.toFixed(1)}分`,
    );
  }
  console.log(`死因 ${Object.entries(row.deaths).map(([cause, count]) => `${cause}:${count}`).join(" / ")}`);
}

console.log("\n職業・ビルド別");
for (const cohort of report.cohorts) {
  console.log(
    `${cohort.strategy.padEnd(8)} ${cohort.job.padEnd(7)} ${cohort.build.padEnd(7)}` +
    ` 踏破 ${(cohort.clears / cohort.runs * 100).toFixed(1)}% / 平均到達 ${(cohort.maxFloorTotal / cohort.runs).toFixed(1)}F`,
  );
}
