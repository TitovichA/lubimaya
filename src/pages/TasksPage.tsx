import { useState } from 'react'
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
import { GripVertical, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { parseISO } from 'date-fns'
import { useAppStore } from '../lib/store'
import { HABIT_COLORS } from '../lib/seed'
import { LIFE_AREAS, isPeriodicDue, areaMeta } from '../lib/areas'
import { Page, Card, Check, Button, Modal, Input, TextArea, Empty } from '../components/ui'
import type { LifeAreaId, Priority, RepeatRule, Task } from '../types'

function SortableTask({
  task,
  onToggle,
  onUpdate,
  onDelete,
}: {
  task: Task
  onToggle: () => void
  onUpdate: (patch: Partial<Task>) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const area = task.areaId ? areaMeta(task.areaId) : null

  return (
    <div ref={setNodeRef} style={style} className="border-b border-sand/50 last:border-0">
      <div className="flex items-start gap-3 px-4 py-4">
        <button className="mt-1 touch-none text-stone" {...attributes} {...listeners}>
          <GripVertical size={16} />
        </button>
        <Check checked={task.done} onChange={onToggle} color={area?.color || task.color} />
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen((v) => !v)}>
          <p className={`text-sm font-medium ${task.done ? 'text-ink-muted line-through' : 'text-ink'}`}>
            {area && <span className="mr-1.5">{area.emoji}</span>}
            {task.title}
          </p>
          <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-ink-muted">
            <span style={{ color: task.color }}>{task.priority}</span>
            {area && <span style={{ color: area.color }}>{area.label}</span>}
            {task.category && <span>{task.category}</span>}
            {task.deadline && <span>до {task.deadline}</span>}
            {task.subtasks.length > 0 && (
              <span>
                {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
              </span>
            )}
          </div>
        </button>
        {open ? <ChevronUp size={16} className="text-ink-muted" /> : <ChevronDown size={16} className="text-ink-muted" />}
      </div>
      {open && (
        <div className="space-y-3 bg-cream-soft/50 px-4 pb-4 pl-14">
          {task.notes && <p className="text-xs text-ink-muted">{task.notes}</p>}
          {task.subtasks.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.done}
                onChange={() =>
                  onUpdate({
                    subtasks: task.subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)),
                  })
                }
              />
              {s.title}
            </label>
          ))}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() =>
                onUpdate({
                  subtasks: [
                    ...task.subtasks,
                    { id: crypto.randomUUID(), title: 'Подзадача', done: false },
                  ],
                })
              }
            >
              + Подзадача
            </Button>
            <Button variant="danger" onClick={onDelete}>
              Удалить
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function TasksPage() {
  const data = useAppStore((s) => s.data)
  const addTask = useAppStore((s) => s.addTask)
  const updateTask = useAppStore((s) => s.updateTask)
  const deleteTask = useAppStore((s) => s.deleteTask)
  const toggleTask = useAppStore((s) => s.toggleTask)
  const reorderTasks = useAppStore((s) => s.reorderTasks)
  const togglePeriodicHabit = useAppStore((s) => s.togglePeriodicHabit)
  const toggleBusinessEvent = useAppStore((s) => s.toggleBusinessEvent)
  const toggleAreaHabit = useAppStore((s) => s.toggleAreaHabit)
  const selectedDate = useAppStore((s) => s.nav.selectedDate)
  const [filter, setFilter] = useState<LifeAreaId | 'all'>('all')

  const tasks = data.tasks
    .filter((t) => t.date === selectedDate)
    .filter((t) => filter === 'all' || t.areaId === filter)
    .sort((a, b) => a.order - b.order)

  const duePeriodic = (data.periodicHabits || []).filter(
    (h) =>
      isPeriodicDue(h.rule, parseISO(selectedDate)) &&
      (filter === 'all' || h.areaId === filter),
  )
  const dueBusiness =
    filter === 'all' || filter === 'business'
      ? (data.businessEvents || []).filter((e) => isPeriodicDue(e.rule, parseISO(selectedDate)))
      : []
  const areaHabitsToday = (data.areaHabits || []).filter(
    (h) => filter === 'all' || h.areaId === filter,
  )

  const [modal, setModal] = useState(false)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [color, setColor] = useState(HABIT_COLORS[0])
  const [category, setCategory] = useState('')
  const [deadline, setDeadline] = useState(selectedDate)
  const [repeat, setRepeat] = useState<RepeatRule>({ type: 'none' })
  const [areaId, setAreaId] = useState<LifeAreaId | ''>('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = tasks.findIndex((t) => t.id === active.id)
    const newIndex = tasks.findIndex((t) => t.id === over.id)
    reorderTasks(arrayMove(tasks, oldIndex, newIndex).map((t) => t.id))
  }

  const save = () => {
    if (!title.trim()) return
    addTask({
      title,
      notes,
      priority,
      color,
      category: category || undefined,
      deadline,
      date: selectedDate,
      repeat,
      reminders: [],
      subtasks: [],
      areaId: areaId || undefined,
    })
    setModal(false)
    setTitle('')
    setNotes('')
    setAreaId('')
  }

  const hasSphereItems = duePeriodic.length > 0 || dueBusiness.length > 0 || areaHabitsToday.length > 0

  return (
    <Page
      title="Задачи"
      subtitle="Единый список дня по всем сферам жизни."
      action={
        <Button variant="soft" onClick={() => setModal(true)}>
          <Plus size={16} /> Задача
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-2xl px-3 py-1.5 text-xs ${
            filter === 'all' ? 'bg-ink text-cream' : 'bg-cream text-ink-muted'
          }`}
        >
          Все
        </button>
        {LIFE_AREAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setFilter(a.id)}
            className={`rounded-2xl px-3 py-1.5 text-xs ${
              filter === a.id ? 'bg-white text-ink shadow-soft' : 'bg-cream text-ink-muted'
            }`}
          >
            {a.emoji} {a.label}
          </button>
        ))}
      </div>

      {hasSphereItems && (
        <Card className="mb-4 divide-y divide-sand/50 overflow-hidden" hover={false}>
          <div className="px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            Сегодня из сфер
          </div>
          {dueBusiness.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3">
              <Check
                checked={!!e.completions[selectedDate]}
                onChange={() => toggleBusinessEvent(e.id, selectedDate)}
                color="#C4A574"
              />
              <span className="text-sm">💼 {e.title}</span>
            </div>
          ))}
          {duePeriodic.map((h) => {
            const meta = areaMeta(h.areaId)
            return (
              <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                <Check
                  checked={!!h.completions[selectedDate]}
                  onChange={() => togglePeriodicHabit(h.id, selectedDate)}
                  color={meta.color}
                />
                <span className="text-sm">
                  {meta.emoji} {h.title}
                </span>
              </div>
            )
          })}
          {areaHabitsToday.map((h) => {
            const meta = areaMeta(h.areaId)
            return (
              <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                <Check
                  checked={!!h.completions[selectedDate]}
                  onChange={() => toggleAreaHabit(h.id, selectedDate)}
                  color={meta.color}
                />
                <span className="text-sm">
                  {meta.emoji} {h.title}
                </span>
              </div>
            )
          })}
        </Card>
      )}

      <Card className="overflow-hidden" hover={false}>
        {tasks.length === 0 && (
          <div className="p-6">
            <Empty title="Нет задач" text="Добавьте задачу или отметьте привычки сфер выше" />
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task.id)}
                onUpdate={(patch) => updateTask(task.id, patch)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Новая задача">
        <div className="space-y-4">
          <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextArea label="Заметки" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <label className="block text-xs text-ink-muted">
            Сфера жизни
            <select
              className="mt-1.5 w-full rounded-2xl border border-sand/80 bg-cream-soft px-4 py-3 text-sm"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value as LifeAreaId | '')}
            >
              <option value="">Без сферы</option>
              {LIFE_AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.emoji} {a.label}
                </option>
              ))}
            </select>
          </label>
          <Input label="Категория" value={category} onChange={(e) => setCategory(e.target.value)} />
          <Input label="Дедлайн" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <label className="block text-xs text-ink-muted">
            Приоритет
            <select
              className="mt-1.5 w-full rounded-2xl border border-sand/80 bg-cream-soft px-4 py-3 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </label>
          <label className="block text-xs text-ink-muted">
            Повтор
            <select
              className="mt-1.5 w-full rounded-2xl border border-sand/80 bg-cream-soft px-4 py-3 text-sm"
              value={repeat.type}
              onChange={(e) => {
                const t = e.target.value
                if (t === 'none') setRepeat({ type: 'none' })
                else if (t === 'daily') setRepeat({ type: 'daily' })
                else if (t === 'weekly') setRepeat({ type: 'weekly', days: [1] })
                else if (t === 'monthly') setRepeat({ type: 'monthly', day: 1 })
              }}
            >
              <option value="none">Нет</option>
              <option value="daily">Ежедневно</option>
              <option value="weekly">Еженедельно</option>
              <option value="monthly">Ежемесячно</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            {HABIT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full ${color === c ? 'ring-2 ring-ink ring-offset-2' : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <Button onClick={save}>Сохранить</Button>
        </div>
      </Modal>
    </Page>
  )
}
