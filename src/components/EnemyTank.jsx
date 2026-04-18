import { useRef, useMemo, useCallback, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import { RigidBody, CuboidCollider, BallCollider, interactionGroups } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import { PHYSICS, TANK_TARGET_SIZE, GROUPS } from '../utils/constants'

// ── Reusable math objects (only used in useFrame — sequential, safe) ─
const _forward = new THREE.Vector3()
const _toPlayer = new THREE.Vector3()
const _toWaypoint = new THREE.Vector3()
const _aimDir = new THREE.Vector3()
const _spreadOffset = new THREE.Vector3()
const _shellPos = new THREE.Vector3()
const _euler = new THREE.Euler()
const _quat = new THREE.Quaternion()

function randomPatrolPoint(center, radius) {
  const angle = Math.random() * Math.PI * 2
  const dist = radius * 0.4 + Math.random() * radius * 0.6
  return [center[0] + Math.cos(angle) * dist, center[1], center[2] + Math.sin(angle) * dist]
}

function angleDiff(current, target) {
  let d = target - current
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

function smoothTurn(diff, turnSpeed, dt) {
  const absDiff = Math.abs(diff)
  // Sharper easing: fast when far, precise when close
  const ease = Math.min(1, absDiff / 0.3)
  return Math.sign(diff) * Math.min(absDiff, turnSpeed * Math.max(ease, 0.5) * dt)
}

const ENEMY_COLLISION_GROUPS = interactionGroups([GROUPS.ENEMY], [GROUPS.TERRAIN, GROUPS.PLAYER, GROUPS.ENEMY, GROUPS.PROJECTILE_PLAYER])

// Throttle rate for syncing position back to Zustand (for minimap/HUD only)
const POSITION_SYNC_INTERVAL = 0.25 // seconds

function HealthBar({ health, maxHealth }) {
  const pct = Math.max(0, health / maxHealth)
  return (
    <Html position={[0, 0.5, 0]} center distanceFactor={25} sprite style={{ pointerEvents: 'none' }}>
      <div style={{
        width: 60, height: 6, background: 'rgba(0,0,0,0.6)',
        borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)',
      }}>
        <div style={{
          width: `${pct * 100}%`, height: '100%', background: '#ef4444',
          borderRadius: 3, transition: 'width 0.25s ease-out',
        }} />
      </div>
    </Html>
  )
}

function EnemyTank({ enemyData, playerPositionRef }) {
  const { scene } = useGLTF(enemyData.modelPath, true)
  const rigidBodyRef = useRef(null)
  const groupRef = useRef(null)

  const ai = useRef({
    state: 'chase', // Start aggressive — immediately hunt the player
    rotation: enemyData.rotation ?? 0,
    lastFireTime: -(enemyData.stats?.fireRate || 3) + Math.random() * 1.5, // Stagger first shots
    patrolCenter: [...enemyData.position],
    waypoint: randomPatrolPoint(enemyData.position, 15),
    waypointTimer: 0,
    reactionDelay: 0.05 + Math.random() * 0.1, // Very fast reaction
    reactionTimer: 0,
    retreatAngle: 0,
    stuckTimer: 0,
    lastPos: [...enemyData.position],
    positionSyncTimer: Math.random() * POSITION_SYNC_INTERVAL, // Stagger sync times
  })

  // ── Auto-normalize model ──────────────────────────────────────
  // LOCAL math objects inside useMemo — prevents shared mutable data race
  const { normalizedScene, modelInfo } = useMemo(() => {
    const clone = scene.clone(true)

    const box = new THREE.Box3()
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()

    box.setFromObject(clone)
    box.getSize(size)
    box.getCenter(center)

    const mult = enemyData.sizeMultiplier ?? 1.0
    const targetSize = TANK_TARGET_SIZE * mult
    const longest = Math.max(size.x, size.y, size.z, 0.001)
    const s = targetSize / longest

    clone.scale.setScalar(s)
    clone.position.set(-center.x * s, -box.min.y * s, -center.z * s)

    const width = size.x * s
    const height = size.y * s
    const depth = size.z * s

    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.material = child.material.clone()
      }
    })

    return {
      normalizedScene: clone,
      modelInfo: {
        width, height, depth,
        colliderHalf: [width / 2, height / 2, depth / 2],
        colliderPos: [0, height / 2, 0],
      },
    }
  }, [scene, enemyData.sizeMultiplier])

  const deadSceneRef = useRef(false)
  const applyDestroyedLook = useCallback(() => {
    if (deadSceneRef.current) return
    deadSceneRef.current = true
    normalizedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color.set(0x222222)
        if (child.material.emissive) child.material.emissive.set(0x110800)
        child.material.roughness = 1
        child.material.metalness = 0.2
      }
    })
  }, [normalizedScene])

  const fireShell = useCallback((position, aimDirection, stats) => {
    const { accuracy, shellSpeed, shellDamage } = stats
    const spread = (1 - accuracy) * 0.25 // Tighter spread for better accuracy
    _spreadOffset.set(
      (Math.random() - 0.5) * 2 * spread,
      (Math.random() - 0.5) * spread * 0.2,
      (Math.random() - 0.5) * 2 * spread,
    )
    _aimDir.copy(aimDirection).normalize().add(_spreadOffset).normalize()
    // Spawn the shell well outside the bounding box
    _shellPos.set(
      position[0] + _aimDir.x * 5.0,
      position[1] + modelInfo.height * 0.7,
      position[2] + _aimDir.z * 5.0,
    )
    useGameStore.getState().addProjectile({
      owner: enemyData.id,
      position: [_shellPos.x, _shellPos.y, _shellPos.z],
      direction: [_aimDir.x, _aimDir.y, _aimDir.z],
      speed: shellSpeed,
      damage: shellDamage,
    })
  }, [enemyData.id, modelInfo.height])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const { alive, health, maxHealth, stats } = enemyData
    const rb = rigidBodyRef.current
    const group = groupRef.current
    if (!rb || !group) return

    if (!alive) {
      applyDestroyedLook()
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0.12, dt * 2)
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, 0.06, dt * 2)
      return
    }

    let bodyPos
    try {
      bodyPos = rb.translation()
    } catch {
      bodyPos = { x: enemyData.position[0], y: enemyData.position[1], z: enemyData.position[2] }
    }
    
    const cx = isNaN(bodyPos.x) ? enemyData.position[0] : bodyPos.x
    const cy = isNaN(bodyPos.y) ? enemyData.position[1] : bodyPos.y
    const cz = isNaN(bodyPos.z) ? enemyData.position[2] : bodyPos.z

    const currentPos = [cx, cy, cz]
    
    let pPosRaw = playerPositionRef.current || [0, 0, 0]
    const px = isNaN(pPosRaw[0]) ? 0 : pPosRaw[0]
    const py = isNaN(pPosRaw[1]) ? 0 : pPosRaw[1]
    const pz = isNaN(pPosRaw[2]) ? 0 : pPosRaw[2]
    const playerPos = [px, py, pz]

    _toPlayer.set(playerPos[0] - currentPos[0], 0, playerPos[2] - currentPos[2])
    const distToPlayer = _toPlayer.length()
    const angleToPlayer = Math.atan2(_toPlayer.x, _toPlayer.z)

    const a = ai.current
    const { detectionRange, attackRange, moveSpeed, turnSpeed, fireRate } = stats

    // ── Aggressive State Machine ─────────────────────────────
    const healthPct = health / maxHealth
    const prevState = a.state

    if (healthPct < 0.15) {
      // Only retreat at very low health
      a.state = 'retreat'
    } else if (a.state === 'retreat' && healthPct >= 0.15) {
      // Stop retreating immediately if health is OK
      a.state = 'chase'
    } else if (distToPlayer < attackRange) {
      a.state = 'attack'
    } else if (distToPlayer < detectionRange) {
      a.state = 'chase'
    } else if (a.state === 'attack' || a.state === 'chase') {
      // Stay aggressive — keep chasing even beyond detection range once engaged
      a.state = 'chase'
    } else {
      a.state = 'patrol'
    }

    if (prevState !== a.state) {
      a.reactionTimer = a.reactionDelay
      if (a.state === 'patrol') a.waypoint = randomPatrolPoint(a.patrolCenter, 15)
      if (a.state === 'retreat') a.retreatAngle = angleToPlayer + Math.PI + (Math.random() - 0.5) * 0.6
    }

    if (a.reactionTimer > 0) a.reactionTimer -= dt
    const reacting = a.reactionTimer > 0
    const now = performance.now() / 1000

    let desiredAngle = a.rotation
    let desiredSpeed = 0
    let shouldFire = false

    switch (a.state) {
      case 'patrol': {
        _toWaypoint.set(a.waypoint[0] - currentPos[0], 0, a.waypoint[2] - currentPos[2])
        const wpDist = _toWaypoint.length()
        if (wpDist < 3) {
          a.waypointTimer += dt
          if (a.waypointTimer > 1.0 + Math.random() * 1.5) {
            a.waypoint = randomPatrolPoint(a.patrolCenter, 15); a.waypointTimer = 0
          }
        } else {
          desiredAngle = Math.atan2(_toWaypoint.x, _toWaypoint.z)
          desiredSpeed = moveSpeed * 0.6
          a.waypointTimer = 0
        }
        break
      }
      case 'chase': {
        desiredAngle = angleToPlayer
        // Full speed chase — close the gap aggressively
        const factor = THREE.MathUtils.clamp(
          (distToPlayer - attackRange * 0.5) / (detectionRange - attackRange * 0.5), 0.6, 1)
        desiredSpeed = moveSpeed * factor
        // Fire while chasing if within reasonable range
        if (!reacting && distToPlayer < detectionRange * 0.8) {
          shouldFire = true
        }
        break
      }
      case 'attack': {
        desiredAngle = angleToPlayer
        // Keep moderate movement speed — strafe and close in
        desiredSpeed = moveSpeed * 0.35
        shouldFire = !reacting
        break
      }
      case 'retreat': {
        a.retreatAngle += (Math.random() - 0.5) * 0.5 * dt
        desiredAngle = a.retreatAngle
        desiredSpeed = moveSpeed * 0.7
        // Still fire while retreating
        if (!reacting && now - a.lastFireTime > fireRate * 0.8) shouldFire = true
        break
      }
    }

    // Stuck detection
    a.stuckTimer += dt
    if (a.stuckTimer > 1.5) {
      const dx = currentPos[0] - a.lastPos[0], dz = currentPos[2] - a.lastPos[2]
      if (dx * dx + dz * dz < 0.25 && desiredSpeed > 0) {
        a.waypoint = randomPatrolPoint(a.patrolCenter, 15)
        a.retreatAngle += Math.PI * 0.5
      }
      a.lastPos = [...currentPos]; a.stuckTimer = 0
    }

    // Turning
    const diff = angleDiff(a.rotation, desiredAngle)
    a.rotation += smoothTurn(diff, turnSpeed, dt)
    if (a.rotation > Math.PI) a.rotation -= Math.PI * 2
    if (a.rotation < -Math.PI) a.rotation += Math.PI * 2

    // Movement
    _forward.set(Math.sin(a.rotation), 0, Math.cos(a.rotation))
    const turnPenalty = THREE.MathUtils.clamp(1 - Math.abs(diff) / Math.PI, 0.3, 1)
    const finalSpeed = desiredSpeed * turnPenalty

    let curVel
    try {
      curVel = rb.linvel()
    } catch {
      curVel = { x: 0, y: 0, z: 0 }
    }
    const vy = (curVel && !isNaN(curVel.y)) ? curVel.y : 0

    // Underground rescue — if we somehow sank below the world, teleport up
    if (currentPos[1] < -5) {
      const pPos = playerPositionRef.current || [0, 0, 0]
      rb.setTranslation({ x: pPos[0] + (Math.random() - 0.5) * 40, y: 25, z: pPos[2] + (Math.random() - 0.5) * 40 }, true)
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    rb.setLinvel({ x: (_forward.x * finalSpeed) || 0, y: vy, z: (_forward.z * finalSpeed) || 0 }, true)

    _euler.set(0, a.rotation, 0)
    _quat.setFromEuler(_euler)
    rb.setRotation({ x: _quat.x, y: _quat.y, z: _quat.z, w: _quat.w }, true)
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true)

    // Firing
    if (shouldFire && now - a.lastFireTime > fireRate) {
      _aimDir.set(playerPos[0] - currentPos[0], 0, playerPos[2] - currentPos[2]).normalize()
      fireShell(currentPos, _aimDir, stats)
      a.lastFireTime = now
    }

    // ── Position sync — throttled to reduce re-renders ───────
    a.positionSyncTimer += dt
    if (a.positionSyncTimer >= POSITION_SYNC_INTERVAL) {
      a.positionSyncTimer = 0
      useGameStore.getState().updateEnemyPosition(enemyData.id, currentPos, a.rotation)
    }
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={enemyData.position}
      rotation={[0, enemyData.rotation ?? 0, 0]}
      mass={PHYSICS.enemyMass}
      linearDamping={PHYSICS.tankLinearDamping}
      angularDamping={PHYSICS.tankAngularDamping}
      friction={PHYSICS.tankFriction}
      restitution={PHYSICS.tankRestitution}
      enabledRotations={[false, true, false]}
      colliders={false}
      userData={{ type: 'enemy', enemyId: enemyData.id }}
    >
      {/* Compound collider: cuboid body + ball belly for smooth terrain traversal */}
      <CuboidCollider
        args={[modelInfo.colliderHalf[0], modelInfo.colliderHalf[1] * 0.6, modelInfo.colliderHalf[2]]}
        position={[0, modelInfo.colliderPos[1] + modelInfo.colliderHalf[1] * 0.4, 0]}
        collisionGroups={ENEMY_COLLISION_GROUPS}
      />
      <BallCollider
        args={[Math.min(modelInfo.colliderHalf[0], modelInfo.colliderHalf[2]) * 0.8]}
        position={[0, modelInfo.colliderHalf[1] * 0.4, 0]}
        collisionGroups={ENEMY_COLLISION_GROUPS}
      />

      <group ref={groupRef}>
        <primitive object={normalizedScene} />

        {/* Health bar above tank */}
        {enemyData.alive && enemyData.health < enemyData.maxHealth && (
          <group position={[0, modelInfo.height + 0.5, 0]}>
            <HealthBar health={enemyData.health} maxHealth={enemyData.maxHealth} />
          </group>
        )}
      </group>
    </RigidBody>
  )
}

// Preload all enemy models at module level
useGLTF.preload('/low_poly_t_72_tank_game_ready.glb', true)
useGLTF.preload('/tank_pzkpfwvi_ausfb_porshe_tiger_ii.glb', true)
useGLTF.preload('/sherman_firefly_tank.glb', true)
useGLTF.preload('/soviet_medium_tank_t_34_85_d_5t.glb', true)
useGLTF.preload('/ms_1_light_tank.glb', true)

export default memo(EnemyTank)
