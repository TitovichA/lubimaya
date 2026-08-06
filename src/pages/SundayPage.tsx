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
import { GripVertical, Plus, Pencil, Trash2 } from 'lucide-react'
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
import type { SundayRitual } from '../types'

function SortableSundayRitual({
  item,
  checked,
  activeDay,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: SundayRitual
  checked: boolean
  activeDay: boolean
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
    opacity: isDragging ? 0.75 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2.5 rounded-2xl px-3 py-3 sm:gap-3 sm:px-4 ${
        checked ? 'bg-cream/45' : 'bg-cream/70'
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
      <Check checked={checked} onChange={onToggle} color={SUNDAY_COLOR} />
      <div className={`min-w-0 flex-1 ${!activeDay ? 'opacity-70' : ''}`}>
        <p
          className={`break-words text-sm leading-relaxed whitespace-pre-wrap ${
            checked ? 'text-ink-muted line-through' : 'text-ink'
          }`}
        >
          {item.title}
        </p>
        {item.description && (
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{item.description}</p>
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

export function SundayPage() {
  const data = useAppStore((s) => s.data)
  const setPage = useAppStore((s) => s.setPage)
  const toggleSundayRitual = useAppStore((s) => s.toggleSundayRitual)
  const addSundayRitual = useAppStore((s) => s.addSundayRitual)
  const updateSundayRitual = useAppStore((s) => s.updateSundayRitual)
  const deleteSundayRitual = useAppStore((s) => s.deleteSundayRitual)
  const reorderSundayRituals = useAppStore((s) => s.reorderSundayRituals)

  const today = todayKey()
  const activeDay = isSunday(today)
  const progress = sundayRitualProgress(data, today)
  const stats = computeSundayStats(data, today)
  const enabled = enabledSundayRituals(data)

  const sortedItems = useMemo(() => {
    const done = new Set(progress.doneIds)
    return [...(data.sundayRitual || [])].sort((a, b) => {
      const aDone = done.has(a.id)
      const bDone = done.has(b.id)
      if (aDone !== bDone) return aDone ? 1 : -1
      return a.order - b.order
    })
  }, [data.sundayRitual, progress.doneIds])

  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

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
    const oldIndex = sortedItems.findIndex((i) => i.id === active.id)
    const newIndex = sortedItems.findIndex((i) => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    reorderSundayRituals(arrayMove(sortedItems, oldIndex, newIndex).map((i) => i.id))
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

      <Card className="mb-8 overflow-hidden p-3 sm:p-4" hover={false}>
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <h2 className="font-display text-2xl text-ink">Ритуалы</h2>
          <Button variant="soft" onClick={openNew}>
            <Plus size={16} />
          </Button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sortedItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sortedItems.map((item) => (
                <SortableSundayRitual
                  key={item.id}
                  item={item}
                  checked={progress.doneIds.includes(item.id)}
                  activeDay={activeDay}
                  onToggle={() => toggleSundayRitual(item.id)}
                  onEdit={() => openEdit(item)}
                  onDelete={() => deleteSundayRitual(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {!sortedItems.length && (
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
    </Page>
  )
}
