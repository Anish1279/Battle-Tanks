import { useProgress } from '@react-three/drei'

export default function LoadingScreen() {
  const { progress, active } = useProgress()

  if (!active) return null

  const percent = Math.floor(progress)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950"
      style={{ fontFamily: "'Rajdhani', sans-serif" }}
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,136,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-[0.4em]">
          Tank Battle
        </h2>

        {/* Loading text */}
        <p className="text-sm text-emerald-400/80 tracking-widest uppercase">
          Loading assets{'.'.repeat(((percent / 5) | 0) % 4)}
        </p>

        {/* Progress bar */}
        <div className="w-72 h-2 bg-gray-800 border border-gray-700/50 overflow-hidden">
          <div
            className="h-full transition-all duration-150"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #00ff88, #10b981)',
            }}
          />
        </div>

        {/* Percentage */}
        <span className="text-emerald-400 text-xl font-bold tabular-nums tracking-wider">
          {percent}%
        </span>

        <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] mt-4">
          Preparing battlefield
        </p>
      </div>
    </div>
  )
}
