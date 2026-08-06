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
import { useState } from 'react'
import { useAppStore } from '../lib/store'
import { dayProgress, getRitualDone, habitDoneToday } from '../lib/analytics'
import { todayKey } from '../lib/seed'
import { Page, Card, Button, TextArea } from '../components/ui'

export function CalendarPage() {
  const data = useAppStore((s) => s.data)
  const selectedDate = useAppStore((s) => s.nav.selectedDate)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const setDayNote = useAppStore((s) => s.setDayNote)
  const [cursor, setCursor] = useState(parseISO(selectedDate))

  const start = startOfMonth(cursor)
  const end = endOfMonth(cursor)
  const days = eachDayOfInterval({ start, end })
  const pad = (getDay(start) + 6) % 7

  const dayLog = data.dayLogs.find((l) => l.date === selectedDate)
  const morning = getRitualDone(data, 'morning', selectedDate)
  const evening = getRitualDone(data, 'evening', selectedDate)
  const habits = data.habits.filter((h) => habitDoneToday(h, selectedDate))
  const tasks = data.tasks.filter((t) => t.date === selectedDate)
  const progress = dayProgress(data, selectedDate)

  return (
    <Page title="Календарь" subtitle="Откройте любой день и посмотрите ритм жизни.">
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
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: pad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((d) => {
            const key = format(d, 'yyyy-MM-dd')
            const val = dayProgress(data, key)
            const selected = key === selectedDate
            const isToday = key === todayKey()
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                className={`aspect-square rounded-2xl p-1 text-sm transition ${
                  selected ? 'bg-ink text-cream' : isToday ? 'bg-gold-light/60 text-ink' : 'hover:bg-sand/50'
                } ${!isSameMonth(d, cursor) ? 'opacity-30' : ''}`}
              >
                <div>{format(d, 'd')}</div>
                <div
                  className="mx-auto mt-1 h-1 w-1 rounded-full"
                  style={{
                    background: selected ? '#E8D5B5' : `rgba(196,165,116,${0.2 + val / 100})`,
                  }}
                />
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="mb-4 p-5" hover={false}>
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">
          {format(parseISO(selectedDate), 'd MMMM yyyy', { locale: ru })}
        </p>
        <p className="mt-2 font-display text-3xl text-ink">{progress}%</p>
        <p className="mt-1 text-sm text-ink-muted">прогресс дня</p>
      </Card>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Card className="p-5" hover={false}>
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">Утро</p>
          <p className="mt-2 text-sm">
            {morning.length}/{data.morningRitual.length}
          </p>
        </Card>
        <Card className="p-5" hover={false}>
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">Вечер</p>
          <p className="mt-2 text-sm">
            {evening.length}/{data.eveningRitual.length}
          </p>
        </Card>
      </div>

      <Card className="mb-4 p-5" hover={false}>
        <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-ink-muted">Привычки</p>
        {habits.length ? (
          habits.map((h) => (
            <p key={h.id} className="text-sm text-ink-soft">
              ✓ {h.title}
            </p>
          ))
        ) : (
          <p className="text-sm text-ink-muted">Нет отмеченных привычек</p>
        )}
      </Card>

      <Card className="mb-4 p-5" hover={false}>
        <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-ink-muted">Задачи</p>
        {tasks.length ? (
          tasks.map((t) => (
            <p key={t.id} className={`text-sm ${t.done ? 'text-ink-muted line-through' : 'text-ink-soft'}`}>
              {t.done ? '✓' : '○'} {t.title}
            </p>
          ))
        ) : (
          <p className="text-sm text-ink-muted">Нет задач</p>
        )}
      </Card>

      <Card className="p-5" hover={false}>
        <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-ink-muted">Заметка дня</p>
        <TextArea
          value={dayLog?.notes || ''}
          onChange={(e) => setDayNote(selectedDate, e.target.value)}
          placeholder="Мысли, наблюдения, благодарности..."
        />
      </Card>
    </Page>
  )
}
