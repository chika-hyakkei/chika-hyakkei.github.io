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

export type RankingSubmission = Omit<RankingEntry, "id" | "rank" | "playedAt" | "highlighted"> & { playerId: string; submissionId: string };

export const PENDING_RANKING_KEY = "chika-hyakkei-ranking-pending-v1";

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

const pendingRankings = () => {
  try {
    const value = JSON.parse(localStorage.getItem(PENDING_RANKING_KEY) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter((entry): entry is RankingSubmission => Boolean(entry && typeof entry === "object" && typeof (entry as RankingSubmission).submissionId === "string")) : [];
  } catch { return []; }
};

const writePendingRankings = (entries: RankingSubmission[]) => localStorage.setItem(PENDING_RANKING_KEY, JSON.stringify(entries.slice(-20)));
export const queueRanking = (submission: RankingSubmission) => {
  const entries = pendingRankings();
  if (!entries.some(entry=>entry.submissionId===submission.submissionId)) writePendingRankings([...entries,submission]);
};
const removeQueuedRanking = (submissionId: string) => writePendingRankings(pendingRankings().filter(entry=>entry.submissionId!==submissionId));

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

export async function submitRankingReliably(submission: RankingSubmission) {
  queueRanking(submission);
  const recorded = await submitRanking(submission);
  removeQueuedRanking(submission.submissionId);
  return recorded;
}

export async function flushPendingRankings() {
  let sent = 0;
  for (const submission of pendingRankings()) {
    try { await submitRanking(submission); removeQueuedRanking(submission.submissionId); sent++; }
    catch { break; }
  }
  return { sent, remaining: pendingRankings().length };
}
