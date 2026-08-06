import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAppStore } from '../lib/store'
import { dayProgress, getRitualDone, habitDoneToday } from '../lib/analytics'
import { Page, Card, LinearProgress, SectionLabel, ProgressRing } from '../components/ui'
import { AppIcon } from '../components/AppIcon'

const moodLabels = ['', 'Тяжело', 'Так себе', 'Спокойно', 'Хорошо', 'Отлично']

export function DayPage() {
  const data = useAppStore((s) => s.data)
  const date = useAppStore((s) => s.nav.selectedDate)
  const setPage = useAppStore((s) => s.setPage)
  const setDayMood = useAppStore((s) => s.setDayMood)

  const dayLog = data.dayLogs.find((l) => l.date === date)
  const morningDone = getRitualDone(data, 'morning', date)
  const eveningDone = getRitualDone(data, 'evening', date)
  const habitsDone = data.habits.filter((h) => habitDoneToday(h, date))
  const habitsMissed = data.habits.filter((h) => !habitDoneToday(h, date))
  const tasks = data.tasks.filter((t) => t.date === date)
  const goalsTouched = data.goals.filter((g) => g.history.some((h) => h.date === date))
  const notes = data.notes.filter(
    (n) => n.createdAt.slice(0, 10) === date || n.updatedAt.slice(0, 10) === date,
  )
  const photos = notes.flatMap((n) =>
    n.attachments.filter((a) => a.type.startsWith('image/')).map((a) => ({ ...a, noteTitle: n.title })),
  )
  const progress = dayProgress(data, date)
  const thoughtId = data.settings.thoughtByDate?.[date]
  const thought = data.thoughts.find((t) => t.id === thoughtId)

  return (
    <Page
      title={format(parseISO(date), 'd MMMM yyyy', { locale: ru })}
      subtitle={format(parseISO(date), 'EEEE', { locale: ru })}
      back={() => setPage('calendar')}
    >
      <Card className="mb-6 flex items-center gap-5 p-5" hover={false}>
        <ProgressRing value={progress} label={`${progress}%`} sublabel="дня" color="#A8C5D4" />
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">Процент выполнения</p>
          <div className="mt-3">
            <LinearProgress value={progress} color="#A8C5D4" />
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-ink-muted">Настроение</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((m) => (
              <button
                key={m}
                onClick={() => setDayMood(date, m)}
                className={`rounded-2xl px-3 py-1.5 text-xs transition ${
                  dayLog?.mood === m ? 'bg-sky text-ink' : 'bg-cream text-ink-muted'
                }`}
              >
                {moodLabels[m]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {thought && (
        <Card className="mb-6 p-5" hover={false}>
          <p className="text-[11px] uppercase tracking-[0.16em] text-gold-deep">Мысль дня</p>
          <p className="mt-3 font-display text-xl leading-snug text-ink-soft">{thought.text}</p>
        </Card>
      )}

      <SectionLabel>☀ Утренний ритуал</SectionLabel>
      <Card className="mb-6 divide-y divide-sand/50 overflow-hidden" hover={false}>
        {data.morningRitual
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((r) => {
            const done = morningDone.includes(r.id)
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className={done ? 'text-gold-deep' : 'text-ink-muted'}>{done ? '✓' : '○'}</span>
                <span className={done ? 'text-ink-muted line-through' : 'text-ink'}>{r.title}</span>
                {r.time && <span className="ml-auto font-mono text-xs text-ink-muted">{r.time}</span>}
              </div>
            )
          })}
        <div className="px-4 py-3 text-xs text-ink-muted">
          {morningDone.length}/{data.morningRitual.length}
        </div>
      </Card>

      <SectionLabel>🌿 Привычки</SectionLabel>
      <Card className="mb-6 space-y-2 p-4" hover={false}>
        {habitsDone.map((h) => (
          <div key={h.id} className="flex items-center gap-3 text-sm text-ink-soft">
            <AppIcon name={h.icon} color={h.color} size={16} />
            <span>✓ {h.title}</span>
          </div>
        ))}
        {habitsMissed.map((h) => (
          <div key={h.id} className="flex items-center gap-3 text-sm text-ink-muted">
            <AppIcon name={h.icon} color="#C4BDB3" size={16} />
            <span>○ {h.title}</span>
          </div>
        ))}
        {!data.habits.length && <p className="text-sm text-ink-muted">Нет привычек</p>}
      </Card>

      <SectionLabel>📝 Задачи</SectionLabel>
      <Card className="mb-6 divide-y divide-sand/50 overflow-hidden" hover={false}>
        {tasks.length ? (
          tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className={t.done ? 'text-gold-deep' : 'text-ink-muted'}>{t.done ? '✓' : '○'}</span>
              <span className={t.done ? 'text-ink-muted line-through' : 'text-ink'}>{t.title}</span>
            </div>
          ))
        ) : (
          <p className="px-4 py-4 text-sm text-ink-muted">Нет задач на этот день</p>
        )}
      </Card>

      <SectionLabel>🎯 Цели</SectionLabel>
      <Card className="mb-6 p-4" hover={false}>
        {goalsTouched.length ? (
          goalsTouched.map((g) => {
            const entry = g.history.filter((h) => h.date === date).at(-1)
            return (
              <p key={g.id} className="mb-2 text-sm text-ink-soft">
                {g.title}: {entry?.value}/{g.targetValue} {g.unit}
              </p>
            )
          })
        ) : (
          <p className="text-sm text-ink-muted">В этот день цели не обновлялись</p>
        )}
      </Card>

      <SectionLabel>🌙 Вечерний ритуал</SectionLabel>
      <Card className="mb-6 divide-y divide-sand/50 overflow-hidden" hover={false}>
        {data.eveningRitual
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((r) => {
            const done = eveningDone.includes(r.id)
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className={done ? 'text-gold-deep' : 'text-ink-muted'}>{done ? '✓' : '○'}</span>
                <span className={done ? 'text-ink-muted line-through' : 'text-ink'}>{r.title}</span>
              </div>
            )
          })}
        <div className="px-4 py-3 text-xs text-ink-muted">
          {eveningDone.length}/{data.eveningRitual.length}
        </div>
      </Card>

      <SectionLabel>Заметки</SectionLabel>
      <Card className="mb-6 p-4" hover={false}>
        {dayLog?.notes && <p className="mb-3 whitespace-pre-wrap text-sm text-ink-soft">{dayLog.notes}</p>}
        {notes.map((n) => (
          <button
            key={n.id}
            onClick={() => setPage('note-detail', n.id)}
            className="mb-2 block w-full text-left text-sm text-ink"
          >
            {n.title}
          </button>
        ))}
        {!dayLog?.notes && !notes.length && <p className="text-sm text-ink-muted">Нет заметок</p>}
      </Card>

      {photos.length > 0 && (
        <>
          <SectionLabel>Фотографии</SectionLabel>
          <div className="mb-6 grid grid-cols-2 gap-3">
            {photos.map((p) => (
              <Card key={p.id} className="overflow-hidden p-0" hover={false}>
                <img src={p.dataUrl} alt={p.name} className="h-40 w-full object-cover" />
                <p className="px-3 py-2 text-xs text-ink-muted">{p.noteTitle}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </Page>
  )
}
