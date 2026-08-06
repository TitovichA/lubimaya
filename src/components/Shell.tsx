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
  Building2,
  Heart,
  Briefcase,
  BookOpen,
  Flower2,
} from 'lucide-react'
import type { PageId } from '../types'
import { useAppStore } from '../lib/store'

const nav: { id: PageId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'area-home', label: 'Мой дом', icon: Building2 },
  { id: 'area-body', label: 'Моё тело', icon: Flower2 },
  { id: 'area-business', label: 'Мой бизнес', icon: Briefcase },
  { id: 'area-growth', label: 'Саморазвитие', icon: BookOpen },
  { id: 'area-family', label: 'Моя семья', icon: Heart },
]

const more: { id: PageId; label: string; icon: typeof Home }[] = [
  { id: 'tasks', label: 'Задачи', icon: CheckSquare },
  { id: 'habits', label: 'Привычки', icon: Leaf },
  { id: 'goals', label: 'Цели', icon: Target },
  { id: 'morning', label: 'Утро', icon: Sunrise },
  { id: 'evening', label: 'Вечер', icon: Moon },
  { id: 'calendar', label: 'Календарь', icon: CalendarDays },
  { id: 'stats', label: 'Статистика', icon: BarChart3 },
  { id: 'thoughts', label: 'Мысли', icon: Sparkles },
  { id: 'notes', label: 'Заметки', icon: NotebookPen },
  { id: 'projects', label: 'Проекты', icon: LayoutGrid },
  { id: 'life', label: 'Баланс', icon: CircleDot },
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
          <div className="mb-8 px-3">
            <p className="font-display text-2xl tracking-tight text-ink">Моя 100-дневка</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">каждый день ближе к лучшей версии</p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pb-6">
            <p className="mb-1 px-3 text-[10px] uppercase tracking-[0.16em] text-ink-muted">Сферы</p>
            {nav.map((item) => {
              const Icon = item.icon
              const active = page === item.id
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
            <p className="mb-1 mt-4 px-3 text-[10px] uppercase tracking-[0.16em] text-ink-muted">Ещё</p>
            {more.map((item) => {
              const Icon = item.icon
              const active = page === item.id
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
        <div className="mx-auto flex max-w-lg items-center justify-around px-1 pt-2">
          {[
            nav[0],
            nav[1],
            nav[2],
            { id: 'tasks' as PageId, label: 'Задачи', icon: CheckSquare },
            { id: 'more' as PageId, label: 'Ещё', icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon
            const active = page === item.id || (item.id === 'more' && !nav.slice(0, 3).some((n) => n.id === page) && page !== 'tasks' && !String(page).startsWith('area-'))
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[10px] ${
                  active ? 'text-ink' : 'text-ink-muted'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 1.75 : 1.4} />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
