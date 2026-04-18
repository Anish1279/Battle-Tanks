// ── Tank Model Definitions ──────────────────────────────────────────
// Scale is auto-computed from bounding box. sizeMultiplier adjusts
// the normalized size per tank type (1.0 = reference MBT size).
export const TANK_MODELS = {
  player: {
    id: 'challenger',
    path: '/tank_challenger.glb',
    name: 'Challenger',
    sizeMultiplier: 1.0,
  },
  enemies: [
    {
      id: 't72',
      path: '/low_poly_t_72_tank_game_ready.glb',
      name: 'T-72',
      sizeMultiplier: 0.95,
    },
    {
      id: 'tiger2',
      path: '/tank_pzkpfwvi_ausfb_porshe_tiger_ii.glb',
      name: 'Tiger II',
      sizeMultiplier: 1.1,
    },
    {
      id: 'sherman',
      path: '/sherman_firefly_tank.glb',
      name: 'Sherman Firefly',
      sizeMultiplier: 0.9,
    },
    {
      id: 't34',
      path: '/soviet_medium_tank_t_34_85_d_5t.glb',
      name: 'T-34-85',
      sizeMultiplier: 0.9,
    },
    {
      id: 'ms1',
      path: '/ms_1_light_tank.glb',
      name: 'MS-1',
      sizeMultiplier: 0.75,
    },
  ],
}

// The longest dimension of any tank model will be normalized to this value
// (in game units) before applying the per-type sizeMultiplier.
export const TANK_TARGET_SIZE = 6.0

// ── Player Stats ────────────────────────────────────────────────────
export const PLAYER = {
  maxHealth: 150,
  moveSpeed: 12,
  reverseSpeed: 5,
  turnSpeed: 2.0,
  turretTurnSpeed: 14.0,
  acceleration: 20,
  deceleration: 25,
  fireRate: 0.8,
  shellSpeed: 75,
  shellDamage: 35,
  mass: 200,
}

// ── Enemy Stats (per type) ──────────────────────────────────────────
export const ENEMY_STATS = {
  t72: {
    maxHealth: 80,
    moveSpeed: 5.5,
    turnSpeed: 1.8,
    fireRate: 2.2,
    shellSpeed: 45,
    shellDamage: 12,
    detectionRange: 90,
    attackRange: 55,
    accuracy: 0.72,
  },
  tiger2: {
    maxHealth: 120,
    moveSpeed: 4.0,
    turnSpeed: 1.2,
    fireRate: 3.0,
    shellSpeed: 50,
    shellDamage: 22,
    detectionRange: 110,
    attackRange: 70,
    accuracy: 0.78,
  },
  sherman: {
    maxHealth: 70,
    moveSpeed: 6.0,
    turnSpeed: 2.0,
    fireRate: 2.0,
    shellSpeed: 42,
    shellDamage: 14,
    detectionRange: 85,
    attackRange: 50,
    accuracy: 0.68,
  },
  t34: {
    maxHealth: 75,
    moveSpeed: 6.5,
    turnSpeed: 2.2,
    fireRate: 2.0,
    shellSpeed: 45,
    shellDamage: 15,
    detectionRange: 85,
    attackRange: 50,
    accuracy: 0.70,
  },
  ms1: {
    maxHealth: 50,
    moveSpeed: 7.5,
    turnSpeed: 2.8,
    fireRate: 1.6,
    shellSpeed: 40,
    shellDamage: 10,
    detectionRange: 80,
    attackRange: 45,
    accuracy: 0.62,
  },
}

// ── Physics ─────────────────────────────────────────────────────────
export const PHYSICS = {
  gravity: [0, -20, 0],
  timestep: 1 / 60,
  tankFriction: 0.4,
  tankRestitution: 0.1,
  terrainFriction: 0.6,
  terrainRestitution: 0.05,
  tankLinearDamping: 0.5,
  tankAngularDamping: 5.0,
  tankMass: 200,
  enemyMass: 160,
  shellRadius: 0.15,
  shellLifetime: 4,
}

export const GROUPS = {
  TERRAIN: 0,
  PLAYER: 1,
  ENEMY: 2,
  PROJECTILE_PLAYER: 3,
  PROJECTILE_ENEMY: 4,
}

// ── Camera ──────────────────────────────────────────────────────────
export const CAMERA = {
  distance: 20,
  height: 12,
  lookAheadDistance: 8,
  smoothSpeed: 6.0,
  fov: 55,
  near: 0.5,
  far: 800,
}

// ── World / Spawn ───────────────────────────────────────────────────
export const WORLD = {
  terrainPath: '/terrain.glb',
  terrainScale: 20.0,
  // Approximate size of terrain tile for infinite tiling. 
  // It's manually tuned to create overlapping dense hills without gaps.
  terrainChunkSize: 150, 
  // Spawns
  maxEnemies: 6,
  minSpawnDistance: 80,
  maxSpawnDistance: 160,
  playerSpawnPosition: [0, 12, 0],
}

// ── Cover / Obstacle Definitions ────────────────────────────────────
export const COVER_ASSETS = [
  // Rocks - scattered across the battlefield
  { type: 'rock', pos: [15, 0, 12], scale: [3, 2.5, 3], rot: 0.4 },
  { type: 'rock', pos: [-18, 0, 20], scale: [4, 3, 3.5], rot: 1.2 },
  { type: 'rock', pos: [25, 0, -15], scale: [2.5, 2, 2.5], rot: 2.1 },
  { type: 'rock', pos: [-30, 0, -10], scale: [3.5, 2.8, 4], rot: 0.8 },
  { type: 'rock', pos: [8, 0, -28], scale: [2, 1.8, 2.5], rot: 3.0 },
  { type: 'rock', pos: [-12, 0, -30], scale: [3, 2, 3], rot: 1.6 },
  { type: 'rock', pos: [35, 0, 5], scale: [2.5, 2.2, 3], rot: 0.3 },
  { type: 'rock', pos: [-5, 0, 35], scale: [3, 2.5, 2.8], rot: 2.5 },

  // Walls / barriers - create combat lanes
  { type: 'wall', pos: [10, 0, 0], scale: [8, 2.5, 1], rot: 0.3 },
  { type: 'wall', pos: [-15, 0, 5], scale: [6, 2, 1], rot: -0.5 },
  { type: 'wall', pos: [20, 0, -25], scale: [10, 3, 1.2], rot: 0.8 },
  { type: 'wall', pos: [-25, 0, 25], scale: [7, 2.5, 1], rot: 1.0 },
  { type: 'wall', pos: [0, 0, 20], scale: [5, 2, 0.8], rot: 1.57 },

  // Bunkers - heavy cover near spawn areas
  { type: 'bunker', pos: [30, 0, 30], scale: [5, 2, 4], rot: 0.5 },
  { type: 'bunker', pos: [-35, 0, -35], scale: [4.5, 2, 3.5], rot: 2.0 },

  // Barriers / sandbag positions
  { type: 'barrier', pos: [5, 0, 10], scale: [3, 1.2, 1.5], rot: 0 },
  { type: 'barrier', pos: [-8, 0, -15], scale: [4, 1.3, 1.5], rot: 0.7 },
  { type: 'barrier', pos: [22, 0, 18], scale: [3.5, 1, 1.5], rot: -0.4 },
  { type: 'barrier', pos: [-20, 0, -20], scale: [3, 1.2, 1.5], rot: 1.2 },

  // Crate stacks
  { type: 'crates', pos: [12, 0, -8], scale: [2, 2, 2], rot: 0.2 },
  { type: 'crates', pos: [-10, 0, 15], scale: [2.5, 2.5, 2.5], rot: 1.0 },
  { type: 'crates', pos: [28, 0, -5], scale: [2, 1.8, 2], rot: 0.6 },
]

// ── Game ────────────────────────────────────────────────────────────
export const GAME_PHASES = {
  MENU: 'menu',
  LOADING: 'loading',
  PLAYING: 'playing',
  PAUSED: 'paused',
  VICTORY: 'victory',
  GAME_OVER: 'gameOver',
}

// ── Effects ─────────────────────────────────────────────────────────
export const EFFECTS = {
  explosionDuration: 1.5,
  muzzleFlashDuration: 0.15,
  screenShakeIntensity: 0.25,
  screenShakeDuration: 0.25,
}
