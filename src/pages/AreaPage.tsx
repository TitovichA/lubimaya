import { useMemo, useState } from 'react'
import { Plus, Droplet } from 'lucide-react'
import { useAppStore } from '../lib/store'
import {
  areaMeta,
  describePeriodic,
  isPeriodDay,
  getCycleDay,
  isPeriodicDue,
  isTeamEventImportantOn,
  isTeamEventOnDate,
  teamEventWhenLabel,
  formatTeamEventHeadline,
  buildPeriodicRule,
  nextTeamEventOccurrence,
} from '../lib/areas'
import { todayKey } from '../lib/seed'
import {
  Page,
  Card,
  Button,
  Check,
  LinearProgress,
  Modal,
  Input,
  Empty,
} from '../components/ui'
import type { LifeAreaId, PeriodicRule, TeamEvent } from '../types'
import { parseISO, format, eachDayOfInterval, startOfMonth, endOfMonth, getDate, getMonth } from 'date-fns'
import { ru } from 'date-fns/locale'

const FAR_END = '9999-12-31'
const WEEKDAYS = [
  { v: 1, label: 'пн' },
  { v: 2, label: 'вт' },
  { v: 3, label: 'ср' },
  { v: 4, label: 'чт' },
  { v: 5, label: 'пт' },
  { v: 6, label: 'сб' },
  { v: 0, label: 'вс' },
]

function ruleToForm(rule?: PeriodicRule) {
  if (!rule) {
    return {
      kind: 'monthly',
      weekday: 1,
      n: 14,
      day: getDate(new Date()),
      month: 1,
      count: 2,
    }
  }
  return {
    kind: rule.type,
    weekday: 'weekday' in rule ? rule.weekday : 1,
    n: 'n' in rule ? rule.n : 14,
    day: 'day' in rule ? rule.day : getDate(new Date()),
    month: 'month' in rule ? rule.month : 1,
    count: 'count' in rule ? rule.count : 2,
  }
}

export function AreaPage({ areaId }: { areaId: LifeAreaId }) {
  const meta = areaMeta(areaId)
  const data = useAppStore((s) => s.data)
  const today = todayKey()
  const setPage = useAppStore((s) => s.setPage)

  const addAreaRule = useAppStore((s) => s.addAreaRule)
  const deleteAreaRule = useAppStore((s) => s.deleteAreaRule)
  const updateAreaRule = useAppStore((s) => s.updateAreaRule)
  const addAreaPlan = useAppStore((s) => s.addAreaPlan)
  const updateAreaPlan = useAppStore((s) => s.updateAreaPlan)
  const deleteAreaPlan = useAppStore((s) => s.deleteAreaPlan)
  const addAreaHabit = useAppStore((s) => s.addAreaHabit)
  const toggleAreaHabit = useAppStore((s) => s.toggleAreaHabit)
  const updateAreaHabit = useAppStore((s) => s.updateAreaHabit)
  const deleteAreaHabit = useAppStore((s) => s.deleteAreaHabit)
  const reorderAreaRules = useAppStore((s) => s.reorderAreaRules)
  const addBusinessEvent = useAppStore((s) => s.addBusinessEvent)
  const toggleBusinessEvent = useAppStore((s) => s.toggleBusinessEvent)
  const deleteBusinessEvent = useAppStore((s) => s.deleteBusinessEvent)
  const addTeamEvent = useAppStore((s) => s.addTeamEvent)
  const updateTeamEvent = useAppStore((s) => s.updateTeamEvent)
  const deleteTeamEvent = useAppStore((s) => s.deleteTeamEvent)
  const updateCycle = useAppStore((s) => s.updateCycle)

  const rules = (data.areaRules || [])
    .filter((r) => r.areaId === areaId)
    .sort((a, b) => a.order - b.order)
  const plans = (data.areaPlans || []).filter((p) => p.areaId === areaId)
  const habits = (data.areaHabits || [])
    .filter((h) => h.areaId === areaId)
    .sort((a, b) => a.order - b.order)

  const cycle = data.settings.cycle
  const period = areaId === 'body' && isPeriodDay(cycle, today)
  const cycleDay = areaId === 'body' ? getCycleDay(cycle, today) : null

  const [ruleText, setRuleText] = useState('')
  const [habitText, setHabitText] = useState('')
  const [planOpen, setPlanOpen] = useState(false)
  const [planTitle, setPlanTitle] = useState('')
  const [planTarget, setPlanTarget] = useState(100)
  const [planUnit, setPlanUnit] = useState('%')
  const [teamOpen, setTeamOpen] = useState(false)
  const [editTeamId, setEditTeamId] = useState<string | null>(null)
  const [person, setPerson] = useState('')
  const [teamMode, setTeamMode] = useState<'once' | 'repeat'>('once')
  const [teamStart, setTeamStart] = useState(today)
  const [teamEnd, setTeamEnd] = useState(today)
  const [recKind, setRecKind] = useState('monthly')
  const [recWeekday, setRecWeekday] = useState(1)
  const [recN, setRecN] = useState(14)
  const [recDay, setRecDay] = useState(getDate(new Date()))
  const [recMonth, setRecMonth] = useState(1)
  const [recCount, setRecCount] = useState(2)
  const [bizOpen, setBizOpen] = useState(false)
  const [bizTitle, setBizTitle] = useState('')
  const [bizKind, setBizKind] = useState('monthly')

  const monthDays = useMemo(() => {
    const start = startOfMonth(parseISO(today))
    const end = endOfMonth(start)
    return eachDayOfInterval({ start, end })
  }, [today])

  const areaEvents = (data.teamEvents || []).filter((e) => (e.areaId || 'business') === areaId)
  const importantTeam = areaEvents
    .map((e) => ({ e, meta: isTeamEventImportantOn(e, today) }))
    .filter((x) => x.meta.important)
    .sort((a, b) => a.meta.daysUntilStart - b.meta.daysUntilStart)

  function openNewTeam() {
    setEditTeamId(null)
    setPerson('')
    setTeamMode('once')
    setTeamStart(today)
    setTeamEnd(today)
    setRecKind('monthly')
    setRecWeekday(1)
    setRecN(14)
    setRecDay(getDate(new Date()))
    setRecMonth(1)
    setRecCount(2)
    setTeamOpen(true)
  }

  function openEditTeam(e: TeamEvent) {
    setEditTeamId(e.id)
    setPerson(e.personName)
    if (e.recurrence) {
      setTeamMode('repeat')
      const f = ruleToForm(e.recurrence)
      setRecKind(f.kind)
      setRecWeekday(f.weekday)
      setRecN(f.n)
      setRecDay(f.day)
      setRecMonth(f.month)
      setRecCount(f.count)
      setTeamStart(e.startDate)
      setTeamEnd(e.endDate === FAR_END ? today : e.endDate)
    } else {
      setTeamMode('once')
      setTeamStart(e.startDate)
      setTeamEnd(e.endDate)
    }
    setTeamOpen(true)
  }

  function saveTeamEvent() {
    if (!person.trim()) return
    if (teamMode === 'repeat') {
      const recurrence = buildPeriodicRule(recKind, {
        weekday: recWeekday,
        n: recN,
        day: recDay,
        month: recMonth,
        count: recCount,
        anchorDate: teamStart,
        anchorMonth: getMonth(parseISO(teamStart)) + 1,
      })
      const payload = {
        areaId,
        personName: person.trim(),
        type: 'other' as const,
        startDate: teamStart,
        endDate: FAR_END,
        recurrence,
        note: undefined,
        coverHint: undefined,
      }
      if (editTeamId) updateTeamEvent(editTeamId, payload)
      else addTeamEvent(payload)
    } else {
      const start = teamStart
      const end = teamEnd < teamStart ? teamStart : teamEnd
      const payload = {
        areaId,
        personName: person.trim(),
        type: 'other' as const,
        startDate: start,
        endDate: end,
        recurrence: undefined,
        note: undefined,
        coverHint: undefined,
      }
      if (editTeamId) updateTeamEvent(editTeamId, { ...payload, recurrence: undefined })
      else addTeamEvent(payload)
    }
    setTeamOpen(false)
    setEditTeamId(null)
    setPerson('')
  }

  return (
    <Page title={`${meta.emoji} ${meta.title}`} subtitle={meta.subtitle} back={() => setPage('home')}>
      {areaId === 'body' && period && (
        <Card className="mb-6 border border-[#E8C4C4]/60 bg-[#FBF1F1]/80 p-5" hover={false}>
          <div className="flex items-start gap-3">
            <Droplet className="mt-0.5 text-[#C47A7A]" size={18} />
            <div>
              <p className="font-display text-xl text-ink">День {cycleDay} цикла</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Сегодня можно снизить нагрузку. Позволь своему телу отдых. Забота о себе — тоже дисциплина.
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                Пропуск мягких привычек сегодня не считается провалом — это осознанное восстановление.
              </p>
            </div>
          </div>
        </Card>
      )}

      {importantTeam.length > 0 && (
        <Card className="mb-5 p-5" hover={false}>
          <h2 className="mb-3 font-display text-2xl text-ink">Важно</h2>
          <p className="mb-4 text-xs text-ink-muted">
            Из календаря событий: сегодня и за 3 дня до начала
          </p>
          <div className="space-y-2">
            {importantTeam.map(({ e, meta }) => (
              <button
                key={e.id}
                type="button"
                onClick={() => openEditTeam(e)}
                className="w-full rounded-2xl border border-sand/70 bg-cream/80 px-4 py-3 text-left transition hover:bg-cream"
              >
                <p className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  {teamEventWhenLabel(meta.daysUntilStart, meta.active)}
                  {e.recurrence ? ` · ${describePeriodic(e.recurrence)}` : ''}
                </p>
                <p className="mt-1 text-sm text-ink">{formatTeamEventHeadline(e, meta)}</p>
                {!e.recurrence && (
                  <p className="mt-1 text-xs text-ink-muted">
                    {format(parseISO(e.startDate), 'd MMM', { locale: ru })} —{' '}
                    {format(parseISO(e.endDate), 'd MMM', { locale: ru })}
                  </p>
                )}
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card className="mb-5 p-5" hover={false}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">Правила</h2>
        </div>
        <div className="space-y-2">
          {rules.map((r, idx) => (
            <div key={r.id} className="flex items-center gap-2 rounded-2xl bg-cream/70 px-3 py-2.5">
              <div className="flex flex-col gap-0.5">
                <button
                  className="text-[10px] text-ink-muted disabled:opacity-30"
                  disabled={idx === 0}
                  onClick={() => {
                    const ids = rules.map((x) => x.id)
                    ;[ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]
                    reorderAreaRules(areaId, ids)
                  }}
                >
                  ↑
                </button>
                <button
                  className="text-[10px] text-ink-muted disabled:opacity-30"
                  disabled={idx === rules.length - 1}
                  onClick={() => {
                    const ids = rules.map((x) => x.id)
                    ;[ids[idx + 1], ids[idx]] = [ids[idx], ids[idx + 1]]
                    reorderAreaRules(areaId, ids)
                  }}
                >
                  ↓
                </button>
              </div>
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                value={r.title}
                onChange={(e) => updateAreaRule(r.id, { title: e.target.value })}
              />
              <button className="text-xs text-ink-muted" onClick={() => deleteAreaRule(r.id)}>
                удалить
              </button>
            </div>
          ))}
          {!rules.length && <Empty title="Добавьте первое правило" />}
        </div>
        <div className="mt-4 flex gap-2">
          <Input
            value={ruleText}
            onChange={(e) => setRuleText(e.target.value)}
            placeholder="Новое правило..."
          />
          <Button
            variant="soft"
            onClick={() => {
              if (!ruleText.trim()) return
              addAreaRule(areaId, ruleText)
              setRuleText('')
            }}
          >
            <Plus size={16} />
          </Button>
        </div>
      </Card>

      <Card className="mb-5 p-5" hover={false}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">План моей 100-дневки</h2>
          <Button variant="soft" onClick={() => setPlanOpen(true)}>
            <Plus size={16} />
          </Button>
        </div>
        <div className="space-y-4">
          {plans.map((p) => {
            const pct = p.targetValue ? Math.min(100, Math.round((p.currentValue / p.targetValue) * 100)) : 0
            return (
              <div key={p.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="text-ink">{p.title}</span>
                  <span className="text-ink-muted">
                    {p.currentValue}/{p.targetValue} {p.unit}
                  </span>
                </div>
                <LinearProgress value={pct} color={meta.color} />
                <div className="mt-2 flex gap-2">
                  <Button variant="ghost" onClick={() => updateAreaPlan(p.id, { currentValue: Math.max(0, p.currentValue - 1) })}>
                    −
                  </Button>
                  <Button variant="ghost" onClick={() => updateAreaPlan(p.id, { currentValue: Math.min(p.targetValue, p.currentValue + 1) })}>
                    +
                  </Button>
                  <Button variant="danger" onClick={() => deleteAreaPlan(p.id)}>
                    Удалить
                  </Button>
                </div>
              </div>
            )
          })}
          {!plans.length && <Empty title="Составьте план 100-дневки" />}
        </div>
      </Card>

      <Card className="mb-5 p-5" hover={false}>
        <h2 className="mb-4 font-display text-2xl text-ink">Ежедневные привычки</h2>
        <div className="space-y-2">
          {habits.map((h) => {
            const soft = period && h.softOnCycle
            return (
              <div key={h.id} className="flex items-center gap-3 rounded-2xl bg-cream/60 px-3 py-3">
                <Check checked={!!h.completions[today]} onChange={() => toggleAreaHabit(h.id)} color={meta.color} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${h.completions[today] ? 'text-ink-muted line-through' : 'text-ink'}`}>
                    {h.title}
                  </p>
                  {soft && <p className="text-[10px] text-ink-muted">мягкая в дни цикла</p>}
                </div>
                <button className="text-xs text-ink-muted" onClick={() => deleteAreaHabit(h.id)}>
                  ×
                </button>
                {areaId === 'body' && (
                  <button
                    className="text-[10px] text-ink-muted"
                    onClick={() => updateAreaHabit(h.id, { softOnCycle: !h.softOnCycle })}
                    title="Мягкая в дни цикла"
                  >
                    {h.softOnCycle ? 'мягкая' : 'строгая'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex gap-2">
          <Input value={habitText} onChange={(e) => setHabitText(e.target.value)} placeholder="Новая привычка..." />
          <Button
            variant="soft"
            onClick={() => {
              if (!habitText.trim()) return
              addAreaHabit(areaId, habitText)
              setHabitText('')
            }}
          >
            <Plus size={16} />
          </Button>
        </div>
        {areaId === 'body' && (
          <p className="mt-3 text-xs text-ink-muted">
            Переключайте «мягкая / строгая»: мягкие привычки в дни цикла не портят статистику, если их пропустить.
          </p>
        )}
      </Card>

      {areaId === 'body' && (
        <Card className="mb-5 p-5" hover={false}>
          <h2 className="mb-3 font-display text-2xl text-ink">Женский цикл</h2>
          <label className="mb-4 flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={!!cycle?.enabled}
              onChange={(e) => updateCycle({ enabled: e.target.checked })}
            />
            Включить режим заботы о цикле
          </label>
          <Input
            label="Дата начала текущего цикла"
            type="date"
            value={cycle?.lastStartDate || ''}
            onChange={(e) => updateCycle({ lastStartDate: e.target.value })}
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Input
              label="Длина цикла"
              type="number"
              value={cycle?.cycleLength || 28}
              onChange={(e) => updateCycle({ cycleLength: Number(e.target.value) || 28 })}
            />
            <Input
              label="Дни периода"
              type="number"
              value={cycle?.periodLength || 3}
              onChange={(e) => updateCycle({ periodLength: Number(e.target.value) || 3 })}
            />
          </div>
          {cycleDay && (
            <p className="mt-3 text-sm text-ink-muted">
              Сегодня — день {cycleDay} цикла
              {period ? ' · капелька заботы активна' : ''}
            </p>
          )}
        </Card>
      )}

      {areaId === 'business' && (
        <Card className="mb-5 p-5" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl text-ink">Ежемесячные события</h2>
            <Button variant="soft" onClick={() => setBizOpen(true)}>
              <Plus size={16} />
            </Button>
          </div>
          <div className="space-y-2">
            {(data.businessEvents || []).map((e) => {
              const due = isPeriodicDue(e.rule, parseISO(today))
              return (
                <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-cream/70 px-3 py-3 text-sm">
                  {due && (
                    <Check
                      checked={!!e.completions[today]}
                      onChange={() => toggleBusinessEvent(e.id)}
                      color={meta.color}
                    />
                  )}
                  <div className="flex-1">
                    <p>{e.title}</p>
                    <p className="text-xs text-ink-muted">{describePeriodic(e.rule)}</p>
                  </div>
                  <button className="text-xs text-ink-muted" onClick={() => deleteBusinessEvent(e.id)}>
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card className="mb-5 p-5" hover={false}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Календарь событий</h2>
          <Button variant="soft" onClick={openNewTeam}>
            <Plus size={16} />
          </Button>
        </div>
        <p className="mb-4 text-xs text-ink-muted">
          Разовый период (с… по…) или повтор: каждые N дней, число месяца и другие правила
        </p>
        <div className="mb-4 grid grid-cols-7 gap-1">
          {monthDays.map((d) => {
            const key = format(d, 'yyyy-MM-dd')
            const has = areaEvents.some((e) => isTeamEventOnDate(e, key))
            return (
              <div
                key={key}
                className={`rounded-lg py-2 text-center text-[10px] ${
                  has ? 'bg-gold-light/70 text-ink' : 'bg-cream text-ink-muted'
                }`}
              >
                {format(d, 'd')}
              </div>
            )
          })}
        </div>
        {areaEvents.length === 0 && (
          <Empty title="Добавьте событие" text="Нажмите + — разовый интервал или повтор" />
        )}
        {areaEvents.map((e) => {
          const status = isTeamEventImportantOn(e, today)
          const next = e.recurrence ? nextTeamEventOccurrence(e, today) : null
          return (
            <div
              key={e.id}
              className={`mb-2 flex items-center justify-between rounded-2xl px-3 py-2 text-sm ${
                status.important ? 'border border-gold/40 bg-gold-light/30' : 'bg-cream/70'
              }`}
            >
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openEditTeam(e)}>
                <p className="text-ink">
                  {e.personName}
                  {status.important
                    ? ` · ${teamEventWhenLabel(status.daysUntilStart, status.active).toLowerCase()}`
                    : ''}
                </p>
                {e.recurrence ? (
                  <p className="text-xs text-ink-muted">
                    {describePeriodic(e.recurrence)}
                    {next ? ` · ближайшее ${format(parseISO(next), 'd MMM', { locale: ru })}` : ''}
                  </p>
                ) : (
                  <p className="text-xs text-ink-muted">
                    {format(parseISO(e.startDate), 'd MMM', { locale: ru })} —{' '}
                    {format(parseISO(e.endDate), 'd MMM', { locale: ru })}
                  </p>
                )}
              </button>
              <button className="text-xs text-ink-muted" onClick={() => deleteTeamEvent(e.id)}>
                ×
              </button>
            </div>
          )
        })}
      </Card>

      <Modal open={planOpen} onClose={() => setPlanOpen(false)} title="Пункт плана">
        <div className="space-y-3">
          <Input label="Название" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} />
          <Input label="Цель" type="number" value={planTarget} onChange={(e) => setPlanTarget(Number(e.target.value))} />
          <Input label="Единица" value={planUnit} onChange={(e) => setPlanUnit(e.target.value)} />
          <Button
            className="w-full"
            onClick={() => {
              if (!planTitle.trim()) return
              addAreaPlan({
                areaId,
                title: planTitle.trim(),
                targetValue: planTarget,
                currentValue: 0,
                unit: planUnit,
              })
              setPlanOpen(false)
              setPlanTitle('')
            }}
          >
            Сохранить
          </Button>
        </div>
      </Modal>

      <Modal open={bizOpen} onClose={() => setBizOpen(false)} title="Событие бизнеса">
        <div className="space-y-3">
          <Input label="Название" value={bizTitle} onChange={(e) => setBizTitle(e.target.value)} />
          <label className="block text-xs text-ink-muted">
            Когда
            <select
              className="mt-1.5 w-full rounded-2xl border border-sand/80 bg-cream-soft px-4 py-3 text-sm"
              value={bizKind}
              onChange={(e) => setBizKind(e.target.value)}
            >
              <option value="monthly">Число месяца</option>
              <option value="monthlyLastDay">Последний день месяца</option>
              <option value="weekly">Каждую неделю</option>
            </select>
          </label>
          <Button
            className="w-full"
            onClick={() => {
              if (!bizTitle.trim()) return
              addBusinessEvent({
                title: bizTitle.trim(),
                rule: buildPeriodicRule(bizKind, { day: 15, weekday: 1, anchorDate: today }),
              })
              setBizOpen(false)
              setBizTitle('')
            }}
          >
            Создать
          </Button>
        </div>
      </Modal>

      <Modal
        open={teamOpen}
        onClose={() => {
          setTeamOpen(false)
          setEditTeamId(null)
        }}
        title={editTeamId ? 'Изменить событие' : 'Новое событие'}
      >
        <div className="space-y-3">
          <Input
            label="Имя / название"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder="Например: замена Юлии, маникюр, день рождения…"
          />
          <label className="block text-xs text-ink-muted">
            Тип
            <select
              className="mt-1.5 w-full rounded-2xl border border-sand/80 bg-cream-soft px-4 py-3 text-sm"
              value={teamMode}
              onChange={(e) => setTeamMode(e.target.value as 'once' | 'repeat')}
            >
              <option value="once">Разовый период (с… по…)</option>
              <option value="repeat">Повторяется</option>
            </select>
          </label>

          {teamMode === 'once' ? (
            <>
              <Input label="С" type="date" value={teamStart} onChange={(e) => setTeamStart(e.target.value)} />
              <Input label="По" type="date" value={teamEnd} onChange={(e) => setTeamEnd(e.target.value)} />
            </>
          ) : (
            <>
              <label className="block text-xs text-ink-muted">
                Периодичность
                <select
                  className="mt-1.5 w-full rounded-2xl border border-sand/80 bg-cream-soft px-4 py-3 text-sm"
                  value={recKind}
                  onChange={(e) => setRecKind(e.target.value)}
                >
                  <option value="everyNDays">Каждые N дней</option>
                  <option value="weekly">Каждую неделю</option>
                  <option value="biweekly">Раз в две недели</option>
                  <option value="monthly">Каждый месяц такого числа</option>
                  <option value="monthlyLastDay">Последний день месяца</option>
                  <option value="nthWeekday">N-й день недели месяца</option>
                  <option value="timesPerMonth">Несколько раз в месяц</option>
                  <option value="everyNMonths">Каждые N месяцев</option>
                  <option value="yearly">Раз в год</option>
                  <option value="daily">Каждый день</option>
                </select>
              </label>

              {(recKind === 'weekly' || recKind === 'biweekly' || recKind === 'nthWeekday') && (
                <label className="block text-xs text-ink-muted">
                  День недели
                  <select
                    className="mt-1.5 w-full rounded-2xl border border-sand/80 bg-cream-soft px-4 py-3 text-sm"
                    value={recWeekday}
                    onChange={(e) => setRecWeekday(Number(e.target.value))}
                  >
                    {WEEKDAYS.map((w) => (
                      <option key={w.v} value={w.v}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {(recKind === 'everyNDays' ||
                recKind === 'everyNMonths' ||
                recKind === 'nthWeekday') && (
                <Input
                  label={
                    recKind === 'everyNDays'
                      ? 'Каждые N дней'
                      : recKind === 'nthWeekday'
                        ? 'Какой по счёту (1–5)'
                        : 'Каждые N месяцев'
                  }
                  type="number"
                  min={1}
                  value={recN}
                  onChange={(e) => setRecN(Math.max(1, Number(e.target.value) || 1))}
                />
              )}

              {(recKind === 'monthly' || recKind === 'everyNMonths' || recKind === 'yearly') && (
                <Input
                  label="Число месяца"
                  type="number"
                  min={1}
                  max={31}
                  value={recDay}
                  onChange={(e) => setRecDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                />
              )}

              {recKind === 'yearly' && (
                <Input
                  label="Месяц (1–12)"
                  type="number"
                  min={1}
                  max={12}
                  value={recMonth}
                  onChange={(e) => setRecMonth(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
                />
              )}

              {recKind === 'timesPerMonth' && (
                <Input
                  label="Сколько раз в месяц"
                  type="number"
                  min={1}
                  max={10}
                  value={recCount}
                  onChange={(e) => setRecCount(Math.max(1, Number(e.target.value) || 1))}
                />
              )}

              <Input
                label="Действует с"
                type="date"
                value={teamStart}
                onChange={(e) => setTeamStart(e.target.value)}
              />
            </>
          )}

          <Button className="w-full" onClick={saveTeamEvent}>
            Сохранить
          </Button>
        </div>
      </Modal>
    </Page>
  )
}
