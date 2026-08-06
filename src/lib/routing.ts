import type { PageId } from '../types'

export type NavSnapshot = {
  page: PageId
  selectedId?: string
  selectedDate?: string
}

const AREA_PAGES: PageId[] = [
  'area-home',
  'area-body',
  'area-business',
  'area-growth',
  'area-family',
]

const SIMPLE_PATHS: Partial<Record<PageId, string>> = {
  home: '/',
  more: '/more',
  morning: '/morning',
  evening: '/evening',
  sunday: '/sunday',
  tasks: '/tasks',
  stats: '/stats',
  calendar: '/calendar',
  day: '/day',
  life: '/life',
  ai: '/ai',
  templates: '/templates',
  reviews: '/reviews',
  search: '/search',
  settings: '/settings',
  thoughts: '/thoughts',
}

let syncingFromHistory = false

export function isSyncingFromHistory() {
  return syncingFromHistory
}

export function withHistorySync(fn: () => void) {
  syncingFromHistory = true
  try {
    fn()
  } finally {
    syncingFromHistory = false
  }
}

export function navToPath(nav: NavSnapshot): string {
  const { page, selectedDate } = nav
  const params = new URLSearchParams()

  if (AREA_PAGES.includes(page)) {
    return `/area/${page.replace('area-', '')}`
  }

  if (page === 'day' && selectedDate) {
    params.set('date', selectedDate)
    const q = params.toString()
    return q ? `/day?${q}` : '/day'
  }

  if (
    page === 'habits' ||
    page === 'habit-detail' ||
    page === 'notes' ||
    page === 'note-detail' ||
    page === 'projects' ||
    page === 'project-detail' ||
    page === 'reminders' ||
    page === 'goals' ||
    page === 'goal-detail'
  ) {
    return '/'
  }

  return SIMPLE_PATHS[page] || '/'
}

export function pathToNav(pathname: string, search = ''): NavSnapshot {
  const path = (pathname.replace(/\/+$/, '') || '/') as string
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)

  if (
    path === '/habits' ||
    path.startsWith('/habits/') ||
    path === '/notes' ||
    path.startsWith('/notes/') ||
    path === '/projects' ||
    path.startsWith('/projects/') ||
    path === '/reminders' ||
    path === '/goals' ||
    path.startsWith('/goals/')
  ) {
    return { page: 'home' }
  }

  const area = path.match(/^\/area\/(home|body|business|growth|family)$/)
  if (area) return { page: `area-${area[1]}` as PageId }

  if (path === '/day') {
    return { page: 'day', selectedDate: params.get('date') || undefined }
  }

  for (const [page, p] of Object.entries(SIMPLE_PATHS)) {
    if (p === path || (p === '/' && path === '/')) {
      return { page: page as PageId }
    }
  }

  return { page: 'home' }
}

export function pushAppHistory(nav: NavSnapshot) {
  if (typeof window === 'undefined' || syncingFromHistory) return
  const url = navToPath(nav)
  const current = `${window.location.pathname}${window.location.search}`
  const state: NavSnapshot = {
    page: nav.page,
    selectedId: nav.selectedId,
    selectedDate: nav.selectedDate,
  }
  if (current === url) {
    window.history.replaceState(state, '', url)
    return
  }
  window.history.pushState(state, '', url)
}

export function replaceAppHistory(nav: NavSnapshot) {
  if (typeof window === 'undefined') return
  const url = navToPath(nav)
  window.history.replaceState(
    {
      page: nav.page,
      selectedId: nav.selectedId,
      selectedDate: nav.selectedDate,
    },
    '',
    url,
  )
}
