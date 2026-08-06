import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  parseISO,
  getDay,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAppStore } from '../lib/store'
import { dayProgress } from '../lib/analytics'
import { todayKey } from '../lib/seed'
import { isPeriodicDue, isPeriodDay, isTeamEventOnDate } from '../lib/areas'
import { Page, Card, Button } from '../components/ui'

export function CalendarPage() {
  const data = useAppStore((s) => s.data)
  const selectedDate = useAppStore((s) => s.nav.selectedDate)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const setPage = useAppStore((s) => s.setPage)
  const [cursor, setCursor] = useState(() => parseISO(todayKey()))

  useEffect(() => {
    const today = todayKey()
    setSelectedDate(today)
    setCursor(parseISO(today))
  }, [setSelectedDate])

  const start = startOfMonth(cursor)
  const end = endOfMonth(cursor)
  const days = eachDayOfInterval({ start, end })
  const pad = (getDay(start) + 6) % 7

  const openDay = (key: string) => {
    setSelectedDate(key)
    setPage('day')
  }

  return (
    <Page title="Календарь" subtitle="Откройте любой день — полная картина ритуалов, привычек и прогресса.">
      <Card className="mb-6 p-5" hover={false}>
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setCursor(subMonths(cursor, 1))}>
            <ChevronLeft size={18} />
          </Button>
          <h2 className="font-display text-2xl capitalize">
            {format(cursor, 'LLLL yyyy', { locale: ru })}
          </h2>
          <Button variant="ghost" onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight size={18} />
          </Button>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-ink-muted">
          {['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: pad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((d) => {
            const key = format(d, 'yyyy-MM-dd')
            const val = dayProgress(data, key)
            const isToday = key === todayKey()
            const selected = key === selectedDate && !isToday
            const hasDue =
              (data.teamEvents || []).some((e) => isTeamEventOnDate(e, key)) ||
              (data.businessEvents || []).some((e) => isPeriodicDue(e.rule, d))
            const period = isPeriodDay(data.settings.cycle, key)
            return (
              <button
                key={key}
                onClick={() => openDay(key)}
                className={`relative aspect-square rounded-2xl p-1 text-sm transition ${
                  isToday
                    ? 'bg-sky shadow-soft ring-1 ring-[#C4A574]/70 text-ink'
                    : selected
                      ? 'bg-ink text-cream'
                      : 'hover:bg-sand/50'
                } ${!isSameMonth(d, cursor) ? 'opacity-30' : ''}`}
              >
                <div className="font-medium">{format(d, 'd')}</div>
                <div className="mx-auto mt-1 flex items-center justify-center gap-0.5">
                  <div
                    className="h-1 w-1 rounded-full"
                    style={{
                      background: isToday
                        ? '#C4A574'
                        : selected
                          ? '#E8D5B5'
                          : `rgba(196,165,116,${0.15 + val / 120})`,
                    }}
                  />
                  {hasDue && <div className="h-1 w-1 rounded-full bg-gold" />}
                  {period && <div className="h-1 w-1 rounded-full bg-[#C47A7A]/80" />}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="p-5" onClick={() => openDay(todayKey())}>
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">Сегодня</p>
        <p className="mt-2 font-display text-2xl text-ink">
          {format(parseISO(todayKey()), 'd MMMM', { locale: ru })}
        </p>
        <p className="mt-1 text-sm text-ink-muted">Открыть полную картину дня →</p>
      </Card>
    </Page>
  )
}
