export interface Env { DB: D1Database; ALLOWED_ORIGIN?: string }

type Result = "dead" | "return" | "abandon" | "clear";
type Submission = { playerId: string; name: string; job: string; floor: number; score: number; kills: number; bosses: number; result: Result };

const jobs = new Set(["warrior", "thief", "priest", "mage", "knight", "sage"]);
const text = (body: unknown, status = 200, extra: HeadersInit = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...extra } });
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
    && (v.result === "dead" || v.result === "return" || v.result === "abandon" || v.result === "clear");
};

export default {
  async fetch(request: Request, env: Env) {
    const headers = cors(request, env);
    if (request.method === "OPTIONS") return new Response(null, { headers });
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/leaderboard") {
      const weekly = url.searchParams.get("scope") !== "all";
      const highlight = url.searchParams.get("highlight") ?? "";
      const where = weekly ? "WHERE week_key = ?" : "";
      const query = `SELECT id, display_name name, job, floor, score, kills, bosses, result, played_at playedAt FROM ranking_runs ${where} ORDER BY score DESC, floor DESC, played_at ASC LIMIT 100`;
      const statement = weekly ? env.DB.prepare(query).bind(weekKey(new Date())) : env.DB.prepare(query);
      const { results = [] } = await statement.all<Record<string, unknown>>();
      return text({ entries: results.map((entry, index) => ({ rank: index + 1, ...entry, highlighted: String(entry.id) === highlight })) }, 200, headers);
    }
    if (request.method === "POST" && url.pathname === "/submit") {
      if (request.headers.get("origin") !== (env.ALLOWED_ORIGIN ?? "https://chika-hyakkei.github.io")) return text({ error: "このサイトからのみ送信できます。" }, 403, headers);
      const data = await request.json().catch(() => null);
      if (!valid(data)) return text({ error: "記録の形式が正しくありません。" }, 400, headers);
      const input = { ...data, name: data.name.trim() };
      const playedAt = new Date().toISOString(), week = weekKey(new Date());
      const created = await env.DB.prepare("INSERT INTO ranking_runs (player_id, display_name, job, floor, score, kills, bosses, result, played_at, week_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(input.playerId, input.name, input.job, input.floor, input.score, input.kills, input.bosses, input.result, playedAt, week).run();
      return text({ ok: true, entryId: String(created.meta.last_row_id) }, 200, headers);
    }
    return text({ error: "見つかりません。" }, 404, headers);
  },
} satisfies ExportedHandler<Env>;
