import { generateFloor, stats, JOBS, descentLoanedEquipment } from "./game-rules.ts";
import { descentStartingLevel, descentTargetFloor } from "./descent.ts";
import type { Run, JobKey, Meta } from "./game-types.ts";
import type { QuestKey } from "./i18n.ts";
export function createRun(job:JobKey,floor:number,seed:number,name="ナナシ",runId="run-"+seed):Run{
  const dungeon=generateFloor(floor,seed),base=JOBS[job];
  return {runId,chestsOpened:0,name,job,phase:"explore",floor,level:1,exp:0,hp:base.hp,mp:base.mp,gold:0,totalGold:0,kills:0,bosses:0,nextUid:1,
    ...dungeon,inventory:[],equipment:{weapon:null,armor:null,accessory:null},potions:1,bombs:0,supplies:{},combo:0,relics:[],testMode:false,testPower:false,route:"normal",quest:"slay",recovery:[],shopPotionAvailable:true,battle:null,pendingEnemyTurn:null,guard:0,statuses:[],message:""};
}
export function createCheckpointRun(options:{job:JobKey;floor:number;seed:number;name:string;runId:string;quest:QuestKey;award:{potions:number;bombs:number;starHoney:number};grave?:Meta["grave"]}):Run {
  const floor=descentTargetFloor(options.floor),base=createRun(options.job,floor,options.seed,options.name,options.runId);
  const run:Run={...base,route:"descent",quest:options.quest,level:descentStartingLevel(floor),equipment:descentLoanedEquipment(options.job,floor),nextUid:4,
    potions:options.award.potions,bombs:options.award.bombs,supplies:options.award.starHoney?{c10:options.award.starHoney}:{},
    message:"奈落降下を突破。地下"+floor+"階に着地した。貸与装備で先へ進め。",
    notice:{type:"message",en:"Landed on Floor "+floor+". Your loaned gear and supplies are ready."}};
  if(options.grave?.floor===floor&&run.enemies[0])run.enemies=[{...run.enemies[0],id:777,graveEater:true},...run.enemies.slice(1)];
  const st=stats(run);return {...run,hp:st.maxHp,mp:st.maxMp};
}
