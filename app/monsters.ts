export type MonsterVariant = "通常" | "凶暴" | "呪染" | "深淵";
export type MonsterIntent = "attack" | "heavy" | "guard" | "charge" | "status";
export type DamageKind = "physical" | "fire" | "ice" | "lightning" | "holy" | "blast";
export type MonsterTrait =
  | "none" | "coil" | "split" | "multiHit" | "drain" | "steal" | "shell" | "curseCounter" | "fireAbsorb" | "frenzy" | "blind"
  | "mudBlind" | "venomWeb" | "shieldWall" | "flameSurge" | "manaDrain" | "paralysis" | "bleeder" | "armorPierce" | "tripleHit"
  | "bleedCounter" | "paralyzeStrike" | "magicMirror" | "regenerate" | "curseAura" | "execute";
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
const monsterTactics: Record<string,Tactic> = {
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
  "泥王子":{trait:"mudBlind",telegraph:"泥弾が視界を奪う",hint:"呪いの気配を防御し、暗闇の時間を短くする。",pattern:["attack","status","guard"],statusKind:"blind",hpScale:.9,atkScale:.92},
  "硝子蜘蛛":{trait:"venomWeb",telegraph:"毒糸は防御を抜けて毒を残す",hint:"状態異常予告を防御し、毒を1ターンに抑える。",pattern:["attack","status","heavy"],statusKind:"poison",hpScale:.86,atkScale:.9},
  "空洞兵":{trait:"shieldWall",telegraph:"盾構え中は攻撃をほぼ受けない",hint:"身構え中は回復か防御。盾が下がってから打つ。",pattern:["attack","guard","heavy"],hpScale:.9,atkScale:.92},
  "灯火鬼":{trait:"flameSurge",telegraph:"力を溜めた後の火柱が強烈",hint:"溜めを見たら次の強攻撃を必ず防御する。",pattern:["attack","charge","heavy"],hpScale:.86,atkScale:.9},
  "鉱脈蛇":{trait:"manaDrain",telegraph:"噛みつきがMPを奪う",hint:"技を使い切る前に短期決戦へ持ち込む。",pattern:["attack","attack","heavy"],hpScale:.88,atkScale:.9},
  "月喰い蛾":{trait:"paralysis",telegraph:"月粉が身体の自由を奪う",hint:"呪いの気配は麻痺。防御で効果時間を短くする。",pattern:["attack","status","guard"],statusKind:"paralysis",hpScale:.86,atkScale:.9},
  "墓守犬":{trait:"bleeder",telegraph:"牙の傷から出血が続く",hint:"状態異常予告を防御し、出血は薬で早めに治す。",pattern:["attack","status","heavy"],statusKind:"bleed",hpScale:.9,atkScale:.9},
  "黒潮魚":{trait:"armorPierce",telegraph:"水刃は守備を半分貫く",hint:"通常攻撃も危険。HPを高めに保ち防御を惜しまない。",pattern:["attack","charge","heavy"],hpScale:.88,atkScale:.86},
  "裂け兎":{trait:"tripleHit",telegraph:"跳ねた直後に三連撃を重ねる",hint:"攻撃予告でもHPが低ければ防御する。",pattern:["attack","attack","heavy"],hpScale:.8,atkScale:.84},
  "鉄殻亀":{trait:"bleedCounter",telegraph:"甲羅へ斬りつけると棘が返る",hint:"身構え中は攻撃せず、盾が解けるまで待つ。",pattern:["guard","attack","heavy"],statusKind:"bleed",hpScale:.94,atkScale:.88},
  "奈落蜂":{trait:"paralyzeStrike",telegraph:"通常の毒針にも麻痺が混じる",hint:"攻撃が続く前に弱点で倒し、麻痺は薬で解除する。",pattern:["attack","status","heavy"],statusKind:"paralysis",hpScale:.78,atkScale:.9},
  "鏡面騎士":{trait:"magicMirror",telegraph:"魔法を鏡面で反射する",hint:"炎・氷・雷を避け、物理か爆裂石で攻める。",pattern:["guard","attack","heavy"],hpScale:.9,atkScale:.9},
  "星屑蛙":{trait:"regenerate",telegraph:"休む行動のたび傷を再生する",hint:"身構え・溜め中も回復する。大技で短期決戦にする。",pattern:["attack","guard","charge"],hpScale:.82,atkScale:.86},
  "虚ろ司祭":{trait:"curseAura",telegraph:"祈りが長い呪いを呼ぶ",hint:"呪いの気配を防御し、受けたら薬で解除する。",pattern:["status","attack","heavy"],statusKind:"curse",hpScale:.88,atkScale:.9},
  "深淵の手":{trait:"execute",telegraph:"瀕死の相手を握り潰す",hint:"HP35%以下では強攻撃が増幅する。早めに回復する。",pattern:["attack","charge","heavy"],hpScale:.9,atkScale:.88},
};

const variants: Array<[MonsterVariant, string]> = [["通常",""],["凶暴","狂"],["呪染","呪"],["深淵","深"]];
const fallbackTactic: Tactic={trait:"none",telegraph:"行動予告を見て攻防を切り替える",hint:"敵の次行動に合わせて攻撃と防御を選ぶ。",pattern:["attack","heavy","guard","charge"],hpScale:1,atkScale:1};
const variantPattern=(base:MonsterIntent[],variant:MonsterVariant):MonsterIntent[]=>variant==="通常"?base:variant==="凶暴"?["attack","heavy",...base.filter(intent=>intent==="attack")]:variant==="呪染"?[base[0],"status",...base.slice(1)]:["heavy","status",...base];

export const MONSTER_CATALOG: MonsterRecord[] = bases.flatMap(({base,weakness,resistance="なし",action}, index) => variants.map(([variant, prefix], level) => {
  const tactic=monsterTactics[base]??fallbackTactic;
  const variantAffinity: Record<MonsterVariant,{weakness:string;resistance:string}> = {
    "通常":{weakness,resistance},
    "凶暴":{weakness:"氷",resistance:"斬撃"},
    "呪染":{weakness:"雷",resistance:"炎"},
    "深淵":{weakness:"打撃",resistance:"氷"},
  };
  const affinity=variantAffinity[variant];
  const earliest=level===0?(index<10?Math.max(1,(index-2)*2+1):index<15?21:81):level===1?(index<15?21:index<20?41:81):level===2?(index<20?41:61):index<10?81:61;
  const floor=`${earliest}〜100階`;
  return {
    id:`m${String(index*4+level+1).padStart(3,"0")}`,name:`${prefix}${base}`,base,variant,
    floor,weakness:affinity.weakness,resistance:affinity.resistance,action:`${action}${variant==="通常"?"":variant==="凶暴"?"・連撃化":variant==="呪染"?"・呪染化":"・深淵化"}`,trait:tactic.trait,
    telegraph:tactic.telegraph,hint:tactic.hint,pattern:variantPattern(tactic.pattern,variant),statusKind:variant==="呪染"?"curse":variant==="深淵"?"paralysis":tactic.statusKind,
    hpScale:tactic.hpScale*(variant==="凶暴"?.92:variant==="深淵"?1.08:1),atkScale:tactic.atkScale*(variant==="凶暴"?1.08:variant==="深淵"?1.05:1),
  };
}));

export const BOSS_MONSTERS = ["百足の坑王","石冠の巨人","深淵の古竜","黒曜の女王","月蝕の騎王","竜穴の司祭","天蓋の魔眼","冥河の番犬","終焉の双子","百景の底王"];
export type BossTactic = Pick<MonsterRecord,"telegraph"|"hint"|"pattern"|"statusKind"|"trait"|"weakness"|"resistance"> & { phasePattern: MonsterIntent[] };
export const BOSS_TACTICS: Record<number,BossTactic>={
  10:{trait:"coil",weakness:"雷",resistance:"氷",telegraph:"巻きつきの後に毒牙を打ち込む",hint:"溜めの次は強攻撃。呪いの気配は毒なので防御する。",pattern:["attack","charge","heavy","status"],phasePattern:["heavy","status","attack"],statusKind:"poison"},
  20:{trait:"shell",weakness:"打撃",resistance:"斬撃",telegraph:"石冠を閉じ、力を溜めてから叩き潰す",hint:"甲殻中は攻撃せず、溜めの次の強攻撃を防御する。",pattern:["guard","charge","heavy","attack"],phasePattern:["charge","heavy","guard","heavy"]},
  30:{trait:"fireAbsorb",weakness:"氷",resistance:"炎",telegraph:"炎を喰らい、逆鱗が熱を増す",hint:"炎は回復される。氷結で弱点を突き、溜めの後は防御。",pattern:["attack","charge","heavy","status"],phasePattern:["heavy","attack","charge","heavy"],statusKind:"bleed"},
  40:{trait:"magicMirror",weakness:"打撃",resistance:"雷",telegraph:"黒曜の鏡面が魔力を跳ね返す",hint:"魔法反射中は物理か爆裂石。後半の呪いは防御する。",pattern:["guard","attack","heavy","status"],phasePattern:["status","guard","heavy","attack"],statusKind:"curse"},
  50:{trait:"frenzy",weakness:"炎",resistance:"斬撃",telegraph:"月が欠けるほど連撃が激しくなる",hint:"HP半分以下は強攻撃が増える。回復してから削り切る。",pattern:["attack","attack","charge","heavy"],phasePattern:["heavy","attack","heavy"]},
  60:{trait:"regenerate",weakness:"雷",resistance:"氷",telegraph:"祈りの間に傷が塞がっていく",hint:"身構えと溜めで回復する。攻撃技を温存して一気に崩す。",pattern:["attack","guard","status","charge"],phasePattern:["guard","heavy","status","attack"],statusKind:"curse"},
  70:{trait:"blind",weakness:"聖",resistance:"雷",telegraph:"天蓋の瞳が視界を闇で覆う",hint:"暗闇予告を防御し、外れが続く前に薬で解除する。",pattern:["status","attack","heavy","guard"],phasePattern:["status","heavy","attack"],statusKind:"blind"},
  80:{trait:"armorPierce",weakness:"炎",resistance:"氷",telegraph:"冥河の牙は鎧の隙間を噛み裂く",hint:"守備を貫くためHPを高く保つ。出血予告は防御する。",pattern:["attack","status","charge","heavy"],phasePattern:["heavy","status","attack","heavy"],statusKind:"bleed"},
  90:{trait:"tripleHit",weakness:"打撃",resistance:"斬撃",telegraph:"二つの影が三度ずつ斬り結ぶ",hint:"通常攻撃も重い。攻撃予告でもHP半分以下なら防御する。",pattern:["attack","guard","attack","heavy"],phasePattern:["attack","heavy","attack","heavy"]},
  100:{trait:"execute",weakness:"雷",resistance:"炎",telegraph:"五つの予告を連ね、瀕死を刈り取る",hint:"予告、防御、状態回復を総動員。HP35%以下を残さない。",pattern:["attack","guard","status","charge","heavy"],phasePattern:["status","heavy","attack","charge","heavy"],statusKind:"paralysis"},
};

export const monsterNameFor = (index: number) => MONSTER_CATALOG[Math.abs(index) % MONSTER_CATALOG.length].name;
export const monsterRecordFor = (catalogId:string) => MONSTER_CATALOG.find(monster=>monster.id===catalogId)??MONSTER_CATALOG[0];
export const encodedMonsterKind=(catalogIndex:number)=>100+Math.max(0,Math.min(MONSTER_CATALOG.length-1,catalogIndex));
export const monsterForBattle = (kind:number,floor:number) => {
  if(kind>=100)return MONSTER_CATALOG[Math.min(MONSTER_CATALOG.length-1,kind-100)];
  return floor<=20?MONSTER_CATALOG[Math.min(9,Math.max(0,kind))*4]:MONSTER_CATALOG[Math.abs(kind*4+Math.floor(floor/25))%MONSTER_CATALOG.length];
};
export const baseIndexForKind=(kind:number,floor:number)=>kind>=100?Math.floor((kind-100)/4):Math.max(0,Math.min(24,floor<=20?kind:Math.floor((Number(monsterForBattle(kind,floor).id.slice(1))-1)/4)));
export const damageKindForWeakness=(weakness:string):DamageKind|undefined=>({"斬撃":"physical","打撃":"blast","炎":"fire","氷":"ice","雷":"lightning","聖":"holy"} as Record<string,DamageKind>)[weakness];
export const damageMultiplierFor=(monster:Pick<MonsterRecord,"weakness"|"resistance">,kind:DamageKind)=>{
  if(damageKindForWeakness(monster.weakness)===kind)return 1.35;
  if(damageKindForWeakness(monster.resistance)===kind)return .55;
  return 1;
};
