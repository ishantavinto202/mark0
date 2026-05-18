import { ENEMY, PLATFORM, PLATFORM_WEIGHTS, SPAWN, SPRING, TILE_SIZE } from '@/game/constants';
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
      PLATFORM_WEIGHTS.blue /
      (PLATFORM_WEIGHTS.blue + PLATFORM_WEIGHTS.darkBlue);
    return r < g ? 'blue' : 'darkBlue';
  }
  const t = rng();
  let acc = 0;
  const kinds: PlatformKind[] = ['blue', 'grey', 'darkBlue'];
  for (const k of kinds) {
    acc += PLATFORM_WEIGHTS[k];
    if (t <= acc) return k;
  }
  return 'blue';
}

function nextId(g: GameModel): string {
  g.idCounter += 1;
  return `p_${g.idCounter}`;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Center X of a platform, accounting for darkBlue's horizontal oscillation. */
function platformCenterX(p: PlatformModel): number {
  return p.baseX + p.width / 2;
}

/**
 * Score-driven multiplier applied to darkBlue platforms' `moveSpeed` at spawn.
 * Linear from 1.0 at score 0 up to `SPAWN.darkBlueSpeedMaxMultiplier` at
 * `SPAWN.darkBlueSpeedRampScore`, then held flat. Locking in at spawn (rather
 * than scaling per tick) keeps each platform's velocity predictable for
 * the player and preserves the spawner's reachability guarantees, which
 * depend on `moveRange` and frame-by-frame stability of `moveSpeed`.
 */
function darkBlueSpeedMultiplier(score: number): number {
  const t = clamp(score / SPAWN.darkBlueSpeedRampScore, 0, 1);
  return 1 + t * (SPAWN.darkBlueSpeedMaxMultiplier - 1);
}

/**
 * Grey platform tile range, scaled smoothly by difficulty.
 *
 * Early game (difficulty ≈ 1): 4–6 tiles (112–168 px) — wide, forgiving.
 * Mid game  (difficulty ≈ 2–3): 3–5 → 3–4 tiles — narrowing progressively.
 * Late game (difficulty ≈ 4): 2–3 tiles (56–84 px) — tight, high stakes.
 *
 * t = (difficulty − 1) / 3  normalises difficulty [1, 4] → [0, 1].
 * minTiles = round(4 − 2t)  →  4 at start, 2 at max difficulty.
 * maxTiles = round(6 − 3t)  →  6 at start, 3 at max difficulty.
 */
function greyTileRange(difficulty: number): { min: number; max: number } {
  const t = Math.max(0, Math.min(1, (difficulty - 1) / 3));
  const minTiles = Math.max(2, Math.round(4 - 2 * t));
  const maxTiles = Math.max(minTiles, Math.round(6 - 3 * t));
  return { min: minTiles, max: maxTiles };
}

/**
 * Returns the pixel width for a newly spawned platform.
 *
 * - Blue / Dark Blue: random tile count in [PLATFORM.minTiles, PLATFORM.maxTiles].
 * - Grey: tile count drawn from a difficulty-scaled range — wide early,
 *   narrow late — so breakable platforms stay approachable at game start and
 *   become a tighter challenge as the player climbs.
 *
 * All widths are exact multiples of TILE_SIZE: no fractional tiles, no stretch.
 */
function pickWidth(rng: Rng, kind: PlatformKind, difficulty: number): number {
  if (kind === 'grey') {
    const { min, max } = greyTileRange(difficulty);
    return randInt(rng, min, max) * TILE_SIZE;
  }
  return randInt(rng, PLATFORM.minTiles, PLATFORM.maxTiles) * TILE_SIZE;
}

/**
 * Picks a center-X position biased toward the left and right thirds of the
 * screen, reducing density in the center third.
 *
 * The available window [minC, maxC] is split into three zones: left (< w/3),
 * center (w/3..2w/3), and right (> 2w/3). Each zone is weighted by its length,
 * but the center zone's length is multiplied by CENTER_WEIGHT (< 1) so it is
 * chosen far less often than an even split would produce.
 *
 * This forces players to move horizontally from the very start of a run
 * rather than auto-bouncing straight up through stacked center platforms.
 */
const CENTER_WEIGHT = 0.25;

function biasedAwayFromCenter(
  rng: Rng,
  minC: number,
  maxC: number,
  w: number,
): number {
  const leftBoundary = w / 3;
  const rightBoundary = (2 * w) / 3;

  const leftMin = minC;
  const leftMax = Math.min(maxC, leftBoundary);
  const centerMin = Math.max(minC, leftBoundary);
  const centerMax = Math.min(maxC, rightBoundary);
  const rightMin = Math.max(minC, rightBoundary);
  const rightMax = maxC;

  const leftLen = Math.max(0, leftMax - leftMin);
  const centerLen = Math.max(0, centerMax - centerMin);
  const rightLen = Math.max(0, rightMax - rightMin);

  const wLeft = leftLen;
  const wCenter = centerLen * CENTER_WEIGHT;
  const wRight = rightLen;
  const total = wLeft + wCenter + wRight;

  if (total <= 0) return randRange(rng, minC, maxC);

  const r = rng() * total;
  if (r < wLeft && leftLen > 0) {
    return randRange(rng, leftMin, leftMax);
  }
  if (r < wLeft + wCenter && centerLen > 0) {
    return randRange(rng, centerMin, centerMax);
  }
  if (rightLen > 0) {
    return randRange(rng, rightMin, rightMax);
  }
  return randRange(rng, minC, maxC);
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
  const pw = pickWidth(rng, kind, g.difficulty);

  // Anchor from the previously spawned platform so we can guarantee horizontal
  // reachability. Fall back to screen-center for the very first spawn.
  const prev = g.platforms.length > 0 ? g.platforms[g.platforms.length - 1] : undefined;
  const prevCenterX = prev ? platformCenterX(prev) : w / 2;

  // For darkBlue (moving) prev platforms, treat their worst-case position as
  // the anchor — guarantees reachability even if the platform has drifted.
  const prevWobble = prev && prev.kind === 'darkBlue' ? prev.moveRange : 0;

  // Max horizontal step gets a tiny bonus for closer vertical gaps (you have
  // more airtime to redirect for tall jumps, less for short hops anyway).
  const reach = Math.min(
    SPAWN.maxHorizontalStep,
    JUMP_REACH.practicalHorizontalReach,
  );

  // Allowed center-X window: within reach of prev center, clamped to screen.
  const minCenterReachable = prevCenterX - (reach - prevWobble);
  const maxCenterReachable = prevCenterX + (reach - prevWobble);

  // Account for darkBlue's own horizontal wobble so its baseX stays on-screen.
  const wobbleSelf = kind === 'darkBlue' ? PLATFORM.darkBlueMoveRange : 0;
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

  const centerX = biasedAwayFromCenter(rng, minCenter, maxCenter, w);
  const x = clamp(centerX - pw / 2, PLATFORM.edgeMargin, w - PLATFORM.edgeMargin - pw);

  const darkBlueSpeed =
    kind === 'darkBlue'
      ? PLATFORM.darkBlueMoveSpeed * darkBlueSpeedMultiplier(g.score)
      : 0;

  // Springs only appear on blue and darkBlue platforms — not on breakable grey.
  const canHaveSpring = kind === 'blue' || kind === 'darkBlue';
  const hasSpring = canHaveSpring && rng() < SPRING.spawnChance;

  g.platforms.push({
    id: nextId(g),
    y,
    width: pw,
    height: PLATFORM.height,
    kind,
    baseX: x,
    moveRange: kind === 'darkBlue' ? PLATFORM.darkBlueMoveRange : 0,
    moveSpeed: darkBlueSpeed,
    movePhase: randRange(rng, 0, Math.PI * 2),
    broken: false,
    breakTimer: 0,
    breaking: false,
    shakePhase: 0,
    hasSpring,
    springAnimPhase: 0,
  });

  g.lastSpawnWasBrown = kind === 'grey';
  if (kind === 'grey') {
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
  // Skip grey (breakable) and spring platforms — obstacle above a spring would
  // punish players who are boosted unexpectedly.
  if (!plat || plat.kind === 'grey' || plat.hasSpring) return;
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

/**
 * Possibly spawns an Angry Voxel Face enemy on the most recently placed platform.
 *
 * Guards (all must pass):
 *   - Cooldown counter at zero (prevents back-to-back enemy platforms)
 *   - Platform is blue or darkBlue (not grey/breakable)
 *   - Platform has no spring (spring + enemy = unfair death on boost)
 *   - Platform is wide enough (≥ ENEMY.spawnMinTiles) so a landing gap exists
 *   - Random roll passes the difficulty-scaled probability
 *
 * The enemy's relX is stored relative to the platform's baseX so it naturally
 * follows darkBlue platforms as they oscillate.  Patrol speed is locked at
 * spawn from the difficulty-scaled range so already-on-screen enemies stay
 * predictable for the player.
 */
export function spawnEnemyIfNeeded(g: GameModel, rng: Rng): void {
  if (g.enemyCooldownRows > 0) {
    g.enemyCooldownRows -= 1;
    return;
  }

  const plat = g.platforms[g.platforms.length - 1];
  if (!plat) return;
  if (plat.kind === 'grey') return;
  if (plat.hasSpring) return;

  const tileCount = Math.round(plat.width / TILE_SIZE);
  if (tileCount < ENEMY.spawnMinTiles) return;

  // Difficulty-scaled probability: base → max linearly over difficulty [1, 4].
  const t = clamp((g.difficulty - 1) / 3, 0, 1);
  const spawnChance = ENEMY.spawnChanceBase + t * (ENEMY.spawnChanceMax - ENEMY.spawnChanceBase);
  if (rng() > spawnChance) return;

  // Patrol speed scales with difficulty, locked in at spawn.
  const speed = ENEMY.baseSpeed + t * (ENEMY.maxSpeed - ENEMY.baseSpeed);

  // Start the enemy somewhere in the middle third of the platform to avoid
  // spawning right at an edge (which would immediately reverse direction).
  const maxRelX = plat.width - ENEMY.w;
  const startRelX = randRange(rng, maxRelX * 0.2, maxRelX * 0.8);
  const startDir: 1 | -1 = rng() < 0.5 ? 1 : -1;

  g.enemies.push({
    id: `e_${g.idCounter++}`,
    platformId: plat.id,
    relX: startRelX,
    w: ENEMY.w,
    h: ENEMY.h,
    speed,
    dir: startDir,
    bouncePhase: randRange(rng, 0, Math.PI * 2),
  });

  g.enemyCooldownRows = ENEMY.cooldownRows;
}
