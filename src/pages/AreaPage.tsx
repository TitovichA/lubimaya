import { useMemo, useState } from 'react'
import { Plus, Droplet, GripVertical, Pencil, Trash2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
import { todayKey, HABIT_COLORS } from '../lib/seed'
import {
  Page,
  Card,
  Button,
  Check,
  LinearProgress,
  ProgressRing,
  Modal,
  Input,
  TextArea,
  Empty,
} from '../components/ui'
import type { AreaPlanItem, AreaRule, Goal, LifeAreaId, PeriodicRule, TeamEvent } from '../types'
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

function SortableAreaRule({
  rule,
  onEdit,
  onDelete,
}: {
  rule: AreaRule
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rule.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2.5 rounded-2xl bg-cream/70 px-3 py-3 sm:gap-3 sm:px-4"
    >
      <button
        type="button"
        className="shrink-0 touch-none text-stone"
        aria-label="Перетащить"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <p className="min-w-0 flex-1 break-words text-sm leading-relaxed text-ink whitespace-pre-wrap">
        {rule.title}
      </p>
      <div className="flex shrink-0 gap-0.5 self-center">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl p-2 text-ink-muted hover:bg-sand/40"
          aria-label="Редактировать"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl p-2 text-ink-muted hover:bg-sand/40"
          aria-label="Удалить"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function isPlanDone(plan: AreaPlanItem) {
  return plan.targetValue > 0 && plan.currentValue >= plan.targetValue
}

function SortableAreaPlan({
  plan,
  color,
  onEdit,
  onDelete,
  onDec,
  onInc,
  onToggleDone,
}: {
  plan: AreaPlanItem
  color: string
  onEdit: () => void
  onDelete: () => void
  onDec: () => void
  onInc: () => void
  onToggleDone: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: plan.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  }
  const done = isPlanDone(plan)
  const pct = plan.targetValue
    ? Math.min(100, Math.round((plan.currentValue / plan.targetValue) * 100))
    : 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2.5 rounded-2xl px-3 py-3 sm:gap-3 sm:px-4 ${
        done ? 'bg-cream/45' : 'bg-cream/70'
      }`}
    >
      <button
        type="button"
        className="shrink-0 touch-none text-stone"
        aria-label="Перетащить"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <Check checked={done} onChange={onToggleDone} color={color} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p
            className={`min-w-0 break-words text-sm leading-relaxed whitespace-pre-wrap ${
              done ? 'text-ink-muted line-through' : 'text-ink'
            }`}
          >
            {plan.title}
          </p>
          <span className="shrink-0 text-xs text-ink-muted">
            {plan.currentValue}/{plan.targetValue} {plan.unit}
          </span>
        </div>
        {!done && (
          <>
            <div className="mt-2">
              <LinearProgress value={pct} color={color} />
            </div>
            <div className="mt-2 flex gap-1">
              <button
                type="button"
                onClick={onDec}
                className="rounded-xl px-2.5 py-1 text-sm text-ink-muted hover:bg-sand/40"
              >
                −
              </button>
              <button
                type="button"
                onClick={onInc}
                className="rounded-xl px-2.5 py-1 text-sm text-ink-muted hover:bg-sand/40"
              >
                +
              </button>
            </div>
          </>
        )}
      </div>
      <div className="flex shrink-0 gap-0.5 self-center">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl p-2 text-ink-muted hover:bg-sand/40"
          aria-label="Редактировать"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl p-2 text-ink-muted hover:bg-sand/40"
          aria-label="Удалить"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

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
  const reorderAreaPlans = useAppStore((s) => s.reorderAreaPlans)
  const addBusinessEvent = useAppStore((s) => s.addBusinessEvent)
  const toggleBusinessEvent = useAppStore((s) => s.toggleBusinessEvent)
  const deleteBusinessEvent = useAppStore((s) => s.deleteBusinessEvent)
  const addTeamEvent = useAppStore((s) => s.addTeamEvent)
  const updateTeamEvent = useAppStore((s) => s.updateTeamEvent)
  const deleteTeamEvent = useAppStore((s) => s.deleteTeamEvent)
  const updateCycle = useAppStore((s) => s.updateCycle)
  const addGoal = useAppStore((s) => s.addGoal)
  const updateGoal = useAppStore((s) => s.updateGoal)

  const rules = (data.areaRules || [])
    .filter((r) => r.areaId === areaId)
    .sort((a, b) => a.order - b.order)
  const plans = (data.areaPlans || [])
    .filter((p) => p.areaId === areaId)
    .sort((a, b) => {
      const aDone = isPlanDone(a)
      const bDone = isPlanDone(b)
      if (aDone !== bDone) return aDone ? 1 : -1
      return (a.order ?? 0) - (b.order ?? 0)
    })
  const habits = (data.areaHabits || [])
    .filter((h) => h.areaId === areaId)
    .sort((a, b) => a.order - b.order)
  const areaGoal = (data.goals || []).find((g) => g.areaId === areaId)
  const plansDone = plans.filter((p) => isPlanDone(p)).length
  const areaGoalPct = plans.length
    ? Math.round(
        plans.reduce(
          (s, p) => s + (p.targetValue ? Math.min(100, (p.currentValue / p.targetValue) * 100) : 0),
          0,
        ) / plans.length,
      )
    : 0

  const cycle = data.settings.cycle
  const period = areaId === 'body' && isPeriodDay(cycle, today)
  const cycleDay = areaId === 'body' ? getCycleDay(cycle, today) : null

  const [goalOpen, setGoalOpen] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalColor, setGoalColor] = useState(meta.color)
  const [goalDesc, setGoalDesc] = useState('')
  const [ruleOpen, setRuleOpen] = useState(false)
  const [editRuleId, setEditRuleId] = useState<string | null>(null)
  const [ruleText, setRuleText] = useState('')
  const [habitText, setHabitText] = useState('')
  const [habitOpen, setHabitOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [editPlanId, setEditPlanId] = useState<string | null>(null)
  const [planTitle, setPlanTitle] = useState('')
  const [planTarget, setPlanTarget] = useState(100)
  const [planCurrent, setPlanCurrent] = useState(0)
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

  const ruleSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  function openNewRule() {
    setEditRuleId(null)
    setRuleText('')
    setRuleOpen(true)
  }

  function openEditRule(rule: AreaRule) {
    setEditRuleId(rule.id)
    setRuleText(rule.title)
    setRuleOpen(true)
  }

  function saveRule() {
    const title = ruleText.trim()
    if (!title) return
    if (editRuleId) updateAreaRule(editRuleId, { title })
    else addAreaRule(areaId, title)
    setRuleOpen(false)
    setRuleText('')
    setEditRuleId(null)
  }

  function onRuleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = rules.findIndex((r) => r.id === active.id)
    const newIndex = rules.findIndex((r) => r.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(rules, oldIndex, newIndex)
    reorderAreaRules(
      areaId,
      next.map((r) => r.id),
    )
  }

  function openNewPlan() {
    setEditPlanId(null)
    setPlanTitle('')
    setPlanTarget(100)
    setPlanCurrent(0)
    setPlanUnit('%')
    setPlanOpen(true)
  }

  function openEditPlan(plan: AreaPlanItem) {
    setEditPlanId(plan.id)
    setPlanTitle(plan.title)
    setPlanTarget(plan.targetValue)
    setPlanCurrent(plan.currentValue)
    setPlanUnit(plan.unit)
    setPlanOpen(true)
  }

  function openGoalModal(goal?: Goal) {
    setGoalTitle(goal?.title || '')
    setGoalColor(goal?.color || meta.color)
    setGoalDesc(goal?.description || '')
    setGoalOpen(true)
  }

  function saveGoal() {
    if (!goalTitle.trim()) return
    if (areaGoal) {
      updateGoal(areaGoal.id, {
        title: goalTitle.trim(),
        color: goalColor,
        description: goalDesc.trim() || undefined,
        areaId,
      })
    } else {
      addGoal({
        title: goalTitle.trim(),
        description: goalDesc.trim() || undefined,
        startDate: today,
        targetValue: 100,
        unit: '%',
        color: goalColor,
        milestones: [],
        linkedHabitIds: [],
        reminders: [],
        areaId,
      })
    }
    setGoalOpen(false)
  }

  function savePlan() {
    if (!planTitle.trim()) return
    if (editPlanId) {
      updateAreaPlan(editPlanId, {
        title: planTitle.trim(),
        targetValue: planTarget,
        currentValue: planCurrent,
        unit: planUnit,
      })
    } else {
      addAreaPlan({
        areaId,
        title: planTitle.trim(),
        targetValue: planTarget,
        currentValue: planCurrent,
        unit: planUnit,
      })
    }
    setPlanOpen(false)
    setEditPlanId(null)
    setPlanTitle('')
  }

  function onPlanDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = plans.findIndex((p) => p.id === active.id)
    const newIndex = plans.findIndex((p) => p.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(plans, oldIndex, newIndex)
    reorderAreaPlans(
      areaId,
      next.map((p) => p.id),
    )
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
    <Page title={meta.title} subtitle={meta.subtitle} back={() => setPage('home')}>
      {areaGoal ? (
        <Card className="relative mb-6 p-6" onClick={() => openGoalModal(areaGoal)}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openGoalModal(areaGoal)
            }}
            className="absolute right-4 top-4 rounded-xl p-2 text-ink-muted transition hover:bg-sand/40 hover:text-ink"
            aria-label="Редактировать цель"
          >
            <Pencil size={16} />
          </button>
          <div className="flex items-center gap-5 pr-8">
            <ProgressRing
              value={areaGoalPct}
              size={96}
              color={areaGoal.color}
              label={`${areaGoalPct}%`}
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-2xl text-ink">{areaGoal.title}</h3>
              {areaGoal.description && (
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{areaGoal.description}</p>
              )}
              <p className="mt-1 text-sm text-ink-muted">
                {plansDone} / {plans.length} пунктов плана
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Осталось {Math.max(0, plans.length - plansDone)}
              </p>
              <div className="mt-4">
                <LinearProgress value={areaGoalPct} color={areaGoal.color} />
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mb-6 p-6" onClick={() => openGoalModal()}>
          <p className="font-display text-2xl text-ink">Цель сферы</p>
          <p className="mt-2 text-sm text-ink-muted">Нажмите, чтобы добавить главную цель</p>
        </Card>
      )}

      <Card className="mb-5 overflow-hidden p-5" hover={false}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">План моей 100-дневки</h2>
          <Button variant="soft" onClick={openNewPlan}>
            <Plus size={16} />
          </Button>
        </div>
        <DndContext sensors={ruleSensors} collisionDetection={closestCenter} onDragEnd={onPlanDragEnd}>
          <SortableContext items={plans.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {plans.map((p) => (
                <SortableAreaPlan
                  key={p.id}
                  plan={p}
                  color={meta.color}
                  onEdit={() => openEditPlan(p)}
                  onDelete={() => deleteAreaPlan(p.id)}
                  onDec={() =>
                    updateAreaPlan(p.id, { currentValue: Math.max(0, p.currentValue - 1) })
                  }
                  onInc={() =>
                    updateAreaPlan(p.id, {
                      currentValue: Math.min(p.targetValue, p.currentValue + 1),
                    })
                  }
                  onToggleDone={() =>
                    updateAreaPlan(p.id, {
                      currentValue: isPlanDone(p)
                        ? Math.max(0, p.targetValue - 1)
                        : p.targetValue,
                    })
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {!plans.length && <Empty title="Составьте план 100-дневки" />}
      </Card>

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
            Из календаря событий: сегодня и завтра
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
          <h2 className="font-display text-2xl text-ink">Ежедневные привычки</h2>
          <Button
            variant="soft"
            onClick={() => {
              setHabitText('')
              setHabitOpen(true)
            }}
          >
            <Plus size={16} />
          </Button>
        </div>
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
                {areaId === 'body' && (
                  <button
                    type="button"
                    className="text-[10px] text-ink-muted"
                    onClick={() => updateAreaHabit(h.id, { softOnCycle: !h.softOnCycle })}
                    title="Мягкая в дни цикла"
                  >
                    {h.softOnCycle ? 'мягкая' : 'строгая'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteAreaHabit(h.id)}
                  className="rounded-xl p-2 text-ink-muted hover:bg-sand/40"
                  aria-label="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
          {!habits.length && <Empty title="Добавьте первую привычку" />}
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
                  <button
                    type="button"
                    className="rounded-xl p-2 text-ink-muted hover:bg-sand/40"
                    onClick={() => deleteBusinessEvent(e.id)}
                    aria-label="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card className="mb-5 overflow-hidden p-5" hover={false}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">Правила</h2>
          <Button variant="soft" onClick={openNewRule}>
            <Plus size={16} />
          </Button>
        </div>
        <DndContext sensors={ruleSensors} collisionDetection={closestCenter} onDragEnd={onRuleDragEnd}>
          <SortableContext items={rules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {rules.map((r) => (
                <SortableAreaRule
                  key={r.id}
                  rule={r}
                  onEdit={() => openEditRule(r)}
                  onDelete={() => deleteAreaRule(r.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {!rules.length && <Empty title="Добавьте первое правило" />}
      </Card>

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
              <button className="rounded-xl p-2 text-ink-muted hover:bg-sand/40" onClick={() => deleteTeamEvent(e.id)} aria-label="Удалить">
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </Card>

      <Modal
        open={habitOpen}
        onClose={() => setHabitOpen(false)}
        title="Новая привычка"
      >
        <div className="space-y-4">
          <Input
            label="Название"
            value={habitText}
            onChange={(e) => setHabitText(e.target.value)}
            placeholder="Например: Полить растения"
          />
          <Button
            className="w-full"
            onClick={() => {
              if (!habitText.trim()) return
              addAreaHabit(areaId, habitText)
              setHabitText('')
              setHabitOpen(false)
            }}
          >
            Сохранить
          </Button>
        </div>
      </Modal>

      <Modal
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        title={areaGoal ? 'Цель сферы' : 'Новая цель'}
      >
        <div className="space-y-4">
          <Input label="Название" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} />
          <TextArea
            label="Описание"
            value={goalDesc}
            onChange={(e) => setGoalDesc(e.target.value)}
            rows={2}
          />
          <div className="flex flex-wrap gap-2">
            {HABIT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setGoalColor(c)}
                className={`h-7 w-7 rounded-full border-2 ${goalColor === c ? 'border-ink' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <Button className="w-full" onClick={saveGoal}>
            Сохранить
          </Button>
        </div>
      </Modal>

      <Modal
        open={ruleOpen}
        onClose={() => setRuleOpen(false)}
        title={editRuleId ? 'Редактировать правило' : 'Новое правило'}
      >
        <div className="space-y-4">
          <TextArea
            label="Текст правила"
            value={ruleText}
            onChange={(e) => setRuleText(e.target.value)}
            placeholder="Напишите правило..."
            rows={4}
          />
          <Button onClick={saveRule} className="w-full">
            Сохранить
          </Button>
        </div>
      </Modal>

      <Modal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        title={editPlanId ? 'Редактировать план' : 'Пункт плана'}
      >
        <div className="space-y-3">
          <Input label="Название" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} />
          <Input
            label="Цель"
            type="number"
            value={planTarget}
            onChange={(e) => setPlanTarget(Number(e.target.value))}
          />
          <Input
            label="Сейчас"
            type="number"
            value={planCurrent}
            onChange={(e) => setPlanCurrent(Number(e.target.value))}
          />
          <Input label="Единица" value={planUnit} onChange={(e) => setPlanUnit(e.target.value)} />
          <Button className="w-full" onClick={savePlan}>
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
