import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EFFECTS } from '../utils/constants'

// Shared geometries
const sphereGeo = new THREE.SphereGeometry(1, 16, 12)
const debrisGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4)
const PARTICLE_COUNT = 30

export default function Explosion({ position, scale = 1 }) {
  const groupRef = useRef(null)
  const innerMatRef = useRef(null)
  const midMatRef = useRef(null)
  const outerMatRef = useRef(null)
  const lightRef = useRef(null)
  const instancedRef = useRef(null)
  
  const elapsed = useRef(0)

  // Pre-compute position as a stable array to avoid allocations
  const pos = useMemo(
    () => (Array.isArray(position) ? position : [0, 0, 0]),
    [position]
  )

  // Generate random velocity and rotations for debris particles
  const particles = useMemo(() => {
    const arr = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const u = Math.random()
      const v = Math.random()
      const theta = u * 2.0 * Math.PI
      const phi = Math.acos(2.0 * v - 1.0)
      const r = Math.cbrt(Math.random()) * 8.0 * scale

      const sinPhi = Math.sin(phi)
      
      const vx = r * sinPhi * Math.cos(theta)
      const vy = Math.abs(r * sinPhi * Math.sin(theta)) + 4.0 * scale // push upwards
      const vz = r * Math.cos(phi)

      arr.push({
        velocity: new THREE.Vector3(vx, vy, vz),
        rotAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
        rotSpeed: (Math.random() - 0.5) * 15,
      })
    }
    return arr
  }, [scale])

  useFrame((_, delta) => {
    elapsed.current += delta

    const duration = EFFECTS.explosionDuration
    const t = Math.min(elapsed.current / duration, 1) // 0 -> 1 normalized
    const easedT = 1 - Math.pow(1 - t, 3)

    // --- Core Scale: fast expand then slow grow ---
    const innerScale = (0.3 + easedT * 1.5) * scale
    const midScale = (0.1 + easedT * 2.2) * scale
    const outerScale = (0.0 + easedT * 3.0) * scale

    const group = groupRef.current
    if (!group) return

    const children = group.children
    if (children[0]) children[0].scale.setScalar(innerScale)
    if (children[1]) children[1].scale.setScalar(midScale)
    if (children[2]) children[2].scale.setScalar(outerScale)

    // --- Opacity ---
    const fadeStart = 0.2
    const opacity = t < fadeStart ? 1 : 1 - (t - fadeStart) / (1 - fadeStart)
    const clampedOpacity = Math.max(0, opacity)

    if (innerMatRef.current) {
      innerMatRef.current.opacity = clampedOpacity
      innerMatRef.current.emissiveIntensity = 8 * clampedOpacity
    }
    if (midMatRef.current) {
      midMatRef.current.opacity = clampedOpacity * 0.8
      midMatRef.current.emissiveIntensity = 5 * clampedOpacity
    }
    if (outerMatRef.current) {
      outerMatRef.current.opacity = clampedOpacity * 0.4
      outerMatRef.current.emissiveIntensity = 2 * clampedOpacity
    }

    // --- Point light ---
    if (lightRef.current) {
      const lightT = t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / 0.5)
      lightRef.current.intensity = lightT * 25 * scale
    }

    // --- Debris Particles ---
    if (instancedRef.current) {
      const dummy = new THREE.Object3D()
      particles.forEach((p, i) => {
        // Simple gravity and velocity
        const dt = elapsed.current
        const dx = p.velocity.x * dt
        const dy = p.velocity.y * dt - 0.5 * 20 * dt * dt // gravity
        const dz = p.velocity.z * dt

        dummy.position.set(dx, dy, dz)
        dummy.setRotationFromAxisAngle(p.rotAxis, p.rotSpeed * dt)
        
        // Shrink particles as they fly
        const pScale = Math.max(0, scale * (1 - t))
        dummy.scale.setScalar(pScale)

        dummy.updateMatrix()
        instancedRef.current.setMatrixAt(i, dummy.matrix)
      })
      instancedRef.current.instanceMatrix.needsUpdate = true
      if (instancedRef.current.material) {
        instancedRef.current.material.opacity = clampedOpacity
      }
    }
  })

  return (
    <group ref={groupRef} position={pos}>
      {/* Inner core */}
      <mesh geometry={sphereGeo}>
        <meshStandardMaterial
          ref={innerMatRef}
          color="#ffffdd"
          emissive="#ffcc44"
          emissiveIntensity={8}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Mid layer */}
      <mesh geometry={sphereGeo}>
        <meshStandardMaterial
          ref={midMatRef}
          color="#ff6600"
          emissive="#ff3300"
          emissiveIntensity={5}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Outer layer */}
      <mesh geometry={sphereGeo}>
        <meshStandardMaterial
          ref={outerMatRef}
          color="#551100"
          emissive="#440000"
          emissiveIntensity={2}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Debris Instance Mesh */}
      <instancedMesh ref={instancedRef} args={[debrisGeo, null, PARTICLE_COUNT]}>
        <meshStandardMaterial 
          color="#ff4400" 
          emissive="#ff2200" 
          emissiveIntensity={1.5}
          transparent
        />
      </instancedMesh>

      {/* Dynamic flash light */}
      <pointLight
        ref={lightRef}
        color="#ff8844"
        intensity={0}
        distance={30 * scale}
        decay={2}
      />
    </group>
  )
}
