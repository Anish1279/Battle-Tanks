import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA, EFFECTS } from '../utils/constants'
import { useGameStore } from '../store/gameStore'

const _desiredPos = new THREE.Vector3()
const _lookTarget = new THREE.Vector3()
const _shakeOffset = new THREE.Vector3()

export default function CameraController() {
  const { camera } = useThree()
  const initialized = useRef(false)

  useFrame((_, delta) => {
    const rbRef = window.__playerRigidBody
    if (!rbRef || !rbRef.current) return

    let pos
    try {
      const t = rbRef.current.translation()
      pos = { x: t.x, y: t.y, z: t.z }
    } catch {
      return
    }

    const playerRotation = useGameStore.getState().playerRotation

    // Camera behind and above the tank
    _desiredPos.set(
      pos.x - Math.sin(playerRotation) * CAMERA.distance,
      pos.y + CAMERA.height,
      pos.z - Math.cos(playerRotation) * CAMERA.distance
    )

    // Keep camera above a reasonable floor
    _desiredPos.y = Math.max(_desiredPos.y, pos.y + 5)

    const lerpFactor = 1 - Math.exp(-CAMERA.smoothSpeed * delta)

    if (!initialized.current) {
      camera.position.copy(_desiredPos)
      initialized.current = true
    } else {
      camera.position.lerp(_desiredPos, lerpFactor)
    }

    // Screen shake
    if (useGameStore.getState().screenShake) {
      const i = EFFECTS.screenShakeIntensity
      _shakeOffset.set(
        (Math.random() - 0.5) * 2 * i,
        (Math.random() - 0.5) * 2 * i,
        (Math.random() - 0.5) * 2 * i
      )
      camera.position.add(_shakeOffset)
    }

    // Look ahead of the tank
    _lookTarget.set(
      pos.x + Math.sin(playerRotation) * CAMERA.lookAheadDistance,
      pos.y + 2,
      pos.z + Math.cos(playerRotation) * CAMERA.lookAheadDistance
    )
    camera.lookAt(_lookTarget)
  })

  return null
}
