import { Suspense, useRef, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Stars, Sky, Environment } from '@react-three/drei'
import Terrain from './Terrain'
import PlayerTank from './PlayerTank'
import EnemyTank from './EnemyTank'
import ProjectileManager from './ProjectileManager'
import EnemyManager from './EnemyManager'
import CameraController from './CameraController'
import CoverAssets from './CoverAssets'
import { useGameStore } from '../store/gameStore'
import { useInput } from '../hooks/useInput'
import { PHYSICS, CAMERA } from '../utils/constants'

/**
 * Wraps a single enemy tank in its own Suspense boundary.
 * If one model fails/delays, the others still render.
 */
function SafeEnemyTank({ enemyData, playerPositionRef }) {
  return (
    <Suspense fallback={null}>
      <EnemyTank enemyData={enemyData} playerPositionRef={playerPositionRef} />
    </Suspense>
  )
}

function SceneContent({ inputRef }) {
  const enemies = useGameStore((s) => s.enemies)
  const playerPositionRef = useRef([0, 0, 0])

  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      playerPositionRef.current = state.playerPosition
    })
    return unsub
  }, [])

  return (
    <>
      {/* Lighting - realistic sunlight and PBR environment */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[100, 50, 100]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={300}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.0005}
      />

      {/* Atmosphere - Photorealistic Skybox */}
      <Sky sunPosition={[100, 20, 100]} turbidity={0.2} rayleigh={0.3} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <Environment preset="sunset" />
      
      <fog attach="fog" args={['#8b99a6', 120, 450]} />

      {/* Camera */}
      <CameraController />

      {/* Physics World */}
      <Physics gravity={PHYSICS.gravity} timeStep={PHYSICS.timestep}>
        <Terrain playerPositionRef={playerPositionRef} />
        <PlayerTank inputRef={inputRef} />
        <EnemyManager playerPositionRef={playerPositionRef} />
        {enemies.map((enemy) => (
          <SafeEnemyTank
            key={enemy.id}
            enemyData={enemy}
            playerPositionRef={playerPositionRef}
          />
        ))}
        <CoverAssets />
        <ProjectileManager />
      </Physics>
    </>
  )
}

export default function Game() {
  const { keys, mouse } = useInput()
  const inputRef = useRef({ keys, mouse })
  inputRef.current = { keys, mouse }
  const gameSessionId = useGameStore((state) => state.gameSessionId)

  return (
    <Canvas
      shadows
      camera={{
        fov: CAMERA.fov,
        near: CAMERA.near,
        far: CAMERA.far,
        position: [0, CAMERA.height, CAMERA.distance],
      }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      dpr={[1, 1.5]}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <Suspense fallback={null}>
        <SceneContent key={gameSessionId} inputRef={inputRef} />
      </Suspense>
    </Canvas>
  )
}
