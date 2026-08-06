import {
  format,
  getDate,
  getDay,
  getMonth,
  parseISO,
  differenceInCalendarDays,
  isWithinInterval,
  addDays,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import type {
  AppData,
  LifeAreaId,
  PeriodicHabit,
  PeriodicRule,
  CycleSettings,
  TeamEvent,
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

export type PeriodicRuleOpts = {
  weekday?: number
  n?: number
  day?: number
  month?: number
  count?: number
  anchorDate?: string
  anchorMonth?: number
}

/** Собрать правило периодичности из вида + параметров формы */
export function buildPeriodicRule(kind: string, opts: PeriodicRuleOpts = {}): PeriodicRule {
  const weekday = opts.weekday ?? 1
  const n = Math.max(1, opts.n ?? 1)
  const day = Math.min(31, Math.max(1, opts.day ?? 1))
  const month = Math.min(12, Math.max(1, opts.month ?? 1))
  const count = Math.max(1, opts.count ?? 2)
  const anchorDate = opts.anchorDate || todayKey()
  const anchorMonth = opts.anchorMonth ?? 1

  switch (kind) {
    case 'daily':
      return { type: 'daily' }
    case 'weekly':
      return { type: 'weekly', weekday }
    case 'biweekly':
      return { type: 'biweekly', weekday, anchorDate }
    case 'everyNDays':
      return { type: 'everyNDays', n, anchorDate }
    case 'monthly':
      return { type: 'monthly', day }
    case 'monthlyLastDay':
      return { type: 'monthlyLastDay' }
    case 'nthWeekday':
      return { type: 'nthWeekday', n: Math.min(5, n), weekday }
    case 'everyNMonths':
      return { type: 'everyNMonths', n, day, anchorMonth }
    case 'yearly':
      return { type: 'yearly', month, day }
    case 'timesPerMonth':
      return { type: 'timesPerMonth', count }
    default:
      return { type: 'monthly', day }
  }
}

/** Событие приходится на дату (разовый интервал или повтор) */
export function isTeamEventOnDate(event: TeamEvent, date = todayKey()): boolean {
  try {
    if (event.recurrence) {
      if (date < event.startDate) return false
      if (event.endDate && date > event.endDate) return false
      return isPeriodicDue(event.recurrence, parseISO(date))
    }
    const d = parseISO(date)
    return isWithinInterval(d, { start: parseISO(event.startDate), end: parseISO(event.endDate) })
  } catch {
    return false
  }
}

/** Ближайшая дата вхождения события с fromDate включительно */
export function nextTeamEventOccurrence(event: TeamEvent, fromDate = todayKey()): string | null {
  if (!event.recurrence) return event.startDate >= fromDate ? event.startDate : null
  const from = parseISO(fromDate)
  for (let i = 0; i < 400; i++) {
    const key = format(addDays(from, i), 'yyyy-MM-dd')
    if (isTeamEventOnDate(event, key)) return key
  }
  return null
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

  const tasks = data.tasks.filter((t) => t.areaId === areaId && t.date === date)
  const taskRate = tasks.length ? tasks.filter((t) => t.done).length / tasks.length : null

  const parts = [dailyRate, planRate, taskRate].filter((v): v is number => v !== null)
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

/** Событие важно в этот день или на завтра (без превью за 2–3 дня) */
export function isTeamEventImportantOn(
  event: TeamEvent | { startDate: string; endDate: string; recurrence?: PeriodicRule },
  date = todayKey(),
): { important: boolean; daysUntilStart: number; active: boolean } {
  try {
    if (event.recurrence) {
      const next = nextTeamEventOccurrence(event as TeamEvent, date)
      if (!next) return { important: false, daysUntilStart: 0, active: false }
      const daysUntilStart = differenceInCalendarDays(parseISO(next), parseISO(date))
      const active = daysUntilStart === 0
      return {
        important: active || daysUntilStart === 1,
        daysUntilStart,
        active,
      }
    }
    const today = parseISO(date)
    const start = parseISO(event.startDate)
    const end = parseISO(event.endDate)
    const daysUntilStart = differenceInCalendarDays(start, today)
    const active = isWithinInterval(today, { start, end })
    const startsToday = daysUntilStart === 0
    const startsTomorrow = daysUntilStart === 1
    return {
      important: active || startsToday || startsTomorrow,
      daysUntilStart,
      active: active || startsToday,
    }
  } catch {
    return { important: false, daysUntilStart: 0, active: false }
  }
}

export function teamEventWhenLabel(daysUntilStart: number, active: boolean): string {
  if (active || daysUntilStart <= 0) return 'Сегодня'
  if (daysUntilStart === 1) return 'Завтра'
  if (daysUntilStart === 2) return 'Послезавтра'
  return `Через ${daysUntilStart} дня`
}

/** Заголовок события = имя/название + когда */
export function formatTeamEventHeadline(
  event: TeamEvent | { personName: string; startDate: string; endDate?: string; recurrence?: PeriodicRule },
  status: { daysUntilStart: number; active: boolean },
): string {
  const name = event.personName.trim()
  const next =
    'recurrence' in event && event.recurrence
      ? nextTeamEventOccurrence(event as TeamEvent) || event.startDate
      : event.startDate
  const startRu = format(parseISO(next), 'd MMMM', { locale: ru })
  if (status.active || status.daysUntilStart <= 0) return name
  if (status.daysUntilStart === 1) return `${name} — завтра`
  if (status.daysUntilStart === 2) return `${name} — послезавтра`
  return `${name} — с ${startRu}`
}
