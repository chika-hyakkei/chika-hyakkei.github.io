import test from "node:test";
import assert from "node:assert/strict";
import { retreatEnemyAfterEscape } from "../app/escape.ts";

test("moves the escaped enemy away without removing it or moving other enemies", () => {
  const map = [
    ["#","#","#","#","#","#","#"],
    ["#",".",".",".",".",".","#"],
    ["#",".",".",".",".",".","#"],
    ["#",".",".",".",".",".","#"],
    ["#",".",".",".",".",".","#"],
    ["#",".",".",".",".",".","#"],
    ["#","#","#","#","#","#","#"],
  ];
  const player = { x: 3, y: 3 };
  const enemies = [
    { id: 10, x: 4, y: 3, kind: 1 },
    { id: 20, x: 1, y: 1, kind: 2 },
  ];

  const moved = retreatEnemyAfterEscape(map, player, enemies, 10);
  const escaped = moved.find(enemy => enemy.id === 10);

  assert.equal(moved.length, enemies.length);
  assert.deepEqual(moved.find(enemy => enemy.id === 20), enemies[1]);
  assert.ok(escaped);
  assert.notDeepEqual({ x: escaped.x, y: escaped.y }, { x: 4, y: 3 });
  assert.ok(Math.abs(escaped.x - player.x) + Math.abs(escaped.y - player.y) >= 4);
});

test("keeps the enemy when no free floor exists", () => {
  const enemies = [{ id: 10, x: 1, y: 1 }];
  assert.deepEqual(
    retreatEnemyAfterEscape([["#","#","#"],["#",".","#"],["#","#","#"]], { x: 1, y: 1 }, enemies, 10),
    enemies,
  );
});
