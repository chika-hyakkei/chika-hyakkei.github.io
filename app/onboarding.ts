export type GuideStep = "move" | "intent" | "guard" | "heal" | "status";
export type GuideProgress = Record<GuideStep, boolean>;

export const ONBOARDING_KEY = "chika-hyakkei-onboarding-v1";
export const emptyGuideProgress = (): GuideProgress => ({ move:false, intent:false, guard:false, heal:false, status:false });

export function normalizeGuideProgress(value: unknown): GuideProgress {
  const source=value&&typeof value==="object"?value as Partial<GuideProgress>:{};
  return { move:Boolean(source.move), intent:Boolean(source.intent), guard:Boolean(source.guard), heal:Boolean(source.heal), status:Boolean(source.status) };
}

export function nextGuideStep(progress: GuideProgress, state: { active:boolean; phase?:string; intent?:string; hp?:number; maxHp?:number; potions?:number; hasStatus?:boolean }): GuideStep|null {
  if(!state.active)return null;
  if(!progress.move)return "move";
  if(state.phase==="battle"&&!progress.intent)return "intent";
  if(state.phase==="battle"&&state.intent==="heavy"&&!progress.guard)return "guard";
  if(state.hasStatus&&!progress.status)return "status";
  if(state.phase==="battle"&&(state.hp??0)/Math.max(1,state.maxHp??1)<=.65&&(state.potions??0)>0&&!progress.heal)return "heal";
  return null;
}
