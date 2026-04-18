import { useMemo } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { COVER_ASSETS, PHYSICS } from '../utils/constants'

// ── Shared geometry (created once at module level) ──────────────────
const rockGeo = new THREE.DodecahedronGeometry(1, 1)
const rp = rockGeo.attributes.position
for (let i = 0; i < rp.count; i++) {
  rp.setXYZ(i,
    rp.getX(i) * (0.7 + Math.random() * 0.6),
    rp.getY(i) * (0.6 + Math.random() * 0.5),
    rp.getZ(i) * (0.7 + Math.random() * 0.6),
  )
}
rockGeo.computeVertexNormals()
const boxGeo = new THREE.BoxGeometry(1, 1, 1)

// ── Shared materials ────────────────────────────────────────────────
const rockMat = new THREE.MeshStandardMaterial({ color: 0x666058, roughness: 0.95, metalness: 0.05, flatShading: true })
const concreteMat = new THREE.MeshStandardMaterial({ color: 0x888880, roughness: 0.85, metalness: 0.1 })
const bunkerMat = new THREE.MeshStandardMaterial({ color: 0x5a5a52, roughness: 0.9, metalness: 0.15 })
const barrierMat = new THREE.MeshStandardMaterial({ color: 0x7a7058, roughness: 0.92, metalness: 0.05 })
const crateMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.85, metalness: 0.05 })
const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222 })

function CoverPiece({ data }) {
  const { type, pos, scale: s, rot } = data

  const colliderArgs = useMemo(() => {
    switch (type) {
      case 'rock':    return [s[0] * 0.45, s[1] * 0.45, s[2] * 0.45]
      case 'wall':    return [s[0] / 2, s[1] / 2, s[2] / 2]
      case 'bunker':  return [s[0] / 2, s[1] / 2, s[2] / 2]
      case 'barrier': return [s[0] / 2, s[1] * 0.5, s[2] / 2]
      case 'crates':  return [s[0] * 0.55, s[1] * 0.5, s[2] * 0.5]
      default: return [1, 1, 1]
    }
  }, [type, s])

  const colliderY = useMemo(() => {
    switch (type) {
      case 'rock':    return s[1] * 0.35
      case 'wall':    return s[1] / 2
      case 'bunker':  return s[1] / 2
      case 'barrier': return s[1] * 0.4
      case 'crates':  return s[1] * 0.45
      default: return 0.5
    }
  }, [type, s])

  return (
    <RigidBody type="fixed" position={pos} rotation={[0, rot, 0]} colliders={false}
      friction={PHYSICS.terrainFriction}>
      <CuboidCollider args={colliderArgs} position={[0, colliderY, 0]} />

      {type === 'rock' && (
        <mesh geometry={rockGeo} material={rockMat} scale={s} castShadow receiveShadow />
      )}

      {type === 'wall' && (
        <group>
          <mesh geometry={boxGeo} material={concreteMat}
            scale={s} position={[0, s[1] / 2, 0]} castShadow receiveShadow />
          <mesh geometry={rockGeo} material={concreteMat}
            scale={[s[0] * 0.3, 0.4, s[2] * 0.8]} position={[s[0] * 0.4, 0.2, 0]} castShadow />
        </group>
      )}

      {type === 'bunker' && (
        <group>
          <mesh geometry={boxGeo} material={bunkerMat}
            scale={s} position={[0, s[1] / 2, 0]} castShadow receiveShadow />
          <mesh geometry={boxGeo} material={bunkerMat}
            scale={[s[0] * 1.15, 0.3, s[2] * 1.15]} position={[0, s[1] + 0.15, 0]} castShadow receiveShadow />
          <mesh geometry={boxGeo} material={darkMat}
            scale={[s[0] * 0.6, 0.3, 0.1]} position={[0, s[1] * 0.7, s[2] / 2 + 0.05]} />
        </group>
      )}

      {type === 'barrier' && (
        <group>
          {[0, 0.35, 0.65].map((yOff, i) => (
            <mesh key={i} geometry={boxGeo} material={barrierMat}
              scale={[s[0] * (1 - i * 0.08), 0.35, s[2]]}
              position={[i * 0.05, yOff + 0.175, 0]} castShadow receiveShadow />
          ))}
        </group>
      )}

      {type === 'crates' && (
        <group>
          <mesh geometry={boxGeo} material={crateMat}
            scale={[s[0], s[1] * 0.5, s[2]]}
            position={[-s[0] * 0.3, s[1] * 0.25, 0]} castShadow receiveShadow />
          <mesh geometry={boxGeo} material={crateMat}
            scale={[s[0] * 0.9, s[1] * 0.5, s[2] * 0.9]}
            position={[s[0] * 0.3, s[1] * 0.25, 0]} castShadow receiveShadow />
          <mesh geometry={boxGeo} material={crateMat}
            scale={[s[0] * 0.8, s[1] * 0.45, s[2] * 0.85]}
            position={[0, s[1] * 0.72, 0]} rotation={[0, 0.15, 0]} castShadow receiveShadow />
        </group>
      )}
    </RigidBody>
  )
}

export default function CoverAssets() {
  return (
    <>
      {COVER_ASSETS.map((asset, i) => (
        <CoverPiece key={`cover_${i}`} data={asset} />
      ))}
    </>
  )
}
