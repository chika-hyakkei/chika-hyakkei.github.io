"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { advanceDescent, createDescent, DESCENT_LOOKAHEAD_MS, DESCENT_MAX_PROGRESS, descentSupplyAward, type DescentState, type DescentEventKind } from "./descent";
import { pick } from "./content-localization";
import type { Locale } from "./i18n";

function DescentObject({ kind }: { kind: DescentEventKind }) {
  return <svg viewBox="0 0 24 20" aria-hidden="true" shapeRendering="crispEdges">
    {kind === "rock" ? <><path fill="#11191f" d="M7 1h10v2h3v4h3v9h-3v3H4v-3H1V7h3V3h3z"/><path fill="#77848c" d="M7 3h9v2h3v3h2v7h-3v2H5v-3H3V8h3z"/><path fill="#b9c3b9" d="M8 4h7v2H9v3H6V7h2z"/><path fill="#414958" d="M16 8h3v6h-4v2H7v-3h8z"/></>
      : kind === "bat" ? <><path fill="#171323" d="M0 2h3v3h3v3h3V4h2v2h2V4h2v4h3V5h3V2h3v10h-3v3h-4v2h-2v3H9v-3H7v-2H3v-3H0z"/><path fill="#9574bd" d="M2 6h2v3h4v3h2v4h4v-4h2V9h4V6h2v5h-3v2h-4v3H9v-3H5v-2H2z"/><path fill="#f9b4aa" d="M9 9h2v2H9zm4 0h2v2h-2z"/></>
      : <><path fill="#342216" d="M3 2h18v3h2v14H1V5h2z"/><path fill="#e6ac48" d="M4 4h16v3h1v10H3V7h1z"/><path fill="#81502b" d="M6 5h4v5H6zm8 0h4v5h-4zM5 12h5v4H5zm9 0h5v4h-5z"/><path fill="#fff1ae" d="M4 4h16v2H4zm6 5h4v5h-4z"/><path fill="#2d251c" d="M11 10h2v3h-2z"/></>}
  </svg>;
}

export function DescentGame({ initial, locale, onClose, onLand, onSound }: {
  initial: DescentState; locale: Locale; onClose: () => void;
  onLand: (state: DescentState) => void; onSound: (kind: "hit" | "crate") => void;
}) {
  const [state, setState] = useState(initial), [paused, setPaused] = useState(false);
  const input = useRef({ axis: 0, targetX: undefined as number | undefined });
  const keys = useRef(new Set<string>()), lastSound = useRef(-1);
  const active = state.status === "falling";
  useEffect(() => {
    if (!active || paused) return;
    let frame = 0, previous = 0;
    const tick = (now: number) => {
      if (previous) setState(value => advanceDescent(value, input.current, Math.min(50, now - previous)));
      previous = now; frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, paused]);
  useEffect(() => {
    if (state.lastEvent && state.lastEventAt > lastSound.current) {
      lastSound.current = state.lastEventAt; onSound(state.lastEvent);
    }
  }, [state.lastEvent, state.lastEventAt, onSound]);
  useEffect(() => {
    const reset = () => { keys.current.clear(); input.current = { axis: 0, targetX: undefined }; };
    const suspend = () => { reset(); if (active) setPaused(true); };
    const visibility = () => { if (document.hidden) suspend(); };
    const key = (event: KeyboardEvent, down: boolean) => {
      if ((event.target as HTMLElement)?.matches("input,textarea")) return;
      const code = event.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d"].includes(code)) {
        event.preventDefault(); down ? keys.current.add(code) : keys.current.delete(code);
        input.current = { axis: Number(keys.current.has("arrowright") || keys.current.has("d")) - Number(keys.current.has("arrowleft") || keys.current.has("a")), targetX: undefined };
      } else if (code === " " && down && !event.repeat && active) { event.preventDefault(); reset(); setPaused(value => !value); }
    };
    const down = (event: KeyboardEvent) => key(event, true), up = (event: KeyboardEvent) => key(event, false);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    window.addEventListener("blur", suspend); document.addEventListener("visibilitychange", visibility);
    return () => { reset(); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", suspend); document.removeEventListener("visibilitychange", visibility); };
  }, [active]);
  const steer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    input.current = { axis: 0, targetX: ((event.clientX - rect.left) / rect.width - .5) / .4 };
  };
  const start = () => { input.current = { axis: 0, targetX: undefined }; setPaused(false); setState(value => ({ ...value, status: "falling" })); };
  const award = descentSupplyAward(state), flash = state.progress - state.lastEventAt < 550;
  return <div className="overlay descent-overlay"><section className="modal descent-modal descent-v2" role="dialog" aria-modal="true" aria-label={pick(locale,"奈落降下","Abyss Descent")}>
    <header><div><small>ABYSS DESCENT</small><h2>{pick(locale,"奈落降下","Abyss Descent")}</h2></div><button onClick={onClose} aria-label={pick(locale,"降下をやめる","Cancel descent")}>×</button></header>
    <div className="descent-hud"><span aria-label={`${state.integrity}/3`}>{"♥".repeat(state.integrity)}<i>{"♡".repeat(3-state.integrity)}</i></span><span><DescentObject kind="crate"/> {state.crates}</span><b>{Math.ceil((DESCENT_MAX_PROGRESS-state.progress)/1000)}s</b></div>
    <div className={`descent-field ${active&&!paused?"running":""} ${flash&&state.lastEvent==="hit"?"hit":""}`}
      onPointerDown={event=>{ if (!active || paused) return; event.currentTarget.setPointerCapture(event.pointerId); steer(event); }}
      onPointerMove={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))steer(event);}}
      onPointerCancel={()=>{input.current={axis:0,targetX:undefined};}}
      aria-label={pick(locale,"指で左右にスライドして移動","Slide left or right to steer")}>
      <div className="descent-flow" style={{transform:`translateY(${-(state.progress*.12%96)}px)`}}/>
      <div className="descent-depth"><span>{pick(locale,"着地まで","TO LANDING")}</span><strong>{Math.round((1-state.progress/DESCENT_MAX_PROGRESS)*100)}%</strong></div>
      {state.events.filter(event=>event.progress>state.progress-600&&event.progress<state.progress+DESCENT_LOOKAHEAD_MS).map(event=><div key={event.id} className={`descent-sprite ${event.kind} ${state.resolvedEventIds.includes(event.id)?"passed":""}`} style={{width:`${event.radius*80}%`,left:`${50+event.x*40}%`,top:`${29+(event.progress-state.progress)/DESCENT_LOOKAHEAD_MS*85}%`}}><DescentObject kind={event.kind}/></div>)}
      <div className={`descent-explorer ${state.progress<state.invulnerableUntil?"protected":""}`} style={{left:`${50+state.x*40}%`}}><span className="canopy"/><img src={flash&&state.lastEvent==="hit"?"/assets/hero-hit.png":"/assets/hero-front-a.png"} alt={pick(locale,"探索者","Explorer")}/></div>
      {flash&&<span className={`descent-feedback ${state.lastEvent}`}>{state.lastEvent==="crate"?pick(locale,"補給 +1","SUPPLY +1"):pick(locale,"被弾！","HIT!")}</span>}
      {(state.status==="ready"||paused)&&<div className="descent-ready"><strong>{paused?pick(locale,"一時停止","Paused"):pick(locale,"左右に避けて、潜り抜けろ！","Dodge. Dive. Reach the depths!")}</strong>{!paused&&<><p>{pick(locale,"指で左右にスライド / ← → 長押し","Slide left/right · Hold ← →")}</p><div className="descent-legend"><span><DescentObject kind="rock"/><DescentObject kind="bat"/>{pick(locale,"避ける","DODGE")}</span><span><DescentObject kind="crate"/>{pick(locale,"取る","COLLECT")}</span></div><small>{pick(locale,"20秒で着地・3回当たると失敗","Land in 20 seconds · Three hits ends the dive")}</small></>}<button className="primary" onClick={paused?()=>setPaused(false):start}>{paused?pick(locale,"再開","Resume"):pick(locale,"降下開始！","DIVE!")}</button></div>}
      {active&&!paused&&state.progress<700&&<span className="descent-go">GO!</span>}
      {(state.status==="landed"||state.status==="failed")&&<div className="descent-ready descent-result"><strong>{state.status==="landed"?pick(locale,"着地成功！","LANDED!"):pick(locale,"もう一度いこう！","ONE MORE DIVE!")}</strong><p>{state.status==="landed"?pick(locale,`地下${state.targetFloor}階へ。回復薬${award.potions}個・爆裂石${award.bombs}個を支給。`,`Floor ${state.targetFloor}. ${award.potions} Potions and ${award.bombs} Blast Stones supplied.`):pick(locale,"失ったものはありません。左右に大きく避けよう。","Nothing was lost. Give obstacles a wider berth.")}</p><button className="primary" onClick={state.status==="landed"?()=>onLand(state):()=>{lastSound.current=-1;setState(createDescent(state.targetFloor,Date.now()));}}>{state.status==="landed"?pick(locale,`地下${state.targetFloor}階を探索する`,`Explore Floor ${state.targetFloor}`):pick(locale,"もう一度","Try Again")}</button><button onClick={onClose}>{pick(locale,"地上へ戻る","Return to Surface")}</button></div>}
    </div>
    <div className="descent-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.progress/DESCENT_MAX_PROGRESS*100)}><i style={{width:`${state.progress/DESCENT_MAX_PROGRESS*100}%`}}/></div>
    <div className="descent-controls">{([-1,1] as const).map(direction=><button key={direction} disabled={!active||paused} aria-label={direction<0?pick(locale,"左へ","Left"):pick(locale,"右へ","Right")} onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);input.current={axis:direction,targetX:undefined};}} onPointerUp={()=>{input.current={axis:0,targetX:undefined};}} onPointerCancel={()=>{input.current={axis:0,targetX:undefined};}}>{direction<0?"◀":"▶"}</button>)}<button disabled={!active} onClick={()=>{input.current={axis:0,targetX:undefined};setPaused(value=>!value);}} aria-label={pick(locale,"一時停止・再開","Pause or resume")}>{paused?"▶":"Ⅱ"}</button></div>
    <small>{pick(locale,`目標：地下${state.targetFloor}階｜貸与装備で開始・総合ランキング対象外`,`Target: Floor ${state.targetFloor} · Loaned gear · Separate from global ranking`)}</small>
  </section></div>;
}
