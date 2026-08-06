import { motion } from 'framer-motion'
import { useEffectiveTheme } from './ThemeToggle'
import type { LifeAreaId, PageId } from '../types'

export type AreaScoreItem = {
  id: LifeAreaId
  pageId: PageId
  label: string
  emoji: string
  color: string
  value: number
}

/** Более насыщенные цвета колец — пастель сфер слабо читается в стиле Activity Rings */
const RING_COLORS: Record<LifeAreaId, string> = {
  home: '#C9A86A',
  body: '#7CB07A',
  business: '#D4A05C',
  growth: '#9B8BC4',
  family: '#D4897A',
}

/** Концентрические кольца сфер — в духе Activity Rings Apple Watch */
export function LifeAreaRings({
  scores,
  onSelect,
}: {
  scores: AreaScoreItem[]
  onSelect: (pageId: PageId) => void
}) {
  const dark = useEffectiveTheme() === 'dark'
  const size = 300
  const stroke = 14
  const gap = 5
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - stroke / 2 - 6
  // внутренний радиус отверстия под цифру
  const innerHole = outerR - (scores.length - 1) * (stroke + gap) - stroke / 2

  const avg = Math.round(scores.reduce((s, a) => s + a.value, 0) / Math.max(1, scores.length))

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-center sm:gap-10 md:gap-14">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {scores.map((area, i) => {
            const color = RING_COLORS[area.id] || area.color
            const r = outerR - i * (stroke + gap)
            const c = 2 * Math.PI * r
            const pct = Math.min(100, Math.max(0, area.value))
            const offset = c - (pct / 100) * c
            const track = dark ? `${color}22` : `${color}2E`

            return (
              <g key={area.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={track}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                />
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={c}
                  initial={{ strokeDashoffset: c }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.05, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    filter: dark ? `drop-shadow(0 0 5px ${color}99)` : `drop-shadow(0 1px 2px ${color}44)`,
                  }}
                />
              </g>
            )
          })}
        </svg>

        <div
          className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center"
          style={{ width: innerHole * 2 - 8, height: innerHole * 2 - 8 }}
        >
          <p className="font-display text-[2.35rem] leading-none tracking-tight text-ink md:text-4xl">
            {avg}%
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-ink-muted">баланс</p>
        </div>
      </div>

      <ul className="grid w-full max-w-sm grid-cols-1 gap-1 sm:max-w-[240px]">
        {scores.map((area, i) => {
          const color = RING_COLORS[area.id] || area.color
          return (
            <motion.li
              key={area.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
            >
              <button
                type="button"
                onClick={() => onSelect(area.pageId)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-sand/35"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: color, boxShadow: `0 0 0 3px ${color}33` }}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">
                  {area.emoji} {area.label}
                </span>
                <span className="font-display text-lg tabular-nums" style={{ color }}>
                  {area.value}%
                </span>
              </button>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
