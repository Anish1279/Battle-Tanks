import { create } from 'zustand'
import { GAME_PHASES, PLAYER, ENEMY_STATS, TANK_MODELS, WORLD } from '../utils/constants'

export const useGameStore = create((set, get) => ({
  // ── Game Phase ──────────────────────────────────────────────
  phase: GAME_PHASES.MENU,
  setPhase: (phase) => set({ phase }),

  // ── Player State ────────────────────────────────────────────
  playerHealth: PLAYER.maxHealth,
  playerMaxHealth: PLAYER.maxHealth,
  playerPosition: [0, 0, 0],
  playerRotation: 0,
  turretRotation: 0,
  reloadProgress: 1, // 0 = reloading, 1 = ready
  lastFireTime: 0,

  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setPlayerRotation: (rot) => set({ playerRotation: rot }),
  setTurretRotation: (rot) => set({ turretRotation: rot }),
  setReloadProgress: (p) => set({ reloadProgress: p }),

  damagePlayer: (amount) => {
    const { playerHealth, phase } = get()
    if (phase !== GAME_PHASES.PLAYING) return
    if (amount <= 0) return // Guard against negative/zero damage
    const newHealth = Math.max(0, playerHealth - amount)
    set({ playerHealth: newHealth, screenShake: true })
    // Clear screen shake after a short time
    setTimeout(() => set({ screenShake: false }), 300)
    if (newHealth <= 0) {
      set({ phase: GAME_PHASES.GAME_OVER })
    }
  },

  // ── Screen Shake ────────────────────────────────────────────
  screenShake: false,

  // ── Game Session ────────────────────────────────────────────
  gameSessionId: 0,
  
  // ── Enemies ─────────────────────────────────────────────────
  enemies: [],
  nextEnemyId: 0,

  spawnEnemy: (model, position) => {
    const stats = ENEMY_STATS[model.id]
    if (!stats) return

    const id = get().nextEnemyId
    const newEnemy = {
      id: `enemy_${model.id}_${id}`,
      modelId: model.id,
      modelPath: model.path,
      name: model.name,
      sizeMultiplier: model.sizeMultiplier,
      health: stats.maxHealth,
      maxHealth: stats.maxHealth,
      stats,
      position: position,
      rotation: Math.random() * Math.PI * 2,
      alive: true,
      state: 'chase', // Start aggressive
    }

    set((state) => ({ 
      enemies: [...state.enemies, newEnemy],
      nextEnemyId: state.nextEnemyId + 1
    }))
  },
  
  removeEnemy: (enemyId) => {
    set((state) => ({
      enemies: state.enemies.filter(e => e.id !== enemyId)
    }))
  },

  damageEnemy: (enemyId, amount) => {
    if (!enemyId || amount <= 0) return // Guard
    const { enemies } = get()
    let killed = false
    const updated = enemies.map((e) => {
      if (e.id !== enemyId) return e
      if (!e.alive) return e // Already dead — don't re-kill
      const newHealth = Math.max(0, e.health - amount)
      if (newHealth <= 0) killed = true
      return { ...e, health: newHealth, alive: newHealth > 0 }
    })
    set({ enemies: updated })

    // Track kills
    if (killed) {
      get().addKill()
    }

    const allDead = updated.every((e) => !e.alive)
    if (allDead) {
      setTimeout(() => {
        const { phase } = get()
        if (phase === GAME_PHASES.PLAYING && get().enemies.every(e => !e.alive)) {
          set({ phase: GAME_PHASES.VICTORY })
        }
      }, 1500)
    }

    // Auto-remove dead enemies after an explosion delay (so they don't clutter)
    if (killed) {
      setTimeout(() => {
        get().removeEnemy(enemyId)
      }, 3000)
    }
  },

  updateEnemyPosition: (enemyId, position, rotation) => {
    set((state) => ({
      enemies: state.enemies.map((e) =>
        e.id === enemyId ? { ...e, position, rotation } : e
      ),
    }))
  },

  // ── Projectiles ─────────────────────────────────────────────
  projectiles: [],
  nextProjectileId: 0,

  addProjectile: (projectile) => {
    const id = get().nextProjectileId
    set((state) => ({
      projectiles: [...state.projectiles, { ...projectile, id }],
      nextProjectileId: id + 1,
    }))
    return id
  },

  removeProjectile: (id) => {
    set((state) => ({
      projectiles: state.projectiles.filter((p) => p.id !== id),
    }))
  },

  // ── Explosions ──────────────────────────────────────────────
  explosions: [],
  nextExplosionId: 0,

  addExplosion: (position, scale = 1) => {
    if (!position || !Array.isArray(position)) return // Guard
    const id = get().nextExplosionId
    set((state) => ({
      explosions: [...state.explosions, { id, position, scale, time: Date.now() }],
      nextExplosionId: id + 1,
    }))
    // Auto-remove after animation
    setTimeout(() => {
      set((state) => ({
        explosions: state.explosions.filter((e) => e.id !== id),
      }))
    }, 1500)
  },

  // ── Score ───────────────────────────────────────────────────
  score: 0,
  kills: 0,
  addKill: () => set((s) => ({ kills: s.kills + 1, score: s.score + 100 })),

  // ── Game Flow ───────────────────────────────────────────────
  startGame: () => {
    set((s) => ({
      phase: GAME_PHASES.PLAYING,
      playerHealth: PLAYER.maxHealth,
      score: 0,
      kills: 0,
      projectiles: [],
      explosions: [],
      enemies: [],
      nextProjectileId: 0,
      nextExplosionId: 0,
      nextEnemyId: 0,
      reloadProgress: 1,
      lastFireTime: 0,
      screenShake: false,
      gameSessionId: s.gameSessionId + 1,
    }))
  },

  restartGame: () => {
    get().startGame()
  },

  returnToMenu: () => {
    set({
      phase: GAME_PHASES.MENU,
      projectiles: [],
      explosions: [],
      enemies: [],
    })
  },

  togglePause: () => {
    const { phase } = get()
    if (phase === GAME_PHASES.PLAYING) set({ phase: GAME_PHASES.PAUSED })
    else if (phase === GAME_PHASES.PAUSED) set({ phase: GAME_PHASES.PLAYING })
  },
}))
