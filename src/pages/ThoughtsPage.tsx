import { useEffect, useState } from 'react'
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
import { GripVertical, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useAppStore } from '../lib/store'
import { Page, Card, Button, Modal, TextArea, Empty } from '../components/ui'
import type { Thought } from '../types'
import { isSunday } from '../lib/sunday'
import { todayKey } from '../lib/seed'

function SortableThought({
  thought,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  thought: Thought
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: thought.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 border-b border-sand/50 px-4 py-4 last:border-0"
    >
      <button className="mt-1 touch-none text-stone" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg leading-snug text-ink-soft">{thought.text}</p>
      </div>
      <button onClick={onToggleFavorite} className="rounded-xl p-2 text-ink-muted hover:bg-sand/40">
        <Star size={16} className={thought.favorite ? 'fill-gold text-gold' : ''} />
      </button>
      <button onClick={onEdit} className="rounded-xl p-2 text-ink-muted hover:bg-sand/40">
        <Pencil size={14} />
      </button>
      <button onClick={onDelete} className="rounded-xl p-2 text-ink-muted hover:bg-sand/40">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export function ThoughtsPage() {
  const thoughts = useAppStore((s) => s.data.thoughts)
  const addThought = useAppStore((s) => s.addThought)
  const updateThought = useAppStore((s) => s.updateThought)
  const deleteThought = useAppStore((s) => s.deleteThought)
  const reorderThoughts = useAppStore((s) => s.reorderThoughts)
  const setPage = useAppStore((s) => s.setPage)

  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const list = [...thoughts]
    .sort((a, b) => a.order - b.order)
    .filter((t) => !favoritesOnly || t.favorite)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  const openNew = () => {
    setEditId(null)
    setText('')
    setModal(true)
  }

  const openEdit = (t: Thought) => {
    setEditId(t.id)
    setText(t.text)
    setModal(true)
  }

  const save = () => {
    if (!text.trim()) return
    if (editId) updateThought(editId, { text: text.trim() })
    else addThought(text.trim())
    setModal(false)
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const full = [...thoughts].sort((a, b) => a.order - b.order)
    const oldIndex = full.findIndex((t) => t.id === active.id)
    const newIndex = full.findIndex((t) => t.id === over.id)
    reorderThoughts(arrayMove(full, oldIndex, newIndex).map((t) => t.id))
  }

  return (
    <Page
      title="Коллекция мыслей"
      subtitle="Ваша библиотека. Мысль дня берётся отсюда без повторов, пока список не пройдёт весь цикл."
      back={() => setPage('home')}
      action={
        <Button variant="soft" onClick={openNew}>
          <Plus size={16} /> Мысль
        </Button>
      }
    >
      <div className="mb-4 flex gap-2">
        <Button variant={!favoritesOnly ? 'soft' : 'ghost'} onClick={() => setFavoritesOnly(false)}>
          Все · {thoughts.length}
        </Button>
        <Button variant={favoritesOnly ? 'soft' : 'ghost'} onClick={() => setFavoritesOnly(true)}>
          Избранные · {thoughts.filter((t) => t.favorite).length}
        </Button>
      </div>

      <Card className="overflow-hidden" hover={false}>
        {!list.length && (
          <div className="p-6">
            <Empty title="Пока пусто" text="Добавьте первую мысль" />
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={list.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {list.map((t) => (
              <SortableThought
                key={t.id}
                thought={t}
                onEdit={() => openEdit(t)}
                onDelete={() => deleteThought(t.id)}
                onToggleFavorite={() => updateThought(t.id, { favorite: !t.favorite })}
              />
            ))}
          </SortableContext>
        </DndContext>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Редактировать' : 'Новая мысль'}>
        <div className="space-y-4">
          <TextArea
            label="Текст"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Короткая мысль без кавычек..."
          />
          <Button className="w-full" onClick={save}>
            Сохранить
          </Button>
        </div>
      </Modal>
    </Page>
  )
}

export function ThoughtOfDayCard({ date }: { date?: string }) {
  const ensureThoughtOfDay = useAppStore((s) => s.ensureThoughtOfDay)
  const ensureSundayThought = useAppStore((s) => s.ensureSundayThought)
  const setPage = useAppStore((s) => s.setPage)
  const [text, setText] = useState('')
  const [sundayMode, setSundayMode] = useState(false)
  const day = date || todayKey()

  useEffect(() => {
    const sunday = isSunday(day)
    setSundayMode(sunday)
    const t = sunday ? ensureSundayThought(day) : ensureThoughtOfDay(day)
    setText(t?.text || '')
  }, [day, ensureThoughtOfDay, ensureSundayThought])

  if (!text) return null

  return (
    <Card className="relative overflow-hidden p-6 md:p-8" hover={false}>
      <div
        className={`absolute inset-0 -z-10 ${
          sundayMode
            ? 'bg-gradient-to-br from-[#A8B892]/25 via-transparent to-gold-light/10'
            : 'bg-gradient-to-br from-sky/25 via-transparent to-gold-light/15'
        }`}
      />
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">
        {sundayMode ? '🌾 Мысль недели' : '✨ Мысль дня'}
      </p>
      <p className="mt-4 font-display text-2xl leading-snug text-ink md:text-[1.7rem]">{text}</p>
      <button
        onClick={() => setPage(sundayMode ? 'sunday' : 'thoughts')}
        className="mt-6 text-sm text-ink-muted transition hover:text-ink"
      >
        {sundayMode ? 'Коллекция мыслей недели →' : 'Посмотреть всю коллекцию мыслей →'}
      </button>
    </Card>
  )
}
