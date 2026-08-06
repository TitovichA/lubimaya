import { useEffect, useMemo, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../lib/store'
import { resolveEffectiveTheme } from '../lib/theme'
import type { ThemeMode } from '../types'

/** Актуальная тема с учётом расписания (обновляется каждую минуту) */
export function useEffectiveTheme(): ThemeMode {
  const settings = useAppStore((s) => s.data.settings)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!settings.themeScheduleEnabled) return
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000)
    return () => window.clearInterval(id)
  }, [settings.themeScheduleEnabled])

  return useMemo(() => {
    void tick
    return resolveEffectiveTheme(settings)
  }, [settings, tick])
}

/** Применяет класс темы на <html> */
export function useThemeSync() {
  const effective = useEffectiveTheme()
  const hydrated = useAppStore((s) => s.hydrated)

  useEffect(() => {
    if (!hydrated) return
    document.documentElement.classList.toggle('dark', effective === 'dark')
  }, [effective, hydrated])
}

export function ThemeToggleFab() {
  const effective = useEffectiveTheme()
  const scheduleOn = useAppStore((s) => !!s.data.settings.themeScheduleEnabled)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const dark = effective === 'dark'

  const toggle = () => {
    // Ручное переключение отключает расписание — иначе через минуту вернётся обратно
    updateSettings({
      themeMode: dark ? 'light' : 'dark',
      themeScheduleEnabled: false,
    })
  }

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={
        scheduleOn
          ? dark
            ? 'Сейчас тёмная (по расписанию). Нажмите — переключить вручную'
            : 'Сейчас светлая (по расписанию). Нажмите — переключить вручную'
          : dark
            ? 'Светлая тема'
            : 'Тёмная тема'
      }
      className="fixed bottom-24 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-sand/70 bg-cream-soft/95 text-ink shadow-lift backdrop-blur-md transition hover:border-gold/50 lg:bottom-6 lg:right-6 dark:border-sand/40 dark:bg-surface/95"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? 'sun' : 'moon'}
          initial={{ opacity: 0, rotate: -40, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 40, scale: 0.7 }}
          transition={{ duration: 0.25 }}
          className="flex"
        >
          {dark ? <Sun size={20} strokeWidth={1.6} /> : <Moon size={20} strokeWidth={1.6} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
