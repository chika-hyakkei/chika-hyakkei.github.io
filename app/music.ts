export type GameTheme = "dungeon" | "battle" | "boss" | "shop" | "death";

type Track = { melody: number[]; bass: number[]; stepMs: number; lead: OscillatorType; grow: boolean };

// 以前のゲーム内メロディを核に、周回するごとに低音・和音・オクターブを足す。
const tracks: Record<GameTheme, Track> = {
  dungeon: { melody: [110,0,165,196,147,0,165,131], bass: [55,0,55,0,49,0,55,0], stepMs: 235, lead: "square", grow: true },
  battle: { melody: [82,110,87,123,73,116,92,131,82,104,78,117], bass: [41,41,43,43,37,37,46,46,41,41,39,39], stepMs: 132, lead: "sawtooth", grow: true },
  boss: { melody: [82,110,87,123,73,116,92,131,82,104,78,117,82,123,110,131], bass: [41,41,43,43,37,37,46,46,41,41,39,39,41,46,43,49], stepMs: 116, lead: "sawtooth", grow: true },
  shop: { melody: [220,277,330,277,247,330,277,220], bass: [110,0,139,0,123,0,110,0], stepMs: 190, lead: "square", grow: true },
  death: { melody: [165,147,131,110,98,82,73,0], bass: [55,0,49,0,41,0,37,0], stepMs: 260, lead: "triangle", grow: false },
};

export function startGameTheme(context: AudioContext, theme: GameTheme) {
  const track = tracks[theme], master = context.createGain(); master.gain.value = theme === "boss" ? .13 : .105; master.connect(context.destination);
  const tone = (frequency: number, duration: number, level: number, type: OscillatorType, when: number) => { if (!frequency) return; const oscillator = context.createOscillator(), gain = context.createGain(); oscillator.type = type; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.0001, when); gain.gain.exponentialRampToValueAtTime(level, when + .014); gain.gain.exponentialRampToValueAtTime(.0001, when + duration); oscillator.connect(gain); gain.connect(master); oscillator.start(when); oscillator.stop(when + duration + .025); };
  const pulse = (when: number, level: number) => { const oscillator = context.createOscillator(), gain = context.createGain(); oscillator.type = "sine"; oscillator.frequency.setValueAtTime(92, when); oscillator.frequency.exponentialRampToValueAtTime(45, when + .1); gain.gain.setValueAtTime(level, when); gain.gain.exponentialRampToValueAtTime(.0001, when + .12); oscillator.connect(gain); gain.connect(master); oscillator.start(when); oscillator.stop(when + .13); };
  let step = 0, timer = 0, stopped = false;
  const tick = () => { if (stopped) return; const when = context.currentTime + .03, i = step % track.melody.length, lap = Math.floor(step / track.melody.length) % 4, note = track.melody[i], bass = track.bass[i];
    tone(note, track.stepMs / 1000 * .72, theme === "boss" ? .069 : .054, track.lead, when);
    if (lap >= 1 || !track.grow) tone(bass, track.stepMs / 1000 * .9, theme === "shop" ? .028 : .039, "triangle", when);
    if (lap >= 2 && note) tone(note / 2, track.stepMs / 1000 * .62, .018, "sine", when + .028);
    if (lap >= 3 && note && theme !== "death") tone(note * 2, track.stepMs / 1000 * .36, .014, "triangle", when);
    if (theme === "shop" && i % 2 === 0) tone(note * 1.5, .075, lap >= 2 ? .024 : .014, "sine", when + .05);
    if (theme === "boss" && (i % 4 === 0 || lap >= 2 && i % 4 === 2)) pulse(when, lap >= 2 ? .052 : .034);
    step++; timer = window.setTimeout(tick, track.stepMs);
  };
  tick(); return () => { stopped = true; window.clearTimeout(timer); master.disconnect(); };
}
