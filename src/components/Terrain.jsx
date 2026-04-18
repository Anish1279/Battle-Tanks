import { useGLTF } from '@react-three/drei'
import { RigidBody, CuboidCollider, interactionGroups } from '@react-three/rapier'
import { useMemo } from 'react'
import * as THREE from 'three'
import { WORLD, PHYSICS, GROUPS } from '../utils/constants'

// Tiling system for infinite terrain mapping.
function TerrainChunk({ terrainScene, offsetX, offsetZ }) {
  const terrainMask = interactionGroups([GROUPS.TERRAIN], [GROUPS.PLAYER, GROUPS.ENEMY, GROUPS.PROJECTILE_PLAYER, GROUPS.PROJECTILE_ENEMY])
  return (
    <group position={[offsetX, 0, offsetZ]}>
      {/* Main terrain with trimesh collider */}
      <RigidBody
        type="fixed"
        colliders="trimesh"
        friction={PHYSICS.terrainFriction}
        restitution={PHYSICS.terrainRestitution}
        collisionGroups={terrainMask}
      >
        <primitive
          object={terrainScene.clone(true)}
          scale={WORLD.terrainScale}
        />
      </RigidBody>
    </group>
  )
}

export default function Terrain({ playerPositionRef }) {
  const { scene } = useGLTF(WORLD.terrainPath, true)

  const terrainScene = useMemo(() => {
    const cloned = scene.clone(true)
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (child.material) {
          child.material.roughness = Math.max(child.material.roughness || 0.8, 0.6)
          child.material.envMapIntensity = 0.5
        }
      }
    })
    return cloned
  }, [scene])

  // Get current chunk based on player position without recalculating every frame.
  // Using a hook over playerPosition in Zustand directly would cause 60fps re-renders, 
  // so we'll just track the current chunks using a generic heuristic in the frame 
  // OR rely on the reference and calculate the 3x3 manually in useFrame..
  // Wait, rendering components based on a fast-changing ref requires state.
  // Instead, the 3x3 array of terrain chunks can just rigidly follow the player's chunk via an instanced mesh
  // or a manual useFrame that snaps their positions!
  return (
    <>
      <InfiniteTerrainGrid terrainScene={terrainScene} playerPositionRef={playerPositionRef} />

      {/* Extended ground plane to fill void beyond terrain edges */}
      <RigidBody type="fixed" position={[0, -1, 0]} collisionGroups={interactionGroups([GROUPS.TERRAIN], [GROUPS.PLAYER, GROUPS.ENEMY, GROUPS.PROJECTILE_PLAYER, GROUPS.PROJECTILE_ENEMY])}>
        <CuboidCollider args={[5000, 0.5, 5000]} />
        <mesh receiveShadow>
          <boxGeometry args={[10000, 1, 10000]} />
          <meshStandardMaterial color="#2a3a18" roughness={1} />
        </mesh>
      </RigidBody>
    </>
  )
}

// Manages the physical snapping of a 3x3 grid
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

function InfiniteTerrainGrid({ terrainScene, playerPositionRef }) {
  const gridRef = useRef()

  useFrame(() => {
    if (!playerPositionRef.current || !gridRef.current) return
    const [px, , pz] = playerPositionRef.current
    
    const chunkSize = WORLD.terrainChunkSize
    
    // Calculate which chunk coordinate the player is currently in
    const chunkX = Math.floor(px / chunkSize)
    const chunkZ = Math.floor(pz / chunkSize)
    
    // Snap the entire 3x3 grid group to the center of the player's current chunk.
    // The Terrain instances themselves are offset locally by [-1, 0, 1] * chunkSize.
    gridRef.current.position.set(
      chunkX * chunkSize,
      0,
      chunkZ * chunkSize
    )
  })

  // We build a 3x3 grid of `TerrainChunk` once.
  // By moving the parent group (gridRef), we seamlessly shift the 3x3 block of terrains 
  // snapping to the chunk grid.
  const offsets = []
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      offsets.push({ x: x * WORLD.terrainChunkSize, z: z * WORLD.terrainChunkSize })
    }
  }

  return (
    <group ref={gridRef}>
      {offsets.map((off, i) => (
        <TerrainChunk 
          key={i} 
          terrainScene={terrainScene} 
          offsetX={off.x} 
          offsetZ={off.z} 
        />
      ))}
    </group>
  )
}

useGLTF.preload(WORLD.terrainPath, true)
