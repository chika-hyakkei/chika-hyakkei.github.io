export type DepthMusicProfile = {
  transpose: number;
  voice: "square" | "triangle" | "sawtooth";
  density: 1 | 2 | 3 | 4;
  counter: readonly (number | null)[];
  pulse: number;
};

export type DepthTheme = {
  band: number;
  floors: string;
  name: string;
  subtitle: string;
  mark: string;
  ornaments: readonly [string, string];
  music: DepthMusicProfile;
};

export const DEPTH_THEMES: readonly DepthTheme[] = [
  {
    band: 1,
    floors: "1–10F",
    name: "苔むす入口",
    subtitle: "地上の風がまだ届く",
    mark: "♠",
    ornaments: ["♠", "·"],
    music: { transpose: 0, voice: "square", density: 1, counter: [null, 7, null, 5], pulse: 0 },
  },
  {
    band: 2,
    floors: "11–20F",
    name: "赤錆坑道",
    subtitle: "捨てられた鉄が軋む",
    mark: "＋",
    ornaments: ["＋", "┼"],
    music: { transpose: -2, voice: "square", density: 2, counter: [3, null, 5, null], pulse: 0.018 },
  },
  {
    band: 3,
    floors: "21–30F",
    name: "水没回廊",
    subtitle: "黒い水音が先を誘う",
    mark: "≋",
    ornaments: ["≋", "∴"],
    music: { transpose: 2, voice: "triangle", density: 2, counter: [7, null, 10, null], pulse: 0.012 },
  },
  {
    band: 4,
    floors: "31–40F",
    name: "紫晶脈",
    subtitle: "毒めく結晶が息づく",
    mark: "◆",
    ornaments: ["◆", "⋄"],
    music: { transpose: 3, voice: "triangle", density: 3, counter: [12, 7, null, 10], pulse: 0.016 },
  },
  {
    band: 5,
    floors: "41–50F",
    name: "白骨墓廊",
    subtitle: "名もなき挑戦者の眠り",
    mark: "†",
    ornaments: ["†", "×"],
    music: { transpose: -3, voice: "square", density: 2, counter: [null, 3, null, -2], pulse: 0.022 },
  },
  {
    band: 6,
    floors: "51–60F",
    name: "焔脈炉",
    subtitle: "岩の底で炎が脈打つ",
    mark: "▲",
    ornaments: ["▲", "˄"],
    music: { transpose: 5, voice: "sawtooth", density: 3, counter: [7, 12, 10, null], pulse: 0.032 },
  },
  {
    band: 7,
    floors: "61–70F",
    name: "氷哭洞",
    subtitle: "凍った悲鳴が反響する",
    mark: "✦",
    ornaments: ["✦", "＊"],
    music: { transpose: 7, voice: "triangle", density: 2, counter: [12, null, 7, null], pulse: 0.014 },
  },
  {
    band: 8,
    floors: "71–80F",
    name: "呪祭壇",
    subtitle: "古い祈りが形を持つ",
    mark: "Ψ",
    ornaments: ["Ψ", "∵"],
    music: { transpose: 1, voice: "sawtooth", density: 3, counter: [6, null, 1, 8], pulse: 0.028 },
  },
  {
    band: 9,
    floors: "81–90F",
    name: "星無き淵",
    subtitle: "光さえ沈む無音の底",
    mark: "●",
    ornaments: ["●", "°"],
    music: { transpose: -5, voice: "triangle", density: 4, counter: [null, -2, 6, null], pulse: 0.036 },
  },
  {
    band: 10,
    floors: "91–100F",
    name: "奈落王城",
    subtitle: "百景の主が待つ終着",
    mark: "王",
    ornaments: ["王", "◇"],
    music: { transpose: -1, voice: "sawtooth", density: 4, counter: [7, 11, 2, 6], pulse: 0.042 },
  },
] as const;

export function depthBandForFloor(floor: number) {
  return Math.min(10, Math.max(1, Math.ceil((Number.isFinite(floor) ? floor : 1) / 10)));
}

export function depthThemeForFloor(floor: number) {
  return DEPTH_THEMES[depthBandForFloor(floor) - 1];
}

export function depthThemeForBand(band: number) {
  return DEPTH_THEMES[Math.min(10, Math.max(1, Math.floor(band || 1))) - 1];
}
