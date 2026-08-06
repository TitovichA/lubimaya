import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../lib/store'
import { formatRuDate, formatRuWeekday, todayKey } from '../lib/seed'
import {
  dayProgress,
  getRitualDone,
  ritualProgress,
  habitDoneToday,
  goalPercent,
  periodAverage,
  generateInsights,
} from '../lib/analytics'
import {
  challengeDayNumber,
  challengeOverallProgress,
  challengeRemaining,
  formatChallengeEndRu,
  isChallengeComplete,
  remainingLabel,
  defaultChallenge,
} from '../lib/challenge'
import { Card, ProgressRing, LinearProgress, SectionLabel, Modal, Input, Button } from '../components/ui'
import { AppIcon } from '../components/AppIcon'
import { AreaIllustration } from '../components/AreaIllustrations'
import { ChallengeBadge } from '../components/ChallengeBadge'
import { RemindersHomeBlock } from '../components/RemindersHomeBlock'
import { ThoughtOfDayCard } from './ThoughtsPage'
import { allAreaScores, LIFE_AREAS } from '../lib/areas'

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

export function HomePage() {
  const data = useAppStore((s) => s.data)
  const setPage = useAppStore((s) => s.setPage)
  const updateChallenge = useAppStore((s) => s.updateChallenge)
  const challenge = data.settings.challenge || defaultChallenge()
  const progress = dayProgress(data)
  const challengeProgress = challengeOverallProgress(data)
  const dayNum = challengeDayNumber(challenge)
  const remaining = challengeRemaining(challenge)
  const complete = isChallengeComplete(challenge)
  const morningDone = getRitualDone(data, 'morning').length
  const eveningDone = getRitualDone(data, 'evening').length
  const habitsDone = data.habits.filter((h) => habitDoneToday(h)).length
  const todayTasks = data.tasks.filter((t) => t.date === todayKey()).sort((a, b) => a.order - b.order)
  const week = periodAverage(data, 7)
  const insights = generateInsights(data)
  const scores = allAreaScores(data)
  const hidden = new Set(
    data.settings.hiddenWidgets.map((w) => (w === 'quote' ? 'thought' : w)),
  )
  const widgets = [
    ...new Set(data.settings.homeWidgets.map((w) => (w === 'quote' ? 'thought' : w))),
  ].filter((w) => !hidden.has(w))

  const [challengeOpen, setChallengeOpen] = useState(false)
  const [congratsOpen, setCongratsOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState(challenge.title)
  const [draftStart, setDraftStart] = useState(challenge.startDate)
  const [draftDuration, setDraftDuration] = useState(String(challenge.durationDays))

  useEffect(() => {
    if (complete) setCongratsOpen(true)
  }, [complete, challenge.startDate, challenge.durationDays])

  const openChallenge = () => {
    setDraftTitle(challenge.title)
    setDraftStart(challenge.startDate)
    setDraftDuration(String(challenge.durationDays))
    setChallengeOpen(true)
  }

  const saveChallenge = () => {
    updateChallenge({
      title: draftTitle.trim() || 'Моя 100-дневка',
      startDate: draftStart || todayKey(),
      durationDays: Math.max(1, Number(draftDuration) || 100),
    })
    setChallengeOpen(false)
    setCongratsOpen(false)
  }

  const startNewChallenge = () => {
    updateChallenge({
      title: 'Новая 100-дневка',
      startDate: todayKey(),
      durationDays: 100,
    })
    setCongratsOpen(false)
    openChallenge()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-8 md:max-w-5xl md:px-8 md:pb-12 lg:max-w-6xl">
      {widgets.includes('greeting') && (
        <motion.header {...fade} transition={{ delay: 0.05 }} className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-display text-3xl tracking-tight text-ink md:text-4xl">Моя 100-дневка</p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted md:text-base">
                Каждый день делает меня ближе к моей лучшей версии.
              </p>
              <p className="mt-5 text-xs uppercase tracking-[0.2em] text-ink-muted">{formatRuWeekday()}</p>
              <p className="mt-2 text-ink-muted">{formatRuDate()}</p>
            </div>

            <ChallengeBadge
              dayLabel={`${Math.max(1, Math.min(dayNum, challenge.durationDays))}-й`}
              complete={complete}
              progress={Math.min(100, (Math.max(1, dayNum) / challenge.durationDays) * 100)}
              onClick={openChallenge}
            />
          </div>
          <p className="mt-3 text-right text-[11px] text-ink-muted">
            {complete ? '100-дневка завершена' : remainingLabel(remaining)}
          </p>
          <p className="text-right text-[10px] text-ink-muted/80">{challenge.title}</p>
        </motion.header>
      )}

      {(widgets.includes('thought')) && (
        <motion.div {...fade} transition={{ delay: 0.1 }} className="mb-8">
          <ThoughtOfDayCard />
        </motion.div>
      )}

      {widgets.includes('progress') && (
        <motion.div {...fade} transition={{ delay: 0.15 }} className="mb-8 grid gap-4 md:grid-cols-2">
          <Card className="flex items-center gap-5 p-6" hover={false}>
            <ProgressRing
              value={progress}
              size={112}
              stroke={7}
              color="#A8C5D4"
              label={`${progress}%`}
              sublabel="день"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Сегодня выполнено</p>
              <p className="mt-2 font-display text-3xl text-ink">{progress}%</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Ритуалы, привычки, задачи и дела дня
              </p>
              <p className="mt-3 text-xs text-ink-muted">Неделя в среднем — {week}%</p>
            </div>
          </Card>
          <Card className="flex items-center gap-5 p-6" hover={false} onClick={openChallenge}>
            <ProgressRing
              value={challengeProgress}
              size={112}
              stroke={7}
              color="#C4A574"
              label={`${challengeProgress}%`}
              sublabel="путь"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                Выполнено за {challenge.durationDays}-дневку
              </p>
              <p className="mt-2 font-display text-3xl text-ink">{challengeProgress}%</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Цели, привычки, планы сфер и дни пути
              </p>
              <p className="mt-3 text-xs text-gold-deep">до {formatChallengeEndRu(challenge)}</p>
            </div>
          </Card>
        </motion.div>
      )}

      {widgets.includes('areas') && (
        <section className="mb-8">
          <SectionLabel>Панель развития жизни</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {scores.map((s) => (
              <Card key={s.id} className="group overflow-hidden p-0" onClick={() => setPage(s.pageId)}>
                <AreaIllustration areaId={s.id} className="aspect-[4/3] w-full" />
                <div className="p-4">
                  <p className="text-sm font-medium text-ink">{s.label}</p>
                  <p className="mt-1 font-display text-2xl" style={{ color: s.color }}>
                    {s.value}%
                  </p>
                  <div className="mt-2">
                    <LinearProgress value={s.value} color={s.color} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {widgets.includes('todayDue') && <RemindersHomeBlock />}

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
            {todayTasks.slice(0, 5).map((t) => {
              const area = t.areaId ? LIFE_AREAS.find((a) => a.id === t.areaId) : null
              return (
              <button
                key={t.id}
                onClick={() => setPage('tasks')}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-cream-soft/80"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${t.done ? 'opacity-40' : ''}`}
                  style={{ background: area?.color || t.color }}
                />
                <span className={`flex-1 text-sm ${t.done ? 'text-ink-muted line-through' : 'text-ink'}`}>
                  {area?.emoji ? `${area.emoji} ` : ''}
                  {t.title}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-ink-muted">{t.priority}</span>
              </button>
            )})}
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
          <SectionLabel>Панель развития жизни</SectionLabel>
          <Card className="p-5" onClick={() => setPage('life')}>
            <div className="grid grid-cols-5 gap-2">
              {scores.map((s) => (
                <div key={s.id} className="text-center">
                  <p className="text-xs text-ink-muted">{s.label}</p>
                  <p className="mt-1 font-display text-lg" style={{ color: s.color }}>
                    {s.value}%
                  </p>
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

      <Modal open={challengeOpen} onClose={() => setChallengeOpen(false)} title="Текущая 100-дневка">
        <div className="space-y-4">
          <Input
            label="Название"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Осень 2026"
          />
          <Input
            label="Дата начала"
            type="date"
            value={draftStart}
            onChange={(e) => setDraftStart(e.target.value)}
          />
          <Input
            label="Продолжительность (дней)"
            type="number"
            value={draftDuration}
            onChange={(e) => setDraftDuration(e.target.value)}
          />
          <p className="text-sm text-ink-muted">
            Сегодня — {Math.max(1, dayNum)}-й день · окончание{' '}
            {formatChallengeEndRu({
              ...challenge,
              title: draftTitle,
              startDate: draftStart || challenge.startDate,
              durationDays: Math.max(1, Number(draftDuration) || 100),
            })}
          </p>
          <Button onClick={saveChallenge}>Сохранить</Button>
        </div>
      </Modal>

      <Modal open={congratsOpen && complete} onClose={() => setCongratsOpen(false)} title="Поздравляем!">
        <div className="space-y-4">
          <p className="font-display text-2xl text-ink">Вы завершили свою 100-дневку</p>
          <p className="text-sm leading-relaxed text-ink-soft">
            Каждый маленький шаг сложился в большой результат. Создать новую?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={startNewChallenge}>Создать новую</Button>
            <Button variant="ghost" onClick={() => setCongratsOpen(false)}>
              Позже
            </Button>
          </div>
        </div>
      </Modal>
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
