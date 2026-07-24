export const LOCALE_STORAGE_KEY = "chika-hyakkei-locale-v1";

export type Locale = "ja" | "en";
export type QuestKey = "slay" | "descend" | "chests" | "test";
export const QUEST_KEYS: QuestKey[] = ["slay", "descend", "chests"];

const legacyQuests: Record<string, QuestKey> = {
  "討伐依頼：魔物を8体倒す": "slay",
  "探索依頼：地下10階へ到達": "descend",
  "収集依頼：宝箱を3個開ける": "chests",
  "テスト依頼": "test",
};

const japanese = {
  "language.ja": "日本語",
  "language.en": "English",
  "language.switchToEnglish": "Englishに切替",
  "language.switchToJapanese": "日本語に切替",
  "common.close": "閉じる",
  "common.none": "なし",
  "header.bestFloor": "最高",
  "header.bestScore": "最高得点",
  "header.soundOn": "🔊 音を切る",
  "header.soundOff": "🔇 音を出す",
  "start.tagline": "百の景色を越えても、底はない。\n倒れれば、すべてを失う。",
  "start.name": "探索者の名前",
  "start.anonymous": "ナナシ",
  "start.chooseJob": "職業を選ぶ",
  "start.chooseQuest": "地下依頼を選ぶ",
  "start.descend": "地下へ降りる",
  "start.ranking": "地下ランキング",
  "start.testRecord": "テスト記録",
  "start.testMode": "テストモード",
  "quest.slay": "討伐依頼：魔物を8体倒す",
  "quest.descend": "探索依頼：地下10階へ到達",
  "quest.chests": "収集依頼：宝箱を3個開ける",
  "quest.test": "テスト依頼",
  "job.warrior.name": "戦士",
  "job.warrior.desc": "高い体力と一撃の重さ",
  "job.warrior.skill1": "強打",
  "job.warrior.skill2": "鉄壁",
  "job.thief.name": "盗賊",
  "job.thief.desc": "逃走と金策に優れる",
  "job.thief.skill1": "連撃",
  "job.thief.skill2": "盗む",
  "job.priest.name": "僧侶",
  "job.priest.desc": "回復しながら粘り強く戦う",
  "job.priest.skill1": "治療",
  "job.priest.skill2": "守りの祈り",
  "job.mage.name": "魔法使い",
  "job.mage.desc": "魔法で敵を一気に倒す",
  "job.mage.skill1": "火球",
  "job.mage.skill2": "氷結",
  "job.knight.name": "騎士",
  "job.knight.desc": "10階を越えた者の堅牢な職",
  "job.knight.skill1": "盾打ち",
  "job.knight.skill2": "鉄壁",
  "job.sage.name": "賢者",
  "job.sage.desc": "20階を知る者の万能な職",
  "job.sage.skill1": "大治療",
  "job.sage.skill2": "雷撃",
  "battle.attack": "たたかう",
  "battle.guard": "防御",
  "battle.potion": "回復薬",
  "battle.bomb": "爆裂石",
  "battle.flee": "にげる",
  "battle.noItem": "持っていない",
  "battle.enemyNext": "敵の次行動",
  "archive.monsters": "魔物図鑑",
  "archive.items": "アイテムリスト",
} as const;

export type TranslationKey = keyof typeof japanese;

const english: Partial<Record<TranslationKey, string>> = {
  "language.ja": "日本語",
  "language.en": "English",
  "language.switchToEnglish": "Switch to English",
  "language.switchToJapanese": "日本語に切替",
  "common.close": "Close",
  "common.none": "None",
  "header.bestFloor": "BEST",
  "header.bestScore": "HIGH SCORE",
  "header.soundOn": "🔊 Mute",
  "header.soundOff": "🔇 Sound on",
  "start.tagline": "Beyond a hundred sights, the abyss continues.\nFall, and you lose everything.",
  "start.name": "Explorer name",
  "start.anonymous": "Nameless",
  "start.chooseJob": "Choose a class",
  "start.chooseQuest": "Choose a dungeon request",
  "start.descend": "Descend",
  "start.ranking": "Dungeon Ranking",
  "start.testRecord": "Test Records",
  "start.testMode": "Test Mode",
  "quest.slay": "Hunt: Defeat 8 monsters",
  "quest.descend": "Explore: Reach floor 10",
  "quest.chests": "Collect: Open 3 chests",
  "quest.test": "Test request",
  "job.warrior.name": "Warrior",
  "job.warrior.desc": "High vitality and powerful blows",
  "job.warrior.skill1": "Power Strike",
  "job.warrior.skill2": "Iron Guard",
  "job.thief.name": "Thief",
  "job.thief.desc": "Excels at escape and earning gold",
  "job.thief.skill1": "Flurry",
  "job.thief.skill2": "Steal",
  "job.priest.name": "Priest",
  "job.priest.desc": "Endures through healing and defense",
  "job.priest.skill1": "Heal",
  "job.priest.skill2": "Prayer Guard",
  "job.mage.name": "Mage",
  "job.mage.desc": "Overwhelms enemies with magic",
  "job.mage.skill1": "Fireball",
  "job.mage.skill2": "Icebind",
  "job.knight.name": "Knight",
  "job.knight.desc": "A stalwart class unlocked past floor 10",
  "job.knight.skill1": "Shield Bash",
  "job.knight.skill2": "Iron Guard",
  "job.sage.name": "Sage",
  "job.sage.desc": "A versatile class unlocked past floor 20",
  "job.sage.skill1": "Greater Heal",
  "job.sage.skill2": "Lightning",
  "battle.attack": "Attack",
  "battle.guard": "Guard",
  "battle.potion": "Potion",
  "battle.bomb": "Blast Stone",
  "battle.flee": "Flee",
  "battle.noItem": "None left",
  "battle.enemyNext": "Enemy's next action",
  "archive.monsters": "Monster Archive",
  "archive.items": "Item Archive",
};

export function detectLocale(stored: string | null | undefined, languages: readonly string[] = []): Locale {
  if (stored === "ja" || stored === "en") return stored;
  return languages.some(language => language.toLowerCase().startsWith("en")) ? "en" : "ja";
}

export function normalizeQuestKey(value: unknown): QuestKey {
  if (typeof value !== "string") return "slay";
  if ((["slay", "descend", "chests", "test"] as string[]).includes(value)) return value as QuestKey;
  return legacyQuests[value] ?? "slay";
}

export function translate(locale: Locale, key: TranslationKey): string {
  return locale === "en" ? english[key] ?? japanese[key] : japanese[key];
}
