import { itemById } from "./items.ts";
import { localizedItem } from "./content-localization.ts";
import { translate } from "./i18n.ts";
import type { Run, GameNotice } from "./game-types.ts";
const itemName=(id?:string)=>{const item=id?itemById(id.split("-f")[0]):undefined;return item?localizedItem("en",item).name:"equipment";};
const intentNames={attack:"Attack",heavy:"Heavy Attack",guard:"Guard",charge:"Charge",status:"Ailment"};
export function englishGameNotice(run:Run):string|null {
  const notice=run.notice;if(!notice)return null;
  if(notice.type==="message")return notice.en;
  if(notice.type==="chest")return notice.converted?"Inventory limit reached. "+itemName(notice.itemId)+" was converted to "+notice.amount+" G.":notice.category==="gold"?"Found "+notice.amount+" G in the chest.":"Found "+itemName(notice.itemId)+" in the chest.";
  const names:Record<string,string>={attack:"Attack",guard:"Guard",potion:"Potion",bomb:"Blast Stone",flee:"Escape",enemy:"Enemy turn"};
  const command=notice.command==="skill1"||notice.command==="skill2"?translate("en",("job."+run.job+"."+notice.command) as Parameters<typeof translate>[1]):notice.command.startsWith("c")?itemName(notice.command):names[notice.command]??notice.command;
  return [command+".",notice.enemyDamage?"Dealt "+notice.enemyDamage+" damage.":"",notice.playerDamage?"Took "+notice.playerDamage+" damage.":"",
    notice.healing?"Recovered "+notice.healing+" HP.":"",notice.enemyHealing?"Enemy recovered "+notice.enemyHealing+" HP.":"",
    notice.mpChange?"MP "+(notice.mpChange>0?"+":"")+notice.mpChange+".":"",
    notice.enemyIntent?"Enemy action: "+intentNames[notice.enemyIntent]+".":"",
    notice.victory?"Enemy defeated!":"",notice.dead?"You fell.":"",
    notice.status.length?"Ailments: "+notice.status.join(", ")+".":"",
    run.battle?"Next: "+intentNames[run.battle.intent]+".":""].filter(Boolean).join(" ");
}
export function chestNotice(before:Run,after:Run):GameNotice|undefined {
  if(before===after)return before.notice;
  const gear=after.inventory.find(item=>!before.inventory.some(old=>old.uid===item.uid));
  if(gear)return {type:"chest",category:"gear",itemId:gear.id};
  if(after.potions>before.potions)return {type:"chest",category:"consumable",itemId:"c1"};
  if(after.bombs>before.bombs)return {type:"chest",category:"consumable",itemId:"c3"};
  for(const id of Object.keys(after.supplies) as (keyof Run["supplies"])[])if((after.supplies[id]??0)>(before.supplies[id]??0))return {type:"chest",category:"consumable",itemId:id};
  return {type:"chest",category:"gold",amount:after.gold-before.gold};
}
