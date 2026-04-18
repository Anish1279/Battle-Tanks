import { useGameStore } from '../store/gameStore'

export default function VictoryScreen() {
  const score = useGameStore((s) => s.score)
  const kills = useGameStore((s) => s.kills)
  const restartGame = useGameStore((s) => s.restartGame)
  const returnToMenu = useGameStore((s) => s.returnToMenu)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ fontFamily: "'Rajdhani', sans-serif" }}
    >
      {/* Golden overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-950/80 via-gray-950/90 to-gray-950" />
      <div
        className="absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 200px 60px rgba(161,98,7,0.15)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Accent */}
        <div className="w-40 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

        {/* Title */}
        <h1 className="text-6xl md:text-7xl font-bold text-yellow-400 tracking-wider uppercase">
          Mission Complete
        </h1>

        <div className="w-48 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

        <p className="text-lg text-yellow-200/70 tracking-wide mt-2">
          All enemy targets neutralized. Outstanding work, Commander.
        </p>

        {/* Stats */}
        <div className="flex gap-12 mt-4">
          <StatColumn label="Final Score" value={score} />
          <StatColumn label="Enemies Destroyed" value={kills} />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-64 mt-8">
          <button
            onClick={restartGame}
            className="w-full py-3 text-lg font-bold uppercase tracking-widest
                       bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 text-white
                       border border-yellow-400/30 hover:border-yellow-400/60
                       transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/20
                       cursor-pointer"
          >
            Play Again
          </button>
          <button
            onClick={returnToMenu}
            className="w-full py-3 text-lg font-bold uppercase tracking-widest
                       bg-gray-800/80 hover:bg-gray-700/80 active:bg-gray-800 text-gray-300
                       border border-gray-600/30 hover:border-gray-500/50
                       transition-all duration-200 cursor-pointer"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}

function StatColumn({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-gray-500 uppercase tracking-[0.25em] font-semibold">
        {label}
      </span>
      <span className="text-3xl font-bold text-white tabular-nums">{value}</span>
    </div>
  )
}
