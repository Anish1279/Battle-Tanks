import { useEffect, useCallback } from 'react'
import { useProgress } from '@react-three/drei'
import Game from './components/Game'
import MainMenu from './ui/MainMenu'
import HUD from './ui/HUD'
import PauseMenu from './ui/PauseMenu'
import GameOverScreen from './ui/GameOverScreen'
import VictoryScreen from './ui/VictoryScreen'
import LoadingScreen from './ui/LoadingScreen'
import { useGameStore } from './store/gameStore'
import { GAME_PHASES } from './utils/constants'
import { Audio } from './utils/audio'

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const togglePause = useGameStore((s) => s.togglePause)

  // Handle pause key globally
  useEffect(() => {
    let pausePressed = false
    const handleKey = (e) => {
      if (e.code === 'Escape' && !pausePressed) {
        pausePressed = true
        if (phase === GAME_PHASES.PLAYING || phase === GAME_PHASES.PAUSED) {
          togglePause()
        }
      }
    }
    const handleKeyUp = (e) => {
      if (e.code === 'Escape') pausePressed = false
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [phase, togglePause])

  // Resume audio context on first interaction
  useEffect(() => {
    const resume = () => {
      Audio.resume()
      window.removeEventListener('click', resume)
      window.removeEventListener('keydown', resume)
    }
    window.addEventListener('click', resume)
    window.addEventListener('keydown', resume)
    return () => {
      window.removeEventListener('click', resume)
      window.removeEventListener('keydown', resume)
    }
  }, [])

  const isInGame = phase === GAME_PHASES.PLAYING ||
    phase === GAME_PHASES.PAUSED ||
    phase === GAME_PHASES.VICTORY ||
    phase === GAME_PHASES.GAME_OVER

  return (
    <div className="w-full h-full relative bg-black">
      {/* 3D Game Canvas - only render when in game */}
      {isInGame && <Game />}

      {/* Loading overlay */}
      {isInGame && <LoadingScreen />}

      {/* UI Overlays */}
      {phase === GAME_PHASES.MENU && <MainMenu />}
      {phase === GAME_PHASES.PLAYING && <HUD />}
      {phase === GAME_PHASES.PAUSED && (
        <>
          <HUD />
          <PauseMenu />
        </>
      )}
      {phase === GAME_PHASES.GAME_OVER && <GameOverScreen />}
      {phase === GAME_PHASES.VICTORY && <VictoryScreen />}
    </div>
  )
}
