import { useRef, useState } from 'react'
import { Plus, Pin, Paperclip } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAppStore } from '../lib/store'
import { Page, Card, Button, Empty, Input, TextArea } from '../components/ui'

export function NotesPage() {
  const notes = useAppStore((s) => s.data.notes)
  const addNote = useAppStore((s) => s.addNote)
  const setPage = useAppStore((s) => s.setPage)

  const sorted = [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt))

  return (
    <Page
      title="Заметки"
      subtitle="Мысли, идеи, списки, планы и вложения."
      action={
        <Button
          variant="soft"
          onClick={() => {
            const id = addNote()
            setPage('note-detail', id)
          }}
        >
          <Plus size={16} /> Заметка
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((n) => (
          <Card key={n.id} className="p-5" onClick={() => setPage('note-detail', n.id)}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-xl text-ink">{n.title}</h3>
              {n.pinned && <Pin size={14} className="text-gold-deep" />}
            </div>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">{n.content || 'Пусто'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {n.tags.map((t) => (
                <span key={t} className="rounded-full bg-sand/50 px-2 py-0.5 text-[10px] text-ink-muted">
                  {t}
                </span>
              ))}
              {n.attachments.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-ink-muted">
                  <Paperclip size={10} /> {n.attachments.length}
                </span>
              )}
            </div>
            <p className="mt-3 text-[10px] text-ink-muted">
              {format(parseISO(n.updatedAt), 'd MMM yyyy, HH:mm', { locale: ru })}
            </p>
          </Card>
        ))}
      </div>
      {!sorted.length && <Empty title="Пока нет заметок" />}
    </Page>
  )
}

export function NoteDetailPage() {
  const id = useAppStore((s) => s.nav.selectedId)
  const note = useAppStore((s) => s.data.notes.find((n) => n.id === id))
  const updateNote = useAppStore((s) => s.updateNote)
  const deleteNote = useAppStore((s) => s.deleteNote)
  const setPage = useAppStore((s) => s.setPage)
  const fileRef = useRef<HTMLInputElement>(null)
  const [tag, setTag] = useState('')

  if (!note) {
    return (
      <Page title="Заметка" back={() => setPage('notes')}>
        <Empty title="Не найдена" />
      </Page>
    )
  }

  const onFile = async (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      updateNote(note.id, {
        attachments: [
          ...note.attachments,
          {
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            dataUrl: String(reader.result),
            size: file.size,
          },
        ],
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <Page
      title="Заметка"
      back={() => setPage('notes')}
      action={
        <Button variant="ghost" onClick={() => updateNote(note.id, { pinned: !note.pinned })}>
          <Pin size={16} /> {note.pinned ? 'Открепить' : 'Закрепить'}
        </Button>
      }
    >
      <Card className="space-y-4 p-5" hover={false}>
        <Input value={note.title} onChange={(e) => updateNote(note.id, { title: e.target.value })} />
        <TextArea
          value={note.content}
          onChange={(e) => updateNote(note.id, { content: e.target.value })}
          rows={12}
          placeholder="Пишите свободно..."
        />
        <div className="flex flex-wrap gap-2">
          {note.tags.map((t) => (
            <button
              key={t}
              onClick={() => updateNote(note.id, { tags: note.tags.filter((x) => x !== t) })}
              className="rounded-full bg-sand/60 px-3 py-1 text-xs"
            >
              {t} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Тег"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tag.trim()) {
                updateNote(note.id, { tags: [...new Set([...note.tags, tag.trim()])] })
                setTag('')
              }
            }}
          />
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.txt,.md"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <Button variant="soft" onClick={() => fileRef.current?.click()}>
            <Paperclip size={16} /> Фото / файл
          </Button>
        </div>
        {note.attachments.length > 0 && (
          <div className="space-y-3">
            {note.attachments.map((a) => (
              <div key={a.id} className="rounded-2xl bg-cream p-3">
                <p className="text-xs text-ink-muted">
                  {a.name} · {Math.round(a.size / 1024)} КБ
                </p>
                {a.type.startsWith('image/') && (
                  <img src={a.dataUrl} alt={a.name} className="mt-2 max-h-48 rounded-xl object-cover" />
                )}
              </div>
            ))}
          </div>
        )}
        <Button
          variant="danger"
          onClick={() => {
            deleteNote(note.id)
            setPage('notes')
          }}
        >
          Удалить
        </Button>
      </Card>
    </Page>
  )
}
