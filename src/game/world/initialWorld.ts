import { CAMERA, PLATFORM, PLAYER_SIZE, TILE_SIZE } from '@/game/constants';
import { mulberry32 } from '@/game/math/rng';
import { spawnPlatformRow } from '@/game/spawn/platformSpawner';
import type { GameModel, PlatformModel } from '@/game/types';

/** Start with grey disabled until a few rows exist. */
const SPAWN_INITIAL_BROWN_COOLDOWN = 4;

let id = 0;
function nid(): string {
  id += 1;
  return `p_${id}`;
}

function starterPlatform(y: number, w: number, x: number): PlatformModel {
  return {
    id: nid(),
    y,
    width: w,
    height: PLATFORM.height,
    kind: 'blue',
    baseX: x,
    moveRange: 0,
    moveSpeed: 0,
    movePhase: 0,
    broken: false,
    breakTimer: 0,
    breaking: false,
    shakePhase: 0,
    hasSpring: false,
    springAnimPhase: 0,
    landingScored: false,
  };
}

export function createInitialGame(width: number, height: number): GameModel {
  id = 0;
  // Quantize to a whole number of 28 px tiles so the starter platform
  // renders without partial tiles, just like procedurally spawned ones.
  const rawPw = Math.min(280, width - 48);
  const pw = Math.floor(rawPw / TILE_SIZE) * TILE_SIZE;
  const px = (width - pw) / 2;
  const startPlatformY = height * 0.62;
  const platforms: PlatformModel[] = [
    starterPlatform(startPlatformY, pw, px),
  ];

  const playerX = width / 2 - PLAYER_SIZE.w / 2;
  const playerY = startPlatformY - PLAYER_SIZE.h - 0.5;

  const rngSeed = Date.now() % 1_000_000_007;
  const g: GameModel = {
    phase: 'ready',
    width,
    height,
    player: {
      x: playerX,
      y: playerY,
      vx: 0,
      vy: 0,
      w: PLAYER_SIZE.w,
      h: PLAYER_SIZE.h,
      grounded: true,
      facing: 1,
    },
    platforms,
    obstacles: [],
    enemies: [],
    cameraY: Math.max(0, playerY - height * CAMERA.followRatio),
    score: 0,
    springChainActive: false,
    springSourcePlatformId: null,
    difficulty: 1,
    rngSeed,
    nextSpawnY: startPlatformY,
    brownCooldownRows: SPAWN_INITIAL_BROWN_COOLDOWN,
    lastSpawnWasBrown: false,
    enemyCooldownRows: 0,
    idCounter: 100,
  };

  const rng = mulberry32(rngSeed);
  // One platform per call now → spawn enough to cover the visible area plus
  // a comfortable buffer above the camera.
  for (let i = 0; i < 32; i += 1) {
    spawnPlatformRow(g, rng);
  }

  return g;
}

export function resetPlayerToStart(g: GameModel): void {
  const start = g.platforms[0];
  if (!start) return;
  g.player.x = g.width / 2 - g.player.w / 2;
  g.player.y = start.y - g.player.h - 0.5;
  g.player.vx = 0;
  g.player.vy = 0;
  g.player.grounded = true;
  g.cameraY = Math.max(0, g.player.y - g.height * CAMERA.followRatio);
}
