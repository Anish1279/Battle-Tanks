import { useGameStore } from '../store/gameStore'

export default function PauseMenu() {
  const togglePause = useGameStore((s) => s.togglePause)
  const restartGame = useGameStore((s) => s.restartGame)
  const returnToMenu = useGameStore((s) => s.returnToMenu)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      style={{ fontFamily: "'Rajdhani', sans-serif" }}
    >
      <div className="flex flex-col items-center gap-8 p-10">
        {/* Accent line */}
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent" />

        {/* Title */}
        <h2 className="text-5xl font-bold text-white tracking-widest uppercase">
          Paused
        </h2>

        <div className="w-32 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent" />

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-64 mt-4">
          <MenuButton onClick={togglePause} primary>
            Resume
          </MenuButton>
          <MenuButton onClick={restartGame}>Restart Mission</MenuButton>
          <MenuButton onClick={returnToMenu}>Main Menu</MenuButton>
        </div>

        {/* Controls reminder */}
        <div className="mt-6 flex flex-col items-center gap-2 text-gray-500 text-xs">
          <p className="uppercase tracking-[0.3em] text-[10px] font-semibold text-gray-600">
            Controls
          </p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <span className="text-right">Move</span>
            <span className="text-gray-400">W A S D</span>
            <span className="text-right">Aim</span>
            <span className="text-gray-400">Mouse</span>
            <span className="text-right">Fire</span>
            <span className="text-gray-400">Space / Click</span>
            <span className="text-right">Pause</span>
            <span className="text-gray-400">Esc</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MenuButton({ children, onClick, primary = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-3 text-lg font-bold uppercase tracking-widest border transition-all duration-200 cursor-pointer ${
        primary
          ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border-emerald-400/30 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/20'
          : 'bg-gray-800/80 hover:bg-gray-700/80 active:bg-gray-800 text-gray-300 border-gray-600/30 hover:border-gray-500/50'
      }`}
    >
      {children}
    </button>
  )
}
