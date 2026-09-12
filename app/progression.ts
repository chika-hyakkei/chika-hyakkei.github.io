import type { Run, Meta, Result, OwnedGear, JobKey } from "./game-types.ts";
export const lostGear=(run:Run)=>[...run.inventory,...Object.values(run.equipment).filter((item):item is OwnedGear=>Boolean(item))].filter(item=>!item.loaned);
export function updateMetaAfterRun(meta:Meta,run:Run,reason:Result["reason"],score:number):Meta {
  const unlocked=[...meta.unlocked];
  for(const [floor,job] of [[10,"knight"],[20,"sage"],[50,"samurai"],[80,"alchemist"]] as [number,JobKey][])if(run.floor>=floor&&!unlocked.includes(job))unlocked.push(job);
  // Preserve the existing explicit permission to unlock jobs from a test, only.
  if(run.testMode)return {...meta,unlocked};
  const mastery={...meta.mastery,[run.job]:(meta.mastery[run.job]??0)+Math.max(1,Math.ceil(run.floor/10))},value=mastery[run.job]??0;
  const title=value>=30?"百景を越えた者":value>=15?"深層の常連":value>=5?"坑道の熟練者":"駆け出し探索者",lost=lostGear(run);
  return {...meta,bestFloor:Math.max(meta.bestFloor,run.floor),bestScore:Math.max(meta.bestScore,score),totalKills:meta.totalKills+run.kills,
    cleared:meta.cleared||reason==="clear",unlocked,mastery,titles:[...new Set([...meta.titles,title])],
    grave:reason==="dead"?(lost.length?{floor:run.floor,items:lost}:null):meta.grave,
    jobBest:{...meta.jobBest,[run.job]:Math.max(meta.jobBest[run.job]??0,run.floor)}};
}
export function recoverGraveItem(run:Run,uid:number):Run {
  const item=run.recovery.find(item=>item.uid===uid);
  if(!item||run.phase!=="recoveryChoice"||run.inventory.length>=8)return run;
  return {...run,phase:"explore",recovery:[],nextUid:run.nextUid+1,inventory:[...run.inventory,{...item,uid:run.nextUid}],message:"遺品「"+item.name+"」を回収した。",notice:undefined};
}
