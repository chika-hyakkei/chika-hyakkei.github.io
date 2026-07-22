export type MonsterVariant = "通常" | "凶暴" | "呪染" | "深淵";
export type MonsterIntent = "attack" | "heavy" | "guard" | "charge" | "status";
export type DamageKind = "physical" | "fire" | "ice" | "lightning" | "holy" | "blast";
export type MonsterTrait = "none" | "coil" | "split" | "multiHit" | "drain" | "steal" | "shell" | "curseCounter" | "fireAbsorb" | "frenzy" | "blind";
export type MonsterRecord = {
  id: string; name: string; base: string; variant: MonsterVariant; floor: string; weakness: string; resistance: string;
  action: string; trait: MonsterTrait; telegraph: string; hint: string; pattern: MonsterIntent[]; statusKind?: "poison" | "bleed" | "curse" | "blind" | "paralysis";
  hpScale: number; atkScale: number; boss?: boolean;
};

type BaseMonster = { base:string; weakness:string; action:string; resistance?:string };
const bases: BaseMonster[] = [
  {base:"洞ミミズ",weakness:"雷",resistance:"氷",action:"締めつけ"},{base:"苔スライム",weakness:"炎",resistance:"雷",action:"分裂"},{base:"骨ネズミ",weakness:"聖",resistance:"斬撃",action:"連続噛みつき"},{base:"夜コウモリ",weakness:"炎",resistance:"氷",action:"吸血"},{base:"穴ゴブリン",weakness:"氷",resistance:"なし",action:"金貨盗み"},
  {base:"岩トカゲ",weakness:"雷",resistance:"斬撃",action:"甲殻防御"},{base:"亡者の鎧",weakness:"雷",resistance:"斬撃",action:"呪いの剣"},{base:"火喰い虫",weakness:"氷",resistance:"炎",action:"火炎吸収"},{base:"影オオカミ",weakness:"炎",resistance:"なし",action:"瀕死連撃"},{base:"深層の目",weakness:"聖",resistance:"雷",action:"暗闇"},
  {base:"泥王子",weakness:"炎",action:"泥弾"},{base:"硝子蜘蛛",weakness:"打撃",action:"毒糸"},{base:"空洞兵",weakness:"雷",action:"盾構え"},{base:"灯火鬼",weakness:"氷",action:"火柱"},{base:"鉱脈蛇",weakness:"雷",action:"締めつけ"},
  {base:"月喰い蛾",weakness:"炎",action:"眠り粉"},{base:"墓守犬",weakness:"聖",action:"出血"},{base:"黒潮魚",weakness:"雷",action:"水刃"},{base:"裂け兎",weakness:"炎",action:"三連撃"},{base:"鉄殻亀",weakness:"雷",action:"反撃"},
  {base:"奈落蜂",weakness:"炎",action:"麻痺針"},{base:"鏡面騎士",weakness:"打撃",action:"反射"},{base:"星屑蛙",weakness:"氷",action:"回復"},{base:"虚ろ司祭",weakness:"聖",action:"呪詛"},{base:"深淵の手",weakness:"炎",action:"握り潰し"},
];

type Tactic = Pick<MonsterRecord,"trait"|"telegraph"|"hint"|"pattern"|"statusKind"|"hpScale"|"atkScale">;
const earlyTactics: Record<string,Tactic> = {
  "洞ミミズ":{trait:"coil",telegraph:"身体を巻いた後に締めつける",hint:"力を溜めた次の強攻撃を防御する。",pattern:["attack","charge","heavy"],hpScale:.96,atkScale:.96},
  "苔スライム":{trait:"split",telegraph:"半分まで傷つくと一度だけ分裂",hint:"HP半分付近から大技で一気に倒す。",pattern:["attack","guard","attack"],hpScale:.76,atkScale:.92},
  "骨ネズミ":{trait:"multiHit",telegraph:"小さな傷を二度重ねる",hint:"防御より短期決戦。聖なる攻撃に弱い。",pattern:["attack","attack","heavy"],hpScale:.86,atkScale:.86},
  "夜コウモリ":{trait:"drain",telegraph:"与えた傷の一部を吸収する",hint:"吸血で回復される前に炎か大技で倒す。",pattern:["attack","charge","heavy"],hpScale:.84,atkScale:.88},
  "穴ゴブリン":{trait:"steal",telegraph:"攻撃と同時に金貨を盗む",hint:"所持金を守るなら最優先で倒す。",pattern:["attack","guard","attack"],hpScale:.9,atkScale:.86},
  "岩トカゲ":{trait:"shell",telegraph:"甲殻防御中は攻撃をほぼ通さない",hint:"身構えている間は防御・回復・MP温存。",pattern:["attack","guard","heavy"],hpScale:.88,atkScale:.92},
  "亡者の鎧":{trait:"curseCounter",telegraph:"盾構え中に斬ると呪いが返る",hint:"身構えているターンに攻撃しない。",pattern:["attack","guard","heavy"],statusKind:"curse",hpScale:.88,atkScale:.92},
  "火喰い虫":{trait:"fireAbsorb",telegraph:"炎を吸収して傷を回復する",hint:"火球を避け、氷結か物理攻撃を使う。",pattern:["attack","charge","heavy"],hpScale:.88,atkScale:.9},
  "影オオカミ":{trait:"frenzy",telegraph:"瀕死になると強攻撃を連発する",hint:"HP25%付近から大技で仕留める。",pattern:["attack","charge","heavy"],hpScale:.86,atkScale:.9},
  "深層の目":{trait:"blind",telegraph:"呪いの気配は暗闇を与える",hint:"状態異常予告を防御し、暗闇は回復薬で解除。",pattern:["attack","status","heavy"],statusKind:"blind",hpScale:.86,atkScale:.9},
};

const variants: Array<[MonsterVariant, string]> = [["通常",""],["凶暴","狂"],["呪染","呪"],["深淵","深"]];
const fallbackTactic: Tactic={trait:"none",telegraph:"行動予告を見て攻防を切り替える",hint:"敵の次行動に合わせて攻撃と防御を選ぶ。",pattern:["attack","heavy","guard","charge"],hpScale:1,atkScale:1};
const variantPattern=(base:MonsterIntent[],variant:MonsterVariant):MonsterIntent[]=>variant==="通常"?base:variant==="凶暴"?base.map(intent=>intent==="guard"||intent==="charge"?"attack":intent):variant==="呪染"?[base[0],"status",...base.slice(1)]:["heavy","status",...base];

export const MONSTER_CATALOG: MonsterRecord[] = bases.flatMap(({base,weakness,resistance="なし",action}, index) => variants.map(([variant, prefix], level) => {
  const tactic=earlyTactics[base]??fallbackTactic;
  const floor=index<10
    ?`${Math.max(1,(index-2)*2+1)}〜${Math.min(20,(index+1)*2)}階`
    :`${Math.min(91,index*4+1)}〜${Math.min(100,index*4+12)}階`;
  return {
    id:`m${String(index*4+level+1).padStart(3,"0")}`,name:`${prefix}${base}`,base,variant,
    floor,weakness,resistance,action,trait:tactic.trait,
    telegraph:tactic.telegraph,hint:tactic.hint,pattern:variantPattern(tactic.pattern,variant),statusKind:tactic.statusKind??(variant==="呪染"||variant==="深淵"?"curse":undefined),
    hpScale:tactic.hpScale*(variant==="凶暴"?.92:variant==="深淵"?1.08:1),atkScale:tactic.atkScale*(variant==="凶暴"?1.08:variant==="深淵"?1.05:1),
  };
}));

export const BOSS_MONSTERS = ["百足の坑王","石冠の巨人","深淵の古竜","黒曜の女王","月蝕の騎王","竜穴の司祭","天蓋の魔眼","冥河の番犬","終焉の双子","百景の底王"];
export const BOSS_TACTICS: Record<number,Pick<MonsterRecord,"telegraph"|"hint"|"pattern"|"statusKind">>={
  10:{telegraph:"巻きつきの後に毒牙を打ち込む",hint:"溜めの次は強攻撃。呪いの気配は毒なので防御する。",pattern:["attack","charge","heavy","status"],statusKind:"poison"},
  20:{telegraph:"石冠を閉じ、力を溜めてから叩き潰す",hint:"甲殻中は攻撃せず、溜めの次の強攻撃を防御する。",pattern:["guard","charge","heavy","attack"]},
};

export const monsterNameFor = (index: number) => MONSTER_CATALOG[Math.abs(index) % MONSTER_CATALOG.length].name;
export const monsterRecordFor = (catalogId:string) => MONSTER_CATALOG.find(monster=>monster.id===catalogId)??MONSTER_CATALOG[0];
export const monsterForBattle = (kind:number,floor:number) => floor<=20?MONSTER_CATALOG[Math.min(9,Math.max(0,kind))*4]:MONSTER_CATALOG[Math.abs(kind*4+Math.floor(floor/25))%MONSTER_CATALOG.length];
export const damageKindForWeakness=(weakness:string):DamageKind|undefined=>({"斬撃":"physical","打撃":"blast","炎":"fire","氷":"ice","雷":"lightning","聖":"holy"} as Record<string,DamageKind>)[weakness];
export const damageMultiplierFor=(monster:Pick<MonsterRecord,"weakness"|"resistance">,kind:DamageKind)=>{
  if(damageKindForWeakness(monster.weakness)===kind)return 1.35;
  if(damageKindForWeakness(monster.resistance)===kind)return .55;
  return 1;
};
