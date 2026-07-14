export type MonsterVariant = "通常" | "凶暴" | "呪染" | "深淵";
export type MonsterRecord = { id: string; name: string; base: string; variant: MonsterVariant; floor: string; weakness: string; action: string; boss?: boolean };

const bases = [
  ["洞ミミズ","雷","締めつけ"],["苔スライム","炎","分裂"],["骨ネズミ","聖","連続噛みつき"],["夜コウモリ","炎","吸血"],["穴ゴブリン","氷","投石"],
  ["岩トカゲ","雷","甲殻防御"],["亡者の鎧","雷","呪いの剣"],["火喰い虫","氷","火炎"],["影オオカミ","炎","飛びかかり"],["深層の目","聖","暗闇"],
  ["泥王子","炎","泥弾"],["硝子蜘蛛","打撃","毒糸"],["空洞兵","雷","盾構え"],["灯火鬼","氷","火柱"],["鉱脈蛇","雷","締めつけ"],
  ["月喰い蛾","炎","眠り粉"],["墓守犬","聖","出血"],["黒潮魚","雷","水刃"],["裂け兎","炎","三連撃"],["鉄殻亀","雷","反撃"],
  ["奈落蜂","炎","麻痺針"],["鏡面騎士","打撃","反射"],["星屑蛙","氷","回復"],["虚ろ司祭","聖","呪詛"],["深淵の手","炎","握り潰し"],
] as const;
const variants: Array<[MonsterVariant, string]> = [["通常",""],["凶暴","狂"],["呪染","呪"],["深淵","深"]];

export const MONSTER_CATALOG: MonsterRecord[] = bases.flatMap(([base, weakness, action], index) => variants.map(([variant, prefix], level) => ({
  id: `m${String(index * 4 + level + 1).padStart(3, "0")}`,
  name: `${prefix}${base}`,
  base,
  variant,
  floor: `${Math.min(91, index * 4 + 1)}〜${Math.min(100, index * 4 + 12)}階`,
  weakness,
  action,
})));

export const BOSS_MONSTERS = ["百足の坑王","石冠の巨人","深淵の古竜","黒曜の女王","月蝕の騎王","竜穴の司祭","天蓋の魔眼","冥河の番犬","終焉の双子","百景の底王"];
export const monsterNameFor = (index: number) => MONSTER_CATALOG[Math.abs(index) % MONSTER_CATALOG.length].name;
