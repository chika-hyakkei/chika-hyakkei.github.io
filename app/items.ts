export type ItemCategory = "weapon" | "armor" | "accessory" | "consumable" | "relic";
export type EquipmentCategory = Extract<ItemCategory, "weapon" | "armor" | "accessory">;
export type PassiveKey = "vampire" | "critical" | "guardCounter" | "mpFlow" | "statusResist" | "lastStand";
export type ItemStats = { atk?: number; def?: number; hp?: number; mp?: number };
export type ItemRecord = {
  id: string;
  name: string;
  category: ItemCategory;
  tier: number;
  effect: string;
  stats?: ItemStats;
  passive?: PassiveKey;
  passiveValue?: number;
};

export const PASSIVE_LABELS: Record<PassiveKey, string> = {
  vampire: "吸血",
  critical: "会心",
  guardCounter: "防御反撃",
  mpFlow: "MP循環",
  statusResist: "状態耐性",
  lastStand: "瀕死強化",
};

const passiveDescription = (passive: PassiveKey, value: number) => ({
  vampire: `与えた傷の${value}%を回復`,
  critical: `会心率 +${value}%`,
  guardCounter: `防御成功時、攻撃力${value}%で反撃`,
  mpFlow: `攻撃命中時、${value}MP回復`,
  statusResist: `状態異常を${value}%で防ぐ`,
  lastStand: `HP35%以下で与える傷 +${value}%`,
})[passive];

const weaponFamilies = ["短剣", "剣", "斧", "槌", "杖", "槍"];
const armorFamilies = ["旅装", "革鎧", "鎖帷子", "胸当て", "法衣", "重鎧"];
const stages = ["粗末な", "鍛えた", "銀の", "黒鋼の", "奈落の"];
const weaponPassives: PassiveKey[] = ["critical", "lastStand", "vampire", "guardCounter", "mpFlow", "statusResist"];
const armorPassives: PassiveKey[] = ["mpFlow", "critical", "vampire", "guardCounter", "statusResist", "lastStand"];
const accessories = ["力の指輪", "守り石", "命の首飾り", "魔力の輪", "疾風の鈴", "王家の印", "深淵の瞳", "会心の牙", "反撃の鏡", "血潮の環", "浄化の護符", "麻痺避け", "星読みの環", "火鼠の尾", "氷晶の耳飾り", "雷鳴の印", "影縫いの針", "月白の冠", "竜守の環", "終焉の印"];
const consumables: Array<[string, string]> = [
  ["回復薬", "最大HPの45%（最低18HP）回復し、状態異常を解除"],
  ["万能薬", "すべての状態異常を解除"],
  ["爆裂石", "敵最大HPに応じた無属性の大ダメージ"],
  ["火炎瓶", "炎属性の大ダメージ"],
  ["氷結札", "氷属性の傷を与え、敵の行動を時々止める"],
  ["雷鳴玉", "雷属性の大ダメージ"],
  ["煙玉", "階層主以外の戦闘から必ず逃走"],
  ["解呪札", "呪いを解除し、HPを少し回復"],
  ["止血布", "出血を解除し、HPを少し回復"],
  ["星蜜", "MPを10回復"],
];
const relics: Array<[string, string]> = [
  ["血の杯", "討伐時にHPを4回復"],
  ["折れた王冠", "獲得金貨が15%増加"],
  ["深層羅針盤", "階移動時のHP回復が8%増加"],
  ["影の心臓", "最大HP +12"],
  ["月の破片", "最大MP +5"],
  ["竜骨の骰子", "会心率 +18%"],
  ["星喰いの種", "攻撃 +4"],
  ["冥河の石", "階移動時のMP回復 +2"],
  ["時止めの砂", "敵の攻撃を16%で止める"],
  ["百景の鍵", "100階の扉を開いた証"],
];

const accessoryRecord = (name: string, index: number): ItemRecord => {
  const id = `x${index + 1}`, tier = Math.floor(index / 4) + 1;
  const statRecords: ItemRecord[] = [
    { id, name, category: "accessory", tier, effect: `攻撃 +${3 + tier}`, stats: { atk: 3 + tier } },
    { id, name, category: "accessory", tier, effect: `守備 +${2 + tier}`, stats: { def: 2 + tier } },
    { id, name, category: "accessory", tier, effect: `最大HP +${8 + tier * 2}`, stats: { hp: 8 + tier * 2 } },
    { id, name, category: "accessory", tier, effect: `最大MP +${5 + tier}`, stats: { mp: 5 + tier } },
    { id, name, category: "accessory", tier, effect: `攻撃 +${2 + tier}・最大MP +${3 + tier}`, stats: { atk: 2 + tier, mp: 3 + tier } },
    { id, name, category: "accessory", tier, effect: `守備 +${1 + tier}・最大HP +${6 + tier * 2}`, stats: { def: 1 + tier, hp: 6 + tier * 2 } },
    { id, name, category: "accessory", tier, effect: `攻撃 +${2 + tier}・守備 +${1 + tier}`, stats: { atk: 2 + tier, def: 1 + tier } },
  ];
  if (index < statRecords.length) return statRecords[index];
  const passive = (["critical", "guardCounter", "vampire", "statusResist", "statusResist", "mpFlow", "vampire", "critical", "lastStand", "statusResist", "guardCounter", "lastStand", "lastStand"] as PassiveKey[])[index - 7];
  const value = passive === "vampire" ? 8 + tier * 2 : passive === "critical" ? 10 + tier * 2 : passive === "guardCounter" ? 30 + tier * 5 : passive === "mpFlow" ? 1 : passive === "statusResist" ? 18 + tier * 4 : 22 + tier * 4;
  return { id, name, category: "accessory", tier, effect: passiveDescription(passive, value), passive, passiveValue: value };
};

export const ITEM_CATALOG: ItemRecord[] = [
  ...weaponFamilies.flatMap((family, familyIndex) => stages.map((stage, stageIndex) => {
    const tier = stageIndex + 1, passive = weaponPassives[familyIndex], value = passive === "vampire" ? 4 + tier : passive === "critical" ? 4 + tier * 2 : passive === "guardCounter" ? 18 + tier * 3 : passive === "mpFlow" ? 1 : passive === "statusResist" ? 8 + tier * 3 : 12 + tier * 4;
    const stats = { atk: 2 + tier * 2 + Math.floor(familyIndex / 2) };
    return { id:`w${familyIndex+1}-${tier}`, name:`${stage}${family}`, category:"weapon" as const, tier, effect:`攻撃 +${stats.atk}・${passiveDescription(passive,value)}`, stats, passive, passiveValue:value };
  })),
  ...armorFamilies.flatMap((family, familyIndex) => stages.map((stage, stageIndex) => {
    const tier = stageIndex + 1, passive = armorPassives[familyIndex], value = passive === "vampire" ? 3 + tier : passive === "critical" ? 3 + tier * 2 : passive === "guardCounter" ? 16 + tier * 3 : passive === "mpFlow" ? 1 : passive === "statusResist" ? 10 + tier * 4 : 12 + tier * 4;
    const stats = { def: 1 + Math.ceil(tier * 1.6) + Math.floor(familyIndex / 3), hp: tier >= 4 ? 4 + tier * 2 : 0 };
    return { id:`a${familyIndex+1}-${tier}`, name:`${stage}${family}`, category:"armor" as const, tier, effect:`守備 +${stats.def}${stats.hp?`・最大HP +${stats.hp}`:""}・${passiveDescription(passive,value)}`, stats, passive, passiveValue:value };
  })),
  ...accessories.map(accessoryRecord),
  ...consumables.map(([name,effect],index)=>({ id:`c${index+1}`, name, category:"consumable" as const, tier:1, effect })),
  ...relics.map(([name,effect],index)=>({ id:`r${index+1}`, name, category:"relic" as const, tier:index+1, effect })),
];

export const itemById = (id: string) => ITEM_CATALOG.find(item => item.id === id);
export const equipmentItems = ITEM_CATALOG.filter((item): item is ItemRecord & { category: EquipmentCategory } => item.category === "weapon" || item.category === "armor" || item.category === "accessory");
