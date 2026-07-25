import type { Locale } from "./i18n";
import type { ItemRecord, PassiveKey } from "./items";
import type { MonsterRecord } from "./monsters";
import type { BossTactic } from "./monsters";
import type { DepthTheme } from "./depth-themes";

export const pick = (locale: Locale, japanese: string, english: string) => locale === "en" ? english : japanese;

const passiveEnglish: Record<PassiveKey, string> = {
  vampire: "Drain",
  critical: "Critical",
  guardCounter: "Guard Counter",
  mpFlow: "MP Flow",
  statusResist: "Status Resist",
  lastStand: "Last Stand",
};

export function passiveLabel(locale: Locale, passive: PassiveKey) {
  return locale === "en" ? passiveEnglish[passive] : {
    vampire: "吸血", critical: "会心", guardCounter: "防御反撃", mpFlow: "MP循環", statusResist: "状態耐性", lastStand: "瀕死強化",
  }[passive];
}

function passiveEffectEnglish(passive: PassiveKey, value: number) {
  return {
    vampire: `Heal ${value}% of damage dealt`,
    critical: `Critical chance +${value}%`,
    guardCounter: `Counter at ${value}% ATK after guarding`,
    mpFlow: `Restore ${value} MP on hit`,
    statusResist: `${value}% chance to resist ailments`,
    lastStand: `Damage +${value}% below 35% HP`,
  }[passive];
}

const weaponFamilies = ["Dagger", "Sword", "Axe", "Hammer", "Staff", "Spear"];
const armorFamilies = ["Travel Gear", "Leather Armor", "Chainmail", "Breastplate", "Robe", "Heavy Armor"];
const stages = ["Crude", "Forged", "Silver", "Blacksteel", "Abyssal"];
const accessories = ["Ring of Might","Guard Stone","Life Pendant","Mana Ring","Gale Bell","Royal Crest","Abyss Eye","Critical Fang","Counter Mirror","Blood Ring","Purity Charm","Paralysis Ward","Stargazer Ring","Fire Rat Tail","Ice Crystal Earring","Thunder Sigil","Shadow Needle","Moonwhite Crown","Dragonward Ring","End Sigil"];
const consumables: Array<[string,string]> = [
  ["Potion","Restore 45% max HP (at least 18) and cure ailments"],
  ["Panacea","Cure all status ailments"],
  ["Blast Stone","Heavy non-elemental damage based on enemy max HP"],
  ["Fire Flask","Heavy fire damage"],
  ["Ice Talisman","Ice damage with a chance to stop the enemy"],
  ["Thunder Orb","Heavy lightning damage"],
  ["Smoke Bomb","Guaranteed escape from non-boss battles"],
  ["Curse Ward","Cure curse and restore a little HP"],
  ["Bandage","Cure bleeding and restore a little HP"],
  ["Star Honey","Restore 10 MP"],
];
const relics: Array<[string,string]> = [
  ["Blood Chalice","Restore 4 HP after a kill"],
  ["Broken Crown","Gold gained +15%"],
  ["Depth Compass","Floor-change HP recovery +8%"],
  ["Shadow Heart","Max HP +12"],
  ["Moon Shard","Max MP +5"],
  ["Dragonbone Die","Critical chance +18%"],
  ["Star-Eater Seed","ATK +4"],
  ["Styx Stone","Floor-change MP recovery +2"],
  ["Time-Sand","16% chance to cancel an enemy attack"],
  ["Hundred-Vista Key","Proof that the 100th-floor gate opened"],
];

function englishItemEffect(item: ItemRecord) {
  const stats = [
    item.stats?.atk ? `ATK +${item.stats.atk}` : "",
    item.stats?.def ? `DEF +${item.stats.def}` : "",
    item.stats?.hp ? `Max HP +${item.stats.hp}` : "",
    item.stats?.mp ? `Max MP +${item.stats.mp}` : "",
    item.passive ? passiveEffectEnglish(item.passive, item.passiveValue ?? 0) : "",
  ].filter(Boolean);
  return stats.join(" · ");
}

export function localizedItem(locale: Locale, item: ItemRecord) {
  if (locale === "ja") return { name: item.name, effect: item.effect };
  const weapon = item.id.match(/^w(\d+)-(\d+)$/);
  if (weapon) return { name: `${stages[Number(weapon[2])-1]} ${weaponFamilies[Number(weapon[1])-1]}`, effect: englishItemEffect(item) };
  const armor = item.id.match(/^a(\d+)-(\d+)$/);
  if (armor) return { name: `${stages[Number(armor[2])-1]} ${armorFamilies[Number(armor[1])-1]}`, effect: englishItemEffect(item) };
  if (/^x\d+$/.test(item.id)) return { name: accessories[Number(item.id.slice(1))-1], effect: englishItemEffect(item) };
  if (/^c\d+$/.test(item.id)) return { name: consumables[Number(item.id.slice(1))-1]?.[0] ?? item.name, effect: consumables[Number(item.id.slice(1))-1]?.[1] ?? item.effect };
  if (/^r\d+$/.test(item.id)) return { name: relics[Number(item.id.slice(1))-1]?.[0] ?? item.name, effect: relics[Number(item.id.slice(1))-1]?.[1] ?? item.effect };
  return { name: item.name, effect: item.effect };
}

const monsterBases = ["Cave Worm","Moss Slime","Bone Rat","Night Bat","Pit Goblin","Rock Lizard","Undead Armor","Fire-Eater Bug","Shadow Wolf","Depth Eye","Mud Prince","Glass Spider","Hollow Soldier","Lantern Fiend","Ore Serpent","Moon-Eater Moth","Grave Hound","Blacktide Fish","Riven Rabbit","Iron-Shell Turtle","Abyss Wasp","Mirror Knight","Stardust Frog","Hollow Priest","Abyss Hand"];
const actions = ["Constrict","Split","Double Bite","Blood Drain","Gold Theft","Shell Guard","Cursed Blade","Fire Absorb","Desperate Flurry","Blindness","Mud Shot","Venom Web","Shield Wall","Fire Pillar","Constrict","Moon Dust","Bleeding Fang","Water Blade","Triple Strike","Counter","Paralysis Sting","Reflection","Regeneration","Curse","Crushing Grip"];
const telegraphs = [
  "Coils before constricting","Splits once when wounded below half HP","Layers two small wounds","Drains part of the damage dealt","Steals gold while attacking","Barely takes damage while its shell is raised","Returns a curse if struck while guarding","Absorbs fire to heal","Repeats heavy attacks when near death","Its baleful gaze inflicts blindness",
  "Mud shots steal your sight","Venom web leaves poison through a guard","Barely takes damage behind its shield","A charged fire pillar hits brutally hard","Its bite drains MP","Moon dust locks the body","Fang wounds keep bleeding","Water blades pierce half your defense","Leaps into a triple strike","Spikes punish attacks against its shell",
  "Even normal stings can paralyze","Its mirrored body reflects magic","Regenerates whenever it rests","Long prayers call down a curse","Crushes foes who are near death",
];
const hints = [
  "Guard the heavy attack after it charges.","Burst it down around half HP.","End the fight quickly; holy damage works well.","Use fire or a strong skill before it drains too much.","Defeat it first if you want to protect your gold.","Heal, guard, or save MP while its shell is raised.","Do not attack while it is guarding.","Avoid fire; use ice or physical attacks.","Finish it with a skill around 25% HP.","Guard the ailment warning and cure blindness with a potion.",
  "Guard the ailment warning to shorten blindness.","Guard the ailment warning and keep poison to one turn.","Recover or guard until its shield drops.","Always guard the heavy attack after a charge.","Use skills early and force a short fight.","Guard the ailment warning to shorten paralysis.","Guard the ailment warning and cure bleeding early.","Keep HP high; even normal attacks are dangerous.","Guard even a normal attack warning when HP is low.","Do not attack while it is guarding.",
  "Exploit its weakness before paralysis piles up.","Use physical damage or a Blast Stone, not elemental magic.","It heals while guarding or charging; burst it down.","Guard the ailment warning and cure a curse quickly.","Heal before falling below 35% HP.",
];
const affinities: Record<string,string> = { "斬撃":"Slash","打撃":"Impact","炎":"Fire","氷":"Ice","雷":"Lightning","聖":"Holy","なし":"None" };
const variants = ["", "Savage ", "Cursed ", "Abyssal "];

export function localizedMonster(locale: Locale, monster: MonsterRecord) {
  if (locale === "ja") return monster;
  const index = Math.max(0, Math.min(24, Math.floor((Number(monster.id.slice(1))-1)/4)));
  const variant = Math.max(0, Math.min(3, (Number(monster.id.slice(1))-1)%4));
  const actionSuffix = variant === 1 ? " · Flurry" : variant === 2 ? " · Cursed" : variant === 3 ? " · Abyssal" : "";
  return {
    ...monster,
    name: `${variants[variant]}${monsterBases[index]}`,
    base: monsterBases[index],
    variant: (["Normal","Savage","Cursed","Abyssal"] as const)[variant],
    floor: monster.floor.replace("〜100階", "–100F"),
    weakness: affinities[monster.weakness] ?? monster.weakness,
    resistance: affinities[monster.resistance] ?? monster.resistance,
    action: `${actions[index]}${actionSuffix}`,
    telegraph: telegraphs[index],
    hint: hints[index],
  };
}

const bossNames = ["Centipede Pit King","Stone-Crown Giant","Ancient Abyss Dragon","Obsidian Queen","Eclipse Knight-King","Dragon-Pit Priest","Firmament Eye","Styx Hound","Twins of the End","Lord of the Hundred Vistas"];
const bossTelegraphs = ["Coils, then strikes with venomous fangs","Closes its stone crown, charges, then crushes","Devours fire as its scales grow hotter","Its obsidian surface reflects magic","Its flurries intensify as the moon wanes","Its wounds close while it prays","The great eye covers your sight in darkness","Its Styx fangs tear through gaps in armor","Two shadows trade three cuts each","Chains all five warnings and executes the wounded"];
const bossHints = ["Guard the heavy attack after a charge. Guard the poison warning.","Do not attack the closed crown; guard after it charges.","Fire heals it. Exploit ice and guard after a charge.","Use physical attacks or Blast Stones; guard the late curse.","Heavy attacks increase below half HP. Heal before finishing it.","It heals while guarding or charging. Save skills for a burst.","Guard the blindness warning and cure it before misses pile up.","Keep HP high against armor-piercing bites. Guard bleeding.","Even normal attacks are heavy. Guard below half HP.","Use warnings, guards, and cures. Never remain below 35% HP."];
export function localizedBossTactic(locale: Locale, floor: number, tactic: BossTactic) {
  if (locale === "ja") return tactic;
  const index = Math.max(0, Math.min(9, Math.floor(floor/10)-1));
  return { ...tactic, telegraph: bossTelegraphs[index], hint: bossHints[index], weakness: affinities[tactic.weakness] ?? tactic.weakness, resistance: affinities[tactic.resistance] ?? tactic.resistance };
}
export function localizedBattleName(locale: Locale, monster: MonsterRecord, floor: number, boss: boolean, graveEater = false) {
  if (locale === "ja") {
    if (graveEater) return "遺品喰らい";
    if (boss && floor === 100) return "百景の奈落王";
    return boss ? ["百足の坑王","石冠の巨人","深淵の古竜","黒曜の女王","月蝕の騎王","竜穴の司祭","天蓋の魔眼","冥河の番犬","終焉の双子","百景の底王"][Math.floor(floor/10)-1] : monster.name;
  }
  if (graveEater) return "Relic Devourer";
  if (boss) return bossNames[Math.max(0, Math.min(9, Math.floor(floor/10)-1))];
  return localizedMonster(locale,monster).name;
}

const depthNames = ["Mossy Entrance","Rustmine","Flooded Gallery","Amethyst Vein","Ossuary Walk","Ember Forge","Wailing Ice Cave","Cursed Altar","Starless Chasm","Abyssal Citadel"];
const depthSubtitles = ["A trace of surface wind remains","Abandoned iron groans","Black water calls from ahead","Venomous crystals breathe","Nameless challengers sleep","Fire pulses under the rock","Frozen screams echo","Old prayers take form","Even light sinks here","The lord of all vistas awaits"];
export function localizedDepth(locale: Locale, theme: DepthTheme) {
  return locale === "en" ? { ...theme, name: depthNames[theme.band-1], subtitle: depthSubtitles[theme.band-1] } : theme;
}
