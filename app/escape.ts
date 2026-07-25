export type EscapePoint = { x: number; y: number };
export type EscapeEnemy = EscapePoint & { id: number };

/**
 * 逃走直後の敵を同じ階の離れた通路へ戻す。
 * 討伐扱いにはせず、他の敵やプレイヤーと重ならない最遠の床を選ぶ。
 */
export function retreatEnemyAfterEscape<T extends EscapeEnemy>(
  map: readonly (readonly string[])[],
  player: EscapePoint,
  enemies: readonly T[],
  escapedId: number,
): T[] {
  const occupied = new Set(
    enemies.filter(enemy => enemy.id !== escapedId).map(enemy => `${enemy.x},${enemy.y}`),
  );
  const candidates: Array<EscapePoint & { distance: number }> = [];

  map.forEach((row, y) => row.forEach((tile, x) => {
    if (tile !== "." || (x === player.x && y === player.y) || occupied.has(`${x},${y}`)) return;
    candidates.push({ x, y, distance: Math.abs(x - player.x) + Math.abs(y - player.y) });
  }));

  candidates.sort((a, b) => b.distance - a.distance || a.y - b.y || a.x - b.x);
  const destination = candidates[0];
  if (!destination) return [...enemies];

  return enemies.map(enemy => (
    enemy.id === escapedId ? { ...enemy, x: destination.x, y: destination.y } : enemy
  ));
}
