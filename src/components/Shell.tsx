import {
  Home,
  Sunrise,
  Moon,
  Leaf,
  CheckSquare,
  Target,
  BarChart3,
  CalendarDays,
  NotebookPen,
  Sparkles,
  LayoutGrid,
  Settings,
  Search,
  CircleDot,
  Bell,
} from 'lucide-react'
import type { PageId } from '../types'
import { useAppStore } from '../lib/store'

const nav: { id: PageId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'habits', label: 'Привычки', icon: Leaf },
  { id: 'tasks', label: 'Задачи', icon: CheckSquare },
  { id: 'goals', label: 'Цели', icon: Target },
  { id: 'stats', label: 'Статистика', icon: BarChart3 },
]

const more: { id: PageId; label: string; icon: typeof Home }[] = [
  { id: 'morning', label: 'Утро', icon: Sunrise },
  { id: 'evening', label: 'Вечер', icon: Moon },
  { id: 'calendar', label: 'Календарь', icon: CalendarDays },
  { id: 'thoughts', label: 'Мысли', icon: Sparkles },
  { id: 'notes', label: 'Заметки', icon: NotebookPen },
  { id: 'projects', label: 'Проекты', icon: LayoutGrid },
  { id: 'life', label: 'Жизнь', icon: CircleDot },
  { id: 'ai', label: 'ИИ', icon: Sparkles },
  { id: 'reminders', label: 'Напоминания', icon: Bell },
  { id: 'search', label: 'Поиск', icon: Search },
  { id: 'settings', label: 'Настройки', icon: Settings },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const page = useAppStore((s) => s.nav.page)
  const setPage = useAppStore((s) => s.setPage)

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-sky/40 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-gold-light/30 blur-3xl" />
        <div className="absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-sand/50 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(212,228,237,0.5), transparent 40%), radial-gradient(circle at 80% 0%, rgba(232,213,181,0.45), transparent 35%), linear-gradient(180deg, #FBF8F3 0%, #F7F3EC 50%, #F3EEE4 100%)',
          }}
        />
      </div>

      <div className="mx-auto flex min-h-dvh max-w-7xl">
        <aside className="safe-top sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sand/60 px-4 py-6 lg:flex">
          <div className="mb-10 px-3">
            <p className="font-display text-2xl tracking-tight text-ink">Моя 100-дневка</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">каждый день ближе к лучшей версии</p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {[...nav, ...more].map((item) => {
              const Icon = item.icon
              const active = page === item.id || (page.includes('detail') && item.id === page.replace('-detail', '') as PageId)
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                    active ? 'bg-white/80 text-ink shadow-soft' : 'text-ink-muted hover:bg-white/40 hover:text-ink'
                  }`}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="safe-top min-w-0 flex-1">{children}</main>
      </div>

      <nav className="safe-bottom glass fixed inset-x-0 bottom-0 z-40 border-t border-white/50 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 pt-2">
          {nav.map((item) => {
            const Icon = item.icon
            const active = page === item.id
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-[10px] ${
                  active ? 'text-ink' : 'text-ink-muted'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 1.75 : 1.4} />
                {item.label}
              </button>
            )
          })}
          <button
            onClick={() => setPage('more')}
            className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-[10px] ${
              page === 'more' || !nav.some((n) => n.id === page) ? 'text-ink' : 'text-ink-muted'
            }`}
          >
            <Sparkles size={20} strokeWidth={1.4} />
            Ещё
          </button>
        </div>
      </nav>
    </div>
  )
}
