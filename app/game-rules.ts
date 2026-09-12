import { chestNotice } from "./game-feedback.ts";
import { BOSS_MONSTERS, BOSS_TACTICS, baseIndexForKind, encodedMonsterKind, monsterForBattle, monsterRecordFor } from "./monsters.ts";
import { ITEM_CATALOG, equipmentItems, itemById, type PassiveKey } from "./items.ts";
import { descentLoanTier } from "./descent.ts";
import { JOB_IDS } from "../shared/jobs.ts";
import type { JobKey, GearKind, Gear, OwnedGear, Run, Point, Tile, DungeonEnemy, BattleEnemy, EnemyIntent, StatusKind, Status, SupplyId, QuestProgress } from "./game-types.ts";
import type { QuestKey } from "./i18n.ts";
export const W=13,H=11;
export const SUPPLY_IDS:SupplyId[]=["c2","c4","c5","c6","c7","c8","c9","c10"];
export const SUPPLY_LIMIT=5;
export const nextRandom=(seed:number)=>{const next=(seed*1664525+1013904223)>>>0;return[next/4294967296,next] as const;};
const key=(p:Point)=>`${p.x},${p.y}`;
export const JOBS: Record<JobKey, { name: string; mark: string; desc: string; hp: number; mp: number; atk: number; def: number; skills: [string, string] }> = {
  warrior: { name: "戦士", mark: "剣", desc: "高い体力と一撃の重さ", hp: 30, mp: 7, atk: 7, def: 4, skills: ["強打", "鉄壁"] },
  thief: { name: "盗賊", mark: "鍵", desc: "逃走と金策に優れる", hp: 23, mp: 10, atk: 6, def: 3, skills: ["連撃", "盗む"] },
  priest: { name: "僧侶", mark: "祈", desc: "回復しながら粘り強く戦う", hp: 25, mp: 16, atk: 4, def: 4, skills: ["治療", "守りの祈り"] },
  mage: { name: "魔法使い", mark: "炎", desc: "魔法で敵を一気に倒す", hp: 19, mp: 21, atk: 3, def: 2, skills: ["火球", "氷結"] },
  knight: { name: "騎士", mark: "盾", desc: "10階を越えた者の堅牢な職", hp: 33, mp: 11, atk: 6, def: 7, skills: ["盾打ち", "鉄壁"] },
  sage: { name: "賢者", mark: "星", desc: "20階を知る者の万能な職", hp: 25, mp: 24, atk: 5, def: 4, skills: ["大治療", "雷撃"] },
  samurai: { name: "侍", mark: "刀", desc: "50階を越えた者の一撃必殺", hp: 28, mp: 12, atk: 9, def: 3, skills: ["居合斬り", "見切り"] },
  alchemist: { name: "錬金術師", mark: "錬", desc: "80階を越えた者の道具錬成", hp: 24, mp: 22, atk: 4, def: 3, skills: ["爆薬調合", "再生調合"] },
};
export const gear: Gear[] = equipmentItems.map((item,index)=>{
  const kind=item.category as GearKind, family=Math.floor(index/5), mark=kind==="weapon"?"⚔":kind==="armor"?"▣":"◉";
  return{id:item.id,name:`${mark} ${item.name}`,kind,tier:item.tier,price:(kind==="weapon"?18:kind==="armor"?16:25)+item.tier*(kind==="accessory"?18:kind==="weapon"?15:14)+family*4,...item.stats,passive:item.passive,passiveValue:item.passiveValue};
});
export const INTENTS: Record<EnemyIntent, { label: string; detail: string; multiplier: number }> = {
  attack: { label: "攻撃", detail: "通常攻撃。防御で軽減できる", multiplier: 1 },
  heavy: { label: "強攻撃", detail: "大ダメージ。防御推奨", multiplier: 1.65 },
  guard: { label: "身構える", detail: "敵は攻撃せず、こちらの攻撃を軽減する", multiplier: 0 },
  charge: { label: "力を溜める", detail: "今回は攻撃なし。次の行動に備えよう", multiplier: 0 },
  status: { label: "呪いの気配", detail: "状態異常を与えようとしている。防御で短くできる", multiplier: 0 },
};
export const statusName: Record<StatusKind,string>={poison:"毒",bleed:"出血",curse:"呪い",blind:"暗闇",paralysis:"麻痺"};
export const SKILL_COSTS: Record<JobKey,[number,number]>={warrior:[3,2],thief:[3,3],priest:[4,3],mage:[4,5],knight:[3,3],sage:[5,6],samurai:[4,3],alchemist:[5,6]};
export const statusFor=(b:BattleEnemy,floor:number):StatusKind=>(BOSS_TACTICS[floor]?.statusKind??monsterRecordFor(b.catalogId).statusKind??(["poison","bleed","curse","blind","paralysis"] as StatusKind[])[(b.kind+b.turn+floor)%5]) as StatusKind;
export const statusDamage=(statuses:Status[])=>statuses.reduce((total,s)=>total+(s.kind==="poison"?3:s.kind==="bleed"?4:0),0);
export const statusText=(statuses:Status[])=>statuses.length?` 現在：${statuses.map(s=>`${statusName[s.kind]} ${s.turns}T`).join("・")}。`:"";
export const supplyCount=(supplies:Run["supplies"])=>SUPPLY_IDS.reduce((total,id)=>total+(supplies[id]??0),0);
export const supplyName=(id:SupplyId)=>itemById(id)?.name??id;
export const supplyUnavailableReason=(run:Run,id:SupplyId)=>{if((run.supplies[id]??0)<=0)return"持っていない";if(id==="c2"&&!run.statuses.length)return"状態異常ではない";if(id==="c7"&&run.battle?.boss)return"階層主には効かない";if(id==="c8"&&!run.statuses.some(status=>status.kind==="curse"))return"呪われていない";if(id==="c9"&&!run.statuses.some(status=>status.kind==="bleed"))return"出血していない";if(id==="c10"&&run.mp>=stats(run).maxMp)return"MPは満タン";return"";};
export const passivePower=(run:Run,passive:PassiveKey)=>(Object.values(run.equipment).filter(Boolean) as OwnedGear[]).reduce((total,item)=>total+(item.passive===passive?(item.passiveValue??0):0),0);
export const questTarget=(quest:QuestKey)=>quest==="slay"?8:quest==="descend"?10:quest==="chests"?3:0;
export function stats(run:Run){ const j=JOBS[run.job], eq=Object.values(run.equipment).filter(Boolean) as OwnedGear[], relics=run.relics??[],test=run.testMode&&run.testPower?{hp:2000,mp:999,atk:999,def:500}:{hp:0,mp:0,atk:0,def:0}; return {maxHp:j.hp+(run.level-1)*5+eq.reduce((s,g)=>s+(g.hp||0),0)+(relics.includes("r4")?12:0)+test.hp,maxMp:j.mp+(run.level-1)*2+eq.reduce((s,g)=>s+(g.mp||0),0)+(relics.includes("r5")?5:0)+test.mp,atk:j.atk+(run.level-1)*2+eq.reduce((s,g)=>s+(g.atk||0),0)+(relics.includes("r7")?4:0)+test.atk,def:j.def+(run.level-1)+eq.reduce((s,g)=>s+(g.def||0),0)+test.def};}
export function enemyFor(e:DungeonEnemy,floor:number):BattleEnemy{const final=e.boss&&floor===100,scale=floor+(e.boss?9:baseIndexForKind(e.kind,floor)*.35),rank=Math.floor(floor/30),boost=(1+rank*.22)*(1+Math.max(0,floor-25)*.007)*(final?1.28:1),record=monsterForBattle(e.kind,floor),catalogId=record.id;const baseName=e.graveEater?"遺品喰らい":final?"百景の奈落王":e.boss?BOSS_MONSTERS[e.kind%BOSS_MONSTERS.length]:record.name,name=`${baseName}${rank&&!final&&!e.graveEater?`＋${rank}`:""}`;const hpScale=e.boss||e.graveEater?1:record.hpScale,atkScale=e.boss||e.graveEater?1:record.atkScale,hp=Math.floor(((e.graveEater?32:e.boss?55:13)+scale*(e.boss?8.5:3.7))*boost*hpScale),bossPattern=BOSS_TACTICS[floor]?.pattern;return{...e,name,catalogId,hp,maxHp:hp,atk:Math.floor(((e.graveEater?6:e.boss?7:4)+scale*(e.boss?2.15:1.45))*boost*atkScale),def:Math.floor(scale/(e.boss?2.5:3.2)*boost),gold:Math.floor(((e.boss?50:7)+scale*3.5)*boost),exp:Math.floor(((e.boss?32:8)+scale*3.4)*boost),intent:((e.boss&&bossPattern?.[0])||record.pattern[0]||intentFor(floor*7919+e.id,e.boss,0,floor)),turn:0,traitUsed:false};}
export function nextIntentFor(b:BattleEnemy,floor:number,turn:number):EnemyIntent{const record=monsterRecordFor(b.catalogId),boss=BOSS_TACTICS[floor],hpRate=b.hp/Math.max(1,b.maxHp);let pattern=(b.boss&&boss?.pattern)||record.pattern;if(b.boss&&boss&&hpRate<=.5)pattern=boss.phasePattern;else if(!b.boss&&record.trait==="frenzy"&&hpRate<=.25)pattern=["heavy","attack","heavy"];return(pattern[turn%pattern.length]??intentFor(floor*7919+b.id,b.boss,turn,floor)) as EnemyIntent;}
export function intentFor(seed:number,boss:boolean,turn:number,floor=1):EnemyIntent{const r=nextRandom((seed+turn*2654435761)>>>0)[0];if(floor>=11&&r>.9)return"status";if(boss&&r>.72)return"heavy";if(r<.5)return"attack";if(r<.7)return"heavy";if(r<.86)return"guard";return"charge";}
export function generateFloor(floor: number, inputSeed: number) {
  let seed = inputSeed >>> 0; const rand = () => { const [r,n] = nextRandom(seed); seed=n; return r; };
  const map: Tile[][] = Array.from({length:H},()=>Array<Tile>(W).fill("#"));
  const visited = new Set<string>(); const stack: Point[] = [{x:1,y:1}]; map[1][1]="."; visited.add("1,1");
  while(stack.length){ const cur=stack[stack.length-1]; const dirs=[{x:2,y:0},{x:-2,y:0},{x:0,y:2},{x:0,y:-2}].sort(()=>rand()-.5); const options=dirs.map(d=>({x:cur.x+d.x,y:cur.y+d.y})).filter(p=>p.x>0&&p.x<W-1&&p.y>0&&p.y<H-1&&!visited.has(key(p))); if(!options.length){stack.pop();continue;} const n=options[0]; map[(cur.y+n.y)/2][(cur.x+n.x)/2]=".";map[n.y][n.x]=".";visited.add(key(n));stack.push(n); }
  for(let i=0;i<14;i++){ const x=1+Math.floor(rand()*(W-2)),y=1+Math.floor(rand()*(H-2)); if(map[y][x]==="#"&&((map[y][x-1]==="."&&map[y][x+1]===".")||(map[y-1][x]==="."&&map[y+1][x]==="."))) map[y][x]="."; }
  const walkable:Point[]=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(map[y][x]===".")walkable.push({x,y});
  const player={...walkable[Math.floor(rand()*walkable.length)]};
  const maxDistance=Math.max(...walkable.map(p=>Math.abs(p.x-player.x)+Math.abs(p.y-player.y)));
  const farCells=walkable.filter(p=>Math.abs(p.x-player.x)+Math.abs(p.y-player.y)>=maxDistance-2);
  const stairs={...farCells[Math.floor(rand()*farCells.length)]}; map[stairs.y][stairs.x]=">";
  const floors:Point[]=[]; for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(map[y][x]==="."&&!(x===player.x&&y===player.y))floors.push({x,y}); floors.sort(()=>rand()-.5);
  const chestCount=1+Math.floor(rand()*3); const opened:number[]=[]; for(let i=0;i<chestCount;i++){const p=floors.pop();if(p)map[p.y][p.x]="$";}
  if(floor%3===0){const p=floors.pop();if(p)map[p.y][p.x]="S";}
  const enemies:DungeonEnemy[]=[]; const count=3+Math.floor(rand()*3); for(let i=0;i<count;i++){const p=floors.pop();if(p){let kind:number;if(floor<=20)kind=Math.min(9,Math.floor((floor-1)/2)+Math.floor(rand()*3));else{const [baseMin,baseMax]=floor<=40?[0,14]:floor<=60?[5,19]:floor<=80?[10,24]:[0,24],variantMin=floor<=40?0:floor<=60?1:floor<=80?2:0,variantMax=floor<=40?1:floor<=60?2:3;const base=baseMin+Math.floor(rand()*(baseMax-baseMin+1)),variant=variantMin+Math.floor(rand()*(variantMax-variantMin+1));kind=encodedMonsterKind(base*4+variant);}enemies.push({id:i+1,x:p.x,y:p.y,kind,boss:false});}}
  if(floor%10===0) enemies.push({id:99,x:stairs.x,y:stairs.y,kind:Math.floor(floor/10-1),boss:true});
  const seen=Array.from({length:H},()=>Array(W).fill(false)); reveal(seen,player);
  return {map,seen,player,enemies,opened,seed};
}
export function reveal(seen:boolean[][],p:Point){for(let y=Math.max(0,p.y-2);y<=Math.min(H-1,p.y+2);y++)for(let x=Math.max(0,p.x-2);x<=Math.min(W-1,p.x+2);x++)if(Math.abs(x-p.x)+Math.abs(y-p.y)<=3)seen[y][x]=true;}
const rollChest=(g:Run,x:number,y:number)=>{const id=y*W+x;if(g.opened.includes(id))return g;let [r,seed]=nextRandom(g.seed);const opened=[...g.opened,id];g={...g,chestsOpened:(g.chestsOpened??g.opened.length)+1,notice:undefined};let content:number;[content,seed]=nextRandom(seed);if(r<.28){const amount=8+g.floor*3+Math.floor(content*20);return{...g,seed,opened,gold:g.gold+amount,totalGold:g.totalGold+amount,message:`宝箱から ${amount} Gを手に入れた。`};}if(r<.50)return g.potions>=3?{...g,seed,opened,gold:g.gold+10,totalGold:g.totalGold+10,message:"回復薬は3個まで。代わりに10Gを得た。"}:{...g,seed,opened,potions:g.potions+1,message:"宝箱から回復薬を手に入れた。"};if(r<.61)return g.bombs>=2?{...g,seed,opened,gold:g.gold+16,totalGold:g.totalGold+16,message:"爆裂石は2個まで。代わりに16Gを得た。"}:{...g,seed,opened,bombs:g.bombs+1,message:"宝箱から爆裂石を手に入れた。戦闘で大ダメージを与える。"};if(r<.76){const supplyId=SUPPLY_IDS[Math.floor(content*SUPPLY_IDS.length)],name=supplyName(supplyId);if(supplyCount(g.supplies)>=SUPPLY_LIMIT)return{...g,seed,opened,gold:g.gold+14,totalGold:g.totalGold+14,message:`道具袋は${SUPPLY_LIMIT}個まで。「${name}」を14Gに換えた。`};return{...g,seed,opened,supplies:{...g.supplies,[supplyId]:(g.supplies[supplyId]??0)+1},message:`宝箱から道具「${name}」を手に入れた。`};}if(g.inventory.length>=8)return{...g,seed,opened,gold:g.gold+12,totalGold:g.totalGold+12,message:"持ち物がいっぱいだ。装備を12Gに換えた。"};const tier=Math.min(5,Math.max(1,Math.ceil(g.floor/20))),choices=gear.filter(i=>Math.abs(i.tier-tier)<=1),item=choices[Math.floor(content*choices.length)]??gear[0];return{...g,seed,opened,nextUid:g.nextUid+1,inventory:[...g.inventory,{...item,uid:g.nextUid}],message:`宝箱から「${item.name}」を手に入れた。`};};

export function openChest(g:Run,x:number,y:number):Run {const next=rollChest(g,x,y);return next===g?g:{...next,notice:chestNotice(g,next)};}
export const questProgressFor=(run:Pick<Run,"quest"|"kills"|"floor"|"opened"> & Partial<Pick<Run,"chestsOpened">>):QuestProgress=>{
  const target=questTarget(run.quest),raw=run.quest==="slay"?run.kills:run.quest==="descend"?run.floor:run.quest==="chests"?(run.chestsOpened??run.opened.length):target;
  return {value:Math.min(raw,target),target,complete:target===0||raw>=target};
};
export const relicOffers=(run:Pick<Run,"relics"|"seed"|"floor">)=>{
  const pool=ITEM_CATALOG.filter(item=>item.category==="relic"&&item.id!=="r10"&&!run.relics.includes(item.id));
  let seed=(run.seed+run.floor*13)>>>0;
  for(let i=pool.length-1;i>0;i--){const [r,next]=nextRandom(seed);seed=next;const j=Math.floor(r*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,3);
};
export const forgeGear=(item:Gear,forge:number):Gear=>{
  const boost=1+forge*.25;
  return {...item,id:item.id+"-f"+forge,price:Math.ceil(item.price*(1+forge*.35)),
    atk:item.atk?Math.ceil(item.atk*boost):item.atk,def:item.def?Math.ceil(item.def*boost):item.def,
    hp:item.hp?Math.ceil(item.hp*boost):item.hp,mp:item.mp?Math.ceil(item.mp*boost):item.mp};
};
export const descentLoanedEquipment=(job:JobKey,targetFloor:number):Record<GearKind,OwnedGear>=>{
  const tier=descentLoanTier(targetFloor),offset=JOB_IDS.indexOf(job),forge=Math.floor(targetFloor/20);
  return Object.fromEntries((["weapon","armor","accessory"] as GearKind[]).map((kind,index)=>{
    const choices=gear.filter(item=>item.kind===kind&&item.tier===tier),item=choices[(offset+index*3)%choices.length]??gear.find(item=>item.kind===kind)!;
    return [kind,{...forgeGear(item,forge),uid:index+1,loaned:true}];
  })) as Record<GearKind,OwnedGear>;
};
