import { useMemo, useState } from 'react'
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
import { GripVertical, Plus, Pencil, Trash2, Pause, Play } from 'lucide-react'
import { useAppStore } from '../lib/store'
import {
  SUNDAY_COLOR,
  isSunday,
  nextSundayWaitingLabel,
  sundayRitualProgress,
  computeSundayStats,
  enabledSundayRituals,
} from '../lib/sunday'
import { todayKey } from '../lib/seed'
import {
  Page,
  Card,
  Check,
  Button,
  Modal,
  Input,
  TextArea,
  LinearProgress,
  ProgressRing,
  SectionLabel,
} from '../components/ui'
import type { SundayRitual, Thought } from '../types'

function SortableSundayRitual({
  item,
  checked,
  activeDay,
  onToggle,
  onEdit,
  onDelete,
  onToggleEnabled,
}: {
  item: SundayRitual
  checked: boolean
  activeDay: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleEnabled: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : item.enabled === false ? 0.45 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-3 border-b border-sand/40 px-4 py-4 last:border-0"
    >
      <button className="mt-1 touch-none text-stone" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      {item.enabled !== false && activeDay ? (
        <Check checked={checked} onChange={onToggle} color={SUNDAY_COLOR} />
      ) : (
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px]"
          style={{ background: `${SUNDAY_COLOR}33` }}
        >
          {item.enabled === false ? '—' : '○'}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${
            checked && activeDay ? 'text-ink-muted line-through' : 'text-ink'
          }`}
        >
          {item.title}
        </p>
        {item.description && (
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{item.description}</p>
        )}
        {item.enabled === false && (
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-ink-muted">Отключено</p>
        )}
      </div>
      <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
        <button
          onClick={onToggleEnabled}
          className="rounded-xl p-2 text-ink-muted hover:bg-sand/40"
          title={item.enabled === false ? 'Включить' : 'Отключить'}
        >
          {item.enabled === false ? <Play size={14} /> : <Pause size={14} />}
        </button>
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

export function SundayPage() {
  const data = useAppStore((s) => s.data)
  const setPage = useAppStore((s) => s.setPage)
  const toggleSundayRitual = useAppStore((s) => s.toggleSundayRitual)
  const addSundayRitual = useAppStore((s) => s.addSundayRitual)
  const updateSundayRitual = useAppStore((s) => s.updateSundayRitual)
  const deleteSundayRitual = useAppStore((s) => s.deleteSundayRitual)
  const reorderSundayRituals = useAppStore((s) => s.reorderSundayRituals)
  const addSundayThought = useAppStore((s) => s.addSundayThought)
  const updateSundayThought = useAppStore((s) => s.updateSundayThought)
  const deleteSundayThought = useAppStore((s) => s.deleteSundayThought)
  const reorderSundayThoughts = useAppStore((s) => s.reorderSundayThoughts)

  const today = todayKey()
  const activeDay = isSunday(today)
  const allItems = useMemo(
    () => [...(data.sundayRitual || [])].sort((a, b) => a.order - b.order),
    [data.sundayRitual],
  )
  const enabled = enabledSundayRituals(data)
  const progress = sundayRitualProgress(data, today)
  const stats = computeSundayStats(data, today)
  const sundayThoughts = [...(data.sundayThoughts || [])].sort((a, b) => a.order - b.order)

  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thoughtModal, setThoughtModal] = useState(false)
  const [thoughtEditId, setThoughtEditId] = useState<string | null>(null)
  const [thoughtText, setThoughtText] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  const openNew = () => {
    setEditId(null)
    setTitle('')
    setDescription('')
    setModal(true)
  }

  const openEdit = (item: SundayRitual) => {
    setEditId(item.id)
    setTitle(item.title)
    setDescription(item.description || '')
    setModal(true)
  }

  const save = () => {
    if (!title.trim()) return
    if (editId) updateSundayRitual(editId, { title: title.trim(), description })
    else addSundayRitual({ title: title.trim(), description, enabled: true })
    setModal(false)
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = allItems.findIndex((i) => i.id === active.id)
    const newIndex = allItems.findIndex((i) => i.id === over.id)
    reorderSundayRituals(arrayMove(allItems, oldIndex, newIndex).map((i) => i.id))
  }

  const onThoughtDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sundayThoughts.findIndex((i) => i.id === active.id)
    const newIndex = sundayThoughts.findIndex((i) => i.id === over.id)
    reorderSundayThoughts(arrayMove(sundayThoughts, oldIndex, newIndex).map((i) => i.id))
  }

  const saveThought = () => {
    if (!thoughtText.trim()) return
    if (thoughtEditId) updateSundayThought(thoughtEditId, { text: thoughtText.trim() })
    else addSundayThought(thoughtText.trim())
    setThoughtModal(false)
  }

  return (
    <Page
      title="🌾 Воскресенье"
      subtitle={
        activeDay
          ? 'День восстановления. Отмечайте ритуалы мягко и без спешки.'
          : nextSundayWaitingLabel(today)
      }
      back={() => setPage('home')}
      action={
        <Button onClick={openNew} variant="soft">
          <Plus size={16} /> Добавить
        </Button>
      }
    >
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-white/60 shadow-[var(--shadow-card)]">
        <img
          src={`${import.meta.env.BASE_URL}illustrations/sunday-field.jpg`}
          alt=""
          className="aspect-[16/9] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2c3228]/55 via-transparent to-[#f5f1e8]/20" />
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-cream/90">День заботы о себе</p>
          <p className="mt-2 max-w-md font-display text-2xl leading-snug text-cream md:text-3xl">
            {activeDay ? 'Сегодня можно замедлиться' : 'Тишина ждёт своего воскресенья'}
          </p>
        </div>
      </div>

      <Card
        className={`mb-6 flex items-center gap-6 p-5 ${activeDay ? '' : 'opacity-80'}`}
        hover={false}
      >
        <ProgressRing
          value={activeDay ? progress.pct : 0}
          color={SUNDAY_COLOR}
          label={activeDay ? `${progress.done}/${progress.total}` : '—'}
          sublabel={activeDay ? `${progress.pct}%` : 'ожидание'}
        />
        <div className="flex-1">
          <p className="font-display text-2xl text-ink">Воскресные ритуалы</p>
          <p className="mt-1 text-sm text-ink-muted">
            {activeDay
              ? `${progress.done} из ${progress.total} выполнено`
              : `${enabled.length} активных · ${nextSundayWaitingLabel(today)}`}
          </p>
          <div className="mt-4">
            <LinearProgress value={activeDay ? progress.pct : 0} color={SUNDAY_COLOR} />
          </div>
        </div>
      </Card>

      <SectionLabel>Ритуалы</SectionLabel>
      <Card className="mb-8 overflow-hidden" hover={false}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={allItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {allItems.map((item) => (
              <SortableSundayRitual
                key={item.id}
                item={item}
                checked={progress.doneIds.includes(item.id)}
                activeDay={activeDay}
                onToggle={() => toggleSundayRitual(item.id)}
                onEdit={() => openEdit(item)}
                onDelete={() => deleteSundayRitual(item.id)}
                onToggleEnabled={() => updateSundayRitual(item.id, { enabled: item.enabled === false })}
              />
            ))}
          </SortableContext>
        </DndContext>
        {!allItems.length && (
          <p className="p-5 text-sm text-ink-muted">Добавьте первый воскресный ритуал</p>
        )}
      </Card>

      <SectionLabel>Статистика воскресенья</SectionLabel>
      <Card className="mb-8 grid grid-cols-1 gap-4 p-5 sm:grid-cols-3" hover={false}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">Ритуалов выполнено</p>
          <p className="mt-1 font-display text-2xl text-ink">
            {stats.ritualsDone} из {stats.ritualsTotal || '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">Серия воскресений</p>
          <p className="mt-1 font-display text-2xl text-ink">{stats.streakWeeks} нед.</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">За 100-дневку</p>
          <p className="mt-1 font-display text-2xl text-ink">{stats.challengePct}%</p>
          <p className="mt-1 text-xs text-ink-muted">
            {stats.challengeDone}/{stats.challengeTotal || 0} пунктов
          </p>
        </div>
      </Card>

      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionLabel>Мысли недели</SectionLabel>
        <Button
          variant="soft"
          onClick={() => {
            setThoughtEditId(null)
            setThoughtText('')
            setThoughtModal(true)
          }}
        >
          <Plus size={16} /> Мысль
        </Button>
      </div>
      <Card className="overflow-hidden" hover={false}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onThoughtDragEnd}>
          <SortableContext
            items={sundayThoughts.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {sundayThoughts.map((t) => (
              <SundayThoughtRow
                key={t.id}
                thought={t}
                onEdit={() => {
                  setThoughtEditId(t.id)
                  setThoughtText(t.text)
                  setThoughtModal(true)
                }}
                onDelete={() => deleteSundayThought(t.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
        {!sundayThoughts.length && (
          <p className="p-5 text-sm text-ink-muted">Добавьте мысли для воскресного размышления</p>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Редактировать' : 'Новый ритуал'}>
        <div className="space-y-4">
          <Input
            label="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Тишина до полудня"
          />
          <TextArea
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={save} className="w-full">
            Сохранить
          </Button>
        </div>
      </Modal>

      <Modal
        open={thoughtModal}
        onClose={() => setThoughtModal(false)}
        title={thoughtEditId ? 'Редактировать мысль' : 'Мысль недели'}
      >
        <div className="space-y-4">
          <TextArea
            label="Текст"
            value={thoughtText}
            onChange={(e) => setThoughtText(e.target.value)}
            rows={5}
            placeholder="Глубокая идея для воскресного размышления..."
          />
          <Button onClick={saveThought} className="w-full">
            Сохранить
          </Button>
        </div>
      </Modal>
    </Page>
  )
}

function SundayThoughtRow({
  thought,
  onEdit,
  onDelete,
}: {
  thought: Thought
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: thought.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 border-b border-sand/40 px-4 py-4 last:border-0"
    >
      <button className="mt-1 touch-none text-stone" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <p className="min-w-0 flex-1 font-display text-lg leading-snug text-ink-soft">{thought.text}</p>
      <button onClick={onEdit} className="rounded-xl p-2 text-ink-muted hover:bg-sand/40">
        <Pencil size={14} />
      </button>
      <button onClick={onDelete} className="rounded-xl p-2 text-ink-muted hover:bg-sand/40">
        <Trash2 size={14} />
      </button>
    </div>
  )
}
