import { useMemo, useState } from 'react'
import { Plus, Droplet } from 'lucide-react'
import { useAppStore } from '../lib/store'
import {
  areaMeta,
  describePeriodic,
  isPeriodDay,
  getCycleDay,
  isPeriodicDue,
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
import type { LifeAreaId, PeriodicRule } from '../types'
import { parseISO, format, eachDayOfInterval, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { ru } from 'date-fns/locale'

function parseRule(kind: string): PeriodicRule {
  switch (kind) {
    case 'daily':
      return { type: 'daily' }
    case 'weekly':
      return { type: 'weekly', weekday: 1 }
    case 'biweekly':
      return { type: 'biweekly', weekday: 0, anchorDate: todayKey() }
    case 'everyNDays':
      return { type: 'everyNDays', n: 14, anchorDate: todayKey() }
    case 'monthly':
      return { type: 'monthly', day: 15 }
    case 'monthlyLastDay':
      return { type: 'monthlyLastDay' }
    case 'nthWeekday':
      return { type: 'nthWeekday', n: 1, weekday: 0 }
    case 'everyNMonths':
      return { type: 'everyNMonths', n: 3, day: 1 }
    case 'yearly':
      return { type: 'yearly', month: 10, day: 1 }
    case 'timesPerMonth':
      return { type: 'timesPerMonth', count: 2 }
    default:
      return { type: 'monthly', day: 1 }
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
  const addPeriodicHabit = useAppStore((s) => s.addPeriodicHabit)
  const togglePeriodicHabit = useAppStore((s) => s.togglePeriodicHabit)
  const deletePeriodicHabit = useAppStore((s) => s.deletePeriodicHabit)
  const addBusinessEvent = useAppStore((s) => s.addBusinessEvent)
  const toggleBusinessEvent = useAppStore((s) => s.toggleBusinessEvent)
  const deleteBusinessEvent = useAppStore((s) => s.deleteBusinessEvent)
  const addTeamEvent = useAppStore((s) => s.addTeamEvent)
  const deleteTeamEvent = useAppStore((s) => s.deleteTeamEvent)
  const updateCycle = useAppStore((s) => s.updateCycle)

  const rules = (data.areaRules || [])
    .filter((r) => r.areaId === areaId)
    .sort((a, b) => a.order - b.order)
  const plans = (data.areaPlans || []).filter((p) => p.areaId === areaId)
  const habits = (data.areaHabits || [])
    .filter((h) => h.areaId === areaId)
    .sort((a, b) => a.order - b.order)
  const periodics = (data.periodicHabits || []).filter((h) => h.areaId === areaId)
  const duePeriodics = periodics.filter((h) => isPeriodicDue(h.rule, parseISO(today)))

  const cycle = data.settings.cycle
  const period = areaId === 'body' && isPeriodDay(cycle, today)
  const cycleDay = areaId === 'body' ? getCycleDay(cycle, today) : null

  const [ruleText, setRuleText] = useState('')
  const [habitText, setHabitText] = useState('')
  const [planOpen, setPlanOpen] = useState(false)
  const [planTitle, setPlanTitle] = useState('')
  const [planTarget, setPlanTarget] = useState(100)
  const [planUnit, setPlanUnit] = useState('%')
  const [periodicOpen, setPeriodicOpen] = useState(false)
  const [periodicTitle, setPeriodicTitle] = useState('')
  const [periodicKind, setPeriodicKind] = useState('monthly')
  const [teamOpen, setTeamOpen] = useState(false)
  const [person, setPerson] = useState('')
  const [teamStart, setTeamStart] = useState(today)
  const [teamEnd, setTeamEnd] = useState(today)
  const [bizOpen, setBizOpen] = useState(false)
  const [bizTitle, setBizTitle] = useState('')
  const [bizKind, setBizKind] = useState('monthly')

  const monthDays = useMemo(() => {
    const start = startOfMonth(parseISO(today))
    const end = endOfMonth(start)
    return eachDayOfInterval({ start, end })
  }, [today])

  const activeCovers = (data.teamEvents || []).filter((e) => {
    try {
      return isWithinInterval(parseISO(today), {
        start: parseISO(e.startDate),
        end: parseISO(e.endDate),
      })
    } catch {
      return false
    }
  })

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

      {areaId === 'business' && activeCovers.length > 0 && (
        <Card className="mb-6 p-5" hover={false}>
          {activeCovers.map((e) => (
            <p key={e.id} className="text-sm text-ink-soft">
              {e.coverHint || `Сегодня вы заменяете ${e.personName}.`}
            </p>
          ))}
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

      <Card className="mb-5 p-5" hover={false}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Периодические привычки</h2>
          <Button variant="soft" onClick={() => setPeriodicOpen(true)}>
            <Plus size={16} />
          </Button>
        </div>
        {duePeriodics.length > 0 && (
          <div className="mb-4 rounded-2xl bg-sky/40 px-4 py-3 text-sm text-ink-soft">
            Сегодня: {duePeriodics.map((h) => h.title).join(' · ')}
          </div>
        )}
        <div className="space-y-3">
          {periodics.map((h) => {
            const due = isPeriodicDue(h.rule, parseISO(today))
            return (
              <div key={h.id} className="flex items-start gap-3 rounded-2xl border border-sand/60 px-3 py-3">
                {due ? (
                  <Check
                    checked={!!h.completions[today]}
                    onChange={() => togglePeriodicHabit(h.id)}
                    color={meta.color}
                  />
                ) : (
                  <span className="mt-1 h-6 w-6" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{h.title}</p>
                  <p className="text-xs text-ink-muted">{describePeriodic(h.rule)}</p>
                </div>
                <button className="text-xs text-ink-muted" onClick={() => deletePeriodicHabit(h.id)}>
                  ×
                </button>
              </div>
            )
          })}
          {!periodics.length && <Empty title="Добавьте периодическую привычку" />}
        </div>
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
        <>
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

          <Card className="mb-5 p-5" hover={false}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink">Команда</h2>
              <Button variant="soft" onClick={() => setTeamOpen(true)}>
                <Plus size={16} />
              </Button>
            </div>
            <div className="mb-4 grid grid-cols-7 gap-1">
              {monthDays.map((d) => {
                const key = format(d, 'yyyy-MM-dd')
                const has = (data.teamEvents || []).some((e) =>
                  isWithinInterval(d, { start: parseISO(e.startDate), end: parseISO(e.endDate) }),
                )
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
            {(data.teamEvents || []).map((e) => (
              <div key={e.id} className="mb-2 flex items-center justify-between rounded-2xl bg-cream/70 px-3 py-2 text-sm">
                <div>
                  <p className="text-ink">
                    {e.personName} · {e.note || e.type}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {format(parseISO(e.startDate), 'd MMM', { locale: ru })} —{' '}
                    {format(parseISO(e.endDate), 'd MMM', { locale: ru })}
                  </p>
                </div>
                <button className="text-xs text-ink-muted" onClick={() => deleteTeamEvent(e.id)}>
                  ×
                </button>
              </div>
            ))}
          </Card>
        </>
      )}

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

      <Modal open={periodicOpen} onClose={() => setPeriodicOpen(false)} title="Периодическая привычка">
        <div className="space-y-3">
          <Input label="Название" value={periodicTitle} onChange={(e) => setPeriodicTitle(e.target.value)} />
          <label className="block text-xs text-ink-muted">
            Повторение
            <select
              className="mt-1.5 w-full rounded-2xl border border-sand/80 bg-cream-soft px-4 py-3 text-sm"
              value={periodicKind}
              onChange={(e) => setPeriodicKind(e.target.value)}
            >
              <option value="daily">Ежедневно</option>
              <option value="weekly">Раз в неделю</option>
              <option value="biweekly">Раз в две недели</option>
              <option value="everyNDays">Каждые N дней</option>
              <option value="monthly">Раз в месяц (число)</option>
              <option value="monthlyLastDay">Последний день месяца</option>
              <option value="nthWeekday">N-й день недели месяца</option>
              <option value="timesPerMonth">Несколько раз в месяц</option>
              <option value="everyNMonths">Раз в квартал / N месяцев</option>
              <option value="yearly">Раз в год</option>
            </select>
          </label>
          <Button
            className="w-full"
            onClick={() => {
              if (!periodicTitle.trim()) return
              addPeriodicHabit({
                areaId,
                title: periodicTitle.trim(),
                rule: parseRule(periodicKind),
              })
              setPeriodicOpen(false)
              setPeriodicTitle('')
            }}
          >
            Создать
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
              addBusinessEvent({ title: bizTitle.trim(), rule: parseRule(bizKind) })
              setBizOpen(false)
              setBizTitle('')
            }}
          >
            Создать
          </Button>
        </div>
      </Modal>

      <Modal open={teamOpen} onClose={() => setTeamOpen(false)} title="Событие команды">
        <div className="space-y-3">
          <Input label="Имя" value={person} onChange={(e) => setPerson(e.target.value)} />
          <Input label="С" type="date" value={teamStart} onChange={(e) => setTeamStart(e.target.value)} />
          <Input label="По" type="date" value={teamEnd} onChange={(e) => setTeamEnd(e.target.value)} />
          <Button
            className="w-full"
            onClick={() => {
              if (!person.trim()) return
              addTeamEvent({
                personName: person.trim(),
                type: 'vacation',
                startDate: teamStart,
                endDate: teamEnd,
                note: 'Отпуск',
                coverHint: `Сегодня вы заменяете ${person.trim()}.`,
              })
              setTeamOpen(false)
              setPerson('')
            }}
          >
            Сохранить
          </Button>
        </div>
      </Modal>
    </Page>
  )
}
