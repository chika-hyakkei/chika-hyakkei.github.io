const jobs = ["warrior", "thief", "priest", "mage", "knight", "sage"];
const risk = { warrior: -.0006, thief: .0002, priest: -.0004, mage: .0008, knight: -.0008, sage: .0008 };
const checkpoints = [10, 30, 50, 70, 90, 100];

function random(seed) { const next = (seed * 1664525 + 1013904223) >>> 0; return [next / 4294967296, next]; }
function simulate(seed, job, forecast, report) {
  let hp = 100, mp = 12, potions = 1;
  for (let floor = 1; floor <= 100; floor++) {
    let roll; [roll, seed] = random(seed);
    if (roll < .24) potions = Math.min(3, potions + 1);
    if (floor % 3 === 0 && potions < 3) potions++;
    hp = Math.min(100, hp + 18); mp = Math.min(12, mp + 3);
    let danger; [danger, seed] = random(seed);
    const threshold = (forecast ? .0256 : .0388) + risk[job];
    if (danger < threshold) {
      if (potions && danger > threshold * .82) { potions--; hp = Math.min(100, hp + 45); }
      else { report.deaths[floor] = (report.deaths[floor] ?? 0) + 1; return; }
    }
    hp = Math.max(1, hp - Math.floor(danger * 17)); mp = Math.max(0, mp - 1);
    if (checkpoints.includes(floor)) { const row = report.points[floor]; row.reached++; row.hp += hp; row.mp += mp; row.potions += potions; }
  }
}

function run(forecast) {
  const report = { points: Object.fromEntries(checkpoints.map(f => [f, { reached: 0, hp: 0, mp: 0, potions: 0 }])), deaths: {} };
  for (const job of jobs) for (let seed = 1; seed <= 10000; seed++) simulate(seed * 7919, job, forecast, report);
  return report;
}

for (const [label, forecast] of [["初見相当", false], ["予告活用", true]]) {
  const report = run(forecast); console.log(`\n${label}（全職業 × 10,000シード）`);
  for (const floor of checkpoints) { const p = report.points[floor]; const total = 60000; console.log(`${String(floor).padStart(3)}F 到達 ${(p.reached / total * 100).toFixed(2)}% / 平均HP ${p.reached ? (p.hp / p.reached).toFixed(1) : "-"} / MP ${p.reached ? (p.mp / p.reached).toFixed(1) : "-"} / 薬 ${p.reached ? (p.potions / p.reached).toFixed(2) : "-"}`); }
}
