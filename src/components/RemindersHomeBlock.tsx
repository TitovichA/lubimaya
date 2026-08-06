import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '../lib/store'
import { todayKey } from '../lib/seed'
import { collectSmartReminders, type SmartReminder } from '../lib/reminders'
import { Card, SectionLabel } from './ui'

function ReminderCard({ item }: { item: SmartReminder }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div
        className="flex items-start gap-3 rounded-2xl border border-sand/60 bg-cream-soft/70 px-4 py-3.5 shadow-soft"
        style={{ borderColor: `${item.color}55` }}
      >
        <span
          className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: item.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: item.color }}>
            {item.areaLabel}
          </p>
          <p className="mt-1 text-sm leading-snug text-ink">{item.title}</p>
          {item.detail && (
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{item.detail}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function RemindersHomeBlock({ date }: { date?: string }) {
  const data = useAppStore((s) => s.data)
  const pruneTeamCalendar = useAppStore((s) => s.pruneTeamCalendar)
  const viewDate = date || todayKey()
  const isToday = viewDate === todayKey()

  // Удаляем разовые события после даты окончания (только при просмотре сегодня)
  useEffect(() => {
    if (isToday) pruneTeamCalendar()
  }, [pruneTeamCalendar, isToday])

  const visible = collectSmartReminders(data, viewDate)

  if (!visible.length) {
    return (
      <section className="mb-8">
        <SectionLabel>🔔 Напоминания</SectionLabel>
        <Card className="p-5" hover={false}>
          <p className="text-sm text-ink-muted">
            {isToday
              ? 'Нет событий из календарей сфер на сегодня и завтра.'
              : 'Нет важных событий календаря на этот день.'}
          </p>
        </Card>
      </section>
    )
  }

  return (
    <section className="mb-8">
      <SectionLabel>🔔 Напоминания</SectionLabel>
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {visible.map((item) => (
            <ReminderCard key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  )
}
