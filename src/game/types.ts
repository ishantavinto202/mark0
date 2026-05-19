/** Platform kinds — extend with new types in spawn + tick + render. */
export type PlatformKind = 'blue' | 'grey' | 'darkBlue';

export type PlatformModel = {
  id: string;
  /** World-space top edge (y grows downward). */
  y: number;
  width: number;
  height: number;
  kind: PlatformKind;
  /** For darkBlue: horizontal anchor in world space. */
  baseX: number;
  moveRange: number;
  moveSpeed: number;
  movePhase: number;
  broken: boolean;
  /** Seconds until collision disabled (grey). */
  breakTimer: number;
  breaking: boolean;
  shakePhase: number;
  /** Spring booster — only spawns on blue and darkBlue platforms. */
  hasSpring: boolean;
  /**
   * Animation phase for spring compression effect.
   * Counts down from 1→0 after the player lands on the spring.
   * 0 = idle (full height), >0 = animating (compress then release).
   */
  springAnimPhase: number;
};

export type ObstacleModel = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Which side of the parent platform the enemy patrols beside. */
export type EnemySide = 'left' | 'right';

/**
 * Patrol enemy beside a platform (not on its surface).
 * Position is relative to the platform's baseX / top-y so it follows
 * darkBlue oscillation via getPlatformWorldX at render/collision time.
 */
export type EnemyModel = {
  id: string;
  /** ID of the parent platform this enemy is anchored to. */
  platformId: string;
  /** X offset from the platform's baseX. */
  relX: number;
  /** Y offset from the platform's top edge (negative = higher). */
  relY: number;
  w: number;
  h: number;
  /** Side of the platform the enemy patrols along. */
  side: EnemySide;
  /** Patrol speed in logical px/s (locked at spawn, scales with difficulty). */
  speed: number;
  /** Current movement direction: 1 = right, -1 = left. */
  dir: 1 | -1;
};

export type PlayerModel = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  grounded: boolean;
  facing: 1 | -1;
};

export type GamePhase = 'ready' | 'playing' | 'paused' | 'gameover';

export type GameModel = {
  phase: GamePhase;
  width: number;
  height: number;
  player: PlayerModel;
  platforms: PlatformModel[];
  obstacles: ObstacleModel[];
  enemies: EnemyModel[];
  cameraY: number;
  score: number;
  bestHeight: number;
  difficulty: number;
  rngSeed: number;
  /** Spawner: minimum world-y of last spawned row (smaller = higher). */
  nextSpawnY: number;
  /** Prevent impossible brown chains. */
  brownCooldownRows: number;
  lastSpawnWasBrown: boolean;
  /**
   * Rows to skip before allowing another enemy spawn.
   * Prevents back-to-back enemy platforms.
   */
  enemyCooldownRows: number;
  idCounter: number;
  /** Player y at run start — used for score delta. */
  runStartPlayerY: number;
};

export type ControlInput = {
  /** -1..1 from gyro or touch. */
  horizontal: number;
};
