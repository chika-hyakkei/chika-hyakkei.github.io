export type GameTheme = "dungeon" | "battle" | "boss" | "shop" | "death";

type Track = { melody: number[]; roots: number[]; stepMs: number; lead: OscillatorType; drums: boolean; bright?: boolean };

const tracks: Record<GameTheme, Track> = {
  dungeon: { melody: [57,0,60,0,62,0,60,0,57,0,55,0,53,0,0,0], roots: [33,33,29,31], stepMs: 188, lead: "triangle", drums: false },
  battle: { melody: [69,72,69,74,72,69,67,69,72,74,76,74,72,69,67,0], roots: [45,45,41,43], stepMs: 118, lead: "square", drums: true },
  boss: { melody: [57,60,64,62,57,60,65,64,69,67,64,62,60,57,55,0,60,64,67,65,64,62,60,57,55,57,60,62,64,60,57,0], roots: [33,33,29,31,33,36,31,33], stepMs: 104, lead: "sawtooth", drums: true },
  shop: { melody: [72,76,79,76,74,77,81,77,76,79,84,79,77,74,76,0], roots: [48,53,45,55], stepMs: 156, lead: "square", drums: false, bright: true },
  death: { melody: [69,67,64,62,60,57,55,0,64,62,60,57,55,52,50,0], roots: [45,41,38,33], stepMs: 205, lead: "triangle", drums: false },
};

export function startGameTheme(context: AudioContext, theme: GameTheme) {
  const track = tracks[theme], master = context.createGain(); master.gain.value = theme === "boss" ? .19 : .15; master.connect(context.destination);
  const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
  const voice = (midi: number, duration: number, level: number, type: OscillatorType, when: number) => { if (!midi) return; const oscillator = context.createOscillator(), gain = context.createGain(); oscillator.type = type; oscillator.frequency.value = hz(midi); gain.gain.setValueAtTime(.0001, when); gain.gain.exponentialRampToValueAtTime(level, when + .01); gain.gain.exponentialRampToValueAtTime(.0001, when + duration); oscillator.connect(gain); gain.connect(master); oscillator.start(when); oscillator.stop(when + duration + .02); };
  const kick = (when: number, level: number) => { const oscillator = context.createOscillator(), gain = context.createGain(); oscillator.type = "sine"; oscillator.frequency.setValueAtTime(116, when); oscillator.frequency.exponentialRampToValueAtTime(42, when + .09); gain.gain.setValueAtTime(level, when); gain.gain.exponentialRampToValueAtTime(.0001, when + .11); oscillator.connect(gain); gain.connect(master); oscillator.start(when); oscillator.stop(when + .12); };
  const snare = (when: number) => { const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * .055), context.sampleRate), data = buffer.getChannelData(0), source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain(); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1; source.buffer = buffer; filter.type = "highpass"; filter.frequency.value = 1300; gain.gain.setValueAtTime(.045, when); gain.gain.exponentialRampToValueAtTime(.0001, when + .06); source.connect(filter); filter.connect(gain); gain.connect(master); source.start(when); source.stop(when + .07); };
  let step = 0, timer = 0, stopped = false;
  const tick = () => { if (stopped) return; const when = context.currentTime + .025, i = step % track.melody.length, beat = i % 4, root = track.roots[Math.floor(i / 4) % track.roots.length], melody = track.melody[i]; voice(melody, track.stepMs / 1000 * .78, theme === "boss" ? .085 : .062, track.lead, when); if (theme === "dungeon" && melody && i % 4 === 0) voice(melody - 12, .3, .035, "sine", when); if (theme === "shop") { voice(root + 12, .22, .045, "triangle", when); if (beat === 2) voice(root + 19, .08, .027, "sine", when); } if (theme === "death") { voice(root, .44, .06, "sine", when); if (beat === 0) voice(root + 7, .24, .026, "triangle", when); } if (track.drums) { voice(root, .23, theme === "boss" ? .09 : .07, "triangle", when); if (beat === 2) voice(root + 7, .1, .032, "square", when); if (beat === 0 || theme === "boss" && beat === 2) kick(when, theme === "boss" ? .1 : .075); if (beat === 2) snare(when); if (theme === "boss" && beat % 2 === 1) voice(98, .018, .013, "sawtooth", when); } step++; timer = window.setTimeout(tick, track.stepMs); };
  tick(); return () => { stopped = true; window.clearTimeout(timer); master.disconnect(); };
}
