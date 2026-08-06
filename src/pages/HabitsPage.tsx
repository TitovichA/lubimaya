import { useMemo, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { eachDayOfInterval, format, subDays } from 'date-fns'
import { useAppStore } from '../lib/store'
import { habitDoneToday, habitStreak, habitCompletionRate } from '../lib/analytics'
import { todayKey, HABIT_COLORS, HABIT_ICONS } from '../lib/seed'
import { Page, Card, Button, Modal, Input, TextArea, LinearProgress, Check, Empty } from '../components/ui'
import { AppIcon } from '../components/AppIcon'
import type { Habit, HabitCategory } from '../types'

const categories: HabitCategory[] = [
  'Здоровье',
  'Красота',
  'Работа',
  'Дом',
  'Саморазвитие',
  'Финансы',
  'Отношения',
  'Другое',
]

export function HabitsPage() {
  const data = useAppStore((s) => s.data)
  const toggleHabitDone = useAppStore((s) => s.toggleHabitDone)
  const addHabit = useAppStore((s) => s.addHabit)
  const setPage = useAppStore((s) => s.setPage)
  const [filter, setFilter] = useState<HabitCategory | 'Все'>('Все')
  const [modal, setModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<HabitCategory>('Здоровье')
  const [icon, setIcon] = useState('leaf')
  const [color, setColor] = useState(HABIT_COLORS[0])

  const habits = data.habits.filter((h) => filter === 'Все' || h.category === filter)

  const save = () => {
    if (!title.trim()) return
    addHabit({
      title,
      description,
      category,
      icon,
      color,
      targetPerDay: 1,
      unit: 'раз',
      reminders: [],
    })
    setModal(false)
    setTitle('')
    setDescription('')
  }

  return (
    <Page
      title="Привычки"
      subtitle="Постоянные практики. Серии, история и спокойный прогресс."
      action={
        <Button variant="soft" onClick={() => setModal(true)}>
          <Plus size={16} /> Добавить
        </Button>
      }
    >
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {(['Все', ...categories] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
              filter === c ? 'bg-ink text-cream' : 'bg-white/70 text-ink-muted'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {habits.map((h) => {
          const done = habitDoneToday(h)
          const streak = habitStreak(h)
          const rate = habitCompletionRate(h, 30)
          return (
            <Card key={h.id} className="p-5" onClick={() => setPage('habit-detail', h.id)}>
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: `${h.color}33` }}
                >
                  <AppIcon name={h.icon} color={h.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-xl text-ink">{h.title}</h3>
                      <p className="text-xs text-ink-muted">{h.category}</p>
                    </div>
                    <Check checked={done} onChange={() => toggleHabitDone(h.id)} color={h.color} />
                  </div>
                  {h.description && (
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">{h.description}</p>
                  )}
                  <div className="mt-4 flex gap-4 text-xs text-ink-muted">
                    <span>Серия {streak}</span>
                    <span>{rate}%</span>
                    <span>
                      {(h.completions[todayKey()] ?? 0)}
                      {h.targetPerDay && h.targetPerDay > 1 ? `/${h.targetPerDay}` : ''} {h.unit}
                    </span>
                  </div>
                  <div className="mt-3">
                    <LinearProgress value={rate} color={h.color} />
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {!habits.length && <Empty title="Пока пусто" text="Добавьте первую привычку" />}

      <Modal open={modal} onClose={() => setModal(false)} title="Новая привычка">
        <div className="space-y-4">
          <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextArea label="Описание" value={description} onChange={(e) => setDescription(e.target.value)} />
          <label className="block text-xs text-ink-muted">
            Категория
            <select
              className="mt-1.5 w-full rounded-2xl border border-sand/80 bg-cream-soft px-4 py-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value as HabitCategory)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div>
            <p className="mb-2 text-xs text-ink-muted">Иконка</p>
            <div className="flex flex-wrap gap-2">
              {HABIT_ICONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`rounded-xl p-2 ${icon === i ? 'bg-sand' : 'bg-white'}`}
                >
                  <AppIcon name={i} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-ink-muted">Цвет</p>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 ${color === c ? 'border-ink' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={save}>
            Создать
          </Button>
        </div>
      </Modal>
    </Page>
  )
}

export function HabitDetailPage() {
  const id = useAppStore((s) => s.nav.selectedId)
  const data = useAppStore((s) => s.data)
  const setPage = useAppStore((s) => s.setPage)
  const toggleHabitDone = useAppStore((s) => s.toggleHabitDone)
  const deleteHabit = useAppStore((s) => s.deleteHabit)
  const updateHabit = useAppStore((s) => s.updateHabit)
  const habit = data.habits.find((h) => h.id === id)

  const [editOpen, setEditOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<HabitCategory>('Здоровье')
  const [icon, setIcon] = useState('leaf')
  const [color, setColor] = useState(HABIT_COLORS[0])
  const [targetPerDay, setTargetPerDay] = useState(1)
  const [unit, setUnit] = useState('раз')

  const chart = useMemo(() => {
    if (!habit) return []
    const end = new Date()
    const start = subDays(end, 13)
    return eachDayOfInterval({ start, end }).map((d) => {
      const key = format(d, 'yyyy-MM-dd')
      return { day: format(d, 'd.MM'), value: habit.completions[key] ?? 0 }
    })
  }, [habit])

  const openEdit = (h: Habit) => {
    setTitle(h.title)
    setDescription(h.description || '')
    setCategory(h.category)
    setIcon(h.icon)
    setColor(h.color)
    setTargetPerDay(h.targetPerDay ?? 1)
    setUnit(h.unit || 'раз')
    setEditOpen(true)
  }

  const saveEdit = () => {
    if (!habit || !title.trim()) return
    updateHabit(habit.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      icon,
      color,
      targetPerDay: Math.max(1, targetPerDay),
      unit: unit.trim() || 'раз',
    })
    setEditOpen(false)
  }

  if (!habit) {
    return (
      <Page title="Привычка" back={() => setPage('habits')}>
        <Empty title="Не найдена" />
      </Page>
    )
  }

  const streak = habitStreak(habit)
  const rate = habitCompletionRate(habit, 30)
  const total = Object.values(habit.completions).reduce((a, b) => a + b, 0)
  const doneToday = habitDoneToday(habit)

  return (
    <Page
      title={habit.title}
      subtitle={habit.description}
      back={() => setPage('habits')}
      action={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => openEdit(habit)} aria-label="Редактировать">
            <Pencil size={16} />
          </Button>
          <Button variant="soft" onClick={() => toggleHabitDone(habit.id)}>
            {doneToday ? 'Снять отметку' : 'Выполнено сегодня'}
          </Button>
        </div>
      }
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5" hover={false}>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">Серия</p>
          <p className="mt-2 font-display text-3xl">{streak}</p>
        </Card>
        <Card className="p-5" hover={false}>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">За 30 дней</p>
          <p className="mt-2 font-display text-3xl">{rate}%</p>
        </Card>
        <Card className="p-5" hover={false}>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">Всего</p>
          <p className="mt-2 font-display text-3xl">{total}</p>
        </Card>
      </div>

      <Card className="mb-6 p-5" hover={false}>
        <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-ink-muted">История 14 дней</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="habitFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={habit.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={habit.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#7A746C' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke={habit.color} fill="url(#habitFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="mb-6 space-y-3 p-5" hover={false}>
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">Напоминания</p>
        {habit.reminders.map((r) => (
          <div key={r.id} className="flex items-center justify-between text-sm">
            <span>{r.time}</span>
            <span className="text-ink-muted">{r.enabled ? 'вкл' : 'выкл'}</span>
          </div>
        ))}
        <Button
          variant="ghost"
          onClick={() =>
            updateHabit(habit.id, {
              reminders: [
                ...habit.reminders,
                { id: crypto.randomUUID(), time: '09:00', enabled: true },
              ],
            })
          }
        >
          + Напоминание
        </Button>
      </Card>

      <Button
        variant="danger"
        onClick={() => {
          deleteHabit(habit.id)
          setPage('habits')
        }}
      >
        Удалить привычку
      </Button>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Редактировать привычку">
        <div className="space-y-4">
          <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextArea label="Описание" value={description} onChange={(e) => setDescription(e.target.value)} />
          <label className="block text-xs text-ink-muted">
            Категория
            <select
              className="mt-1.5 w-full rounded-2xl border border-sand/80 bg-cream-soft px-4 py-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value as HabitCategory)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Цель в день"
              type="number"
              min={1}
              value={targetPerDay}
              onChange={(e) => setTargetPerDay(Number(e.target.value))}
            />
            <Input label="Единица" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div>
            <p className="mb-2 text-xs text-ink-muted">Иконка</p>
            <div className="flex flex-wrap gap-2">
              {HABIT_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`rounded-xl p-2 ${icon === i ? 'bg-sand' : 'bg-white'}`}
                >
                  <AppIcon name={i} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-ink-muted">Цвет</p>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 ${color === c ? 'border-ink' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={saveEdit}>
            Сохранить
          </Button>
        </div>
      </Modal>
    </Page>
  )
}
