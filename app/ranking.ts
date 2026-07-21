export type RankingScope = "weekly" | "all";
export type RankingEntry = {
  id: string;
  rank: number;
  name: string;
  job: string;
  floor: number;
  score: number;
  kills: number;
  bosses: number;
  result: "dead" | "return" | "abandon" | "clear";
  playedAt: string;
  highlighted?: boolean;
};

export type RankingSubmission = Omit<RankingEntry, "id" | "rank" | "playedAt" | "highlighted"> & { playerId: string };

declare global {
  interface Window { __CHIKA_RANKING_API_URL__?: string }
}

const endpoint = () => typeof window === "undefined" ? "" : (window.__CHIKA_RANKING_API_URL__ ?? "").replace(/\/$/, "");
export const rankingAvailable = () => Boolean(endpoint());

export function rankingPlayerId() {
  const key = "chika-hyakkei-ranking-player-v1";
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

export async function loadRanking(scope: RankingScope, highlightId?: string | null) {
  const base = endpoint();
  if (!base) throw new Error("ランキングサーバーは準備中です。");
  const query = new URLSearchParams({ scope });
  if (highlightId) query.set("highlight", highlightId);
  const response = await fetch(`${base}/leaderboard?${query}`, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("ランキングを読み込めませんでした。");
  const body = await response.json() as { entries?: RankingEntry[] };
  return body.entries ?? [];
}

export async function submitRanking(submission: RankingSubmission) {
  const base = endpoint();
  if (!base) throw new Error("ランキングサーバーは準備中です。");
  const response = await fetch(`${base}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(submission) });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? "記録を送信できませんでした。");
  }
  return response.json() as Promise<{ entryId: string }>;
}
