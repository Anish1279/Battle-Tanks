import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, BallCollider, interactionGroups } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import { PHYSICS, GROUPS } from '../utils/constants'

// Reusable vector for velocity computation — allocated once, never in a render loop
const _velocity = new THREE.Vector3()

export default function Projectile({ data }) {
  const { id, position, direction, speed, damage, owner } = data
  const rigidBodyRef = useRef(null)
  const despawnTimer = useRef(null)
  const removed = useRef(false)

  // Pre-compute the initial velocity vector once
  const initialVelocity = useMemo(
    () => ({
      x: direction[0] * speed,
      y: direction[1] * speed,
      z: direction[2] * speed,
    }),
    [direction, speed]
  )

  const collisionMask = useMemo(() => {
    const isPlayer = owner === 'player'
    const group = isPlayer ? GROUPS.PROJECTILE_PLAYER : GROUPS.PROJECTILE_ENEMY
    const mask = isPlayer 
      ? [GROUPS.TERRAIN, GROUPS.ENEMY] 
      : [GROUPS.TERRAIN, GROUPS.PLAYER]
    return interactionGroups([group], mask)
  }, [owner])

  // Set linear velocity on mount and schedule auto-despawn
  useEffect(() => {
    const rb = rigidBodyRef.current
    if (rb) {
      rb.setLinvel(initialVelocity, true)
    }

    despawnTimer.current = setTimeout(() => {
      if (!removed.current) {
        removed.current = true
        useGameStore.getState().removeProjectile(id)
      }
    }, PHYSICS.shellLifetime * 1000)

    return () => {
      if (despawnTimer.current) {
        clearTimeout(despawnTimer.current)
      }
    }
  }, [id, initialVelocity])

  const handleCollision = (event) => {
    if (removed.current) return
    removed.current = true

    const store = useGameStore.getState()
    const other = event.other

    // Determine contact point — fall back to projectile position if unavailable
    const rb = rigidBodyRef.current
    let contactPoint
    try {
      if (event.manifold) {
        const solverContact = event.manifold.solverContactPoint(0)
        if (solverContact) {
          contactPoint = [solverContact.x, solverContact.y, solverContact.z]
        }
      }
    } catch {
      // manifold API can throw if bodies are already removed — safe to ignore
    }
    if (!contactPoint && rb) {
      try {
        const t = rb.translation()
        contactPoint = [t.x, t.y, t.z]
      } catch {
        // rigid body already disposed
      }
    }
    if (!contactPoint) {
      contactPoint = [...position]
    }

    // Spawn explosion at contact point
    store.addExplosion(contactPoint)

    // Resolve damage based on owner and what was hit
    // Guard against null/undefined rigidBodyObject (can happen if target was
    // removed between physics step and collision callback)
    const rigidBodyObject = other?.rigidBodyObject
    const userData = rigidBodyObject?.userData
    if (userData) {
      if (owner === 'player' && userData.type === 'enemy' && userData.enemyId) {
        // Verify enemy still exists and is alive before applying damage
        const enemies = store.enemies
        const targetEnemy = enemies.find((e) => e.id === userData.enemyId)
        if (targetEnemy && targetEnemy.alive) {
          store.damageEnemy(userData.enemyId, damage)
          if (targetEnemy.health - damage <= 0) {
            // Massive explosion for tank destruction
            store.addExplosion(contactPoint, 4.0)
          }
        }
      } else if (owner !== 'player' && userData.type === 'player') {
        store.damagePlayer(damage)
        const playerHealth = store.playerHealth
        if (playerHealth - damage <= 0 && playerHealth > 0) {
           store.addExplosion(contactPoint, 4.0)
        }
      }
    }

    // Remove self from the store
    store.removeProjectile(id)
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={position}
      colliders={false}
      gravityScale={0.15}
      ccd
      userData={{ type: 'projectile', owner, id }}
      onIntersectionEnter={handleCollision}
    >
      <BallCollider args={[PHYSICS.shellRadius * 2]} sensor collisionGroups={collisionMask} />

      {/* Shell body — elongated sphere with emissive glow */}
      <mesh scale={[0.2, 0.2, 0.5]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial
          color="#ffaa22"
          emissive="#ff6600"
          emissiveIntensity={4}
          toneMapped={false}
        />
      </mesh>

      {/* Trailing glow light */}
      <pointLight color="#ff8800" intensity={6} distance={12} decay={2} />
    </RigidBody>
  )
}
