import { useEffect, useRef } from 'react'

/**
 * Tracks keyboard + mouse input state without re-renders.
 * Read keys.current in useFrame loops.
 */
export function useInput() {
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    fire: false,
    pause: false,
    turretLeft: false,
    turretRight: false,
  })

  const mouse = useRef({
    x: 0,
    y: 0,
    clicking: false,
  })

  useEffect(() => {
    const onKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = true; break
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = true; break
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = true; break
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = true; break
        case 'Space':
          keys.current.fire = true; break
        case 'Escape':
          keys.current.pause = true; break
        case 'KeyQ':
          keys.current.turretLeft = true; break
        case 'KeyE':
          keys.current.turretRight = true; break
      }
    }

    const onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = false; break
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = false; break
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = false; break
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = false; break
        case 'Space':
          keys.current.fire = false; break
        case 'Escape':
          keys.current.pause = false; break
        case 'KeyQ':
          keys.current.turretLeft = false; break
        case 'KeyE':
          keys.current.turretRight = false; break
      }
    }

    const onMouseMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    const onMouseDown = (e) => {
      if (e.button === 0) {
        mouse.current.clicking = true
        keys.current.fire = true
      }
    }

    const onMouseUp = (e) => {
      if (e.button === 0) {
        mouse.current.clicking = false
        keys.current.fire = false
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return { keys, mouse }
}
