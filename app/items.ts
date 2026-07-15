export type ItemCategory = "weapon" | "armor" | "accessory" | "consumable" | "relic";
export type ItemRecord = { id: string; name: string; category: ItemCategory; tier: number; effect: string };

const weaponFamilies = ["短剣", "剣", "斧", "槌", "杖", "槍"];
const armorFamilies = ["旅装", "革鎧", "鎖帷子", "胸当て", "法衣", "重鎧"];
const stages = ["粗末な", "鍛えた", "銀の", "黒鋼の", "奈落の"];
const accessories = ["力の指輪", "守り石", "命の首飾り", "魔力の輪", "疾風の鈴", "王家の印", "深淵の瞳", "会心の牙", "反撃の鏡", "血潮の環", "浄化の護符", "麻痺避け", "星読みの環", "火鼠の尾", "氷晶の耳飾り", "雷鳴の印", "影縫いの針", "月白の冠", "竜守の環", "終焉の印"];
const consumables = ["回復薬", "万能薬", "爆裂石", "火炎瓶", "氷結札", "雷鳴玉", "煙玉", "解呪札", "止血布", "星蜜"];
const relics = ["血の杯", "折れた王冠", "深層羅針盤", "影の心臓", "月の破片", "竜骨の骰子", "星喰いの種", "冥河の石", "時止めの砂", "百景の鍵"];

export const ITEM_CATALOG: ItemRecord[] = [
  ...weaponFamilies.flatMap((family, familyIndex) => stages.map((stage, stageIndex) => ({ id:`w${familyIndex+1}-${stageIndex+1}`, name:`${stage}${family}`, category:"weapon" as const, tier:stageIndex+1, effect:`攻撃 +${2+stageIndex*3}` }))),
  ...armorFamilies.flatMap((family, familyIndex) => stages.map((stage, stageIndex) => ({ id:`a${familyIndex+1}-${stageIndex+1}`, name:`${stage}${family}`, category:"armor" as const, tier:stageIndex+1, effect:`守備 +${1+stageIndex*2}` }))),
  ...accessories.map((name,index)=>({ id:`x${index+1}`, name, category:"accessory" as const, tier:Math.floor(index/4)+1, effect:index<10?"能力上昇":"特殊効果" })),
  ...consumables.map((name,index)=>({ id:`c${index+1}`, name, category:"consumable" as const, tier:1, effect:index===0?"HP回復":"戦闘補助" })),
  ...relics.map((name,index)=>({ id:`r${index+1}`, name, category:"relic" as const, tier:index+1, effect:"冒険中のみ有効な加護" })),
];
