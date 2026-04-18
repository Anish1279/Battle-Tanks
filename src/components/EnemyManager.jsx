import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/gameStore'
import { TANK_MODELS, WORLD, GAME_PHASES } from '../utils/constants'

export default function EnemyManager({ playerPositionRef }) {
  const lastSpawnTime = useRef(0)

  // Choose a random distance and angle for enemy spawn
  const getRandomSpawnPosition = (playerPos) => {
    const angle = Math.random() * Math.PI * 2
    const distance = WORLD.minSpawnDistance + 
      Math.random() * (WORLD.maxSpawnDistance - WORLD.minSpawnDistance)
    
    return [
      playerPos[0] + Math.cos(angle) * distance,
      25, // Spawn well above the highest terrain peak — gravity will settle them on top
      playerPos[2] + Math.sin(angle) * distance
    ]
  }

  useFrame((_, delta) => {
    const store = useGameStore.getState()
    if (store.phase !== GAME_PHASES.PLAYING) return

    const now = performance.now() / 1000
    // Throttle spawn checks so we aren't generating enemies instantly when one dies
    if (now - lastSpawnTime.current < 2.0) return

    const aliveEnemies = store.enemies.filter(e => e.alive)

    if (aliveEnemies.length < WORLD.maxEnemies) {
      // Pick a random tank model variant
      const randomModel = TANK_MODELS.enemies[
        Math.floor(Math.random() * TANK_MODELS.enemies.length)
      ]
      
      const pPos = playerPositionRef.current || [0, 0, 0]
      const spawnPos = getRandomSpawnPosition(pPos)
      
      store.spawnEnemy(randomModel, spawnPos)
      lastSpawnTime.current = now
    }
  })

  return null
}
