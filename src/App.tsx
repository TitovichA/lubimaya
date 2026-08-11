import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Shell } from './components/Shell'
import { SplashScreen } from './components/SplashScreen'
import { useAppStore } from './lib/store'
import { HomePage } from './pages/HomePage'
import { RitualPage } from './pages/RitualPage'
import { SundayPage } from './pages/SundayPage'
import { TasksPage } from './pages/TasksPage'
import { StatsPage } from './pages/StatsPage'
import { CalendarPage } from './pages/CalendarPage'
import { DayPage } from './pages/DayPage'
import { ThoughtsPage } from './pages/ThoughtsPage'
import { AreaPage } from './pages/AreaPage'
import { AiPage } from './pages/AiPage'
import { LifePage } from './pages/LifePage'
import { LoginPage } from './pages/LoginPage'
import {
  MoreHubPage,
  SearchPage,
  TemplatesPage,
  ReviewsPage,
  SettingsPage,
} from './pages/SettingsPage'
import { getSyncMeta } from './lib/sync'
import { pathToNav, replaceAppHistory, withHistorySync } from './lib/routing'
import { fetchAuthStatus } from './lib/auth'

const SPLASH_MIN_MS = 2200

export default function App() {
  const page = useAppStore((s) => s.nav.page)
  const init = useAppStore((s) => s.init)
  const syncNow = useAppStore((s) => s.syncNow)
  const hydrated = useAppStore((s) => s.hydrated)
  const setPage = useAppStore((s) => s.setPage)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const [splashDone, setSplashDone] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const status = await fetchAuthStatus()
        if (!cancelled) setAuthenticated(!!status.authenticated)
      } catch {
        if (!cancelled) setAuthenticated(false)
      } finally {
        if (!cancelled) setAuthChecked(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!authenticated) return
    init()
  }, [authenticated, init])

  // Синхронизация URL ↔ навигация (кнопка «Назад» в браузере)
  useEffect(() => {
    if (!hydrated || !authenticated) return

    const applyFromUrl = () => {
      const snap = pathToNav(window.location.pathname, window.location.search)
      withHistorySync(() => {
        if (snap.selectedDate) setSelectedDate(snap.selectedDate)
        setPage(snap.page, snap.selectedId)
      })
      replaceAppHistory({
        page: snap.page,
        selectedId: snap.selectedId,
        selectedDate: snap.selectedDate || useAppStore.getState().nav.selectedDate,
      })
    }

    const fromUrl = pathToNav(window.location.pathname, window.location.search)
    if (fromUrl.page !== 'home' || fromUrl.selectedId || window.location.pathname !== '/') {
      applyFromUrl()
    } else {
      const nav = useAppStore.getState().nav
      replaceAppHistory({
        page: nav.page,
        selectedId: nav.selectedId,
        selectedDate: nav.selectedDate,
      })
    }

    const onPopState = (event: PopStateEvent) => {
      const state = event.state as { page?: string; selectedId?: string; selectedDate?: string } | null
      const snap = state?.page
        ? {
            page: state.page as typeof fromUrl.page,
            selectedId: state.selectedId,
            selectedDate: state.selectedDate,
          }
        : pathToNav(window.location.pathname, window.location.search)

      withHistorySync(() => {
        if (snap.selectedDate) setSelectedDate(snap.selectedDate)
        setPage(snap.page, snap.selectedId)
      })
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [hydrated, authenticated, setPage, setSelectedDate])

  useEffect(() => {
    if (!authenticated) return
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
  }, [hydrated, authenticated])

  useEffect(() => {
    if (!hydrated || !splashDone || !authenticated) return
    const meta = getSyncMeta()
    if (meta?.blobId) {
      syncNow()
      const id = window.setInterval(() => syncNow(), 60_000)
      return () => window.clearInterval(id)
    }
  }, [hydrated, splashDone, authenticated, syncNow])

  if (!authChecked) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream text-ink-muted">
        <p className="text-sm">Проверка входа…</p>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <LoginPage
        onSuccess={() => {
          setAuthenticated(true)
          setSplashDone(false)
        }}
      />
    )
  }

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
            {page === 'sunday' && <SundayPage />}
            {page === 'tasks' && <TasksPage />}
            {page === 'stats' && <StatsPage />}
            {page === 'calendar' && <CalendarPage />}
            {page === 'day' && <DayPage />}
            {page === 'thoughts' && <ThoughtsPage />}
            {page === 'area-home' && <AreaPage areaId="home" />}
            {page === 'area-body' && <AreaPage areaId="body" />}
            {page === 'area-business' && <AreaPage areaId="business" />}
            {page === 'area-growth' && <AreaPage areaId="growth" />}
            {page === 'area-family' && <AreaPage areaId="family" />}
            {page === 'ai' && <AiPage />}
            {page === 'life' && <LifePage />}
            {page === 'search' && <SearchPage />}
            {page === 'templates' && <TemplatesPage />}
            {page === 'reviews' && <ReviewsPage />}
            {page === 'settings' && (
              <SettingsPage
                onLogout={() => {
                  setAuthenticated(false)
                  setSplashDone(false)
                }}
              />
            )}
          </Shell>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
