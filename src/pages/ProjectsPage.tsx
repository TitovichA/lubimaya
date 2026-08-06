import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useAppStore } from '../lib/store'
import { goalPercent } from '../lib/analytics'
import { HABIT_COLORS } from '../lib/seed'
import { Page, Card, Button, Modal, Input, TextArea, Empty, LinearProgress } from '../components/ui'
import { AppIcon } from '../components/AppIcon'
import type { LifeSphere } from '../types'

const spheres: LifeSphere[] = ['здоровье', 'отношения', 'финансы', 'развитие', 'дом', 'бизнес', 'отдых']
const sphereColors = ['#B8C9A8', '#D4B5A0', '#C4A574', '#C5B8D4', '#D4C5A8', '#A8C5D4', '#A8B5C4']

export function ProjectsPage() {
  const data = useAppStore((s) => s.data)
  const addProject = useAppStore((s) => s.addProject)
  const setPage = useAppStore((s) => s.setPage)
  const [modal, setModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(HABIT_COLORS[0])
  const [sphere, setSphere] = useState<LifeSphere>('развитие')

  return (
    <Page
      title="Жизненные проекты"
      subtitle="Большие направления: здоровье, дом, бизнес, обучение."
      action={
        <Button variant="soft" onClick={() => setModal(true)}>
          <Plus size={16} /> Проект
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {data.projects.map((p) => {
          const goals = data.goals.filter((g) => g.projectId === p.id)
          const habits = data.habits.filter((h) => h.projectId === p.id)
          const tasks = data.tasks.filter((t) => t.projectId === p.id)
          const notes = data.notes.filter((n) => n.projectId === p.id)
          return (
            <Card key={p.id} className="p-5" onClick={() => setPage('project-detail', p.id)}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${p.color}33` }}>
                  <AppIcon name={p.icon} color={p.color} />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-ink">{p.title}</h3>
                  <p className="text-xs text-ink-muted">{p.sphere}</p>
                </div>
              </div>
              {p.description && <p className="mt-3 text-sm text-ink-muted">{p.description}</p>}
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-ink-muted">
                <span>{goals.length} целей</span>
                <span>{habits.length} привычек</span>
                <span>{tasks.length} задач</span>
                <span>{notes.length} заметок</span>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Новый проект">
        <div className="space-y-4">
          <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextArea label="Описание" value={description} onChange={(e) => setDescription(e.target.value)} />
          <label className="block text-xs text-ink-muted">
            Сфера
            <select
              className="mt-1.5 w-full rounded-2xl border border-sand/80 bg-cream-soft px-4 py-3 text-sm"
              value={sphere}
              onChange={(e) => setSphere(e.target.value as LifeSphere)}
            >
              {spheres.map((s) => (
                <option key={s}>{s}</option>
              ))}
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
          <Button
            className="w-full"
            onClick={() => {
              if (!title.trim()) return
              addProject({ title, description, color, icon: 'sparkles', sphere })
              setModal(false)
              setTitle('')
            }}
          >
            Создать
          </Button>
        </div>
      </Modal>
    </Page>
  )
}

export function ProjectDetailPage() {
  const id = useAppStore((s) => s.nav.selectedId)
  const data = useAppStore((s) => s.data)
  const setPage = useAppStore((s) => s.setPage)
  const deleteProject = useAppStore((s) => s.deleteProject)
  const project = data.projects.find((p) => p.id === id)

  if (!project) {
    return (
      <Page title="Проект" back={() => setPage('projects')}>
        <Empty title="Не найден" />
      </Page>
    )
  }

  const goals = data.goals.filter((g) => g.projectId === project.id || g.sphere === project.sphere)
  const habits = data.habits.filter((h) => h.projectId === project.id)
  const tasks = data.tasks.filter((t) => t.projectId === project.id)
  const notes = data.notes.filter((n) => n.projectId === project.id)

  return (
    <Page title={project.title} subtitle={project.description} back={() => setPage('projects')}>
      <div className="space-y-4">
        <Card className="p-5" hover={false}>
          <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-ink-muted">Цели</p>
          {goals.map((g) => (
            <button
              key={g.id}
              className="mb-3 block w-full text-left"
              onClick={() => setPage('goal-detail', g.id)}
            >
              <div className="mb-1 flex justify-between text-sm">
                <span>{g.title}</span>
                <span>{goalPercent(g)}%</span>
              </div>
              <LinearProgress value={goalPercent(g)} color={g.color} />
            </button>
          ))}
          {!goals.length && <p className="text-sm text-ink-muted">Пока нет связанных целей</p>}
        </Card>
        <Card className="p-5" hover={false}>
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-ink-muted">Привычки</p>
          {habits.length ? habits.map((h) => <p key={h.id} className="text-sm">{h.title}</p>) : <p className="text-sm text-ink-muted">Нет привычек</p>}
        </Card>
        <Card className="p-5" hover={false}>
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-ink-muted">Задачи</p>
          {tasks.length ? tasks.map((t) => <p key={t.id} className="text-sm">{t.title}</p>) : <p className="text-sm text-ink-muted">Нет задач</p>}
        </Card>
        <Card className="p-5" hover={false}>
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-ink-muted">Заметки и файлы</p>
          {notes.length ? notes.map((n) => <p key={n.id} className="text-sm">{n.title}</p>) : <p className="text-sm text-ink-muted">Нет заметок</p>}
        </Card>
        <Button
          variant="danger"
          onClick={() => {
            deleteProject(project.id)
            setPage('projects')
          }}
        >
          Удалить проект
        </Button>
      </div>
    </Page>
  )
}

export function LifePage() {
  const balance = useAppStore((s) => s.data.lifeBalance)
  const setLifeBalance = useAppStore((s) => s.setLifeBalance)
  const chart = spheres.map((s, i) => ({ name: s, value: balance[s], color: sphereColors[i] }))

  return (
    <Page title="Панель жизни" subtitle="Баланс сфер — здоровье, отношения, финансы и другие.">
      <Card className="mb-6 p-5" hover={false}>
        <div className="mx-auto h-72 max-w-md">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chart} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3}>
                {chart.map((e) => (
                  <Cell key={e.name} fill={e.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="space-y-4">
        {spheres.map((s, i) => (
          <Card key={s} className="p-4" hover={false}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="capitalize">{s}</span>
              <span style={{ color: sphereColors[i] }}>{balance[s]}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={balance[s]}
              onChange={(e) => setLifeBalance({ ...balance, [s]: Number(e.target.value) })}
              className="w-full accent-[#C4A574]"
            />
            <div className="mt-2">
              <LinearProgress value={balance[s]} color={sphereColors[i]} />
            </div>
          </Card>
        ))}
      </div>
    </Page>
  )
}
