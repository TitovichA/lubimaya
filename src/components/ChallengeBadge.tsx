import { motion } from 'framer-motion'

export function ChallengeBadge({
  dayLabel,
  complete,
  progress,
  onClick,
}: {
  dayLabel: string
  complete: boolean
  progress: number
  onClick: () => void
}) {
  const size = 148
  const stroke = 3.5
  const r = (size - stroke * 2) / 2 - 4
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, progress)) / 100) * c
  const bg = `${import.meta.env.BASE_URL}illustrations/challenge-badge.jpg`

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Управление 100-дневкой"
      className="group relative shrink-0 outline-none"
    >
      <motion.div
        className="relative"
        style={{ width: size, height: size }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* soft glow */}
        <div className="absolute inset-2 -z-10 rounded-full bg-gold-light/50 blur-xl transition group-hover:bg-gold/40" />

        {/* outer gold rim */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E8D5B5] via-[#C4A574] to-[#A68B5B] p-[2px] shadow-lift">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-cream">
            <img
              src={bg}
              alt=""
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-90 transition duration-700 group-hover:scale-[1.15]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-cream/55 via-cream/35 to-cream/70" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_35%,rgba(247,243,236,0.55)_100%)]" />

            {/* progress ring */}
            <svg
              width={size}
              height={size}
              className="pointer-events-none absolute inset-0 -rotate-90"
              aria-hidden
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="rgba(232,223,208,0.65)"
                strokeWidth={stroke}
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="#C4A574"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={c}
                initial={{ strokeDashoffset: c }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>

            {/* content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                Сегодня
              </span>
              <span className="mt-1 font-display text-[1.05rem] leading-tight text-ink-soft">твой</span>
              <span className="mt-0.5 font-display text-[2rem] leading-none tracking-tight text-ink">
                {complete ? '✓' : dayLabel}
              </span>
              <span className="mt-1.5 text-[11px] text-ink-muted">{complete ? 'путь пройден' : 'день'}</span>
            </div>
          </div>
        </div>

        {/* tiny sparkle accent */}
        <span className="absolute right-3 top-4 h-1.5 w-1.5 rounded-full bg-gold-light shadow-[0_0_8px_rgba(196,165,116,0.8)]" />
        <span className="absolute bottom-5 left-4 h-1 w-1 rounded-full bg-sky-deep/80" />
      </motion.div>
    </button>
  )
}
