import { useGameStore } from '../store/gameStore'

export default function HUD() {
  const playerHealth = useGameStore((s) => s.playerHealth)
  const playerMaxHealth = useGameStore((s) => s.playerMaxHealth)
  const reloadProgress = useGameStore((s) => s.reloadProgress)
  const kills = useGameStore((s) => s.kills)
  const score = useGameStore((s) => s.score)
  const enemies = useGameStore((s) => s.enemies)

  const healthPercent = (playerHealth / playerMaxHealth) * 100
  const isLowHealth = healthPercent <= 25
  const enemiesRemaining = enemies.filter((e) => e.alive).length
  const isReady = reloadProgress >= 1

  return (
    <div
      className="fixed inset-0 z-30 pointer-events-none"
      style={{ fontFamily: "'Rajdhani', sans-serif" }}
    >
      {/* Low health vignette */}
      {isLowHealth && (
        <div
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{
            boxShadow: 'inset 0 0 120px 40px rgba(220,38,38,0.3)',
          }}
        />
      )}

      {/* ── Top Bar ─────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-6 pt-4">
        {/* Mission Objective */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-[0.25em] font-semibold">
            Objective
          </span>
          <span className="text-sm text-gray-300 font-medium tracking-wide">
            Destroy All Enemy Tanks
          </span>
        </div>

        {/* Score and Kills */}
        <div className="flex gap-6 items-start">
          <StatBlock label="Score" value={score} />
          <StatBlock label="Kills" value={kills} />
          <StatBlock
            label="Hostiles"
            value={enemiesRemaining}
            color={enemiesRemaining === 0 ? 'text-emerald-400' : 'text-red-400'}
          />
        </div>
      </div>

      {/* ── Bottom Left: Health ──────────────────────── */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 w-64">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-[0.25em] font-semibold">
            Hull Integrity
          </span>
          <span
            className={`text-sm font-bold tabular-nums ${
              isLowHealth ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {Math.ceil(healthPercent)}%
          </span>
        </div>

        {/* Health bar track */}
        <div className="w-full h-3 bg-gray-800/80 border border-gray-700/50 overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${
              isLowHealth ? 'animate-pulse' : ''
            }`}
            style={{
              width: `${healthPercent}%`,
              background: isLowHealth
                ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                : 'linear-gradient(90deg, #00ff88, #10b981)',
            }}
          />
        </div>
      </div>

      {/* ── Bottom Center: Reload ────────────────────── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        {/* Reload bar */}
        <div className="w-40 h-2 bg-gray-800/80 border border-gray-700/50 overflow-hidden">
          <div
            className="h-full transition-all duration-100"
            style={{
              width: `${reloadProgress * 100}%`,
              background: isReady
                ? '#00ff88'
                : 'linear-gradient(90deg, #f59e0b, #eab308)',
            }}
          />
        </div>
        <span
          className={`text-xs font-bold uppercase tracking-widest ${
            isReady ? 'text-emerald-400' : 'text-yellow-400'
          }`}
        >
          {isReady ? 'Ready' : 'Reloading'}
        </span>
      </div>

      {/* ── Bottom Right: Minimap placeholder ────────── */}
      <div className="absolute bottom-6 right-6 w-32 h-32 border border-gray-700/50 bg-gray-900/60 flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full">
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,255,136,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.4) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          {/* Player dot (center) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(0,255,136,0.8)]" />
          {/* Enemy dots */}
          {enemies
            .filter((e) => e.alive)
            .map((e) => {
              // Scale world positions into minimap coordinates
              const mapX = 50 + (e.position[0] / 100) * 50
              const mapY = 50 + (e.position[2] / 100) * 50
              return (
                <div
                  key={e.id}
                  className="absolute w-1.5 h-1.5 bg-red-500 rounded-full"
                  style={{
                    left: `${Math.min(95, Math.max(5, mapX))}%`,
                    top: `${Math.min(95, Math.max(5, mapY))}%`,
                  }}
                />
              )
            })}
        </div>
        <span className="absolute bottom-1 left-1 text-[8px] text-gray-600 uppercase tracking-wider">
          Radar
        </span>
      </div>

      {/* ── Crosshair ────────────────────────────────── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative w-8 h-8">
          {/* Horizontal lines */}
          <div className="absolute top-1/2 left-0 w-2.5 h-px bg-emerald-400/70 -translate-y-px" />
          <div className="absolute top-1/2 right-0 w-2.5 h-px bg-emerald-400/70 -translate-y-px" />
          {/* Vertical lines */}
          <div className="absolute left-1/2 top-0 w-px h-2.5 bg-emerald-400/70 -translate-x-px" />
          <div className="absolute left-1/2 bottom-0 w-px h-2.5 bg-emerald-400/70 -translate-x-px" />
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-emerald-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    </div>
  )
}

function StatBlock({ label, value, color = 'text-white' }) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-[10px] text-gray-500 uppercase tracking-[0.25em] font-semibold">
        {label}
      </span>
      <span className={`text-xl font-bold tabular-nums ${color}`}>
        {value}
      </span>
    </div>
  )
}
