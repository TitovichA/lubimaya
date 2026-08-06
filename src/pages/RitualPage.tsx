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
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Pencil, Trash2 } from 'lucide-react'
import { useAppStore } from '../lib/store'
import { getRitualDone, ritualProgress } from '../lib/analytics'
import { Page, Card, Check, Button, Modal, Input, TextArea, LinearProgress, ProgressRing } from '../components/ui'
import type { RitualItem } from '../types'

function SortableRitual({
  item,
  checked,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: RitualItem
  checked: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-3 border-b border-sand/50 px-4 py-4 last:border-0"
    >
      <button className="mt-1 touch-none text-stone" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <Check checked={checked} onChange={onToggle} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          {item.time && (
            <span className="font-mono text-xs text-gold-deep">{item.time}</span>
          )}
          <p className={`text-sm font-medium ${checked ? 'text-ink-muted line-through' : 'text-ink'}`}>
            {item.title}
          </p>
        </div>
        {item.description && (
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{item.description}</p>
        )}
      </div>
      <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
        <button onClick={onEdit} className="rounded-xl p-2 text-ink-muted hover:bg-sand/40">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} className="rounded-xl p-2 text-ink-muted hover:bg-sand/40">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export function RitualPage({ type }: { type: 'morning' | 'evening' }) {
  const data = useAppStore((s) => s.data)
  const toggleRitual = useAppStore((s) => s.toggleRitual)
  const addRitual = useAppStore((s) => s.addRitual)
  const updateRitual = useAppStore((s) => s.updateRitual)
  const deleteRitual = useAppStore((s) => s.deleteRitual)
  const reorderRituals = useAppStore((s) => s.reorderRituals)
  const setPage = useAppStore((s) => s.setPage)

  const items = (type === 'morning' ? data.morningRitual : data.eveningRitual).slice().sort((a, b) => a.order - b.order)
  const done = getRitualDone(data, type)
  const pct = ritualProgress(done.length, items.length)

  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [time, setTime] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  const openNew = () => {
    setEditId(null)
    setTitle('')
    setDescription('')
    setTime('')
    setModal(true)
  }

  const openEdit = (item: RitualItem) => {
    setEditId(item.id)
    setTitle(item.title)
    setDescription(item.description || '')
    setTime(item.time || '')
    setModal(true)
  }

  const save = () => {
    if (!title.trim()) return
    if (editId) updateRitual(type, editId, { title, description, time })
    else addRitual(type, { title, description, time })
    setModal(false)
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    const next = arrayMove(items, oldIndex, newIndex)
    reorderRituals(
      type,
      next.map((i) => i.id),
    )
  }

  return (
    <Page
      title={type === 'morning' ? 'Утренний ритуал' : 'Вечерний ритуал'}
      subtitle={
        type === 'morning'
          ? 'Спокойное начало дня. Перетаскивайте пункты, отмечайте выполненное.'
          : 'Мягкое завершение дня. Порядок, благодарность, восстановление.'
      }
      back={() => setPage('home')}
      action={
        <Button onClick={openNew} variant="soft">
          <Plus size={16} /> Добавить
        </Button>
      }
    >
      <Card className="mb-6 flex items-center gap-6 p-5" hover={false}>
        <ProgressRing
          value={pct}
          color={type === 'morning' ? '#C4A574' : '#A8B5C4'}
          label={`${done.length}/${items.length}`}
          sublabel={`${pct}%`}
        />
        <div className="flex-1">
          <p className="font-display text-2xl text-ink">
            {type === 'morning' ? 'Утро' : 'Вечер'}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {done.length} из {items.length} выполнено
          </p>
          <div className="mt-4">
            <LinearProgress value={pct} color={type === 'morning' ? '#C4A574' : '#A8B5C4'} />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden" hover={false}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <SortableRitual
                key={item.id}
                item={item}
                checked={done.includes(item.id)}
                onToggle={() => toggleRitual(type, item.id)}
                onEdit={() => openEdit(item)}
                onDelete={() => deleteRitual(type, item.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Редактировать' : 'Новый пункт'}>
        <div className="space-y-4">
          <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, Медитация" />
          <Input label="Время" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <TextArea label="Описание" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button onClick={save} className="w-full">
            Сохранить
          </Button>
        </div>
      </Modal>
    </Page>
  )
}
