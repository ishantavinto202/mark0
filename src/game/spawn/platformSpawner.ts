import { PLATFORM, PLATFORM_WEIGHTS, SPAWN } from '@/game/constants';
import { mulberry32, randInt, randRange } from '@/game/math/rng';
import type { GameModel, PlatformKind } from '@/game/types';

type Rng = ReturnType<typeof mulberry32>;

function pickKind(
  rng: Rng,
  brownCooldownRows: number,
  rowAlreadyHasBrown: boolean,
): PlatformKind {
  if (brownCooldownRows > 0 || rowAlreadyHasBrown) {
    const r = rng();
    const g =
      PLATFORM_WEIGHTS.green /
      (PLATFORM_WEIGHTS.green + PLATFORM_WEIGHTS.blue);
    return r < g ? 'green' : 'blue';
  }
  const t = rng();
  let acc = 0;
  const kinds: PlatformKind[] = ['green', 'brown', 'blue'];
  for (const k of kinds) {
    acc += PLATFORM_WEIGHTS[k];
    if (t <= acc) return k;
  }
  return 'green';
}

function nextId(g: GameModel): string {
  g.idCounter += 1;
  return `p_${g.idCounter}`;
}

export function spawnPlatformRow(g: GameModel, rng: Rng): void {
  const w = g.width;
  const gap = randRange(rng, SPAWN.minJumpGap, SPAWN.maxJumpGap);
  const y = g.nextSpawnY - gap;
  const count = randInt(rng, 2, 3);

  const slots: number[] = [];
  for (let i = 0; i < count; i += 1) {
    slots.push(randRange(rng, w * 0.06, w * 0.94 - PLATFORM.maxWidth));
  }
  slots.sort((a, b) => a - b);

  let rowHasBrown = false;
  for (let i = 0; i < count; i += 1) {
    const kind = pickKind(rng, g.brownCooldownRows, rowHasBrown);
    if (kind === 'brown') {
      rowHasBrown = true;
    }

    const pw = randInt(rng, PLATFORM.minWidth, PLATFORM.maxWidth);
    let x = slots[i] ?? w * 0.2;
    x = Math.max(16, Math.min(x, w - pw - 16));

    g.platforms.push({
      id: nextId(g),
      y,
      width: pw,
      height: PLATFORM.height,
      kind,
      baseX: x,
      moveRange: kind === 'blue' ? PLATFORM.blueMoveRange : 0,
      moveSpeed: kind === 'blue' ? PLATFORM.blueMoveSpeed : 0,
      movePhase: randRange(rng, 0, Math.PI * 2),
      broken: false,
      breakTimer: 0,
      breaking: false,
      shakePhase: 0,
    });
  }

  g.lastSpawnWasBrown = rowHasBrown;
  if (rowHasBrown) {
    g.brownCooldownRows = SPAWN.brownCooldownRows;
  } else if (g.brownCooldownRows > 0) {
    g.brownCooldownRows -= 1;
  }

  g.nextSpawnY = y;
}

export function spawnObstacleIfNeeded(g: GameModel, rng: Rng): void {
  if (g.obstacles.length > 6) return;
  if (rng() > 0.01 * g.difficulty) return;
  const plat = g.platforms[g.platforms.length - 1];
  if (!plat || plat.kind === 'brown') return;
  const ox = plat.baseX + plat.width / 2 - 16;
  const oy = plat.y - 44;
  g.obstacles.push({
    id: `o_${g.idCounter++}`,
    x: ox,
    y: oy,
    w: 32,
    h: 48,
  });
}
