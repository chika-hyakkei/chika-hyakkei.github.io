import { isJobKey } from "../shared/jobs.ts";
import { itemById } from "./items.ts";
import { monsterForBattle } from "./monsters.ts";
import { normalizeQuestKey } from "./i18n.ts";
import { descentTargetFloor } from "./descent.ts";
import type { Run, Meta, OwnedGear, BattleEnemy, DungeonEnemy, Status, SupplyId, GameNotice } from "./game-types.ts";
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const integer=(v:unknown,min=0,max=Number.MAX_SAFE_INTEGER):v is number=>typeof v==="number"&&Number.isSafeInteger(v)&&v>=min&&v<=max;
const optional=(v:unknown,fallback:number,min=0,max=Number.MAX_SAFE_INTEGER)=>v===undefined?fallback:integer(v,min,max)?v:null;
const strings=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(x=>typeof x==="string");
const point=(v:unknown)=>object(v)&&integer(v.x,0,12)&&integer(v.y,0,10);
const numberMap=(v:unknown)=>v===undefined?{}:object(v)&&Object.values(v).every(x=>integer(x))?v as Record<string,number>:null;
const kinds=["weapon","armor","accessory"] as const;
const intents=["attack","heavy","guard","charge","status"];
const statusKinds=["poison","bleed","curse","blind","paralysis"];
export const defaultMeta:Meta={version:2,bestFloor:0,bestScore:0,totalKills:0,cleared:false,unlocked:["warrior","thief","priest","mage"],jobBest:{},mastery:{},titles:[],grave:null,bestiary:{},itemDiscovery:{},deepestSafeFloor:1};
export function normalizeOwnedGear(value:unknown):OwnedGear|null {
  if(!object(value)||typeof value.id!=="string"||typeof value.name!=="string"||!kinds.includes(value.kind as typeof kinds[number])||!integer(value.uid)||!integer(value.tier,1)||!integer(value.price))return null;
  for(const key of ["atk","def","hp","mp","passiveValue"])if(value[key]!==undefined&&!integer(value[key]))return null;
  if(value.passive!==undefined&&!["vampire","critical","guardCounter","mpFlow","statusResist","lastStand"].includes(String(value.passive)))return null;
  const item=value as OwnedGear,master=itemById(item.id.split("-f")[0]);
  return {...item,passive:item.passive??master?.passive,passiveValue:item.passiveValue??master?.passiveValue};
}
function gearArray(value:unknown):OwnedGear[]|null {
  if(!Array.isArray(value))return null;
  const result=value.map(normalizeOwnedGear);
  return result.every((v):v is OwnedGear=>v!==null)?result:null;
}
function enemy(value:unknown):value is DungeonEnemy & Record<string,unknown> {
  return object(value)&&point(value)&&integer(value.id)&&integer(value.kind)&&typeof value.boss==="boolean";
}
function battle(value:unknown,floor:number):BattleEnemy|null {
  if(!enemy(value)||!object(value)||typeof value.name!=="string")return null;
  for(const key of ["hp","maxHp","atk","def","gold","exp"])if(!integer(value[key],key==="maxHp"?1:0))return null;
  if(Number(value.hp)>Number(value.maxHp)||value.intent!==undefined&&!intents.includes(String(value.intent))||value.turn!==undefined&&!integer(value.turn))return null;
  if(value.catalogId!==undefined&&typeof value.catalogId!=="string")return null;
  return {...value,catalogId:value.catalogId??monsterForBattle(value.kind,floor).id,intent:value.intent??"attack",turn:value.turn??0,traitUsed:value.traitUsed??false} as BattleEnemy;
}
export function normalizeMeta(value:unknown):Meta|null {
  if(!object(value))return null;
  const bestFloor=optional(value.bestFloor,0,0,100),bestScore=optional(value.bestScore,0),totalKills=optional(value.totalKills,0);
  const jobBest=numberMap(value.jobBest),mastery=numberMap(value.mastery),bestiary=numberMap(value.bestiary),itemDiscovery=numberMap(value.itemDiscovery);
  if(bestFloor===null||bestScore===null||totalKills===null||!jobBest||!mastery||!bestiary||!itemDiscovery)return null;
  if(value.cleared!==undefined&&typeof value.cleared!=="boolean"||value.titles!==undefined&&!strings(value.titles))return null;
  if(value.unlocked!==undefined&&(!Array.isArray(value.unlocked)||!value.unlocked.every(isJobKey)))return null;
  let grave:Meta["grave"]=null;
  if(value.grave!==null&&value.grave!==undefined){
    if(!object(value.grave)||!integer(value.grave.floor,1,100))return null;
    const items=gearArray(value.grave.items);if(!items)return null;
    grave=items.length?{floor:value.grave.floor,items}:null;
  }
  const legacySafe=descentTargetFloor(Math.floor((Math.max(0,bestFloor)-1)/10)*10+1);
  const safe=optional(value.deepestSafeFloor,legacySafe,1,100);if(safe===null)return null;
  return {...defaultMeta,...value,version:2,bestFloor,bestScore,totalKills,cleared:value.cleared===true,
    unlocked:value.unlocked as Meta["unlocked"]??defaultMeta.unlocked,jobBest,mastery,
    titles:value.titles as string[]??[],grave,bestiary,itemDiscovery,deepestSafeFloor:descentTargetFloor(safe)};
}
function normalizeNotice(value:unknown):GameNotice|undefined {
  if(!object(value))return undefined;
  if(value.type==="message")return typeof value.en==="string"?value as GameNotice:undefined;
  if(value.type==="chest")return typeof value.category==="string"&&(value.itemId===undefined||typeof value.itemId==="string")&&(value.amount===undefined||integer(value.amount))?value as GameNotice:undefined;
  if(value.type!=="combat"||typeof value.command!=="string"||!Array.isArray(value.status)||!value.status.every(s=>statusKinds.includes(s))||typeof value.victory!=="boolean"||typeof value.dead!=="boolean")return undefined;
  if(!["playerDamage","enemyDamage","healing","enemyHealing"].every(key=>integer(value[key]))||!Number.isSafeInteger(value.mpChange)||value.enemyIntent!==undefined&&!intents.includes(String(value.enemyIntent)))return undefined;
  return value as GameNotice;
}
export function normalizeRun(value:unknown):Run|null {
  if(!object(value)||typeof value.name!=="string"||!isJobKey(value.job)||!["explore","battle","shop","bossChoice","relicChoice","recoveryChoice","ending"].includes(String(value.phase)))return null;
  for(const key of ["floor","level","exp","hp","mp","gold","totalGold","kills","bosses","seed","nextUid","potions"])
    if(!integer(value[key],key==="floor"||key==="level"?1:0,key==="floor"?100:Number.MAX_SAFE_INTEGER))return null;
  if(!Array.isArray(value.map)||value.map.length!==11||!value.map.every(row=>Array.isArray(row)&&row.length===13&&row.every(tile=>["#",".",">","$","S"].includes(tile))))return null;
  if(!Array.isArray(value.seen)||value.seen.length!==11||!value.seen.every(row=>Array.isArray(row)&&row.length===13&&row.every(cell=>typeof cell==="boolean")))return null;
  if(!point(value.player)||!object(value.player)||value.map[Number(value.player.y)][Number(value.player.x)]==="#")return null;
  if(!Array.isArray(value.enemies)||!value.enemies.every(enemy)||!Array.isArray(value.opened)||!value.opened.every(id=>integer(id,0,142))||!object(value.equipment))return null;
  const inventory=gearArray(value.inventory??[]),recovery=gearArray(value.recovery??[]);if(!inventory||!recovery)return null;
  const equipment:Run["equipment"]={weapon:null,armor:null,accessory:null};
  for(const kind of kinds){const raw=value.equipment[kind];if(raw!==null&&raw!==undefined){const item=normalizeOwnedGear(raw);if(!item||item.kind!==kind)return null;equipment[kind]=item;}}
  const b=value.battle?battle(value.battle,Number(value.floor)):null;if(value.battle&&!b||value.phase==="battle"&&!b||value.phase!=="battle"&&b)return null;
  let pendingEnemyTurn:Run["pendingEnemyTurn"]=null;
  if(value.pendingEnemyTurn){const raw=value.pendingEnemyTurn;if(!object(raw)||!b||typeof raw.message!=="string"||typeof raw.skip!=="boolean")return null;const pending=battle(raw.battle,Number(value.floor));if(!pending||pending.id!==b.id)return null;pendingEnemyTurn={battle:pending,message:raw.message,skip:raw.skip};}
  const statuses=value.statuses??[];
  if(!Array.isArray(statuses)||!statuses.every(s=>object(s)&&statusKinds.includes(String(s.kind))&&integer(s.turns,1)))return null;
  const supplies:Run["supplies"]={};
  if(value.supplies!==undefined&&!object(value.supplies))return null;
  for(const id of ["c2","c4","c5","c6","c7","c8","c9","c10"] as SupplyId[]){const n=optional((value.supplies as Record<string,unknown>|undefined)?.[id],0);if(n===null)return null;if(n)supplies[id]=n;}
  if(value.relics!==undefined&&!strings(value.relics)||value.message!==undefined&&typeof value.message!=="string")return null;
  if(value.guard!==undefined&&(typeof value.guard!=="number"||!Number.isFinite(value.guard)||value.guard<0||value.guard>1))return null;
  for(const key of ["testMode","testPower","shopPotionAvailable"])if(value[key]!==undefined&&typeof value[key]!=="boolean")return null;
  const bombs=optional(value.bombs,0),combo=optional(value.combo,0),chestsOpened=optional(value.chestsOpened,value.opened.length);
  if(bombs===null||combo===null||chestsOpened===null)return null;
  const runId=typeof value.runId==="string"&&value.runId?value.runId:"legacy-"+value.seed+"-"+value.nextUid;
  return {...value,notice:normalizeNotice(value.notice),runId,chestsOpened:Math.max(chestsOpened,value.opened.length),inventory,recovery,equipment,battle:b,pendingEnemyTurn,
    bombs,combo,supplies,relics:value.relics??[],testMode:value.testMode===true,testPower:value.testPower??value.testMode??false,
    route:value.route==="descent"?"descent":"normal",quest:normalizeQuestKey(value.quest),
    shopPotionAvailable:value.shopPotionAvailable!==false,statuses:statuses as Status[],guard:value.guard??0,message:value.message??"",
    // A legacy recovery screen without a grave must remain escapable.
    phase:value.phase==="recoveryChoice"&&!recovery.length?"explore":value.phase} as Run;
}
