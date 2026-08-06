import { motion } from 'framer-motion'
import type { ReactNode, ButtonHTMLAttributes, CSSProperties } from 'react'

export function Card({
  children,
  className = '',
  onClick,
  hover = true,
  style,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  style?: CSSProperties
}) {
  const hasCustomBg = /\bbg-/.test(className) || Boolean(style?.background || style?.backgroundColor)
  return (
    <motion.div
      layout
      whileHover={hover && onClick ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={onClick}
      style={style}
      className={`rounded-3xl shadow-[var(--shadow-card)] border border-sand/50 ${
        hasCustomBg ? '' : 'bg-[var(--color-card)]'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function Page({
  title,
  subtitle,
  children,
  action,
  back,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  action?: ReactNode
  back?: () => void
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-6 md:max-w-5xl md:px-8 md:pb-12 lg:max-w-6xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          {back && (
            <button
              onClick={back}
              className="mb-3 text-sm text-ink-muted transition hover:text-ink"
            >
              ← Назад
            </button>
          )}
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink md:text-5xl">
            {title}
          </h1>
          {subtitle && <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted md:text-base">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'soft' | 'danger'
}) {
  const styles = {
    primary:
      'bg-ink text-cream-soft hover:bg-ink-soft shadow-soft',
    ghost: 'bg-transparent text-ink-muted hover:text-ink hover:bg-sand/40',
    soft: 'bg-sand/60 text-ink-soft hover:bg-sand',
    danger: 'bg-transparent text-red-700/70 hover:bg-red-50',
  }
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 8,
  color = '#C4A574',
  label,
  sublabel,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  label?: string
  sublabel?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8DFD0" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-2xl text-ink">{label ?? `${value}%`}</span>
        {sublabel && <span className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">{sublabel}</span>}
      </div>
    </div>
  )
}

export function LinearProgress({ value, color = '#C4A574' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand/80">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}

export function Check({
  checked,
  onChange,
  color = '#C4A574',
}: {
  checked: boolean
  onChange: () => void
  color?: string
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition"
      style={{
        borderColor: checked ? color : '#C4BDB3',
        background: checked ? color : 'transparent',
      }}
      aria-checked={checked}
      role="checkbox"
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">{children}</span>
      <div className="h-px flex-1 bg-sand" />
    </div>
  )
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-sand px-6 py-12 text-center">
      <p className="font-display text-2xl text-ink-soft">{title}</p>
      {text && <p className="mt-2 text-sm text-ink-muted">{text}</p>}
    </div>
  )
}

export function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs text-ink-muted">{label}</span>}
      <input
        className="w-full rounded-2xl border border-sand/80 bg-cream-soft/80 px-4 py-3 text-sm outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
        {...props}
      />
    </label>
  )
}

export function TextArea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs text-ink-muted">{label}</span>}
      <textarea
        className="w-full resize-none rounded-2xl border border-sand/80 bg-cream-soft/80 px-4 py-3 text-sm outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
        rows={4}
        {...props}
      />
    </label>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/20 p-4 backdrop-blur-sm md:items-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-cream-soft p-6 shadow-lift"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-ink-muted hover:bg-sand/50">
            Закрыть
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}
