import { CAMERA, COLLISION_VIEW, ENEMY, PHYSICS, PLATFORM, SPRING } from '@/game/constants';
import { rectBottom, rectsOverlap, type Rect } from '@/game/math/collision';
import { mulberry32 } from '@/game/math/rng';
import { spawnEnemyIfNeeded, spawnPlatformRow } from '@/game/spawn/platformSpawner';
import type { ControlInput, EnemyModel, GameModel, PlatformModel } from '@/game/types';

// Pre-generate platforms this many world-px above the camera. Increased from
// 480 to match the higher platform density (smaller gaps → more platforms fit
// in the same vertical window, so a larger buffer keeps the spawner ahead).
const SPAWN_AHEAD = 560;
const PRUNE_BELOW = 520;
/**
 * Horizontal landing forgiveness — if the player's hitbox grazes the platform
 * within this many pixels of its edge while falling, snap them on top. Matches
 * the Doodle-Jump-style "corner grab" feel.
 */
const EDGE_GRAB = 5;

export function getPlatformWorldX(p: PlatformModel): number {
  if (p.kind === 'darkBlue' && !p.broken) {
    return p.baseX + Math.sin(p.movePhase) * p.moveRange;
  }
  return p.baseX;
}

/** Fixed vertical offset — enemy hovers beside the platform top edge (no Y motion). */
export function getEnemyBaseRelY(): number {
  return -ENEMY.h + PLATFORM.height;
}

export function getEnemyPatrolBounds(
  e: EnemyModel,
  plat: PlatformModel,
): { min: number; max: number } {
  if (e.side === 'left') {
    return {
      min: -e.w - ENEMY.sideGap - ENEMY.sidePatrolRange,
      max: -ENEMY.sideGap,
    };
  }
  return {
    min: plat.width + ENEMY.sideGap,
    max: plat.width + ENEMY.sideGap + ENEMY.sidePatrolRange,
  };
}

export function getEnemyWorldRect(e: EnemyModel, plat: PlatformModel): Rect {
  return {
    x: getPlatformWorldX(plat) + e.relX,
    y: plat.y + e.relY,
    w: e.w,
    h: e.h,
  };
}

/** Keep relX inside patrol bounds and on-screen (X-axis only). */
function clampEnemyRelX(
  e: EnemyModel,
  plat: PlatformModel,
  screenW: number,
): void {
  const { min, max } = getEnemyPatrolBounds(e, plat);
  e.relX = clamp(e.relX, min, max);

  const platX = getPlatformWorldX(plat);
  const screenMin = PLATFORM.edgeMargin;
  const screenMax = screenW - PLATFORM.edgeMargin - e.w;
  const minFromScreen = screenMin - platX;
  const maxFromScreen = screenMax - platX;
  e.relX = clamp(e.relX, Math.max(min, minFromScreen), Math.min(max, maxFromScreen));
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function wrapPlayer(g: GameModel): void {
  const { player, width } = g;
  if (player.x + player.w < -2) {
    player.x = width;
  } else if (player.x > width + 2) {
    player.x = -player.w;
  }
}

function platformSolid(p: PlatformModel): boolean {
  if (p.broken) return false;
  if (p.kind === 'grey' && p.breaking) return false;
  return true;
}

/**
 * True when the platform intersects the visible vertical band (screen space).
 * Off-screen platforms — especially below the bottom edge — do not collide.
 */
export function platformCollisionActive(
  p: PlatformModel,
  cameraY: number,
  screenH: number,
): boolean {
  const screenTop = p.y - cameraY;
  const screenBottom = screenTop + p.height;
  if (screenBottom < -COLLISION_VIEW.marginAbove) return false;
  if (screenTop > screenH + COLLISION_VIEW.marginBelow) return false;
  return true;
}

export function tickGame(
  g: GameModel,
  dt: number,
  input: ControlInput,
): void {
  if (g.phase !== 'playing') return;

  const rng = mulberry32(g.rngSeed ^ Math.floor(g.score * 997));

  for (const p of g.platforms) {
    if (p.kind === 'darkBlue' && !p.broken) {
      p.movePhase += dt * p.moveSpeed;
    }
    if (p.breaking || (p.kind === 'grey' && p.shakePhase > 0)) {
      p.shakePhase += dt * 48;
    }
    if (p.breaking && !p.broken) {
      p.breakTimer -= dt;
      if (p.breakTimer <= 0) {
        p.broken = true;
      }
    }
    // Tick down the spring compression/release animation.
    if (p.springAnimPhase > 0) {
      p.springAnimPhase -= dt / SPRING.animDuration;
      if (p.springAnimPhase < 0) p.springAnimPhase = 0;
    }
  }

  // Enemy patrol — constant horizontal speed, reverse at patrol/screen bounds.
  for (const e of g.enemies) {
    const plat = g.platforms.find((p) => p.id === e.platformId);
    if (!plat || plat.broken) continue;

    e.relX += e.dir * e.speed * dt;

    const { min, max } = getEnemyPatrolBounds(e, plat);
    if (e.relX <= min) {
      e.relX = min;
      e.dir = 1;
    } else if (e.relX >= max) {
      e.relX = max;
      e.dir = -1;
    }

    clampEnemyRelX(e, plat, g.width);
  }

  const wish = clamp(input.horizontal, -1, 1) * PHYSICS.maxRunSpeed;
  const accel = g.player.grounded ? PHYSICS.runAccel : PHYSICS.runAccel * PHYSICS.airControl;
  g.player.vx += wish * accel * 0.004 * dt * 60;
  g.player.vx *= Math.pow(PHYSICS.groundFriction, dt * 60 * 0.08);
  g.player.vx = clamp(g.player.vx, -PHYSICS.maxRunSpeed, PHYSICS.maxRunSpeed);
  if (Math.abs(input.horizontal) > 0.08) {
    g.player.facing = input.horizontal > 0 ? 1 : -1;
  }

  g.player.vy += PHYSICS.gravity * dt;
  // Clamp downward speed so the player can't tunnel through thin platforms in
  // a single frame on dropped-frame or low-fps situations.
  if (g.player.vy > PHYSICS.maxFallSpeed) g.player.vy = PHYSICS.maxFallSpeed;
  g.player.y += g.player.vy * dt;
  g.player.x += g.player.vx * dt;
  wrapPlayer(g);

  const playerRect: Rect = {
    x: g.player.x,
    y: g.player.y,
    w: g.player.w,
    h: g.player.h,
  };
  const feet = rectBottom(playerRect);
  const prevFeet = feet - g.player.vy * dt;

  g.player.grounded = false;

  const sorted = g.platforms
    .filter(
      (p) =>
        platformSolid(p) &&
        platformCollisionActive(p, g.cameraY, g.height),
    )
    .sort((a, b) => b.y - a.y);

  for (const p of sorted) {
    const platX = getPlatformWorldX(p);
    const platRect: Rect = {
      x: platX,
      y: p.y,
      w: p.width,
      h: p.height,
    };
    // Forgive a few pixels at each side — if the player's hitbox just touches
    // the platform edge while coming down, treat it as a landing.
    const horiz =
      playerRect.x + playerRect.w > platRect.x - EDGE_GRAB &&
      playerRect.x < platRect.x + platRect.w + EDGE_GRAB;

    if (!horiz) continue;

    // Only land while falling (vy >= 0) — Doodle-Jump style; you pass through
    // platforms on the way up.
    if (g.player.vy < 0) continue;

    if (prevFeet <= p.y + 8 && feet >= p.y - 4 && feet <= p.y + p.height + 6) {
      // Snap the player onto the platform surface and apply the jump impulse.
      // This must happen before any break logic so grey platforms always give
      // the player a valid bounce — the platform becomes non-solid (breaking)
      // only AFTER the velocity is committed.
      g.player.y = p.y - g.player.h;

      if (p.hasSpring && p.springAnimPhase === 0) {
        // Spring boost: only triggers when the spring is at rest (animPhase 0)
        // to prevent re-firing on the same landing event. Once vy goes negative
        // the player leaves the spring; next contact resets normally.
        g.player.vy = SPRING.boostVelocity;
        p.springAnimPhase = 1.0;
      } else {
        g.player.vy = PHYSICS.jumpVelocity;
      }

      g.player.grounded = true;

      if (p.kind === 'grey') {
        // Trigger the break after the jump is secured. platformSolid() will
        // return false from the next frame onward (breaking === true), so the
        // player can never double-land on the same grey tile.
        p.breaking = true;
        p.breakTimer = 0.09;
        p.shakePhase = 0.01;
      }
      break;
    }
  }

  // Enemy collision — check after movement is settled so position is accurate.
  const playerRectAfterMove: Rect = {
    x: g.player.x,
    y: g.player.y,
    w: g.player.w,
    h: g.player.h,
  };
  for (const e of g.enemies) {
    const plat = g.platforms.find((p) => p.id === e.platformId);
    if (!plat) continue;
    if (rectsOverlap(playerRectAfterMove, getEnemyWorldRect(e, plat))) {
      g.phase = 'gameover';
      return;
    }
  }

  // Camera ratchets UP only. In world coords "up" = decreasing Y, so we only
  // lerp when the target is above the current cameraY. If the player is below
  // the follow line (falling), the camera stays put — letting them visibly
  // drop off the bottom of the screen and trigger gameover below.
  const camTarget = g.player.y - g.height * CAMERA.followRatio;
  if (camTarget < g.cameraY) {
    g.cameraY += (camTarget - g.cameraY) * clamp(CAMERA.lerp * (dt * 60), 0, 1);
  }

  let spawnSafety = 0;
  while (spawnSafety++ < 96) {
    const minY = Math.min(...g.platforms.map((p) => p.y), g.nextSpawnY);
    if (minY <= g.cameraY - SPAWN_AHEAD) break;
    spawnPlatformRow(g, rng);
    spawnEnemyIfNeeded(g, rng);
  }

  g.platforms = g.platforms.filter((p) => p.y < g.cameraY + g.height + PRUNE_BELOW);
  // Prune enemies whose parent platform has been pruned.
  const platformIds = new Set(g.platforms.map((p) => p.id));
  g.enemies = g.enemies.filter((e) => platformIds.has(e.platformId));

  g.score = Math.max(
    g.score,
    Math.floor(Math.max(0, g.runStartPlayerY - g.player.y) / 8),
  );
  g.difficulty = 1 + Math.min(3, g.score / 2500);

  // Game over once the player's top edge has fallen past the bottom of the
  // visible screen with a small grace margin. With the camera no longer
  // tracking downward, this fires reliably as soon as the player drops off.
  const playerOffBottom = g.player.y - g.cameraY > g.height + 40;
  if (playerOffBottom) {
    g.phase = 'gameover';
    g.player.vy = 0;
    return;
  }
}
