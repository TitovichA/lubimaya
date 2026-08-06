import { motion } from 'framer-motion'

export function SplashLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <motion.circle
        cx="64"
        cy="64"
        r="42"
        stroke="#E8D5B5"
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="64"
        cy="64"
        r="36"
        stroke="#C4A574"
        strokeWidth="2.5"
        fill="#FBF8F3"
        initial={{ scale: 0.86, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '64px 64px' }}
      />
      <motion.path
        d="M64 40c8 10 18 18 18 28a18 18 0 1 1-36 0c0-10 10-18 18-28z"
        fill="#C4A574"
        initial={{ opacity: 0, y: 8, scale: 0.9 }}
        animate={{ opacity: 0.9, y: 0, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '64px 58px' }}
      />
      <motion.circle
        cx="58"
        cy="58"
        r="4"
        fill="#FBF8F3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      />
    </svg>
  )
}

export function SplashScreen() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-cream">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-sky/50 blur-3xl"
          animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.06, 1] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-16 bottom-24 h-80 w-80 rounded-full bg-gold-light/40 blur-3xl"
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1.05, 1, 1.05] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center px-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <motion.div
          className="relative mb-8"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <SplashLogo className="h-28 w-28 drop-shadow-sm" />
          <motion.div
            className="absolute inset-0 -z-10 rounded-full bg-gold-light/30 blur-2xl"
            animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.9, 1.15, 0.9] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        <motion.p
          className="font-display text-4xl tracking-tight text-ink sm:text-5xl"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          Моя 100-дневка
        </motion.p>

        <motion.p
          className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          Каждый день делает меня ближе к моей лучшей версии.
        </motion.p>

        <motion.div
          className="mt-10 flex items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.95 }}
          aria-label="Загрузка"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-gold"
              animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85] }}
              transition={{
                duration: 1.05,
                repeat: Infinity,
                delay: i * 0.18,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
