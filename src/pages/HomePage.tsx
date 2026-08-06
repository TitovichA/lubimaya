import { motion } from 'framer-motion'
import { useAppStore } from '../lib/store'
import { greeting, formatRuDate, formatRuWeekday, getQuoteOfDay, todayKey } from '../lib/seed'
import {
  dayProgress,
  getRitualDone,
  ritualProgress,
  habitDoneToday,
  goalPercent,
  periodAverage,
  generateInsights,
} from '../lib/analytics'
import { Card, ProgressRing, LinearProgress, SectionLabel } from '../components/ui'
import { AppIcon } from '../components/AppIcon'

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

export function HomePage() {
  const data = useAppStore((s) => s.data)
  const setPage = useAppStore((s) => s.setPage)
  const quote = getQuoteOfDay()
  const progress = dayProgress(data)
  const morningDone = getRitualDone(data, 'morning').length
  const eveningDone = getRitualDone(data, 'evening').length
  const habitsDone = data.habits.filter((h) => habitDoneToday(h)).length
  const todayTasks = data.tasks.filter((t) => t.date === todayKey()).sort((a, b) => a.order - b.order)
  const week = periodAverage(data, 7)
  const insights = generateInsights(data)
  const widgets = data.settings.homeWidgets.filter((w) => !data.settings.hiddenWidgets.includes(w))

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-8 md:max-w-5xl md:px-8 md:pb-12 lg:max-w-6xl">
      {widgets.includes('greeting') && (
        <motion.header {...fade} transition={{ delay: 0.05 }} className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">{formatRuWeekday()}</p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink md:text-5xl">
            {greeting(data.settings.name)}
          </h1>
          <p className="mt-2 text-ink-muted">{formatRuDate()}</p>
        </motion.header>
      )}

      {widgets.includes('quote') && (
        <motion.div {...fade} transition={{ delay: 0.1 }} className="mb-8">
          <Card className="overflow-hidden p-6 md:p-8" hover={false}>
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky/30 via-transparent to-gold-light/20" />
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">Цитата дня</p>
            <blockquote className="mt-4 font-display text-2xl leading-snug text-ink-soft md:text-3xl">
              «{quote.text}»
            </blockquote>
            <p className="mt-4 text-sm text-ink-muted">— {quote.author}</p>
          </Card>
        </motion.div>
      )}

      {widgets.includes('progress') && (
        <motion.div {...fade} transition={{ delay: 0.15 }} className="mb-8">
          <Card className="flex items-center gap-6 p-6" hover={false}>
            <ProgressRing value={progress} label={`${progress}%`} sublabel="сегодня" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Сегодня выполнено</p>
              <p className="mt-2 font-display text-3xl text-ink">{progress}%</p>
              <div className="mt-4">
                <LinearProgress value={progress} />
              </div>
              <p className="mt-3 text-sm text-ink-muted">Неделя в среднем — {week}%</p>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {widgets.includes('morning') && (
          <Card className="p-5" onClick={() => setPage('morning')}>
            <div className="text-2xl">☀</div>
            <h3 className="mt-3 font-display text-2xl text-ink">Утро</h3>
            <p className="mt-1 text-sm text-ink-muted">
              {morningDone} / {data.morningRitual.length}
            </p>
            <div className="mt-4">
              <LinearProgress
                value={ritualProgress(morningDone, data.morningRitual.length)}
                color="#C4A574"
              />
            </div>
            <p className="mt-2 text-xs text-gold-deep">
              {ritualProgress(morningDone, data.morningRitual.length)}%
            </p>
          </Card>
        )}
        {widgets.includes('habits') && (
          <Card className="p-5" onClick={() => setPage('habits')}>
            <div className="text-2xl">🌿</div>
            <h3 className="mt-3 font-display text-2xl text-ink">Привычки</h3>
            <p className="mt-1 text-sm text-ink-muted">
              {habitsDone} / {data.habits.length}
            </p>
            <div className="mt-4">
              <LinearProgress
                value={ritualProgress(habitsDone, data.habits.length)}
                color="#A8C5D4"
              />
            </div>
            <p className="mt-2 text-xs text-sky-deep">
              {ritualProgress(habitsDone, data.habits.length)}%
            </p>
          </Card>
        )}
        {widgets.includes('evening') && (
          <Card className="p-5" onClick={() => setPage('evening')}>
            <div className="text-2xl">🌙</div>
            <h3 className="mt-3 font-display text-2xl text-ink">Вечер</h3>
            <p className="mt-1 text-sm text-ink-muted">
              {eveningDone} / {data.eveningRitual.length}
            </p>
            <div className="mt-4">
              <LinearProgress
                value={ritualProgress(eveningDone, data.eveningRitual.length)}
                color="#A8B5C4"
              />
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              {ritualProgress(eveningDone, data.eveningRitual.length)}%
            </p>
          </Card>
        )}
      </div>

      {widgets.includes('tasks') && (
        <section className="mb-8">
          <SectionLabel>📝 Задачи на сегодня</SectionLabel>
          <Card className="divide-y divide-sand/60 overflow-hidden" hover={false}>
            {todayTasks.length === 0 && (
              <p className="p-5 text-sm text-ink-muted">На сегодня задач нет — можно добавить.</p>
            )}
            {todayTasks.slice(0, 5).map((t) => (
              <button
                key={t.id}
                onClick={() => setPage('tasks')}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-cream-soft/80"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${t.done ? 'opacity-40' : ''}`}
                  style={{ background: t.color }}
                />
                <span className={`flex-1 text-sm ${t.done ? 'text-ink-muted line-through' : 'text-ink'}`}>
                  {t.title}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-ink-muted">{t.priority}</span>
              </button>
            ))}
            <button onClick={() => setPage('tasks')} className="w-full px-5 py-3 text-left text-sm text-gold-deep">
              Все задачи →
            </button>
          </Card>
        </section>
      )}

      {widgets.includes('goals') && (
        <section className="mb-8">
          <SectionLabel>🎯 Цели</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.goals.slice(0, 4).map((g) => {
              const p = goalPercent(g)
              return (
                <Card key={g.id} className="p-5" onClick={() => setPage('goal-detail', g.id)}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl text-ink">{g.title}</h3>
                      <p className="mt-1 text-sm text-ink-muted">
                        {g.currentValue} / {g.targetValue} {g.unit}
                      </p>
                    </div>
                    <ProgressRing value={p} size={72} stroke={6} color={g.color} label={`${p}%`} />
                  </div>
                  <div className="mt-4">
                    <LinearProgress value={p} color={g.color} />
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {widgets.includes('stats') && (
        <section className="mb-8">
          <SectionLabel>📈 Общая статистика</SectionLabel>
          <Card className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4" onClick={() => setPage('stats')}>
            <Stat label="Сегодня" value={`${progress}%`} />
            <Stat label="Неделя" value={`${week}%`} />
            <Stat label="Привычки" value={`${habitsDone}/${data.habits.length}`} />
            <Stat label="Задачи" value={`${todayTasks.filter((t) => t.done).length}/${todayTasks.length}`} />
          </Card>
        </section>
      )}

      {widgets.includes('life') && (
        <section className="mb-8">
          <SectionLabel>Панель жизни</SectionLabel>
          <Card className="p-5" onClick={() => setPage('life')}>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.lifeBalance).map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-cream px-3 py-2 text-xs text-ink-soft">
                  {k} · {v}%
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {widgets.includes('ai') && (
        <section>
          <SectionLabel>Аналитика ИИ</SectionLabel>
          <Card className="p-5" onClick={() => setPage('ai')}>
            <div className="flex items-start gap-3">
              <AppIcon name="sparkles" color="#C4A574" />
              <p className="text-sm leading-relaxed text-ink-soft">{insights[0]}</p>
            </div>
          </Card>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
    </div>
  )
}
