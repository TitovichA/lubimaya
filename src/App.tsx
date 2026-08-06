import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Shell } from './components/Shell'
import { SplashScreen } from './components/SplashScreen'
import { useAppStore } from './lib/store'
import { HomePage } from './pages/HomePage'
import { RitualPage } from './pages/RitualPage'
import { HabitsPage, HabitDetailPage } from './pages/HabitsPage'
import { TasksPage } from './pages/TasksPage'
import { GoalsPage, GoalDetailPage } from './pages/GoalsPage'
import { StatsPage } from './pages/StatsPage'
import { CalendarPage } from './pages/CalendarPage'
import { DayPage } from './pages/DayPage'
import { ThoughtsPage } from './pages/ThoughtsPage'
import { AreaPage } from './pages/AreaPage'
import { NotesPage, NoteDetailPage } from './pages/NotesPage'
import { AiPage } from './pages/AiPage'
import { ProjectsPage, ProjectDetailPage, LifePage } from './pages/ProjectsPage'
import {
  MoreHubPage,
  SearchPage,
  TemplatesPage,
  ReviewsPage,
  RemindersPage,
  SettingsPage,
} from './pages/SettingsPage'
import { getSyncMeta } from './lib/sync'

const SPLASH_MIN_MS = 2200

export default function App() {
  const page = useAppStore((s) => s.nav.page)
  const init = useAppStore((s) => s.init)
  const syncNow = useAppStore((s) => s.syncNow)
  const hydrated = useAppStore((s) => s.hydrated)
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    const started = Date.now()
    let timer: number | undefined

    const finish = () => {
      const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - started))
      timer = window.setTimeout(() => setSplashDone(true), wait)
    }

    if (hydrated) finish()
    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [hydrated])

  useEffect(() => {
    if (!hydrated || !splashDone) return
    const meta = getSyncMeta()
    if (meta?.blobId) {
      syncNow()
      const id = window.setInterval(() => syncNow(), 60_000)
      return () => window.clearInterval(id)
    }
  }, [hydrated, splashDone, syncNow])

  const showSplash = !splashDone

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <motion.div key="splash" className="min-h-dvh" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <SplashScreen />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          className="min-h-dvh"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <Shell>
            {page === 'home' && <HomePage />}
            {page === 'more' && <MoreHubPage />}
            {page === 'morning' && <RitualPage type="morning" />}
            {page === 'evening' && <RitualPage type="evening" />}
            {page === 'habits' && <HabitsPage />}
            {page === 'habit-detail' && <HabitDetailPage />}
            {page === 'tasks' && <TasksPage />}
            {page === 'goals' && <GoalsPage />}
            {page === 'goal-detail' && <GoalDetailPage />}
            {page === 'stats' && <StatsPage />}
            {page === 'calendar' && <CalendarPage />}
            {page === 'day' && <DayPage />}
            {page === 'thoughts' && <ThoughtsPage />}
            {page === 'area-home' && <AreaPage areaId="home" />}
            {page === 'area-body' && <AreaPage areaId="body" />}
            {page === 'area-business' && <AreaPage areaId="business" />}
            {page === 'area-growth' && <AreaPage areaId="growth" />}
            {page === 'area-family' && <AreaPage areaId="family" />}
            {page === 'notes' && <NotesPage />}
            {page === 'note-detail' && <NoteDetailPage />}
            {page === 'ai' && <AiPage />}
            {page === 'projects' && <ProjectsPage />}
            {page === 'project-detail' && <ProjectDetailPage />}
            {page === 'life' && <LifePage />}
            {page === 'search' && <SearchPage />}
            {page === 'templates' && <TemplatesPage />}
            {page === 'reviews' && <ReviewsPage />}
            {page === 'reminders' && <RemindersPage />}
            {page === 'settings' && <SettingsPage />}
          </Shell>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
