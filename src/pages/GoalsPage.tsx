import { useMemo, useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useAppStore } from '../lib/store'
import { goalPercent } from '../lib/analytics'
import { todayKey, HABIT_COLORS } from '../lib/seed'
import { Page, Card, Button, Modal, Input, TextArea, ProgressRing, LinearProgress, Empty } from '../components/ui'
import type { LifeSphere } from '../types'

export function GoalsPage() {
  const data = useAppStore((s) => s.data)
  const addGoal = useAppStore((s) => s.addGoal)
  const setPage = useAppStore((s) => s.setPage)
  const [modal, setModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetValue, setTargetValue] = useState(100)
  const [unit, setUnit] = useState('шт')
  const [color, setColor] = useState(HABIT_COLORS[0])
  const [sphere, setSphere] = useState<LifeSphere>('развитие')

  const save = () => {
    if (!title.trim()) return
    addGoal({
      title,
      description,
      startDate: todayKey(),
      targetValue,
      unit,
      color,
      milestones: [],
      linkedHabitIds: [],
      reminders: [],
      sphere,
    })
    setModal(false)
    setTitle('')
  }

  return (
    <Page
      title="Цели"
      subtitle="Большие намерения с этапами, прогрессом и историей."
      action={
        <Button variant="soft" onClick={() => setModal(true)}>
          <Plus size={16} /> Цель
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {data.goals.map((g) => {
          const p = goalPercent(g)
          return (
            <Card key={g.id} className="p-6" onClick={() => setPage('goal-detail', g.id)}>
              <div className="flex items-center gap-5">
                <ProgressRing value={p} size={96} color={g.color} label={`${p}%`} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-2xl text-ink">{g.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {g.currentValue} / {g.targetValue} {g.unit}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Осталось {Math.max(0, g.targetValue - g.currentValue)}
                  </p>
                  <div className="mt-4">
                    <LinearProgress value={p} color={g.color} />
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      {!data.goals.length && <Empty title="Целей пока нет" />}

      <Modal open={modal} onClose={() => setModal(false)} title="Новая цель">
        <div className="space-y-4">
          <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextArea label="Описание" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label="Объём" type="number" value={targetValue} onChange={(e) => setTargetValue(Number(e.target.value))} />
          <Input label="Единица" value={unit} onChange={(e) => setUnit(e.target.value)} />
          <label className="block text-xs text-ink-muted">
            Сфера жизни
            <select
              className="mt-1.5 w-full rounded-2xl border border-sand/80 bg-cream-soft px-4 py-3 text-sm"
              value={sphere}
              onChange={(e) => setSphere(e.target.value as LifeSphere)}
            >
              {(['здоровье', 'отношения', 'финансы', 'развитие', 'дом', 'бизнес', 'отдых'] as LifeSphere[]).map(
                (s) => (
                  <option key={s}>{s}</option>
                ),
              )}
            </select>
          </label>
          <div className="flex gap-2">
            {HABIT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full border-2 ${color === c ? 'border-ink' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <Button className="w-full" onClick={save}>
            Создать
          </Button>
        </div>
      </Modal>
    </Page>
  )
}

export function GoalDetailPage() {
  const id = useAppStore((s) => s.nav.selectedId)
  const data = useAppStore((s) => s.data)
  const setPage = useAppStore((s) => s.setPage)
  const incrementGoal = useAppStore((s) => s.incrementGoal)
  const updateGoal = useAppStore((s) => s.updateGoal)
  const deleteGoal = useAppStore((s) => s.deleteGoal)
  const goal = data.goals.find((g) => g.id === id)

  const chart = useMemo(
    () =>
      goal?.history.slice(-20).map((h) => ({
        day: h.date.slice(5),
        value: h.value,
      })) ?? [],
    [goal],
  )

  if (!goal) {
    return (
      <Page title="Цель" back={() => setPage('goals')}>
        <Empty title="Не найдена" />
      </Page>
    )
  }

  const p = goalPercent(goal)

  return (
    <Page title={goal.title} subtitle={goal.description} back={() => setPage('goals')}>
      <Card className="mb-6 flex flex-col items-center gap-6 p-6 sm:flex-row" hover={false}>
        <ProgressRing value={p} size={140} color={goal.color} label={`${p}%`} sublabel="прогресс" />
        <div className="flex-1 text-center sm:text-left">
          <p className="font-display text-3xl text-ink">
            {goal.currentValue}
            <span className="text-ink-muted"> / {goal.targetValue}</span>
          </p>
          <p className="mt-1 text-sm text-ink-muted">{goal.unit}</p>
          <p className="mt-2 text-sm text-ink-muted">
            Осталось {Math.max(0, goal.targetValue - goal.currentValue)}
          </p>
          <div className="mt-4 flex justify-center gap-2 sm:justify-start">
            <Button variant="soft" onClick={() => incrementGoal(goal.id, -1)}>
              <Minus size={16} />
            </Button>
            <Button onClick={() => incrementGoal(goal.id, 1)}>+1</Button>
            <Button variant="soft" onClick={() => incrementGoal(goal.id, 5)}>
              +5
            </Button>
          </div>
          <div className="mt-5">
            <LinearProgress value={p} color={goal.color} />
          </div>
        </div>
      </Card>

      {goal.milestones.length > 0 && (
        <Card className="mb-6 p-5" hover={false}>
          <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-ink-muted">Этапы</p>
          <div className="space-y-3">
            {goal.milestones.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span className={m.done ? 'text-ink-muted line-through' : 'text-ink'}>{m.title}</span>
                <span className="text-ink-muted">{m.targetValue}</span>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            className="mt-3"
            onClick={() =>
              updateGoal(goal.id, {
                milestones: [
                  ...goal.milestones,
                  {
                    id: crypto.randomUUID(),
                    title: 'Новый этап',
                    targetValue: Math.round(goal.targetValue / 2),
                    done: false,
                  },
                ],
              })
            }
          >
            + Этап
          </Button>
        </Card>
      )}

      <Card className="mb-6 p-5" hover={false}>
        <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-ink-muted">История</p>
        <div className="h-48">
          {chart.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#7A746C' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke={goal.color} fill={`${goal.color}33`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-ink-muted">Пока нет изменений</p>
          )}
        </div>
      </Card>

      <Button
        variant="danger"
        onClick={() => {
          deleteGoal(goal.id)
          setPage('goals')
        }}
      >
        Удалить цель
      </Button>
    </Page>
  )
}
