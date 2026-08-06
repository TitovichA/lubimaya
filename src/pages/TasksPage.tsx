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
import { useAppStore } from '../lib/store'
import { HABIT_COLORS } from '../lib/seed'
import { Page, Card, Check, Button, Modal, Input, TextArea, Empty } from '../components/ui'
import type { Priority, RepeatRule, Task } from '../types'

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

  return (
    <div ref={setNodeRef} style={style} className="border-b border-sand/50 last:border-0">
      <div className="flex items-start gap-3 px-4 py-4">
        <button className="mt-1 touch-none text-stone" {...attributes} {...listeners}>
          <GripVertical size={16} />
        </button>
        <Check checked={task.done} onChange={onToggle} color={task.color} />
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen((v) => !v)}>
          <p className={`text-sm font-medium ${task.done ? 'text-ink-muted line-through' : 'text-ink'}`}>
            {task.title}
          </p>
          <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-ink-muted">
            <span style={{ color: task.color }}>{task.priority}</span>
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
  const selectedDate = useAppStore((s) => s.nav.selectedDate)

  const tasks = data.tasks
    .filter((t) => t.date === selectedDate)
    .sort((a, b) => a.order - b.order)

  const [modal, setModal] = useState(false)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [color, setColor] = useState(HABIT_COLORS[0])
  const [category, setCategory] = useState('')
  const [deadline, setDeadline] = useState(selectedDate)
  const [repeat, setRepeat] = useState<RepeatRule>({ type: 'none' })

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
    })
    setModal(false)
    setTitle('')
    setNotes('')
  }

  return (
    <Page
      title="Задачи"
      subtitle="Список на день. Приоритеты, подзадачи, повторения."
      action={
        <Button variant="soft" onClick={() => setModal(true)}>
          <Plus size={16} /> Задача
        </Button>
      }
    >
      <Card className="overflow-hidden" hover={false}>
        {tasks.length === 0 && (
          <div className="p-6">
            <Empty title="Нет задач" text="Добавьте первую задачу на сегодня" />
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
            Повторение
            <select
              className="mt-1.5 w-full rounded-2xl border border-sand/80 bg-cream-soft px-4 py-3 text-sm"
              value={repeat.type}
              onChange={(e) => {
                const t = e.target.value
                if (t === 'daily') setRepeat({ type: 'daily' })
                else if (t === 'weekly') setRepeat({ type: 'weekly', days: [1] })
                else if (t === 'monthly') setRepeat({ type: 'monthly', day: 1 })
                else if (t === 'everyNDays') setRepeat({ type: 'everyNDays', n: 3 })
                else setRepeat({ type: 'none' })
              }}
            >
              <option value="none">Без повтора</option>
              <option value="daily">Каждый день</option>
              <option value="weekly">Каждый понедельник</option>
              <option value="monthly">Каждый месяц</option>
              <option value="everyNDays">Каждые 3 дня</option>
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
