"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type JobKey = "warrior" | "thief" | "priest" | "mage" | "knight" | "sage";
type Phase = "explore" | "battle" | "shop" | "bossChoice";
type Point = { x: number; y: number };
type Tile = "#" | "." | ">" | "$" | "S";
type GearKind = "weapon" | "armor" | "accessory";
type Gear = { id: string; name: string; kind: GearKind; tier: number; price: number; atk?: number; def?: number; hp?: number; mp?: number };
type OwnedGear = Gear & { uid: number };
type DungeonEnemy = { id: number; x: number; y: number; kind: number; boss: boolean };
type BattleEnemy = DungeonEnemy & { name: string; hp: number; maxHp: number; atk: number; def: number; gold: number; exp: number };
type Run = {
  name: string; job: JobKey; phase: Phase; floor: number; level: number; exp: number; hp: number; mp: number;
  gold: number; totalGold: number; kills: number; bosses: number; seed: number; nextUid: number; map: Tile[][]; seen: boolean[][];
  player: Point; enemies: DungeonEnemy[]; opened: number[]; inventory: OwnedGear[]; equipment: Record<GearKind, OwnedGear | null>;
  potions: number; battle: BattleEnemy | null; guard: number; message: string;
};
type Meta = { bestFloor: number; bestScore: number; totalKills: number; unlocked: JobKey[]; jobBest: Partial<Record<JobKey, number>> };
type Result = { reason: "dead" | "return" | "abandon"; floor: number; score: number; kills: number; bosses: number; unlocked: JobKey[] };

const RUN_KEY = "chika-hyakkei-run-v1";
const META_KEY = "chika-hyakkei-meta-v1";
const W = 13, H = 11;
const defaultMeta: Meta = { bestFloor: 0, bestScore: 0, totalKills: 0, unlocked: ["warrior", "thief", "priest", "mage"], jobBest: {} };

const JOBS: Record<JobKey, { name: string; mark: string; desc: string; hp: number; mp: number; atk: number; def: number; skills: [string, string] }> = {
  warrior: { name: "戦士", mark: "剣", desc: "高い体力と一撃の重さ", hp: 30, mp: 7, atk: 7, def: 4, skills: ["強打", "防御"] },
  thief: { name: "盗賊", mark: "鍵", desc: "逃走と金策に優れる", hp: 23, mp: 10, atk: 6, def: 3, skills: ["連撃", "盗む"] },
  priest: { name: "僧侶", mark: "祈", desc: "回復しながら粘り強く戦う", hp: 25, mp: 16, atk: 4, def: 4, skills: ["治療", "守りの祈り"] },
  mage: { name: "魔法使い", mark: "炎", desc: "魔法で敵を一気に倒す", hp: 19, mp: 21, atk: 3, def: 2, skills: ["火球", "氷結"] },
  knight: { name: "騎士", mark: "盾", desc: "10階を越えた者の堅牢な職", hp: 33, mp: 11, atk: 6, def: 7, skills: ["盾打ち", "鉄壁"] },
  sage: { name: "賢者", mark: "星", desc: "20階を知る者の万能な職", hp: 25, mp: 24, atk: 5, def: 4, skills: ["大治療", "雷撃"] },
};

const WEAPONS = ["錆びた短剣","銅の剣","樫の杖","鉄の斧","銀の細剣","戦槌","火紋の杖","黒鋼の剣","月影の刃","竜骨の斧","星喰いの杖","奈落の大剣"];
const ARMORS = ["旅布の服","革の鎧","鎖かたびら","鉄の胸当て","銀糸の衣","石守の鎧","火鼠の外套","黒鋼の鎧","月白の法衣","竜鱗の鎧","星守の衣","奈落の鎧"];
const ACCESSORIES = ["木彫りの環","力の指輪","守り石","命の首飾り","魔力の輪","疾風の鈴","王家の印","深淵の瞳"];
const gear: Gear[] = [
  ...WEAPONS.map((name, i) => ({ id:`w${i+1}`, name, kind:"weapon" as GearKind, tier:i+1, price:18+(i+1)*15, atk:2+(i+1)*2 })),
  ...ARMORS.map((name, i) => ({ id:`a${i+1}`, name, kind:"armor" as GearKind, tier:i+1, price:16+(i+1)*14, def:1+Math.ceil((i+1)*1.6), hp:(i+1)%3===0?4+i:0 })),
  ...ACCESSORIES.map((name, i) => ({ id:`x${i+1}`, name, kind:"accessory" as GearKind, tier:i+1, price:25+(i+1)*20, atk:i%3===0?2+i:0, def:i%3===1?2+Math.floor(i/2):0, hp:i%3===2?8+i*2:0, mp:i%2===0?3+i:0 })),
];

const ENEMIES = ["洞ミミズ","苔スライム","骨ネズミ","夜コウモリ","穴ゴブリン","岩トカゲ","亡者の鎧","火喰い虫","影オオカミ","深層の目"];
const BOSSES = ["百足の坑王","石冠の巨人","深淵の古竜"];
const nextRandom = (seed: number) => { const n = (seed * 1664525 + 1013904223) >>> 0; return [n / 4294967296, n] as const; };
const key = (p: Point) => `${p.x},${p.y}`;

function generateFloor(floor: number, inputSeed: number) {
  let seed = inputSeed >>> 0; const rand = () => { const [r,n] = nextRandom(seed); seed=n; return r; };
  const map: Tile[][] = Array.from({length:H},()=>Array<Tile>(W).fill("#"));
  const visited = new Set<string>(); const stack: Point[] = [{x:1,y:1}]; map[1][1]="."; visited.add("1,1");
  while(stack.length){ const cur=stack[stack.length-1]; const dirs=[{x:2,y:0},{x:-2,y:0},{x:0,y:2},{x:0,y:-2}].sort(()=>rand()-.5); const options=dirs.map(d=>({x:cur.x+d.x,y:cur.y+d.y})).filter(p=>p.x>0&&p.x<W-1&&p.y>0&&p.y<H-1&&!visited.has(key(p))); if(!options.length){stack.pop();continue;} const n=options[0]; map[(cur.y+n.y)/2][(cur.x+n.x)/2]=".";map[n.y][n.x]=".";visited.add(key(n));stack.push(n); }
  for(let i=0;i<14;i++){ const x=1+Math.floor(rand()*(W-2)),y=1+Math.floor(rand()*(H-2)); if(map[y][x]==="#"&&((map[y][x-1]==="."&&map[y][x+1]===".")||(map[y-1][x]==="."&&map[y+1][x]==="."))) map[y][x]="."; }
  const stairs={x:W-2,y:H-2}; map[stairs.y][stairs.x]=">";
  const floors:Point[]=[]; for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(map[y][x]==="."&&!(x===1&&y===1))floors.push({x,y}); floors.sort(()=>rand()-.5);
  const chestCount=1+Math.floor(rand()*3); const opened:number[]=[]; for(let i=0;i<chestCount;i++){const p=floors.pop();if(p)map[p.y][p.x]="$";}
  if(floor%3===0){const p=floors.pop();if(p)map[p.y][p.x]="S";}
  const enemies:DungeonEnemy[]=[]; const count=3+Math.floor(rand()*3); for(let i=0;i<count;i++){const p=floors.pop();if(p)enemies.push({id:i+1,x:p.x,y:p.y,kind:Math.min(9,Math.floor((floor-1)/2)+Math.floor(rand()*3)),boss:false});}
  if(floor%10===0) enemies.push({id:99,x:stairs.x,y:stairs.y,kind:Math.floor(floor/10-1)%3,boss:true});
  const seen=Array.from({length:H},()=>Array(W).fill(false)); reveal(seen,{x:1,y:1});
  return {map,seen,player:{x:1,y:1},enemies,opened,seed};
}
function reveal(seen:boolean[][],p:Point){for(let y=Math.max(0,p.y-2);y<=Math.min(H-1,p.y+2);y++)for(let x=Math.max(0,p.x-2);x<=Math.min(W-1,p.x+2);x++)if(Math.abs(x-p.x)+Math.abs(y-p.y)<=3)seen[y][x]=true;}

function stats(run:Run){ const j=JOBS[run.job], eq=Object.values(run.equipment).filter(Boolean) as OwnedGear[]; return {maxHp:j.hp+(run.level-1)*5+eq.reduce((s,g)=>s+(g.hp||0),0),maxMp:j.mp+(run.level-1)*2+eq.reduce((s,g)=>s+(g.mp||0),0),atk:j.atk+(run.level-1)*2+eq.reduce((s,g)=>s+(g.atk||0),0),def:j.def+(run.level-1)+eq.reduce((s,g)=>s+(g.def||0),0)};}
function enemyFor(e:DungeonEnemy,floor:number):BattleEnemy{const scale=floor+(e.boss?8:0);const name=e.boss?BOSSES[e.kind%BOSSES.length]:ENEMIES[e.kind%ENEMIES.length];const hp=(e.boss?42:10)+scale*(e.boss?7:3);return{...e,name,hp,maxHp:hp,atk:3+Math.floor(scale*1.45),def:Math.floor(scale/4),gold:(e.boss?40:6)+scale*3,exp:(e.boss?25:7)+scale*3};}
function score(run:Run){return run.floor*1000+run.kills*100+run.totalGold*2+run.bosses*2500;}

export default function Home(){
  const [meta,setMeta]=useState<Meta>(defaultMeta); const [run,setRun]=useState<Run|null>(null); const [result,setResult]=useState<Result|null>(null);
  const [name,setName]=useState(""); const [job,setJob]=useState<JobKey>("warrior"); const [ready,setReady]=useState(false); const [muted,setMuted]=useState(false); const audio=useRef<AudioContext|null>(null);
  useEffect(()=>{try{const m=localStorage.getItem(META_KEY),r=localStorage.getItem(RUN_KEY);if(m)setMeta({...defaultMeta,...JSON.parse(m)});if(r)setRun(JSON.parse(r));}catch{}setReady(true);},[]);
  useEffect(()=>{if(ready)localStorage.setItem(META_KEY,JSON.stringify(meta));},[meta,ready]); useEffect(()=>{if(!ready)return;if(run)localStorage.setItem(RUN_KEY,JSON.stringify(run));else localStorage.removeItem(RUN_KEY);},[run,ready]);
  const beep=useCallback((f=440,d=.06)=>{if(muted)return;const C=window.AudioContext||(window as typeof window&{webkitAudioContext:typeof AudioContext}).webkitAudioContext;const c=audio.current??new C();audio.current=c;const o=c.createOscillator(),g=c.createGain();o.type="square";o.frequency.value=f;g.gain.value=.02;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+d);},[muted]);
  const s=run?stats(run):null;
  const start=()=>{const d=generateFloor(1,(Date.now()^Math.floor(Math.random()*999999))>>>0);const clean=name.trim().slice(0,8)||"ナナシ";const base=JOBS[job];setResult(null);setRun({name:clean,job,phase:"explore",floor:1,level:1,exp:0,hp:base.hp,mp:base.mp,gold:0,totalGold:0,kills:0,bosses:0,seed:d.seed,nextUid:1,map:d.map,seen:d.seen,player:d.player,enemies:d.enemies,opened:d.opened,inventory:[],equipment:{weapon:null,armor:null,accessory:null},potions:1,battle:null,guard:0,message:"地下百景、一階。帰る道はまだ近い。"});beep(520,.15);};
  const enterFloor=(old:Run,floor:number)=>{const d=generateFloor(floor,old.seed);const st=stats(old);return{...old,phase:"explore" as Phase,floor,seed:d.seed,map:d.map,seen:d.seen,player:d.player,enemies:d.enemies,opened:d.opened,battle:null,hp:Math.min(old.hp+Math.ceil(st.maxHp*.18),st.maxHp),mp:Math.min(old.mp+3,st.maxMp),message:`地下${floor}階。空気がさらに重くなった。`};};
  const finish=(reason:Result["reason"],current=run)=>{if(!current)return;const total=score(current);const unlocked=[...meta.unlocked];if(current.floor>=10&&!unlocked.includes("knight"))unlocked.push("knight");if(current.floor>=20&&!unlocked.includes("sage"))unlocked.push("sage");const newly=unlocked.filter(x=>!meta.unlocked.includes(x));setMeta({...meta,bestFloor:Math.max(meta.bestFloor,current.floor),bestScore:Math.max(meta.bestScore,total),totalKills:meta.totalKills+current.kills,unlocked,jobBest:{...meta.jobBest,[current.job]:Math.max(meta.jobBest[current.job]||0,current.floor)}});setResult({reason,floor:current.floor,score:total,kills:current.kills,bosses:current.bosses,unlocked:newly});setRun(null);beep(reason==="dead"?90:780,.3);};
  const openChest=(g:Run,x:number,y:number)=>{const id=y*W+x;if(g.opened.includes(id))return g;let [r,seed]=nextRandom(g.seed);const opened=[...g.opened,id];if(r<.38){const amount=8+g.floor*3+Math.floor(r*20);return{...g,seed,opened,gold:g.gold+amount,totalGold:g.totalGold+amount,message:`宝箱から ${amount} Gを手に入れた。`};}if(r<.62)return{...g,seed,opened,potions:g.potions+1,message:"宝箱から回復薬を手に入れた。"};if(g.inventory.length>=8)return{...g,seed,opened,gold:g.gold+12,totalGold:g.totalGold+12,message:"持ち物がいっぱいだ。装備を12Gに換えた。"};const tier=Math.min(12,Math.max(1,Math.ceil(g.floor/2)));const choices=gear.filter(i=>Math.abs(i.tier-tier)<=1);const item=choices[Math.floor(r*choices.length)%choices.length];return{...g,seed,opened,nextUid:g.nextUid+1,inventory:[...g.inventory,{...item,uid:g.nextUid}],message:`宝箱から「${item.name}」を手に入れた。`};};
  const beginBattle=(g:Run,e:DungeonEnemy)=>({...g,phase:"battle" as Phase,battle:enemyFor(e,g.floor),guard:0,message:`${e.boss?"階層主":"魔物"}「${enemyFor(e,g.floor).name}」が立ちはだかった！`});
  const move=(dx:number,dy:number)=>setRun(old=>{if(!old||old.phase!=="explore")return old;const target={x:old.player.x+dx,y:old.player.y+dy};if(target.x<0||target.y<0||target.x>=W||target.y>=H||old.map[target.y][target.x]==="#")return{...old,message:"岩壁に道を阻まれた。"};const hit=old.enemies.find(e=>e.x===target.x&&e.y===target.y);if(hit)return beginBattle(old,hit);let g={...old,player:target,seen:old.seen.map(a=>[...a])};reveal(g.seen,target);const tile=g.map[target.y][target.x];if(tile==="$"&&!g.opened.includes(target.y*W+target.x))g=openChest(g,target.x,target.y);if(tile==="S"){g.phase="shop";g.message="坑道商人がランタンを掲げた。";return g;}if(tile===">"){const bossAlive=g.enemies.some(e=>e.boss);if(bossAlive){g.message="階層主の気配が階段を封じている。";return g;}if(g.floor%10===0){g.phase="bossChoice";g.message="帰還の碑が淡く光っている。";return g;}return enterFloor(g,g.floor+1);}
    const occupied=new Set(g.enemies.map(e=>key(e)));const moved:DungeonEnemy[]=[];for(const e of g.enemies){if(e.boss){moved.push(e);continue;}occupied.delete(key(e));let ne={...e};const dist=Math.abs(e.x-target.x)+Math.abs(e.y-target.y);if(dist<=5){const opts:Point[]=[];const sx=Math.sign(target.x-e.x),sy=Math.sign(target.y-e.y);if(sx)opts.push({x:e.x+sx,y:e.y});if(sy)opts.push({x:e.x,y:e.y+sy});for(const p of opts)if(g.map[p.y]?.[p.x]!=="#"&&!occupied.has(key(p))){ne={...e,...p};break;}}if(ne.x===target.x&&ne.y===target.y)return beginBattle({...g,enemies:[...moved,ne,...g.enemies.slice(moved.length+1)]},ne);occupied.add(key(ne));moved.push(ne);}g.enemies=moved;return g;});
  const enemyRetaliates=(g:Run,b:BattleEnemy,message:string,skip=false)=>{if(skip)return{...g,battle:b,message:`${message} 敵は凍りついて動けない！`};const st=stats(g);const dmg=Math.max(1,Math.floor((b.atk-st.def)*(g.guard||1)) + Math.floor((g.seed%3)));const hp=g.hp-dmg;if(hp<=0){setTimeout(()=>finish("dead",{...g,hp:0,battle:b}),0);return{...g,hp:0,message:`${message} ${b.name}の反撃で倒れた……`};}return{...g,hp,battle:b,guard:0,message:`${message} ${b.name}の反撃、${dmg}の傷。`};};
  const win=(g:Run,b:BattleEnemy)=>{const exp=g.exp+b.exp;let level=g.level;let remain=exp;let hp=g.hp,mp=g.mp;while(remain>=level*12){remain-=level*12;level++;hp+=5;mp+=2;}const bosses=g.bosses+(b.boss?1:0);const next={...g,phase:(b.boss?"bossChoice":"explore") as Phase,battle:null,enemies:g.enemies.filter(e=>e.id!==b.id),gold:g.gold+b.gold,totalGold:g.totalGold+b.gold,kills:g.kills+1,bosses,level,exp:remain,hp,mp,message:`${b.name}を倒した！ ${b.gold}Gを得た。${level>g.level?` レベル${level}へ！`:""}`};return next;};
  const battleAction=(mode:"attack"|"skill1"|"skill2"|"potion"|"flee")=>setRun(g=>{if(!g||g.phase!=="battle"||!g.battle)return g;let b={...g.battle},next={...g},message="";const st=stats(g);let [r,seed]=nextRandom(g.seed);next.seed=seed;if(mode==="potion"){if(g.potions<=0)return{...g,message:"回復薬を持っていない。"};const heal=Math.min(18+g.level*2,st.maxHp-g.hp);next.potions--;next.hp+=heal;return enemyRetaliates(next,b,`回復薬でHPを${heal}回復した。`);}if(mode==="flee"){if(b.boss)return{...g,message:"階層主からは逃げられない！"};if(r<.65+(g.job==="thief"?.2:0))return{...g,phase:"explore",battle:null,message:"闇へ身を隠し、逃げ切った。"};return enemyRetaliates(next,b,"逃げ道を塞がれた！");}
    let damage=0,skip=false;if(mode==="attack"){damage=Math.max(1,st.atk-b.def+Math.floor(r*4));message=`${g.name}の攻撃。${damage}の傷を与えた。`;}else{const which=mode==="skill1"?0:1;const costs:Record<JobKey,[number,number]>={warrior:[3,2],thief:[3,3],priest:[4,3],mage:[4,5],knight:[3,3],sage:[5,6]};const cost=costs[g.job][which];if(g.mp<cost)return{...g,message:"MPが足りない。"};next.mp-=cost;if(g.job==="warrior"){if(which===0){damage=Math.max(1,Math.floor(st.atk*1.8)-b.def);message=`強打！ ${damage}の傷。`;}else{next.guard=.35;message="盾を構え、次の攻撃に備えた。";}}if(g.job==="thief"){if(which===0){damage=Math.max(2,Math.floor(st.atk*1.45)-b.def);message=`連撃！ ${damage}の傷。`;}else{const gain=4+g.floor;next.gold+=gain;next.totalGold+=gain;message=`${gain}Gを盗んだ。`;}}if(g.job==="priest"){if(which===0){const heal=Math.min(12+g.level*3,st.maxHp-g.hp);next.hp+=heal;message=`治療の祈り。HPが${heal}回復。`;}else{next.guard=.3;message="守りの祈りが身を包む。";}}if(g.job==="mage"){damage=which===0?10+g.level*4:7+g.level*3;skip=which===1&&r<.45;message=which===0?`火球が弾け、${damage}の傷！`:`氷結が走り、${damage}の傷！`; }if(g.job==="knight"){if(which===0){damage=Math.max(2,Math.floor(st.atk*1.4)-b.def);skip=r<.3;message=`盾打ち！ ${damage}の傷。`;}else{next.guard=.2;message="鉄壁の構えを取った。";}}if(g.job==="sage"){if(which===0){const heal=Math.min(20+g.level*4,st.maxHp-g.hp);next.hp+=heal;message=`大治療。HPが${heal}回復。`;}else{damage=14+g.level*5;message=`雷撃が落ち、${damage}の傷！`;}}}
    b.hp-=damage;if(b.hp<=0)return win(next,b);return enemyRetaliates(next,b,message,skip);});
  const offers=useMemo(()=>{if(!run)return[];const tier=Math.min(12,Math.max(1,Math.ceil(run.floor/2)));const picks:Gear[]=[];for(const kind of ["weapon","armor","accessory"] as GearKind[]){const list=gear.filter(g=>g.kind===kind&&Math.abs(g.tier-tier)<=1);picks.push(list[(run.floor+kind.length)%list.length]);}return picks;},[run?.floor]);
  const buy=(item:Gear|null)=>setRun(g=>{if(!g)return g;const price=item?item.price:12;if(g.gold<price)return{...g,message:"金貨が足りない。"};if(item&&g.inventory.length>=8)return{...g,message:"持ち物がいっぱいだ。"};if(!item)return{...g,gold:g.gold-price,potions:g.potions+1,message:"回復薬を買った。"};return{...g,gold:g.gold-price,nextUid:g.nextUid+1,inventory:[...g.inventory,{...item,uid:g.nextUid}],message:`${item.name}を買った。`};});
  const equip=(uid:number)=>setRun(g=>{if(!g)return g;const item=g.inventory.find(i=>i.uid===uid);if(!item)return g;const old=g.equipment[item.kind];return{...g,inventory:[...g.inventory.filter(i=>i.uid!==uid),...(old?[old]:[])],equipment:{...g.equipment,[item.kind]:item},message:`${item.name}を装備した。`};});
  const sell=(uid:number)=>setRun(g=>{if(!g||g.phase!=="shop")return g;const item=g.inventory.find(i=>i.uid===uid);if(!item)return g;const value=Math.floor(item.price/2);return{...g,inventory:g.inventory.filter(i=>i.uid!==uid),gold:g.gold+value,totalGold:g.totalGold+value,message:`${item.name}を${value}Gで売った。`};});
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(!run||run.phase!=="explore")return;const dirs:Record<string,[number,number]>={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};const d=dirs[e.key];if(d){e.preventDefault();move(...d);}};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);});
  if(!ready)return null;
  return <main className="shell">
    <header><div><span className="kicker">ENDLESS DUNGEON RPG</span><h1>地下百景</h1></div><div className="records"><span>最高 <b>{meta.bestFloor}F</b></span><span>最高得点 <b>{meta.bestScore.toLocaleString()}</b></span><button onClick={()=>setMuted(!muted)}>{muted?"音 OFF":"音 ON"}</button></div></header>
    {!run?<section className="start-panel">
      <div className="title-copy"><div className="shaft" aria-hidden="true"><i/><i/><i/><i/><i/></div><p>百の景色を越えても、底はない。<br/>倒れれば、すべてを失う。</p></div>
      {result&&<div className={`result ${result.reason}`}><span>{result.reason==="dead"?"YOU DIED":result.reason==="return"?"RETURNED":"ABANDONED"}</span><h2>地下 {result.floor} 階</h2><p>得点 {result.score.toLocaleString()} ／ 討伐 {result.kills} ／ 階層主 {result.bosses}</p>{result.unlocked.length>0&&<strong>新職業解放：{result.unlocked.map(x=>JOBS[x].name).join("・")}</strong>}</div>}
      <div className="setup"><label>探索者の名前<input value={name} maxLength={8} placeholder="ナナシ" onChange={e=>setName(e.target.value)}/></label><p className="choose-label">職業を選ぶ</p><div className="jobs">{(Object.keys(JOBS) as JobKey[]).map(k=>{const open=meta.unlocked.includes(k);return<button key={k} disabled={!open} className={job===k?"selected":""} onClick={()=>open&&setJob(k)}><b>{JOBS[k].mark}</b><span>{JOBS[k].name}</span><small>{open?JOBS[k].desc:(k==="knight"?"10階ボスで解放":"20階到達で解放")}</small></button>})}</div><button className="primary start" onClick={start}>地下へ降りる</button></div>
    </section>:<>
      <section className="game-layout"><div className="game-card"><div className="floor-head"><span>地下 <b>{run.floor}</b> 階</span><span>{JOBS[run.job].name}・{run.name}</span><span>得点 {score(run).toLocaleString()}</span></div>
        <div className={`map biome-${Math.floor((run.floor-1)/10)%4}`} role="grid" aria-label={`地下${run.floor}階の地図`}>
          {run.map.flatMap((row,y)=>row.map((tile,x)=>{
            const visible=run.seen[y][x];
            const enemy=run.enemies.find(e=>e.x===x&&e.y===y);
            const player=run.player.x===x&&run.player.y===y;
            const opened=run.opened.includes(y*W+x);
            const tileName=tile==="#"?"wall":tile===">"?"stairs":tile==="$"?"chest":tile==="S"?"shop":"floor";
            const omen=(x*7+y*11+run.floor*3)%29;
            return <div key={`${x}-${y}`} className={`tile t-${tileName} ${visible?"seen":"hidden"} omen-${omen%4}`} role="gridcell">
              {visible&&(player?<span className="pixel-player" aria-label="探索者"><i/><i/><i/><i/><i/></span>:enemy?<span className={`map-monster ${enemy.boss?"map-boss":""}`} aria-label={enemy.boss?"階層主":"魔物"}><i/><i/><i/></span>:tile===">"?<span className="stairs-mark">▼</span>:tile==="$"&&!opened?<span className="chest-mark">▰</span>:tile==="S"?<span className="merchant-mark">商</span>:tile==="."&&omen===0?<span className="bones" aria-hidden="true">†</span>:tile==="."&&omen===7?<span className="fungus" aria-hidden="true">♠</span>:"")}
            </div>;
          }))}
        </div>
        <div className="message"><i>◆</i><p>{run.message}</p></div>
        <div className="dpad"><button aria-label="上へ" onClick={()=>move(0,-1)}>▲</button><button aria-label="左へ" onClick={()=>move(-1,0)}>◀</button><button aria-label="下へ" onClick={()=>move(0,1)}>▼</button><button aria-label="右へ" onClick={()=>move(1,0)}>▶</button></div>
      </div><aside className="status"><h2>{JOBS[run.job].mark} {JOBS[run.job].name}</h2><div className="meters"><label>HP <b>{run.hp}/{s?.maxHp}</b><i><em style={{width:`${Math.max(0,run.hp/(s?.maxHp||1)*100)}%`}}/></i></label><label>MP <b>{run.mp}/{s?.maxMp}</b><i><em className="mp" style={{width:`${Math.max(0,run.mp/(s?.maxMp||1)*100)}%`}}/></i></label></div><div className="numbers"><span>LV <b>{run.level}</b></span><span>EXP <b>{run.exp}/{run.level*12}</b></span><span>攻撃 <b>{s?.atk}</b></span><span>守備 <b>{s?.def}</b></span><span>金貨 <b>{run.gold}G</b></span><span>薬 <b>{run.potions}</b></span></div><h3>装備</h3>{(["weapon","armor","accessory"] as GearKind[]).map(k=><p className="equip" key={k}><span>{k==="weapon"?"武器":k==="armor"?"防具":"装飾"}</span>{run.equipment[k]?.name||"なし"}</p>)}<h3>持ち物 {run.inventory.length}/8</h3><div className="bag">{run.inventory.length?run.inventory.map(i=><div key={i.uid}><span>{i.name}</span><button onClick={()=>equip(i.uid)}>装備</button>{run.phase==="shop"&&<button onClick={()=>sell(i.uid)}>売る</button>}</div>):<small>何も持っていない</small>}</div><button className="abandon" onClick={()=>finish("abandon")}>冒険を諦める</button></aside></section>
      {run.phase==="battle"&&run.battle&&<div className="overlay battle-overlay"><div className="modal battle"><div className="battle-depth">地下 {run.floor} 階</div><div className="stalactites" aria-hidden="true"/><span className="modal-kicker">ENCOUNTER</span><div className="battle-player-hud"><div className="portrait"><span className="pixel-player"><i/><i/><i/><i/><i/></span></div><div><strong>{run.name} <small>LV {run.level}・{JOBS[run.job].name}</small></strong><label><span>HP {run.hp} / {s?.maxHp}</span><i><em style={{width:`${Math.max(0,run.hp/(s?.maxHp||1)*100)}%`}}/></i></label><label><span>MP {run.mp} / {s?.maxMp}</span><i><em className="mp" style={{width:`${Math.max(0,run.mp/(s?.maxMp||1)*100)}%`}}/></i></label></div></div><div className={`monster kind-${run.battle.kind%3} ${run.battle.boss?"king":""}`}><i/><i/><i/><i/><b>{run.battle.boss?"王":"魔"}</b></div><h2>{run.battle.name}</h2><div className="enemy-label"><span>敵 HP</span><b>{run.battle.hp} / {run.battle.maxHp}</b></div><div className="enemy-hp"><i style={{width:`${run.battle.hp/run.battle.maxHp*100}%`}}/></div><div className="battle-actions"><button onClick={()=>battleAction("attack")}>たたかう</button><button onClick={()=>battleAction("skill1")}>{JOBS[run.job].skills[0]}</button><button onClick={()=>battleAction("skill2")}>{JOBS[run.job].skills[1]}</button><button onClick={()=>battleAction("potion")}>回復薬 ×{run.potions}</button><button onClick={()=>battleAction("flee")}>にげる</button></div></div></div>}
      {run.phase==="shop"&&<div className="overlay"><div className="modal shop"><span className="modal-kicker">SAFE ROOM</span><h2>坑道商人</h2><p>「金貨は命より軽い。使えるうちに使いな」</p><div className="wares">{offers.map(i=><button key={i.id} onClick={()=>buy(i)}><span>{i.name}<small>{i.kind==="weapon"?`攻撃 +${i.atk}`:i.kind==="armor"?`守備 +${i.def}`:"複数能力"}</small></span><b>{i.price}G</b></button>)}<button onClick={()=>buy(null)}><span>回復薬<small>HPを回復</small></span><b>12G</b></button></div><button className="primary" onClick={()=>setRun(g=>g?{...g,phase:"explore",message:"買い物を終え、暗闇へ戻った。"}:g)}>探索へ戻る</button></div></div>}
      {run.phase==="bossChoice"&&<div className="overlay"><div className="modal choice"><span className="modal-kicker">MILESTONE</span><h2>帰還の碑</h2><p>ここまでの記録を刻み、地上へ帰ることができる。<br/>その先にも、階段は続いている。</p><button className="primary" onClick={()=>finish("return")}>地上へ帰還する</button><button onClick={()=>setRun(g=>g?enterFloor(g,g.floor+1):g)}>さらに深く潜る</button></div></div>}
    </>}
    <footer>移動：矢印キー / WASD / 画面の十字キー　・　冒険中は自動保存</footer>
  </main>;
}
