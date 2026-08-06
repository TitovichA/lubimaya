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
import { useEffectiveTheme } from '../components/ThemeToggle'
import { ThoughtOfDayCard } from './ThoughtsPage'
import { allAreaScores, LIFE_AREAS } from '../lib/areas'
import {
  isSunday,
  nextSundayWaitingLabel,
  sundayRitualProgress,
} from '../lib/sunday'

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
  const sundayActive = isSunday()
  const sundayProg = sundayRitualProgress(data)
  const sundayWaiting = nextSundayWaitingLabel()
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

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {widgets.includes('morning') && (
          <RitualHomeCard
            tone="morning"
            title="Утро"
            subtitle="начало дня"
            count={`${morningDone} / ${data.morningRitual.length}`}
            pct={ritualProgress(morningDone, data.morningRitual.length)}
            onClick={() => setPage('morning')}
            delay={0}
          />
        )}
        {widgets.includes('habits') && (
          <RitualHomeCard
            tone="habits"
            title="Привычки"
            subtitle="ежедневная опора"
            count={`${habitsDone} / ${data.habits.length}`}
            pct={ritualProgress(habitsDone, data.habits.length)}
            onClick={() => setPage('habits')}
            delay={0.06}
          />
        )}
        {widgets.includes('evening') && (
          <RitualHomeCard
            tone="evening"
            title="Вечер"
            subtitle="мягкое завершение"
            count={`${eveningDone} / ${data.eveningRitual.length}`}
            pct={ritualProgress(eveningDone, data.eveningRitual.length)}
            onClick={() => setPage('evening')}
            delay={0.12}
          />
        )}
        {widgets.includes('sunday') && (
          <RitualHomeCard
            tone="sunday"
            title="Воскресенье"
            subtitle={sundayActive ? 'день восстановления' : 'ожидание покоя'}
            emoji="🌾"
            count={
              sundayActive
                ? `${sundayProg.done} / ${sundayProg.total}`
                : sundayWaiting
            }
            pct={sundayActive ? sundayProg.pct : 0}
            pctLabel={sundayActive ? undefined : '—'}
            muted={!sundayActive}
            onClick={() => setPage('sunday')}
            delay={0.18}
          />
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

function RitualHomeCard({
  tone,
  title,
  subtitle,
  count,
  pct,
  onClick,
  emoji,
  muted = false,
  pctLabel,
  delay = 0,
}: {
  tone: 'morning' | 'habits' | 'evening' | 'sunday'
  title: string
  subtitle: string
  count: string
  pct: number
  onClick: () => void
  emoji?: string
  muted?: boolean
  pctLabel?: string
  delay?: number
}) {
  const themeMode = useEffectiveTheme()
  const dark = themeMode === 'dark'

  const themes = {
    morning: dark
      ? {
          bg: 'linear-gradient(155deg, #2A241C 0%, #3D3224 45%, #4A3A28 100%)',
          border: 'rgba(196, 165, 116, 0.35)',
          accent: '#E0C89A',
          glow: 'rgba(196, 165, 116, 0.28)',
          orb: 'rgba(80, 64, 40, 0.5)',
          title: '#F7F0E4',
          muted: '#C4B8A4',
          track: 'rgba(255,255,255,0.12)',
        }
      : {
          bg: 'linear-gradient(155deg, #FFF9F0 0%, #F7EBD8 42%, #E8D5B5 100%)',
          border: 'rgba(196, 165, 116, 0.4)',
          accent: '#C4A574',
          glow: 'rgba(232, 213, 181, 0.75)',
          orb: 'rgba(255, 248, 235, 0.9)',
          title: '#1A1A1A',
          muted: '#7A746C',
          track: 'rgba(255,255,255,0.55)',
        },
    habits: dark
      ? {
          bg: 'linear-gradient(155deg, #1C221C 0%, #2A3228 48%, #354034 100%)',
          border: 'rgba(143, 163, 130, 0.35)',
          accent: '#B5C9A8',
          glow: 'rgba(143, 163, 130, 0.25)',
          orb: 'rgba(50, 64, 48, 0.5)',
          title: '#EEF2EA',
          muted: '#A8B59E',
          track: 'rgba(255,255,255,0.12)',
        }
      : {
          bg: 'linear-gradient(155deg, #F5F7F2 0%, #E8EEE6 45%, #D5DFD4 100%)',
          border: 'rgba(168, 184, 160, 0.45)',
          accent: '#8FA382',
          glow: 'rgba(200, 214, 190, 0.65)',
          orb: 'rgba(245, 250, 242, 0.85)',
          title: '#1A1A1A',
          muted: '#7A746C',
          track: 'rgba(255,255,255,0.55)',
        },
    evening: dark
      ? {
          bg: 'linear-gradient(155deg, #1E1C24 0%, #2A2834 48%, #353244 100%)',
          border: 'rgba(168, 158, 186, 0.35)',
          accent: '#C4BBD4',
          glow: 'rgba(154, 145, 168, 0.28)',
          orb: 'rgba(56, 52, 72, 0.5)',
          title: '#F0ECF5',
          muted: '#B0A8BC',
          track: 'rgba(255,255,255,0.12)',
        }
      : {
          bg: 'linear-gradient(155deg, #F4F2F5 0%, #E6E4EC 48%, #D4D0DC 100%)',
          border: 'rgba(164, 156, 176, 0.4)',
          accent: '#9A91A8',
          glow: 'rgba(200, 194, 214, 0.6)',
          orb: 'rgba(248, 246, 250, 0.85)',
          title: '#1A1A1A',
          muted: '#7A746C',
          track: 'rgba(255,255,255,0.55)',
        },
    sunday: dark
      ? {
          bg: muted
            ? 'linear-gradient(155deg, #1A1816 0%, #24201C 55%, #2C2822 100%)'
            : 'linear-gradient(155deg, #2C2418 0%, #3F3424 42%, #534530 100%)',
          border: muted ? 'rgba(90, 80, 70, 0.5)' : 'rgba(196, 165, 116, 0.45)',
          accent: '#E0C89A',
          glow: 'rgba(196, 165, 116, 0.22)',
          orb: 'rgba(70, 56, 36, 0.45)',
          title: '#F7F0E4',
          muted: '#C4B8A4',
          track: 'rgba(255,255,255,0.12)',
        }
      : {
          bg: muted
            ? 'linear-gradient(155deg, #FFFEFB 0%, #F5F1EA 55%, #EBE4DA 100%)'
            : 'linear-gradient(155deg, #FFFBF4 0%, #F3E6CF 40%, #DCC9A0 100%)',
          border: muted ? 'rgba(232, 223, 208, 0.8)' : 'rgba(196, 165, 116, 0.55)',
          accent: '#C4A574',
          glow: 'rgba(232, 213, 181, 0.7)',
          orb: 'rgba(255, 252, 245, 0.9)',
          title: '#1A1A1A',
          muted: '#7A746C',
          track: 'rgba(255,255,255,0.55)',
        },
  } as const

  const t = themes[tone]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: muted ? 0.62 : 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={muted ? undefined : { y: -4 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-3xl border p-5 shadow-[var(--shadow-card)]"
      style={{ background: t.bg, borderColor: t.border }}
    >
      <motion.div
        className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full blur-2xl"
        style={{ background: t.glow }}
        animate={{ x: [0, 10, 0], y: [0, 8, 0], opacity: dark ? [0.35, 0.55, 0.35] : [0.55, 0.85, 0.55] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full blur-2xl"
        style={{ background: t.orb }}
        animate={{ x: [0, -6, 0], y: [0, -8, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="pointer-events-none absolute right-3 top-3 opacity-[0.18] transition duration-500 group-hover:opacity-30">
        {tone === 'morning' && (
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden>
            <circle cx="36" cy="40" r="14" stroke={t.accent} strokeWidth="1.5" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line
                key={a}
                x1="36"
                y1="12"
                x2="36"
                y2="18"
                stroke={t.accent}
                strokeWidth="1.5"
                strokeLinecap="round"
                transform={`rotate(${a} 36 40)`}
              />
            ))}
          </svg>
        )}
        {tone === 'habits' && (
          <svg width="68" height="68" viewBox="0 0 68 68" fill="none" aria-hidden>
            <path
              d="M34 58C34 58 18 46 18 30C18 22 24 16 34 16C44 16 50 22 50 30C50 46 34 58 34 58Z"
              stroke={t.accent}
              strokeWidth="1.5"
            />
            <path d="M34 16V58" stroke={t.accent} strokeWidth="1.2" />
          </svg>
        )}
        {tone === 'evening' && (
          <svg width="70" height="70" viewBox="0 0 70 70" fill="none" aria-hidden>
            <path
              d="M42 14C30 16 22 27 22 39C22 52 32 62 45 62C33 58 26 47 28 34C30 24 36 17 42 14Z"
              stroke={t.accent}
              strokeWidth="1.5"
            />
          </svg>
        )}
        {tone === 'sunday' && (
          <svg width="76" height="56" viewBox="0 0 76 56" fill="none" aria-hidden>
            <path d="M8 48C18 28 28 18 38 14C48 18 58 28 68 48" stroke={t.accent} strokeWidth="1.4" />
            <path d="M14 48C22 34 30 26 38 22C46 26 54 34 62 48" stroke={t.accent} strokeWidth="1.2" opacity="0.7" />
            <path d="M38 14V48" stroke={t.accent} strokeWidth="1.2" />
          </svg>
        )}
      </div>

      <div className="relative z-10 flex min-h-[148px] flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            {emoji && <div className="mb-1.5 text-[1.35rem] leading-none">{emoji}</div>}
            <p
              className="text-[10px] font-medium uppercase tracking-[0.2em]"
              style={{ color: t.muted }}
            >
              {subtitle}
            </p>
            <h3
              className="mt-1 font-display text-[1.85rem] leading-tight tracking-tight"
              style={{ color: t.title }}
            >
              {title}
            </h3>
          </div>
          <motion.p
            key={`${themeMode}-${pctLabel ?? pct}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl leading-none tracking-tight"
            style={{ color: t.accent }}
          >
            {pctLabel ?? `${pct}%`}
          </motion.p>
        </div>

        <p className="mt-3 flex-1 text-sm leading-snug" style={{ color: t.muted }}>
          {count}
        </p>

        <div className="mt-4">
          <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: t.track }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: t.accent }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              transition={{ duration: 0.9, delay: delay + 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
