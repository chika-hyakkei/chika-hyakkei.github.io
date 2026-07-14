import assert from "node:assert/strict";
import test from "node:test";

const jobs = ["warrior","thief","priest","mage","knight","sage"];
const jobRisk = { warrior:-.0006, thief:.0002, priest:-.0004, mage:.0008, knight:-.0008, sage:.0008 };
function random(seed){const next=(seed*1664525+1013904223)>>>0;return[next/4294967296,next]}
function campaign(seed,job,forecast){let potions=1;for(let floor=1;floor<=100;floor++){let chest;[chest,seed]=random(seed);if(chest<.24)potions=Math.min(3,potions+1);if(floor%3===0&&potions<3)potions++;let danger;[danger,seed]=random(seed);const risk=(forecast?.0256:.0388)+jobRisk[job];if(danger<risk){if(potions&&danger>risk*.82)potions--;else return false;}}return true}
function rate(forecast){let wins=0,total=0;for(const job of jobs)for(let seed=1;seed<=1000;seed++){wins+=campaign(seed*7919,job,forecast)?1:0;total++;}return wins/total}

test("fixed-seed balance stays inside the target bands",()=>{
  const firstRun=rate(false),forecasted=rate(true);
  assert.ok(firstRun>=.03&&firstRun<=.05,`first-run rate ${(firstRun*100).toFixed(2)}%`);
  assert.ok(forecasted>=.10&&forecasted<=.15,`forecast rate ${(forecasted*100).toFixed(2)}%`);
});
