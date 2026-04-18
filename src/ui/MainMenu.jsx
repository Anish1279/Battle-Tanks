import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'

export default function MainMenu() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const handleStart = () => {
    useGameStore.getState().startGame()
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-1000 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ fontFamily: "'Rajdhani', sans-serif" }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 via-transparent to-transparent" />

      {/* Decorative grid lines */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,136,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Top accent line */}
        <div className="w-48 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

        {/* Subtitle */}
        <p className="text-emerald-400 text-sm tracking-[0.5em] uppercase font-semibold">
          Steel Thunder
        </p>

        {/* Title */}
        <h1 className="text-7xl md:text-8xl font-bold text-white tracking-wider leading-none">
          TANK
          <br />
          <span className="text-emerald-400">BATTLE</span>
        </h1>

        {/* Bottom accent line */}
        <div className="w-64 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="mt-6 px-12 py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
                     text-white text-xl font-bold tracking-widest uppercase
                     border border-emerald-400/30 hover:border-emerald-400/60
                     transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20
                     cursor-pointer"
        >
          Start Mission
        </button>

        {/* Controls */}
        <div className="mt-12 flex flex-col items-center gap-4 text-gray-400 text-sm">
          <p className="text-gray-500 uppercase tracking-[0.3em] text-xs font-semibold mb-1">
            Controls
          </p>
          <div className="grid grid-cols-2 gap-x-10 gap-y-2">
            <ControlRow label="Move" keys="W A S D" />
            <ControlRow label="Aim" keys="Mouse" />
            <ControlRow label="Fire" keys="Space / Click" />
            <ControlRow label="Pause" keys="Esc" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ControlRow({ label, keys }) {
  return (
    <>
      <span className="text-right text-gray-500 font-medium">{label}</span>
      <span className="text-emerald-400/80 font-semibold tracking-wide">
        {keys}
      </span>
    </>
  )
}
