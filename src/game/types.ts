/** Platform kinds — extend with new types in spawn + tick + render. */
export type PlatformKind = 'green' | 'brown' | 'blue';

export type PlatformModel = {
  id: string;
  /** World-space top edge (y grows downward). */
  y: number;
  width: number;
  height: number;
  kind: PlatformKind;
  /** For blue: horizontal anchor in world space. */
  baseX: number;
  moveRange: number;
  moveSpeed: number;
  movePhase: number;
  broken: boolean;
  /** Seconds until collision disabled (brown). */
  breakTimer: number;
  breaking: boolean;
  shakePhase: number;
};

export type ObstacleModel = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
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
  idCounter: number;
  /** Player y at run start — used for score delta. */
  runStartPlayerY: number;
};

export type ControlInput = {
  /** -1..1 from gyro or touch. */
  horizontal: number;
};
