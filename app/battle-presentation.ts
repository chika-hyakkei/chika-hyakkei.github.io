export type BattleCommand = "attack" | "guard" | "skill1" | "skill2" | "potion" | "bomb" | "flee";
export type BattlePose = "attack" | "guard" | "magic" | "potion" | "bomb" | "flee";
export type BattlePresentationFx = "" | "slash" | "magic" | "heal" | "blast";

export function battlePresentation(command: BattleCommand, job: string): {
  pose: BattlePose;
  fx: BattlePresentationFx;
} {
  if (command === "attack") return { pose: "attack", fx: "slash" };
  if (command === "guard") return { pose: "guard", fx: "" };
  if (command === "potion") return { pose: "potion", fx: "heal" };
  if (command === "bomb") return { pose: "bomb", fx: "blast" };
  if (command === "flee") return { pose: "flee", fx: "" };

  if (job === "mage") return { pose: "magic", fx: "magic" };
  if (job === "sage") return command === "skill1"
    ? { pose: "magic", fx: "heal" }
    : { pose: "magic", fx: "magic" };
  if (job === "samurai") return command === "skill1"
    ? { pose: "attack", fx: "slash" }
    : { pose: "guard", fx: "" };
  if (job === "alchemist") return command === "skill1"
    ? { pose: "bomb", fx: "blast" }
    : { pose: "potion", fx: "heal" };
  if (job === "priest") return command === "skill1"
    ? { pose: "potion", fx: "heal" }
    : { pose: "guard", fx: "" };
  if (job === "knight") return { pose: "guard", fx: "" };
  if (job === "warrior" && command === "skill2") return { pose: "guard", fx: "" };
  return { pose: "attack", fx: "slash" };
}

export const PLAYER_IMPACT_DELAY_MS = 250;
export const ENEMY_IMPACT_DELAY_MS = 220;
