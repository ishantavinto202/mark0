import { CAMERA, PHYSICS } from '@/game/constants';
import { mulberry32 } from '@/game/math/rng';
import { rectBottom, rectsOverlap, type Rect } from '@/game/math/collision';
import { spawnObstacleIfNeeded, spawnPlatformRow } from '@/game/spawn/platformSpawner';
import type { ControlInput, GameModel, PlatformModel } from '@/game/types';

const SPAWN_AHEAD = 320;
const PRUNE_BELOW = 520;
const EPS = 2;

export function getPlatformWorldX(p: PlatformModel): number {
  if (p.kind === 'blue' && !p.broken) {
    return p.baseX + Math.sin(p.movePhase) * p.moveRange;
  }
  return p.baseX;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function wrapPlayer(g: GameModel): void {
  const { player, width } = g;
  if (player.x + player.w < -EPS) {
    player.x = width;
  } else if (player.x > width + EPS) {
    player.x = -player.w;
  }
}

function platformSolid(p: PlatformModel): boolean {
  if (p.broken) return false;
  if (p.kind === 'brown' && p.breaking) return false;
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
    if (p.kind === 'blue' && !p.broken) {
      p.movePhase += dt * p.moveSpeed;
    }
    if (p.breaking || (p.kind === 'brown' && p.shakePhase > 0)) {
      p.shakePhase += dt * 48;
    }
    if (p.breaking && !p.broken) {
      p.breakTimer -= dt;
      if (p.breakTimer <= 0) {
        p.broken = true;
      }
    }
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

  const sorted = [...g.platforms].sort((a, b) => b.y - a.y);

  for (const p of sorted) {
    if (!platformSolid(p)) continue;
    const platX = getPlatformWorldX(p);
    const platRect: Rect = {
      x: platX,
      y: p.y,
      w: p.width,
      h: p.height,
    };
    const horiz =
      playerRect.x + playerRect.w > platRect.x + EPS &&
      playerRect.x < platRect.x + platRect.w - EPS;

    if (!horiz) continue;

    if (p.kind === 'brown') {
      if (g.player.vy >= -40 && prevFeet <= p.y + 8 && feet >= p.y - 4 && feet <= p.y + p.height + 6) {
        p.breaking = true;
        p.breakTimer = 0.09;
        p.shakePhase = 0.01;
        g.player.grounded = false;
      }
      continue;
    }

    if (g.player.vy >= -30 && prevFeet <= p.y + 6 && feet >= p.y - 3 && feet <= p.y + p.height + 4) {
      g.player.y = p.y - g.player.h;
      g.player.vy = PHYSICS.jumpVelocity;
      g.player.grounded = true;
      break;
    }
  }

  const playerRectAfter: Rect = {
    x: g.player.x,
    y: g.player.y,
    w: g.player.w,
    h: g.player.h,
  };

  for (const o of g.obstacles) {
    if (rectsOverlap(playerRectAfter, o)) {
      g.phase = 'gameover';
      return;
    }
  }

  const camTarget = g.player.y - g.height * CAMERA.followRatio;
  g.cameraY += (camTarget - g.cameraY) * clamp(CAMERA.lerp * (dt * 60), 0, 1);

  let spawnSafety = 0;
  while (spawnSafety++ < 48) {
    const minY = Math.min(...g.platforms.map((p) => p.y), g.nextSpawnY);
    if (minY <= g.cameraY - SPAWN_AHEAD) break;
    spawnPlatformRow(g, rng);
    spawnObstacleIfNeeded(g, rng);
  }

  g.platforms = g.platforms.filter((p) => p.y < g.cameraY + g.height + PRUNE_BELOW);
  g.obstacles = g.obstacles.filter((o) => o.y < g.cameraY + g.height + PRUNE_BELOW);

  g.score = Math.max(
    g.score,
    Math.floor(Math.max(0, g.runStartPlayerY - g.player.y) / 8),
  );
  g.difficulty = 1 + Math.min(3, g.score / 2500);

  if (g.player.y - g.cameraY > g.height + 100) {
    g.phase = 'gameover';
    return;
  }
}
