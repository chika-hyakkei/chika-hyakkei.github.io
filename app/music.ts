export type GameTheme = "dungeon" | "battle" | "boss" | "shop" | "death";

type Track = { melody: number[]; bass: number[]; chords: number[][]; counter?: number[]; stepMs: number; lead: OscillatorType; heavy?: boolean };

// 既存BGMの主旋律・テンポは維持し、下支えの音だけを追加する。
const tracks: Record<GameTheme, Track> = {
  dungeon: { melody: [110,0,165,196,147,0,165,131], bass: [55,0,55,0,49,0,55,0], chords: [[110,131,165],[98,123,147],[87,110,131],[98,123,165]], stepMs: 235, lead: "square" },
  battle: { melody: [82,110,87,123,73,116,92,131,82,104,78,117], bass: [41,41,43,43,37,37,46,46,41,41,39,39], chords: [[82,98,123],[87,104,131],[73,92,116],[82,98,131]], stepMs: 132, lead: "sawtooth" },
  boss: { melody: [82,110,87,123,73,116,92,131,82,104,78,117], bass: [41,41,43,43,37,37,46,46,41,41,39,39], chords: [[82,98,123],[87,104,131],[73,92,116],[82,98,131]], counter: [0,0,123,0,110,0,131,0,98,0,110,0], stepMs: 168, lead: "sawtooth", heavy: true },
  shop: { melody: [220,277,330,277,247,330,277,220], bass: [110,0,139,0,123,0,110,0], chords: [[220,277,330],[247,294,370],[196,247,294],[220,277,330]], stepMs: 190, lead: "square" },
  death: { melody: [165,147,131,110,98,82,73,0], bass: [55,0,49,0,41,0,37,0], chords: [[165,196,247],[147,175,220],[131,165,196],[110,131,165]], stepMs: 260, lead: "triangle" },
};

function createBus(context: AudioContext, level: number) {
  const master = context.createGain(), compressor = context.createDynamicsCompressor(), delay = context.createDelay(.4), feedback = context.createGain(), wet = context.createGain();
  master.gain.value = level; compressor.threshold.value = -22; compressor.knee.value = 14; compressor.ratio.value = 5; compressor.attack.value = .01; compressor.release.value = .18;
  delay.delayTime.value = .165; feedback.gain.value = .17; wet.gain.value = .16;
  master.connect(compressor); master.connect(delay); delay.connect(feedback); feedback.connect(delay); delay.connect(wet); wet.connect(compressor); compressor.connect(context.destination);
  return { master, stop: () => { master.disconnect(); delay.disconnect(); feedback.disconnect(); wet.disconnect(); compressor.disconnect(); } };
}

function playTone(context: AudioContext, destination: AudioNode, frequency: number, duration: number, level: number, type: OscillatorType, when: number, detune = 0) {
  if (!frequency) return;
  const oscillator = context.createOscillator(), gain = context.createGain(); oscillator.type = type; oscillator.frequency.value = frequency; oscillator.detune.value = detune;
  gain.gain.setValueAtTime(.0001, when); gain.gain.exponentialRampToValueAtTime(level, when + .014); gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
  oscillator.connect(gain); gain.connect(destination); oscillator.start(when); oscillator.stop(when + duration + .03);
}

function lowPulse(context: AudioContext, destination: AudioNode, when: number, level: number) {
  const oscillator = context.createOscillator(), gain = context.createGain(); oscillator.type = "sine"; oscillator.frequency.setValueAtTime(82, when); oscillator.frequency.exponentialRampToValueAtTime(39, when + .13);
  gain.gain.setValueAtTime(level, when); gain.gain.exponentialRampToValueAtTime(.0001, when + .15); oscillator.connect(gain); gain.connect(destination); oscillator.start(when); oscillator.stop(when + .16);
}

export function startGameTheme(context: AudioContext, theme: GameTheme) {
  const track = tracks[theme], bus = createBus(context, theme === "boss" ? .19 : .15); let step = 0, timer = 0, stopped = false;
  const tick = () => { if (stopped) return; const when = context.currentTime + .03, i = step % track.melody.length, beat = i % 4, note = track.melody[i], bass = track.bass[i], counter = track.counter?.[i % track.counter.length]??0, chord = track.chords[Math.floor(i / 2) % track.chords.length], lap = Math.floor(step / track.melody.length) % 4;
    // 先に従来のメロディ、次に重心となる低音、最後に控えめな和音を置く。
    playTone(context,bus.master,note,track.stepMs/1000*.78,.061,track.lead,when);
    if(note) playTone(context,bus.master,note,track.stepMs/1000*.72,.015,"square",when,7);
    playTone(context,bus.master,bass,track.stepMs/1000*.92,theme === "shop" ? .028 : .045,"triangle",when);
    if(counter) playTone(context,bus.master,counter,track.stepMs/1000*1.3,.026,"triangle",when+.03);
    if(beat===0) chord.forEach((frequency,index)=>playTone(context,bus.master,frequency,track.stepMs/1000*3.45,.011-index*.0015,"sine",when+.012));
    if(lap>=1&&note) playTone(context,bus.master,note/2,track.stepMs/1000*.64,.019,"sine",when+.042);
    if(lap>=2&&note) playTone(context,bus.master,note*2,track.stepMs/1000*.34,.014,"triangle",when+.02);
    if(theme === "shop" && beat===2) playTone(context,bus.master,note*1.5,.075,.022,"sine",when+.06);
    if(track.heavy && (beat===0 || lap>=2&&beat===2)) lowPulse(context,bus.master,when,lap>=2 ? .065 : .045);
    step++; timer=window.setTimeout(tick,track.stepMs);
  };
  tick(); return () => { stopped=true; window.clearTimeout(timer); bus.stop(); };
}

export function startOpeningTheme(context: AudioContext) {
  const bus = createBus(context,.18), melody=[0,0,220,0,247,0,262,0,220,0,196,0,0,0,0,0,220,247,262,294,262,247,220,196,247,262,294,330,294,262,247,0,262,294,330,349,330,294,262,247,294,330,392,330,294,262,247,0,330,349,392,440,392,349,330,294,262,294,330,392,349,330,294,0], roots=[110,110,110,110,98,98,98,98,87,87,87,87,98,98,110,110], thirds=[131,131,131,131,123,123,123,123,110,110,110,110,123,123,131,131];
  let step=0,timer=0,stopped=false;
  const tick=()=>{if(stopped)return;const when=context.currentTime+.03,i=step%melody.length,note=melody[i],root=roots[Math.floor(i/4)%roots.length],third=thirds[Math.floor(i/4)%thirds.length];
    playTone(context,bus.master,note,.13,.057,"triangle",when);
    if(i%4===0){playTone(context,bus.master,root,.56,.053,"sine",when);playTone(context,bus.master,third,.56,.024,"sine",when);playTone(context,bus.master,root*1.5,.56,.018,"triangle",when);}
    if(note)playTone(context,bus.master,note/2,.17,.023,"triangle",when+.03);
    step=(step+1)%melody.length;timer=window.setTimeout(tick,165);
  };
  tick();return()=>{stopped=true;window.clearTimeout(timer);bus.stop();};
}
