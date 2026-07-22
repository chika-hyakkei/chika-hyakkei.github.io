import assert from "node:assert/strict";
import test from "node:test";
import { flushPendingRankings, PENDING_RANKING_KEY, submitRankingReliably } from "../app/ranking.ts";

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

test("keeps a failed ranking submission and retries it without creating a new identity", async () => {
  globalThis.localStorage = new MemoryStorage();
  globalThis.window = { __CHIKA_RANKING_API_URL__: "https://ranking.test" };
  const submission = { submissionId: "11111111-1111-4111-8111-111111111111", playerId: "22222222-2222-4222-8222-222222222222", name: "ナナシ", job: "warrior", floor: 12, score: 12345, kills: 9, bosses: 1, result: "dead" };
  globalThis.fetch = async () => { throw new Error("offline"); };
  await assert.rejects(submitRankingReliably(submission), /offline/);
  const pending = JSON.parse(localStorage.getItem(PENDING_RANKING_KEY));
  assert.equal(pending.length, 1);
  assert.equal(pending[0].submissionId, submission.submissionId);

  const sentBodies = [];
  globalThis.fetch = async (_url, init) => { sentBodies.push(JSON.parse(init.body)); return new Response(JSON.stringify({ entryId: "77" }), { status: 200, headers: { "content-type": "application/json" } }); };
  assert.deepEqual(await flushPendingRankings(), { sent: 1, remaining: 0 });
  assert.equal(sentBodies[0].submissionId, submission.submissionId);
  assert.deepEqual(JSON.parse(localStorage.getItem(PENDING_RANKING_KEY)), []);
});
