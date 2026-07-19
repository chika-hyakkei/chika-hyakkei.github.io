export interface Env { DB: D1Database; ALLOWED_ORIGIN?: string }

type Result = "dead" | "return" | "clear";
type Submission = { playerId: string; name: string; job: string; floor: number; score: number; kills: number; bosses: number; result: Result };
type RecordRow = Submission & { all_score: number; all_floor: number; all_bosses: number; all_kills: number; all_result: Result; all_played_at: string; week_key: string; week_score: number; week_floor: number; week_bosses: number; week_kills: number; week_result: Result; week_played_at: string; last_submit_at: number };

const jobs = new Set(["warrior", "thief", "priest", "mage", "knight", "sage"]);
const text = (body: unknown, status = 200, extra: HeadersInit = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...extra } });
const better = (next: Submission, old: { score: number; floor: number; bosses: number; kills: number }) => next.score > old.score || (next.score === old.score && (next.floor > old.floor || (next.floor === old.floor && (next.bosses > old.bosses || (next.bosses === old.bosses && next.kills > old.kills)))));
const weekKey = (date: Date) => { const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); const day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day); const year = d.getUTCFullYear(); const first = new Date(Date.UTC(year, 0, 1)); return `${year}-${String(Math.ceil((((d.getTime() - first.getTime()) / 86400000) + 1) / 7)).padStart(2, "0")}`; };
const cors = (request: Request, env: Env) => ({ "access-control-allow-origin": request.headers.get("origin") === (env.ALLOWED_ORIGIN ?? "https://chika-hyakkei.github.io") ? request.headers.get("origin")! : (env.ALLOWED_ORIGIN ?? "https://chika-hyakkei.github.io"), "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type", vary: "Origin" });
const valid = (value: unknown): value is Submission => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.playerId === "string" && /^[a-f0-9-]{20,64}$/i.test(v.playerId)
    && typeof v.name === "string" && Array.from(v.name.trim()).length >= 1 && Array.from(v.name.trim()).length <= 8
    && typeof v.job === "string" && jobs.has(v.job)
    && [v.floor, v.score, v.kills, v.bosses].every(Number.isInteger)
    && typeof v.floor === "number" && v.floor >= 1 && v.floor <= 100
    && typeof v.score === "number" && v.score >= 0 && v.score <= 9_999_999
    && typeof v.kills === "number" && v.kills >= 0 && v.kills <= 10_000
    && typeof v.bosses === "number" && v.bosses >= 0 && v.bosses <= 10
    && (v.result === "dead" || v.result === "return" || v.result === "clear");
};

export default {
  async fetch(request: Request, env: Env) {
    const headers = cors(request, env);
    if (request.method === "OPTIONS") return new Response(null, { headers });
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/leaderboard") {
      const weekly = url.searchParams.get("scope") !== "all";
      const columns = weekly ? "week_score score, week_floor floor, week_kills kills, week_bosses bosses, week_result result, week_played_at playedAt" : "all_score score, all_floor floor, all_kills kills, all_bosses bosses, all_result result, all_played_at playedAt";
      const where = weekly ? "WHERE week_key = ?" : "";
      const order = weekly ? "week_score DESC, week_floor DESC, week_played_at ASC" : "all_score DESC, all_floor DESC, all_played_at ASC";
      const query = `SELECT display_name name, ${columns} FROM ranking_records ${where} ORDER BY ${order} LIMIT 100`;
      const statement = weekly ? env.DB.prepare(query).bind(weekKey(new Date())) : env.DB.prepare(query);
      const { results = [] } = await statement.all<Record<string, unknown>>();
      return text({ entries: results.map((entry, index) => ({ rank: index + 1, ...entry })) }, 200, headers);
    }
    if (request.method === "POST" && url.pathname === "/submit") {
      if (request.headers.get("origin") !== (env.ALLOWED_ORIGIN ?? "https://chika-hyakkei.github.io")) return text({ error: "このサイトからのみ送信できます。" }, 403, headers);
      const data = await request.json().catch(() => null);
      if (!valid(data)) return text({ error: "記録の形式が正しくありません。" }, 400, headers);
      const input = { ...data, name: data.name.trim() };
      const now = Date.now(), playedAt = new Date(now).toISOString(), week = weekKey(new Date(now));
      const existing = await env.DB.prepare("SELECT * FROM ranking_records WHERE player_id = ?").bind(input.playerId).first<RecordRow>();
      if (existing && now - existing.last_submit_at < 20_000) return text({ error: "少し待ってからもう一度送信してください。" }, 429, headers);
      const keepAll = existing && !better(input, { score: existing.all_score, floor: existing.all_floor, bosses: existing.all_bosses, kills: existing.all_kills });
      const keepWeek = existing && existing.week_key === week && !better(input, { score: existing.week_score, floor: existing.week_floor, bosses: existing.week_bosses, kills: existing.week_kills });
      const all = keepAll ? { score: existing.all_score, floor: existing.all_floor, kills: existing.all_kills, bosses: existing.all_bosses, result: existing.all_result, playedAt: existing.all_played_at } : { ...input, playedAt };
      const weekly = keepWeek ? { score: existing.week_score, floor: existing.week_floor, kills: existing.week_kills, bosses: existing.week_bosses, result: existing.week_result, playedAt: existing.week_played_at } : { ...input, playedAt };
      await env.DB.prepare(`INSERT INTO ranking_records (player_id, display_name, all_floor, all_score, all_kills, all_bosses, all_result, all_played_at, week_key, week_floor, week_score, week_kills, week_bosses, week_result, week_played_at, last_submit_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(player_id) DO UPDATE SET display_name=excluded.display_name, all_floor=excluded.all_floor, all_score=excluded.all_score, all_kills=excluded.all_kills, all_bosses=excluded.all_bosses, all_result=excluded.all_result, all_played_at=excluded.all_played_at, week_key=excluded.week_key, week_floor=excluded.week_floor, week_score=excluded.week_score, week_kills=excluded.week_kills, week_bosses=excluded.week_bosses, week_result=excluded.week_result, week_played_at=excluded.week_played_at, last_submit_at=excluded.last_submit_at`).bind(input.playerId, input.name, all.floor, all.score, all.kills, all.bosses, all.result, all.playedAt, week, weekly.floor, weekly.score, weekly.kills, weekly.bosses, weekly.result, weekly.playedAt, now).run();
      return text({ ok: true }, 200, headers);
    }
    return text({ error: "見つかりません。" }, 404, headers);
  },
} satisfies ExportedHandler<Env>;
