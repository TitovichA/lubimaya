import { useState, useRef } from 'react'
import {
  Sunrise,
  Moon,
  CalendarDays,
  CircleDot,
  Sparkles,
  Settings,
  Search as SearchIcon,
  FileText,
  Layers,
  Building2,
  Flower2,
  Briefcase,
  BookOpen,
  Heart,
} from 'lucide-react'
import { useAppStore } from '../lib/store'
import { searchAll, generateInsights, periodAverage, bestHabitStreaks, dayProgress } from '../lib/analytics'
import { areaMeta } from '../lib/areas'
import { exportJson, importJsonFile } from '../lib/sync'
import { themeScheduleLabel } from '../lib/theme'
import { logoutRequest } from '../lib/auth'
import type { HomeWidget, PageId } from '../types'
import { Page, Card, Button, Input, Empty, SectionLabel } from '../components/ui'

const sphereLinks: { id: PageId; label: string; icon: typeof Sunrise; desc: string }[] = [
  { id: 'area-home', label: 'Мой дом', icon: Building2, desc: 'Правила, привычки, 100-дневка' },
  { id: 'area-body', label: 'Моё тело', icon: Flower2, desc: 'Здоровье и цикл' },
  { id: 'area-business', label: 'Мой бизнес', icon: Briefcase, desc: 'События и команда' },
  { id: 'area-growth', label: 'Саморазвитие', icon: BookOpen, desc: 'Рост и обучение' },
  { id: 'area-family', label: 'Моя семья', icon: Heart, desc: 'Близость и ритуалы' },
]

const moreLinks: { id: PageId; label: string; icon: typeof Sunrise; desc: string }[] = [
  { id: 'morning', label: 'Утренний ритуал', icon: Sunrise, desc: 'Начало дня' },
  { id: 'evening', label: 'Вечерний ритуал', icon: Moon, desc: 'Завершение дня' },
  { id: 'sunday', label: 'Воскресенье', icon: Flower2, desc: 'День восстановления' },
  { id: 'calendar', label: 'Календарь', icon: CalendarDays, desc: 'Любой день' },
  { id: 'thoughts', label: 'Мысли', icon: Sparkles, desc: 'Коллекция мыслей дня' },
  { id: 'life', label: 'Панель развития', icon: CircleDot, desc: 'Индекс по сферам' },
  { id: 'ai', label: 'ИИ-помощник', icon: Sparkles, desc: 'Анализ и планы' },
  { id: 'templates', label: 'Шаблоны дней', icon: Layers, desc: 'Рабочий, выходной...' },
  { id: 'reviews', label: 'Обзоры', icon: FileText, desc: 'Неделя и месяц' },
  { id: 'search', label: 'Поиск', icon: SearchIcon, desc: 'По всему приложению' },
  { id: 'settings', label: 'Настройки', icon: Settings, desc: 'Синхронизация и вид' },
]

export function MoreHubPage() {
  const setPage = useAppStore((s) => s.setPage)
  return (
    <Page title="Ещё" subtitle="Все разделы системы жизни.">
      <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-ink-muted">Сферы жизни</p>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {sphereLinks.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.id} className="flex items-center gap-4 p-4" onClick={() => setPage(item.id)}>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sand/50">
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{item.label}</p>
                <p className="text-xs text-ink-muted">{item.desc}</p>
              </div>
            </Card>
          )
        })}
      </div>
      <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-ink-muted">Разделы</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {moreLinks.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.id} className="flex items-center gap-4 p-4" onClick={() => setPage(item.id)}>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sand/50">
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{item.label}</p>
                <p className="text-xs text-ink-muted">{item.desc}</p>
              </div>
            </Card>
          )
        })}
      </div>
    </Page>
  )
}

export function SearchPage() {
  const data = useAppStore((s) => s.data)
  const setPage = useAppStore((s) => s.setPage)
  const [q, setQ] = useState('')
  const results = searchAll(data, q)

  const go = (type: string, id: string) => {
    if (type === 'goal') {
      const goal = data.goals.find((g) => g.id === id)
      if (goal?.areaId) setPage(areaMeta(goal.areaId).pageId)
      else setPage('home')
    }
    else if (type === 'task' || type === 'area-plan') setPage('tasks')
    else if (type === 'morning') setPage('morning')
    else if (type === 'evening') setPage('evening')
    else if (type === 'area-habit') {
      const habit = data.areaHabits?.find((h) => h.id === id)
      if (habit) setPage(areaMeta(habit.areaId).pageId)
    }
  }

  return (
    <Page title="Поиск" subtitle="Мгновенный поиск целей, заметок и задач.">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Начните вводить..."
        autoFocus
      />
      <div className="mt-4 space-y-2">
        {results.map((r) => (
          <Card key={`${r.type}-${r.id}`} className="px-4 py-3" onClick={() => go(r.type, r.id)}>
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">{r.type}</p>
            <p className="text-sm text-ink">{r.title}</p>
            {r.subtitle && <p className="text-xs text-ink-muted">{r.subtitle}</p>}
          </Card>
        ))}
        {q && !results.length && <Empty title="Ничего не найдено" />}
      </div>
    </Page>
  )
}

export function TemplatesPage() {
  const data = useAppStore((s) => s.data)
  const applyTemplate = useAppStore((s) => s.applyTemplate)
  const addTemplate = useAppStore((s) => s.addTemplate)

  return (
    <Page
      title="Шаблоны дней"
      subtitle="Рабочий, выходной, путешествие, болезнь — разные ритмы."
      action={
        <Button
          variant="soft"
          onClick={() =>
            addTemplate({
              name: 'Новый шаблон',
              morningRitualIds: [],
              eveningRitualIds: [],
              habitIds: [],
              color: '#C4A574',
            })
          }
        >
          + Шаблон
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {data.dayTemplates.map((t) => {
          const applied = data.dayLogs.find((l) => l.templateId === t.id)
          return (
            <Card key={t.id} className="p-5" hover={false}>
              <div className="mb-3 h-2 w-12 rounded-full" style={{ background: t.color }} />
              <h3 className="font-display text-2xl text-ink">{t.name}</h3>
              <p className="mt-1 text-xs text-ink-muted">{t.habitIds.length} привычек в фокусе</p>
              <Button className="mt-4" variant="soft" onClick={() => applyTemplate(t.id)}>
                Применить сегодня
              </Button>
              {applied && <p className="mt-2 text-xs text-gold-deep">Использовался {applied.date}</p>}
            </Card>
          )
        })}
      </div>
    </Page>
  )
}

export function ReviewsPage() {
  const data = useAppStore((s) => s.data)
  const week = periodAverage(data, 7)
  const month = periodAverage(data, 30)
  const today = dayProgress(data)
  const streaks = bestHabitStreaks(data).slice(0, 3)
  const insights = generateInsights(data)

  return (
    <Page title="Обзоры" subtitle="Автоматические отчёты за неделю и месяц.">
      <SectionLabel>Еженедельный обзор</SectionLabel>
      <Card className="mb-6 space-y-3 p-5" hover={false}>
        <p className="font-display text-3xl text-ink">{week}%</p>
        <p className="text-sm text-ink-muted">средний прогресс за 7 дней (сегодня {today}%)</p>
        <div className="pt-2">
          <p className="text-xs uppercase tracking-wider text-ink-muted">Лучшие привычки</p>
          {streaks.map(({ habit, streak }) => (
            <p key={habit.id} className="mt-1 text-sm">
              {habit.title} — серия {streak}
            </p>
          ))}
        </div>
      </Card>

      <SectionLabel>Ежемесячный обзор</SectionLabel>
      <Card className="mb-6 space-y-3 p-5" hover={false}>
        <p className="font-display text-3xl text-ink">{month}%</p>
        <p className="text-sm text-ink-muted">средний прогресс за 30 дней</p>
        <p className="text-sm text-ink-soft">
          Завершено задач: {data.tasks.filter((t) => t.done).length}. Целей в работе: {data.goals.length}.
        </p>
      </Card>

      <SectionLabel>Рекомендации ИИ</SectionLabel>
      <Card className="space-y-3 p-5" hover={false}>
        {insights.map((i) => (
          <p key={i} className="text-sm leading-relaxed text-ink-soft">
            {i}
          </p>
        ))}
      </Card>
    </Page>
  )
}

const allWidgets: { id: HomeWidget; label: string }[] = [
  { id: 'greeting', label: 'Приветствие' },
  { id: 'thought', label: 'Мысль дня' },
  { id: 'progress', label: 'Прогресс дня' },
  { id: 'areas', label: 'Панель развития жизни' },
  { id: 'todayDue', label: 'Напоминания' },
  { id: 'morning', label: 'Утро' },
  { id: 'evening', label: 'Вечер' },
  { id: 'sunday', label: 'Воскресенье' },
  { id: 'tasks', label: 'План 100-дневки' },
  { id: 'stats', label: 'Статистика' },
  { id: 'life', label: 'Колесо баланса' },
  { id: 'ai', label: 'ИИ' },
]

export function SettingsPage({ onLogout }: { onLogout?: () => void }) {
  const data = useAppStore((s) => s.data)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const enableSync = useAppStore((s) => s.enableSync)
  const joinSync = useAppStore((s) => s.joinSync)
  const syncNow = useAppStore((s) => s.syncNow)
  const syncing = useAppStore((s) => s.syncing)
  const syncError = useAppStore((s) => s.syncError)
  const replaceData = useAppStore((s) => s.replaceData)
  const [joinToken, setJoinToken] = useState('')
  const [syncToken, setSyncToken] = useState('')
  const [msg, setMsg] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const hidden = data.settings.hiddenWidgets
  const widgets = data.settings.homeWidgets

  const toggleWidget = (id: HomeWidget) => {
    if (hidden.includes(id)) {
      updateSettings({ hiddenWidgets: hidden.filter((w) => w !== id) })
    } else {
      updateSettings({ hiddenWidgets: [...hidden, id] })
    }
  }

  const moveWidget = (id: HomeWidget, dir: -1 | 1) => {
    const idx = widgets.indexOf(id)
    if (idx < 0) return
    const next = [...widgets]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    updateSettings({ homeWidgets: next })
  }

  return (
    <Page title="Настройки" subtitle="Имя, главный экран и синхронизация между устройствами.">
      <Card className="mb-4 space-y-4 p-5" hover={false}>
        <Input
          label="Ваше имя / обращение"
          value={data.settings.name}
          onChange={(e) => updateSettings({ name: e.target.value })}
        />
      </Card>

      <SectionLabel>Тема оформления</SectionLabel>
      <Card className="mb-6 space-y-4 p-5" hover={false}>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!data.settings.themeScheduleEnabled && data.settings.themeMode !== 'dark' ? 'soft' : 'ghost'}
            onClick={() =>
              updateSettings({ themeMode: 'light', themeScheduleEnabled: false })
            }
          >
            Светлая
          </Button>
          <Button
            variant={!data.settings.themeScheduleEnabled && data.settings.themeMode === 'dark' ? 'soft' : 'ghost'}
            onClick={() =>
              updateSettings({ themeMode: 'dark', themeScheduleEnabled: false })
            }
          >
            Тёмная
          </Button>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!data.settings.themeScheduleEnabled}
            onChange={(e) => updateSettings({ themeScheduleEnabled: e.target.checked })}
          />
          <span>
            <span className="font-medium">Переключать тему по времени</span>
            <span className="mt-1 block text-xs leading-relaxed text-ink-muted">
              Светлая и тёмная тема будут меняться автоматически по вашему расписанию.
            </span>
          </span>
        </label>

        {data.settings.themeScheduleEnabled && (
          <div className="space-y-3 rounded-2xl border border-sand/60 bg-cream/50 p-4">
            <Input
              label="Светлая тема с"
              type="time"
              value={data.settings.themeLightFrom || '07:00'}
              onChange={(e) => updateSettings({ themeLightFrom: e.target.value })}
            />
            <Input
              label="Тёмная тема с"
              type="time"
              value={data.settings.themeDarkFrom || '21:00'}
              onChange={(e) => updateSettings({ themeDarkFrom: e.target.value })}
            />
            <p className="text-xs leading-relaxed text-ink-muted">
              {themeScheduleLabel(data.settings)}
            </p>
          </div>
        )}
      </Card>

      <SectionLabel>Синхронизация</SectionLabel>
      <Card className="mb-6 space-y-4 p-5" hover={false}>
        <p className="text-sm leading-relaxed text-ink-muted">
          Создайте облачную синхронизацию на одном устройстве, скопируйте код и вставьте его на iPhone, iPad, Mac или Windows.
          Данные подтянутся автоматически.
        </p>
        {data.settings.syncCode && data.settings.syncUrl && (
          <div className="rounded-2xl bg-cream p-4 text-sm">
            <p className="text-xs text-ink-muted">Ваш код синхронизации</p>
            <p className="mt-1 break-all font-mono text-ink">
              {data.settings.syncCode}|{data.settings.syncUrl}
            </p>
            {data.settings.lastSyncAt && (
              <p className="mt-2 text-xs text-ink-muted">Последняя синхронизация: {data.settings.lastSyncAt}</p>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={syncing}
            onClick={async () => {
              try {
                const token = await enableSync()
                setSyncToken(token)
                setMsg('Синхронизация создана. Скопируйте код на другие устройства.')
              } catch {
                setMsg('Не удалось создать синхронизацию. Проверьте интернет.')
              }
            }}
          >
            {syncing ? '...' : 'Создать / обновить облако'}
          </Button>
          <Button variant="soft" disabled={syncing} onClick={() => syncNow()}>
            Синхронизировать сейчас
          </Button>
          {(syncToken || (data.settings.syncCode && data.settings.syncUrl)) && (
            <Button
              variant="ghost"
              onClick={() => {
                const t = syncToken || `${data.settings.syncCode}|${data.settings.syncUrl}`
                navigator.clipboard.writeText(t)
                setMsg('Код скопирован')
              }}
            >
              Копировать код
            </Button>
          )}
        </div>
        <Input
          label="Подключить другое устройство — вставьте код"
          value={joinToken}
          onChange={(e) => setJoinToken(e.target.value)}
          placeholder="XXXX-XXXX|blobId"
        />
        <Button
          variant="soft"
          disabled={syncing || !joinToken.trim()}
          onClick={async () => {
            try {
              await joinSync(joinToken.trim())
              setMsg('Устройство подключено. Данные синхронизированы.')
            } catch {
              setMsg('Не удалось подключиться. Проверьте код.')
            }
          }}
        >
          Подключить
        </Button>
        {(msg || syncError) && <p className="text-sm text-ink-soft">{msg || syncError}</p>}
        <div className="flex flex-wrap gap-2 border-t border-sand/50 pt-4">
          <Button variant="ghost" onClick={() => exportJson(data)}>
            Экспорт JSON
          </Button>
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            Импорт JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const imported = await importJsonFile(f)
              replaceData(imported)
              setMsg('Данные импортированы')
            }}
          />
        </div>
      </Card>

      <SectionLabel>Главный экран</SectionLabel>
      <Card className="mb-6 divide-y divide-sand/50 overflow-hidden" hover={false}>
        {widgets.map((id) => {
          const label = allWidgets.find((w) => w.id === id)?.label || id
          const isHidden = hidden.includes(id)
          return (
            <div key={id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1">
                <p className={`text-sm ${isHidden ? 'text-ink-muted' : 'text-ink'}`}>{label}</p>
              </div>
              <Button variant="ghost" onClick={() => moveWidget(id, -1)}>
                ↑
              </Button>
              <Button variant="ghost" onClick={() => moveWidget(id, 1)}>
                ↓
              </Button>
              <Button variant="soft" onClick={() => toggleWidget(id)}>
                {isHidden ? 'Показать' : 'Скрыть'}
              </Button>
            </div>
          )
        })}
      </Card>

      <SectionLabel>Установка как приложение</SectionLabel>
      <Card className="mb-6 p-5 text-sm leading-relaxed text-ink-muted" hover={false}>
        <p>
          На iPhone: Safari → Поделиться → «На экран Домой».
        </p>
        <p className="mt-2">На Mac/Windows: в браузере выберите «Установить приложение» / Install.</p>
        <p className="mt-2">
          Виджеты iPhone: после установки PWA на экран Домой используйте ярлык «Моя 100-дневка».
        </p>
      </Card>

      <SectionLabel>Безопасность</SectionLabel>
      <Card className="p-5" hover={false}>
        <p className="mb-4 text-sm text-ink-muted">
          Выйти из аккаунта на этом устройстве. Пароль хранится только в `.env` на сервере.
        </p>
        <Button
          variant="danger"
          disabled={loggingOut}
          onClick={async () => {
            setLoggingOut(true)
            try {
              await logoutRequest()
            } finally {
              onLogout?.()
              setLoggingOut(false)
            }
          }}
        >
          {loggingOut ? 'Выход…' : 'Выйти'}
        </Button>
      </Card>
    </Page>
  )
}
