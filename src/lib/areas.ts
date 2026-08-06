import { format, getDate, getDay, getMonth, parseISO, differenceInCalendarDays } from 'date-fns'
import type {
  AppData,
  LifeAreaId,
  PeriodicHabit,
  PeriodicRule,
  CycleSettings,
} from '../types'
import { todayKey } from './seed'

export const LIFE_AREAS: {
  id: LifeAreaId
  pageId: `area-${LifeAreaId}`
  label: string
  emoji: string
  title: string
  subtitle: string
  color: string
}[] = [
  {
    id: 'home',
    pageId: 'area-home',
    label: 'Мой дом',
    emoji: '🏡',
    title: 'Мой дом',
    subtitle: 'Пространство, порядок и уют',
    color: '#D4C5A8',
  },
  {
    id: 'body',
    pageId: 'area-body',
    label: 'Моё тело',
    emoji: '🌿',
    title: 'Моё тело',
    subtitle: 'Здоровье, мягкость и сила',
    color: '#B8C9A8',
  },
  {
    id: 'business',
    pageId: 'area-business',
    label: 'Мой бизнес',
    emoji: '💼',
    title: 'Мой бизнес',
    subtitle: 'Рост, команда и устойчивые системы',
    color: '#C4A574',
  },
  {
    id: 'growth',
    pageId: 'area-growth',
    label: 'Саморазвитие',
    emoji: '📚',
    title: 'Саморазвитие',
    subtitle: 'Знания, мышление и мастерство',
    color: '#C5B8D4',
  },
  {
    id: 'family',
    pageId: 'area-family',
    label: 'Моя семья',
    emoji: '❤️',
    title: 'Моя семья',
    subtitle: 'Близость, забота и тёплые ритуалы',
    color: '#D4B5A0',
  },
]

export function areaMeta(id: LifeAreaId) {
  return LIFE_AREAS.find((a) => a.id === id)!
}

export function isPeriodicDue(rule: PeriodicRule, date = new Date()): boolean {
  const d = date
  const day = getDate(d)
  const weekday = getDay(d) // 0 Sun
  const month = getMonth(d) + 1

  switch (rule.type) {
    case 'daily':
      return true
    case 'weekly':
      return weekday === rule.weekday
    case 'biweekly': {
      if (weekday !== rule.weekday) return false
      const start = rule.anchorDate ? parseISO(rule.anchorDate) : new Date(d.getFullYear(), 0, 1)
      const weeks = Math.floor(differenceInCalendarDays(d, start) / 7)
      return weeks % 2 === 0
    }
    case 'everyNDays': {
      const start = rule.anchorDate ? parseISO(rule.anchorDate) : new Date(d.getFullYear(), 0, 1)
      const diff = differenceInCalendarDays(d, start)
      return diff >= 0 && diff % rule.n === 0
    }
    case 'monthly':
      return day === rule.day
    case 'monthlyLastDay': {
      const tomorrow = new Date(d)
      tomorrow.setDate(day + 1)
      return tomorrow.getDate() === 1
    }
    case 'nthWeekday': {
      if (weekday !== rule.weekday) return false
      const nth = Math.ceil(day / 7)
      return nth === rule.n
    }
    case 'everyNMonths': {
      if (day !== rule.day) return false
      const startMonth = rule.anchorMonth ?? 1
      const idx = month - startMonth
      return idx >= 0 && idx % rule.n === 0
    }
    case 'yearly':
      return month === rule.month && day === rule.day
    case 'timesPerMonth': {
      // due on evenly spaced days of month: e.g. 2 times -> ~1 and 15
      const daysInMonth = new Date(d.getFullYear(), month, 0).getDate()
      const slots = Array.from({ length: rule.count }, (_, i) =>
        Math.min(daysInMonth, Math.round(((i + 0.5) * daysInMonth) / rule.count)),
      )
      return slots.includes(day)
    }
    default:
      return false
  }
}

export function describePeriodic(rule: PeriodicRule): string {
  const wd = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
  switch (rule.type) {
    case 'daily':
      return 'Каждый день'
    case 'weekly':
      return `Каждый ${wd[rule.weekday]}`
    case 'biweekly':
      return `Раз в 2 недели (${wd[rule.weekday]})`
    case 'everyNDays':
      return `Каждые ${rule.n} дн.`
    case 'monthly':
      return `${rule.day}-го числа каждого месяца`
    case 'monthlyLastDay':
      return 'Последний день месяца'
    case 'nthWeekday':
      return `${rule.n}-й ${wd[rule.weekday]} месяца`
    case 'everyNMonths':
      return `Каждые ${rule.n} мес., ${rule.day}-го`
    case 'yearly':
      return `Каждый год: ${rule.day}.${rule.month}`
    case 'timesPerMonth':
      return `${rule.count}× в месяц`
    default:
      return 'Периодически'
  }
}

export function getCycleDay(settings: CycleSettings | undefined, date = todayKey()): number | null {
  if (!settings?.enabled || !settings.lastStartDate) return null
  const start = parseISO(settings.lastStartDate)
  const current = parseISO(date)
  const diff = differenceInCalendarDays(current, start)
  if (diff < 0) return null
  const length = settings.cycleLength || 28
  return (diff % length) + 1
}

export function isPeriodDay(settings: CycleSettings | undefined, date = todayKey()): boolean {
  const day = getCycleDay(settings, date)
  if (!day) return false
  return day <= (settings?.periodLength || 3)
}

export function duePeriodicToday(data: AppData, date = todayKey()): PeriodicHabit[] {
  const d = parseISO(date)
  return (data.periodicHabits || []).filter((h) => isPeriodicDue(h.rule, d) && !h.completions[date])
}

export function areaScore(data: AppData, areaId: LifeAreaId, date = todayKey()): number {
  const period = isPeriodDay(data.settings.cycle, date)
  // Мягкие привычки в дни цикла не считаются пропусками
  const daily = (data.areaHabits || [])
    .filter((h) => h.areaId === areaId)
    .filter((h) => !(period && h.softOnCycle && !h.completions[date]))
  const dailyDone = daily.filter((h) => h.completions[date]).length
  const dailyRate = daily.length ? dailyDone / daily.length : null

  const plans = (data.areaPlans || []).filter((p) => p.areaId === areaId)
  const planRate = plans.length
    ? plans.reduce((s, p) => s + (p.targetValue ? Math.min(1, p.currentValue / p.targetValue) : 0), 0) /
      plans.length
    : null

  const periodic = (data.periodicHabits || []).filter((h) => h.areaId === areaId)
  const due = periodic
    .filter((h) => isPeriodicDue(h.rule, parseISO(date)))
    .filter((h) => !(period && h.softOnCycle && !h.completions[date]))
  const dueDone = due.filter((h) => h.completions[date]).length
  const periodicRate = due.length ? dueDone / due.length : null

  const tasks = data.tasks.filter((t) => t.areaId === areaId && t.date === date)
  const taskRate = tasks.length ? tasks.filter((t) => t.done).length / tasks.length : null

  const parts = [dailyRate, planRate, periodicRate, taskRate].filter((v): v is number => v !== null)
  if (!parts.length) return 55
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100)
}

export function allAreaScores(data: AppData, date = todayKey()) {
  return LIFE_AREAS.map((a) => ({
    ...a,
    value: areaScore(data, a.id, date),
  }))
}

export function formatDateKey(d: Date) {
  return format(d, 'yyyy-MM-dd')
}
