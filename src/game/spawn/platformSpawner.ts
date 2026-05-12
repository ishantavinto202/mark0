import { PLATFORM, PLATFORM_WEIGHTS, SPAWN } from '@/game/constants';
import { JUMP_REACH } from '@/game/math/jumpReach';
import { mulberry32, randInt, randRange } from '@/game/math/rng';
import type { GameModel, PlatformKind, PlatformModel } from '@/game/types';

type Rng = ReturnType<typeof mulberry32>;

function pickKind(
  rng: Rng,
  brownCooldownRows: number,
): PlatformKind {
  if (brownCooldownRows > 0) {
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

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Center X of a platform, accounting for blue's horizontal oscillation. */
function platformCenterX(p: PlatformModel): number {
  return p.baseX + p.width / 2;
}

/**
 * Score-driven multiplier applied to blue platforms' `moveSpeed` at spawn.
 * Linear from 1.0 at score 0 up to `SPAWN.blueSpeedMaxMultiplier` at
 * `SPAWN.blueSpeedRampScore`, then held flat. Locking in at spawn (rather
 * than scaling per tick) keeps each platform's velocity predictable for
 * the player and preserves the spawner's reachability guarantees, which
 * depend on `moveRange` and frame-by-frame stability of `moveSpeed`.
 */
function blueSpeedMultiplier(score: number): number {
  const t = clamp(score / SPAWN.blueSpeedRampScore, 0, 1);
  return 1 + t * (SPAWN.blueSpeedMaxMultiplier - 1);
}

/**
 * Spawn a single platform one step above the previous spawn. Vertical step is
 * always within the player's max reachable jump height (with a safety margin),
 * horizontal step from the previous platform is always within practical
 * sideways reach, and no two platforms share a Y row — this guarantees a clean,
 * staggered upward path.
 */
export function spawnPlatformRow(g: GameModel, rng: Rng): void {
  const w = g.width;

  // Vertical step: clamp to physics-derived reachable peak (with margin) so it
  // is impossible to author an unreachable gap.
  const safeMaxGap = Math.min(
    SPAWN.maxJumpGap,
    Math.floor(JUMP_REACH.peakHeight * 0.72),
  );
  const safeMinGap = Math.min(SPAWN.minJumpGap, safeMaxGap - 1);
  const gap = randRange(rng, safeMinGap, safeMaxGap);
  const y = g.nextSpawnY - gap;

  const kind = pickKind(rng, g.brownCooldownRows);
  const pw = randInt(rng, PLATFORM.minWidth, PLATFORM.maxWidth);

  // Anchor from the previously spawned platform so we can guarantee horizontal
  // reachability. Fall back to screen-center for the very first spawn.
  const prev = g.platforms.length > 0 ? g.platforms[g.platforms.length - 1] : undefined;
  const prevCenterX = prev ? platformCenterX(prev) : w / 2;

  // For blue (moving) prev platforms, treat their worst-case position as the
  // anchor — guarantees reachability even if blue has drifted to the far edge.
  const prevWobble = prev && prev.kind === 'blue' ? prev.moveRange : 0;

  // Max horizontal step gets a tiny bonus for closer vertical gaps (you have
  // more airtime to redirect for tall jumps, less for short hops anyway).
  const reach = Math.min(
    SPAWN.maxHorizontalStep,
    JUMP_REACH.practicalHorizontalReach,
  );

  // Allowed center-X window: within reach of prev center, clamped to screen.
  const minCenterReachable = prevCenterX - (reach - prevWobble);
  const maxCenterReachable = prevCenterX + (reach - prevWobble);

  // Account for blue's own horizontal wobble so its baseX stays on-screen.
  const wobbleSelf = kind === 'blue' ? PLATFORM.blueMoveRange : 0;
  const minCenterScreen = PLATFORM.edgeMargin + pw / 2 + wobbleSelf;
  const maxCenterScreen = w - PLATFORM.edgeMargin - pw / 2 - wobbleSelf;

  let minCenter = Math.max(minCenterReachable, minCenterScreen);
  let maxCenter = Math.min(maxCenterReachable, maxCenterScreen);

  // Encourage a real horizontal stagger so adjacent platforms don't stack on
  // the same X — but only when the screen has the room for it.
  if (maxCenter - minCenter > SPAWN.minHorizontalStep * 2) {
    // Carve out a deadzone around prev center, prefer the side with more room.
    const leftRoom = prevCenterX - SPAWN.minHorizontalStep - minCenter;
    const rightRoom = maxCenter - (prevCenterX + SPAWN.minHorizontalStep);
    const goRight = rightRoom <= 0
      ? false
      : leftRoom <= 0
        ? true
        : rng() < rightRoom / (leftRoom + rightRoom);
    if (goRight) {
      minCenter = prevCenterX + SPAWN.minHorizontalStep;
    } else {
      maxCenter = prevCenterX - SPAWN.minHorizontalStep;
    }
  }

  if (maxCenter < minCenter) {
    // Window collapsed (very narrow screen) — fall back to the midpoint.
    const mid = clamp((minCenterScreen + maxCenterScreen) / 2, minCenterScreen, maxCenterScreen);
    minCenter = mid;
    maxCenter = mid;
  }

  const centerX = randRange(rng, minCenter, maxCenter);
  const x = clamp(centerX - pw / 2, PLATFORM.edgeMargin, w - PLATFORM.edgeMargin - pw);

  const blueSpeed =
    kind === 'blue' ? PLATFORM.blueMoveSpeed * blueSpeedMultiplier(g.score) : 0;

  g.platforms.push({
    id: nextId(g),
    y,
    width: pw,
    height: PLATFORM.height,
    kind,
    baseX: x,
    moveRange: kind === 'blue' ? PLATFORM.blueMoveRange : 0,
    moveSpeed: blueSpeed,
    movePhase: randRange(rng, 0, Math.PI * 2),
    broken: false,
    breakTimer: 0,
    breaking: false,
    shakePhase: 0,
  });

  g.lastSpawnWasBrown = kind === 'brown';
  if (kind === 'brown') {
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
