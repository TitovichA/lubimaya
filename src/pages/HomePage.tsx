import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, parseISO, format } from 'date-fns'
import { useAppStore } from '../lib/store'
import { formatRuDate, formatRuWeekday, todayKey } from '../lib/seed'
import {
  getRitualDone,
  ritualProgress,
  generateInsights,
} from '../lib/analytics'
import {
  challengeDayNumber,
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
import { LifeAreaRings } from '../components/LifeAreaRings'
import { useEffectiveTheme } from '../components/ThemeToggle'
import { LIFE_AREAS, allAreaScores, areaPlansProgress, areasDayProgress } from '../lib/areas'
import { ThoughtOfDayCard } from './ThoughtsPage'
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
  const selectedDate = useAppStore((s) => s.nav.selectedDate)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const updateChallenge = useAppStore((s) => s.updateChallenge)
  const challenge = data.settings.challenge || defaultChallenge()
  const today = todayKey()
  const viewDate = selectedDate || today
  const isToday = viewDate === today
  const viewDateObj = parseISO(viewDate)

  const progress = areasDayProgress(data, viewDate)
  const challengeProgress = areaPlansProgress(data)
  const dayNum = challengeDayNumber(challenge, viewDate)
  const remaining = challengeRemaining(challenge, today)
  const complete = isChallengeComplete(challenge, today)
  const morningDone = getRitualDone(data, 'morning', viewDate).length
  const eveningDone = getRitualDone(data, 'evening', viewDate).length
  const sundayActive = isSunday(viewDate)
  const sundayProg = sundayRitualProgress(data, viewDate)
  const sundayWaiting = nextSundayWaitingLabel(viewDate)
  const dayTasks = (data.areaPlans || [])
    .slice()
    .sort((a, b) => {
      const aDone = a.targetValue > 0 && a.currentValue >= a.targetValue
      const bDone = b.targetValue > 0 && b.currentValue >= b.targetValue
      if (aDone !== bDone) return aDone ? 1 : -1
      return (a.order ?? 0) - (b.order ?? 0)
    })
  const week = Math.round(
    Array.from({ length: 7 }, (_, i) =>
      areasDayProgress(data, format(addDays(viewDateObj, i - 6), 'yyyy-MM-dd')),
    ).reduce((a, b) => a + b, 0) / 7,
  )
  const insights = generateInsights(data)
  const scores = allAreaScores(data, viewDate)
  const hidden = new Set(
    data.settings.hiddenWidgets.map((w) => (w === 'quote' ? 'thought' : w)),
  )
  const widgets = [
    ...new Set(data.settings.homeWidgets.map((w) => (w === 'quote' ? 'thought' : w))),
  ].filter((w) => !hidden.has(w) && w !== 'habits' && w !== 'goals')

  const [challengeOpen, setChallengeOpen] = useState(false)
  const [congratsOpen, setCongratsOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState(challenge.title)
  const [draftStart, setDraftStart] = useState(challenge.startDate)
  const [draftDuration, setDraftDuration] = useState(String(challenge.durationDays))

  useEffect(() => {
    if (complete) setCongratsOpen(true)
  }, [complete, challenge.startDate, challenge.durationDays])

  const shiftDay = (delta: number) => {
    setSelectedDate(format(addDays(viewDateObj, delta), 'yyyy-MM-dd'))
  }

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

              <div className="mt-5 flex max-w-md items-center gap-1">
                <button
                  type="button"
                  onClick={() => shiftDay(-1)}
                  aria-label="Предыдущий день"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-ink-muted transition hover:bg-sand/40 hover:text-ink"
                >
                  <ChevronLeft size={22} strokeWidth={1.6} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isToday) setSelectedDate(today)
                  }}
                  className="min-w-0 flex-1 rounded-2xl px-2 py-1.5 text-center transition hover:bg-sand/30"
                  title={isToday ? undefined : 'Нажмите, чтобы вернуться к сегодня'}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={viewDate}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                        {formatRuWeekday(viewDate)}
                        {!isToday && (
                          <span className="ml-2 normal-case tracking-normal text-gold-deep">
                            · к сегодня
                          </span>
                        )}
                      </p>
                      <p className="mt-1.5 font-display text-xl text-ink md:text-2xl">
                        {formatRuDate(viewDate)}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </button>
                <button
                  type="button"
                  onClick={() => shiftDay(1)}
                  aria-label="Следующий день"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-ink-muted transition hover:bg-sand/40 hover:text-ink"
                >
                  <ChevronRight size={22} strokeWidth={1.6} />
                </button>
              </div>
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

      {widgets.includes('thought') && (
        <motion.div {...fade} transition={{ delay: 0.1 }} className="mb-8">
          <ThoughtOfDayCard date={viewDate} />
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
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                {isToday ? 'Сегодня выполнено' : 'Выполнено за день'}
              </p>
              <p className="mt-2 font-display text-3xl text-ink">{progress}%</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Ежедневные привычки: дом, тело, бизнес, саморазвитие, семья
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
                План 100-дневки по всем сферам
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

      {widgets.includes('todayDue') && <RemindersHomeBlock date={viewDate} />}

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
        {widgets.includes('evening') && (
          <RitualHomeCard
            tone="evening"
            title="Вечер"
            subtitle="мягкое завершение"
            count={`${eveningDone} / ${data.eveningRitual.length}`}
            pct={ritualProgress(eveningDone, data.eveningRitual.length)}
            onClick={() => setPage('evening')}
            delay={0.06}
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
            delay={0.12}
          />
        )}
      </div>

      {widgets.includes('tasks') && (
        <section className="mb-8">
          <SectionLabel>📝 План 100-дневки</SectionLabel>
          <Card className="divide-y divide-sand/60 overflow-hidden" hover={false}>
            {dayTasks.length === 0 && (
              <p className="p-5 text-sm text-ink-muted">Пунктов плана пока нет — добавьте в сферах.</p>
            )}
            {dayTasks.slice(0, 5).map((p) => {
              const area = LIFE_AREAS.find((a) => a.id === p.areaId)
              const done = p.targetValue > 0 && p.currentValue >= p.targetValue
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPage('tasks')}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-cream-soft/80"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${done ? 'opacity-40' : ''}`}
                    style={{ background: area?.color || '#C4A574' }}
                  />
                  <span className={`flex-1 text-sm ${done ? 'text-ink-muted line-through' : 'text-ink'}`}>
                    {area?.emoji ? `${area.emoji} ` : ''}
                    {p.title}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-ink-muted">
                    {p.currentValue}/{p.targetValue}
                  </span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setPage('tasks')}
              className="w-full px-5 py-3 text-left text-sm text-gold-deep"
            >
              Весь план →
            </button>
          </Card>
        </section>
      )}

      {widgets.includes('stats') && (
        <section className="mb-8">
          <SectionLabel>📈 Общая статистика</SectionLabel>
          <Card className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4" onClick={() => setPage('stats')}>
            <Stat label="Сегодня" value={`${progress}%`} />
            <Stat label="Неделя" value={`${week}%`} />
            <Stat label="Утро" value={`${morningDone}/${data.morningRitual.length}`} />
            <Stat label="План" value={`${challengeProgress}%`} />
          </Card>
        </section>
      )}

      {widgets.includes('life') && (
        <section className="mb-8">
          <SectionLabel>Колесо баланса</SectionLabel>
          <Card className="p-6 md:p-8" hover={false}>
            <LifeAreaRings scores={scores} onSelect={(pageId) => setPage(pageId)} />
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
            ? 'linear-gradient(155deg, #181A16 0%, #22261E 55%, #2A3026 100%)'
            : 'linear-gradient(155deg, #243028 0%, #314038 48%, #3E5044 100%)',
          border: muted ? 'rgba(80, 90, 72, 0.45)' : 'rgba(168, 184, 146, 0.55)',
          accent: muted ? '#8A9A7A' : '#C5D4A8',
          glow: muted ? 'rgba(90, 100, 80, 0.15)' : 'rgba(168, 184, 146, 0.28)',
          orb: muted ? 'rgba(40, 48, 36, 0.4)' : 'rgba(70, 90, 68, 0.4)',
          title: muted ? '#C8D0BE' : '#F4F7EE',
          muted: muted ? '#8A9480' : '#C8D4B8',
          track: 'rgba(255,255,255,0.12)',
        }
      : {
          bg: muted
            ? 'linear-gradient(155deg, #FAFBF8 0%, #F0F2EC 55%, #E4E8DE 100%)'
            : 'linear-gradient(155deg, #F6F9F0 0%, #E8F0DC 50%, #D5E4C6 100%)',
          border: muted ? 'rgba(200, 210, 188, 0.7)' : 'rgba(152, 176, 130, 0.55)',
          accent: muted ? '#9AAB8A' : '#6B8A55',
          glow: muted ? 'rgba(200, 210, 188, 0.35)' : 'rgba(188, 208, 160, 0.55)',
          orb: muted ? 'rgba(245, 248, 240, 0.7)' : 'rgba(240, 248, 228, 0.85)',
          title: muted ? '#5A6054' : '#2A3822',
          muted: muted ? '#8A9080' : '#5A6E4A',
          track: 'rgba(255,255,255,0.5)',
        },
  } as const

  const t = themes[tone]
  const sundayHighlight = tone === 'sunday' && !muted

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: muted ? 0.62 : 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={muted ? undefined : { y: -4 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-3xl border p-5 shadow-[var(--shadow-card)]"
      style={{
        background: t.bg,
        borderColor: t.border,
        boxShadow: sundayHighlight
          ? dark
            ? '0 10px 28px rgba(40, 60, 40, 0.35)'
            : '0 10px 28px rgba(140, 168, 120, 0.22)'
          : undefined,
      }}
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

      <div
        className={`pointer-events-none absolute right-3 top-3 transition duration-500 ${
          sundayHighlight ? 'opacity-30 group-hover:opacity-45' : 'opacity-[0.18] group-hover:opacity-30'
        }`}
      >
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
            {sundayHighlight && (
              <>
                <circle cx="22" cy="36" r="2" fill={t.accent} opacity="0.55" />
                <circle cx="54" cy="34" r="1.6" fill={t.accent} opacity="0.45" />
                <circle cx="38" cy="28" r="1.8" fill={t.accent} opacity="0.5" />
              </>
            )}
          </svg>
        )}
      </div>

      <div className="relative z-10 flex min-h-[148px] flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            {emoji && <div className="mb-1.5 text-[1.35rem] leading-none">{emoji}</div>}
            {sundayHighlight && (
              <span
                className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em]"
                style={{
                  background: dark ? 'rgba(197, 212, 168, 0.2)' : 'rgba(95, 122, 74, 0.14)',
                  color: t.accent,
                }}
              >
                день покоя
              </span>
            )}
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
