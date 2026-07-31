export const JOBS = ["warrior", "thief", "priest", "mage", "knight", "sage", "samurai", "alchemist"];
export const BUILDS = ["offense", "guard", "sustain"];
export const STRATEGIES = ["novice", "forecast"];
export const CHECKPOINTS = [10, 30, 50, 70, 90, 100];

const JOB_MODEL = {
  warrior: { hp: 112, mp: 10, risk: -.0006, mpUse: .76 },
  thief: { hp: 98, mp: 13, risk: .0002, mpUse: .82 },
  priest: { hp: 102, mp: 19, risk: -.0004, mpUse: .62 },
  mage: { hp: 88, mp: 24, risk: .0008, mpUse: 1.12 },
  knight: { hp: 118, mp: 14, risk: -.0008, mpUse: .70 },
  sage: { hp: 100, mp: 27, risk: .0008, mpUse: .96 },
  samurai: { hp: 108, mp: 15, risk: .0004, mpUse: .85 },
  alchemist: { hp: 98, mp: 30, risk: -.0005, mpUse: .90 },
};

const BUILD_MODEL = {
  offense: { risk: .00025, damage: 1.05, mp: 1.08, minutes: -.06 },
  guard: { risk: -.00045, damage: .82, mp: .78, minutes: .08 },
  sustain: { risk: -.0002, damage: .90, mp: .88, minutes: .03 },
};

const STRATEGY_MODEL = {
  novice: { risk: .0397, rescueBand: .82, damage: 1, mp: 1, minutes: .57 },
  forecast: { risk: .0264, rescueBand: .80, damage: .72, mp: .86, minutes: .64 },
};

export function seededRandom(seed) {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return [next / 4294967296, next];
}

const emptyPoint = () => ({
  reached: 0,
  hpRatio: 0,
  mpRatio: 0,
  potions: 0,
  supplies: 0,
  bombs: 0,
  minutes: 0,
});

export function simulateRun(inputSeed, job, strategy, build) {
  const jobModel = JOB_MODEL[job];
  const buildModel = BUILD_MODEL[build];
  const strategyModel = STRATEGY_MODEL[strategy];
  let seed = inputSeed >>> 0;
  let maxHp = jobModel.hp;
  let maxMp = jobModel.mp;
  let hp = maxHp;
  let mp = maxMp;
  let potions = 1;
  let supplies = 0;
  let bombs = 0;
  let gold = 0;
  let minutes = 0;
  const points = {};
  const rand = () => {
    let value;
    [value, seed] = seededRandom(seed);
    return value;
  };

  for (let floor = 1; floor <= 100; floor++) {
    if (floor > 1) {
      hp = Math.min(maxHp, hp + Math.ceil(maxHp * .18));
      mp = Math.min(maxMp, mp + 3);
    }
    if (floor % 8 === 0) {
      maxHp += 5;
      maxMp += 2;
      hp += 5;
      mp += 2;
    }

    // 1階につき代表宝箱1個として、実ゲームの抽選帯をそのまま使う。
    const chest = rand();
    if (chest < .28) gold += 8 + floor * 3;
    else if (chest < .50) potions = Math.min(3, potions + 1);
    else if (chest < .61) bombs = Math.min(2, bombs + 1);
    else if (chest < .76) supplies = Math.min(5, supplies + 1);

    gold += 4 + Math.ceil(floor * .8);
    if (floor % 3 === 0 && potions < 2) {
      const price = 12 + Math.floor((floor - 1) / 20) * 9;
      if (gold >= price) {
        gold -= price;
        potions++;
      }
    }

    const damageRoll = .07 + rand() * .12;
    const depthDamage = 1 + floor / 260;
    hp -= Math.ceil(maxHp * damageRoll * depthDamage * strategyModel.damage * buildModel.damage);
    const mpCost = rand() < (strategy === "forecast" ? .68 : .48)
      ? Math.ceil(jobModel.mpUse * strategyModel.mp * buildModel.mp)
      : 0;
    mp = Math.max(0, mp - mpCost);
    minutes += strategyModel.minutes + buildModel.minutes + rand() * .16 + (floor % 10 === 0 ? 1.1 : 0);

    if (hp <= maxHp * .28 && potions > 0) {
      potions--;
      hp = Math.min(maxHp, hp + Math.max(18, Math.ceil(maxHp * .45)));
    }
    if (mp <= maxMp * .18 && supplies > 0 && strategy === "forecast") {
      supplies--;
      mp = Math.min(maxMp, mp + 10);
    }

    const depthRisk = (floor - 50) * .000004;
    const threshold = strategyModel.risk + jobModel.risk + buildModel.risk + depthRisk;
    const danger = rand();
    if (danger < threshold) {
      const severity = danger / threshold;
      let rescued = false;
      if (severity >= strategyModel.rescueBand && potions > 0) {
        potions--;
        hp = Math.min(maxHp, hp + Math.max(18, Math.ceil(maxHp * .45)));
        rescued = true;
      } else if (strategy === "forecast" && severity >= strategyModel.rescueBand - .045 && supplies > 0) {
        supplies--;
        rescued = true;
      } else if (severity >= strategyModel.rescueBand - .025 && bombs > 0) {
        bombs--;
        rescued = true;
      }
      if (!rescued) {
        const causeRoll = rand();
        const cause = causeRoll < .35
          ? "burst"
          : causeRoll < .61
            ? "attrition"
            : causeRoll < .82
              ? "status"
              : "mp_exhaustion";
        return { cleared: false, floor, cause, hp: 0, mp, potions, supplies, bombs, minutes, points };
      }
    }

    if (hp <= 0) {
      return { cleared: false, floor, cause: "attrition", hp: 0, mp, potions, supplies, bombs, minutes, points };
    }
    if (CHECKPOINTS.includes(floor)) {
      points[floor] = {
        reached: 1,
        hpRatio: hp / maxHp,
        mpRatio: mp / maxMp,
        potions,
        supplies,
        bombs,
        minutes,
      };
    }
  }

  return { cleared: true, floor: 100, cause: "clear", hp, mp, potions, supplies, bombs, minutes, points };
}

export function runBalanceSimulation({ seedsPerCohort = 1000 } = {}) {
  const cohorts = [];
  const totals = Object.fromEntries(STRATEGIES.map(strategy => [strategy, {
    runs: 0,
    clears: 0,
    deaths: { burst: 0, attrition: 0, status: 0, mp_exhaustion: 0 },
    points: Object.fromEntries(CHECKPOINTS.map(floor => [floor, emptyPoint()])),
  }]));

  for (const strategy of STRATEGIES) {
    for (const job of JOBS) {
      for (const build of BUILDS) {
        const cohort = { strategy, job, build, runs: seedsPerCohort, clears: 0, maxFloorTotal: 0 };
        for (let index = 1; index <= seedsPerCohort; index++) {
          const seed = (index * 7919 + JOBS.indexOf(job) * 104729 + BUILDS.indexOf(build) * 15485863) >>> 0;
          const result = simulateRun(seed, job, strategy, build);
          const total = totals[strategy];
          total.runs++;
          total.clears += Number(result.cleared);
          cohort.clears += Number(result.cleared);
          cohort.maxFloorTotal += result.floor;
          if (!result.cleared) total.deaths[result.cause]++;
          for (const floor of CHECKPOINTS) {
            const source = result.points[floor];
            if (!source) continue;
            const point = total.points[floor];
            for (const key of Object.keys(point)) point[key] += source[key];
          }
        }
        cohorts.push(cohort);
      }
    }
  }
  return { seedsPerCohort, totalRuns: cohorts.length * seedsPerCohort, cohorts, totals };
}

export function summarizeBalance(report) {
  return Object.fromEntries(STRATEGIES.map(strategy => {
    const total = report.totals[strategy];
    const points = Object.fromEntries(CHECKPOINTS.map(floor => {
      const point = total.points[floor];
      const reached = point.reached || 1;
      return [floor, {
        reachedRate: point.reached / total.runs,
        hpRate: point.hpRatio / reached,
        mpRate: point.mpRatio / reached,
        potions: point.potions / reached,
        supplies: point.supplies / reached,
        bombs: point.bombs / reached,
        minutes: point.minutes / reached,
      }];
    }));
    return [strategy, {
      runs: total.runs,
      clearRate: total.clears / total.runs,
      deaths: total.deaths,
      points,
    }];
  }));
}
