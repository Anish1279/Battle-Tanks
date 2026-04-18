import { useGameStore } from '../store/gameStore'
import Projectile from './Projectile'
import Explosion from './Explosion'

export default function ProjectileManager() {
  const projectiles = useGameStore((state) => state.projectiles)
  const explosions = useGameStore((state) => state.explosions)

  return (
    <>
      {projectiles.map((p) => (
        <Projectile key={p.id} data={p} />
      ))}
      {explosions.map((e) => (
        <Explosion key={e.id} position={e.position} scale={e.scale} />
      ))}
    </>
  )
}
