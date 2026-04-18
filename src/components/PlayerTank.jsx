import { useRef, useEffect, useMemo, useCallback, memo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { RigidBody, CuboidCollider, BallCollider, interactionGroups } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import { PLAYER, PHYSICS, TANK_MODELS, TANK_TARGET_SIZE, WORLD, GAME_PHASES, GROUPS } from '../utils/constants'

// ── Reusable math objects (only used in useFrame — safe, sequential) ──
const _forward = new THREE.Vector3()
const _vel = new THREE.Vector3()
const _euler = new THREE.Euler()
const _quat = new THREE.Quaternion()
const _shellSpawn = new THREE.Vector3()
const _shellDir = new THREE.Vector3()
const _raycaster = new THREE.Raycaster()
const _mouseNDC = new THREE.Vector2()
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const _intersectPoint = new THREE.Vector3()

const FIRE_COOLDOWN = PLAYER.fireRate

function PlayerTank({ inputRef }) {
  const rigidBodyRef = useRef(null)
  const barrelGroupRef = useRef(null)

  const currentSpeed = useRef(0)
  const hullAngle = useRef(0)

  // 3D world point the mouse is aiming at — shared between aim and fire
  const aimWorldPoint = useRef(new THREE.Vector3(0, 0, 20))

  const { camera } = useThree()

  const { scene } = useGLTF(TANK_MODELS.player.path, true)

  // ── Auto-normalize model ──────────────────────────────────────
  const { normalizedScene, modelInfo } = useMemo(() => {
    const clone = scene.clone(true)

    const box = new THREE.Box3()
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()

    box.setFromObject(clone)
    box.getSize(size)
    box.getCenter(center)

    const targetSize = TANK_TARGET_SIZE * TANK_MODELS.player.sizeMultiplier
    const longest = Math.max(size.x, size.y, size.z, 0.001)
    const s = targetSize / longest

    clone.scale.setScalar(s)

    clone.position.set(
      -center.x * s,
      -box.min.y * s,
      -center.z * s
    )

    const width = size.x * s
    const height = size.y * s
    const depth = size.z * s

    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    return {
      normalizedScene: clone,
      modelInfo: {
        width,
        height,
        depth,
        colliderHalf: [width / 2, height / 2, depth / 2],
        colliderPos: [0, height / 2, 0],
        barrelY: height * 0.75,
        barrelLength: depth * 0.55,
      },
    }
  }, [scene])

  // ── Laser sight ───────────────────────────────────────────────
  const laser = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.05, 0.05, 80, 4)
    geo.rotateX(Math.PI / 2)
    geo.translate(0, 0, 40)
    const mat = new THREE.MeshBasicMaterial({
      color: '#ff2200',
      transparent: true,
      opacity: 0.5,
    })
    return new THREE.Mesh(geo, mat)
  }, [])

  // ── Expose rigid body for camera ──────────────────────────────
  useEffect(() => {
    window.__playerRigidBody = rigidBodyRef
    return () => { window.__playerRigidBody = null }
  }, [])

  // ── Fire projectile — aims at the 3D world point under cursor ─
  const fireProjectile = useCallback(() => {
    const store = useGameStore.getState()
    const now = performance.now() / 1000
    if (now - store.lastFireTime < FIRE_COOLDOWN) return

    const rb = rigidBodyRef.current
    if (!rb) return

    const t = rb.translation()
    const barrelOrigin = new THREE.Vector3(t.x, t.y + modelInfo.barrelY + 0.2, t.z)

    // 3D direction from barrel tip to aim point
    _shellDir.copy(aimWorldPoint.current).sub(barrelOrigin)

    // If aim point is essentially at the barrel (degenerate), fire forward
    if (_shellDir.lengthSq() < 1) {
      const a = hullAngle.current
      _shellDir.set(Math.sin(a), 0, Math.cos(a))
    }
    _shellDir.normalize()

    // Spawn point: offset from barrel origin along the fire direction
    // far enough to clear the player collider
    const spawnOffset = Math.max(modelInfo.barrelLength + 2.5, 4)
    _shellSpawn.copy(barrelOrigin).addScaledVector(_shellDir, spawnOffset)

    store.addProjectile({
      position: [_shellSpawn.x, _shellSpawn.y, _shellSpawn.z],
      direction: [_shellDir.x, _shellDir.y, _shellDir.z],
      speed: PLAYER.shellSpeed,
      owner: 'player',
      damage: PLAYER.shellDamage,
    })
    useGameStore.setState({ lastFireTime: now })
  }, [modelInfo])

  // ── Per-frame update ──────────────────────────────────────────
  useFrame((_, delta) => {
    const rb = rigidBodyRef.current
    if (!rb) return

    const store = useGameStore.getState()
    if (store.phase !== GAME_PHASES.PLAYING) return

    const input = inputRef.current
    if (!input) return

    const keys = input.keys.current
    const dt = Math.min(delta, 0.05)

    // ── Hull turning ─────────────────────────────────────────
    let turnInput = 0
    if (keys.left) turnInput += 1
    if (keys.right) turnInput -= 1
    if (turnInput !== 0) {
      hullAngle.current += turnInput * PLAYER.turnSpeed * dt
    }

    // ── Acceleration model ───────────────────────────────────
    let targetSpeed = 0
    if (keys.forward) targetSpeed = PLAYER.moveSpeed
    else if (keys.backward) targetSpeed = -PLAYER.reverseSpeed

    if (targetSpeed !== 0) {
      const rate = PLAYER.acceleration * dt
      if (currentSpeed.current < targetSpeed) {
        currentSpeed.current = Math.min(currentSpeed.current + rate, targetSpeed)
      } else {
        currentSpeed.current = Math.max(currentSpeed.current - rate, targetSpeed)
      }
    } else {
      const rate = PLAYER.deceleration * dt
      if (currentSpeed.current > 0) currentSpeed.current = Math.max(0, currentSpeed.current - rate)
      else currentSpeed.current = Math.min(0, currentSpeed.current + rate)
    }

    // ── Apply velocity ───────────────────────────────────────
    let fX = Math.sin(hullAngle.current) || 0
    let fZ = Math.cos(hullAngle.current) || 0
    _forward.set(fX, 0, fZ)

    let curVel
    try {
      curVel = rb.linvel()
    } catch {
      curVel = { x: 0, y: 0, z: 0 }
    }

    const vY = (curVel && !isNaN(curVel.y)) ? curVel.y : 0

    _vel.set(
      (_forward.x * currentSpeed.current) || 0,
      vY,
      (_forward.z * currentSpeed.current) || 0
    )
    rb.setLinvel(_vel, true)

    // Set rotation (keep upright, only Y rotation)
    _quat.setFromEuler(_euler.set(0, hullAngle.current, 0))
    rb.setRotation(_quat, true)
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true)

    // ── Mouse aim — compute 3D world target ──────────────────
    const mouse = input.mouse.current
    _mouseNDC.set(mouse.x, mouse.y)
    _raycaster.setFromCamera(_mouseNDC, camera)

    let tankPos
    try { tankPos = rb.translation() } catch {}
    tankPos = tankPos || { x: 0, y: 0, z: 0 }

    // Intersect with ground plane at tank Y
    _groundPlane.constant = -tankPos.y
    const hit = _raycaster.ray.intersectPlane(_groundPlane, _intersectPoint)

    if (hit) {
      aimWorldPoint.current.copy(_intersectPoint)
    } else {
      // Fallback: project the ray far out along its horizontal direction
      const d = _raycaster.ray.direction
      aimWorldPoint.current.set(
        tankPos.x + d.x * 300,
        tankPos.y,
        tankPos.z + d.z * 300
      )
    }

    // Turret angle: INSTANT snap — zero lag, zero interpolation
    const dx = aimWorldPoint.current.x - tankPos.x
    const dz = aimWorldPoint.current.z - tankPos.z
    const worldAimAngle = Math.atan2(dx, dz)
    const turretLocalAngle = worldAimAngle - hullAngle.current

    // Apply turret rotation INSTANTLY — no lerp, no max step
    if (barrelGroupRef.current) {
      barrelGroupRef.current.rotation.y = turretLocalAngle
    }
    window.__playerTurretAngle = worldAimAngle

    // ── Firing ───────────────────────────────────────────────
    if (keys.fire) fireProjectile()

    // ── Reload progress ──────────────────────────────────────
    const now = performance.now() / 1000
    store.setReloadProgress(Math.min(1, (now - store.lastFireTime) / FIRE_COOLDOWN))

    // ── Update store ─────────────────────────────────────────
    let translation
    try {
      translation = rb.translation()
    } catch {
      translation = { x: 0, y: 0, z: 0 }
    }

    const px = isNaN(translation.x) ? 0 : translation.x
    const py = isNaN(translation.y) ? 0 : translation.y
    const pz = isNaN(translation.z) ? 0 : translation.z

    store.setPlayerPosition([px, py, pz])
    store.setPlayerRotation(hullAngle.current || 0)
    store.setTurretRotation(worldAimAngle || 0)
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders={false}
      position={WORLD.playerSpawnPosition}
      mass={PHYSICS.tankMass}
      friction={PHYSICS.tankFriction}
      restitution={PHYSICS.tankRestitution}
      linearDamping={PHYSICS.tankLinearDamping}
      angularDamping={PHYSICS.tankAngularDamping}
      enabledRotations={[false, true, false]}
      userData={{ type: 'player' }}
    >
      {/* Compound collider: cuboid body + bottom sphere "belly" for smooth terrain traversal */}
      <CuboidCollider
        args={[modelInfo.colliderHalf[0], modelInfo.colliderHalf[1] * 0.6, modelInfo.colliderHalf[2]]}
        position={[0, modelInfo.colliderPos[1] + modelInfo.colliderHalf[1] * 0.4, 0]}
        collisionGroups={interactionGroups(
          [GROUPS.PLAYER],
          [GROUPS.TERRAIN, GROUPS.ENEMY, GROUPS.PROJECTILE_ENEMY]
        )}
      />
      {/* Rounded bottom to slide over terrain edges */}
      <BallCollider
        args={[Math.min(modelInfo.colliderHalf[0], modelInfo.colliderHalf[2]) * 0.8]}
        position={[0, modelInfo.colliderHalf[1] * 0.4, 0]}
        collisionGroups={interactionGroups(
          [GROUPS.PLAYER],
          [GROUPS.TERRAIN, GROUPS.ENEMY, GROUPS.PROJECTILE_ENEMY]
        )}
      />

      {/* Tank model - auto-normalized to sit on collider bottom */}
      <primitive object={normalizedScene} />

      {/* Laser sight - rotates independently via mouse aim */}
      <group ref={barrelGroupRef} position={[0, modelInfo.barrelY, 0]}>
        <primitive object={laser} />
      </group>
    </RigidBody>
  )
}

useGLTF.preload(TANK_MODELS.player.path, true)

export default memo(PlayerTank)
