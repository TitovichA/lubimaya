import { addDays, format, getDay, parseISO, subDays } from 'date-fns'
import type { AppData, DayRitualProgress, SundayRitual } from '../types'
import { todayKey } from './seed'
import { defaultChallenge } from './challenge'

export const SUNDAY_COLOR = '#A8B892'

/** Воскресенье: getDay === 0 */
export function isSunday(date = todayKey()): boolean {
  return getDay(parseISO(date)) === 0
}

/** Сколько полных дней до следующего воскресенья (0 — сегодня воскресенье) */
export function daysUntilNextSunday(date = todayKey()): number {
  if (isSunday(date)) return 0
  const d = parseISO(date)
  const dow = getDay(d)
  return (7 - dow) % 7 || 7
}

export function daysWordRu(n: number): string {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return 'день'
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return 'дня'
  return 'дней'
}

export function nextSundayWaitingLabel(date = todayKey()): string {
  const n = daysUntilNextSunday(date)
  if (n === 0) return 'Сегодня — день восстановления'
  return `Следующее воскресенье через ${n} ${daysWordRu(n)}.`
}

export function enabledSundayRituals(data: AppData): SundayRitual[] {
  return (data.sundayRitual || [])
    .filter((r) => r.enabled !== false)
    .slice()
    .sort((a, b) => a.order - b.order)
}

export function getSundayDone(data: AppData, date = todayKey()): string[] {
  return data.sundayProgress?.find((p) => p.date === date)?.completedIds || []
}

export function sundayRitualProgress(data: AppData, date = todayKey()) {
  const items = enabledSundayRituals(data)
  const done = getSundayDone(data, date).filter((id) => items.some((r) => r.id === id))
  const total = items.length
  const pct = total ? Math.round((done.length / total) * 100) : 0
  return { done: done.length, total, pct, doneIds: done }
}

/** Воскресенье считается выполненным, если все включённые ритуалы отмечены */
export function isSundayFullyDone(data: AppData, date: string): boolean {
  const { done, total } = sundayRitualProgress(data, date)
  return total > 0 && done === total
}

/** Все воскресенья в интервале [start, end] включительно */
export function sundaysInRange(startKey: string, endKey: string): string[] {
  const start = parseISO(startKey)
  const end = parseISO(endKey)
  if (end < start) return []
  const out: string[] = []
  let d = start
  // move to first sunday on or after start
  while (getDay(d) !== 0) {
    d = addDays(d, 1)
    if (d > end) return out
  }
  while (d <= end) {
    out.push(format(d, 'yyyy-MM-dd'))
    d = addDays(d, 7)
  }
  return out
}

export type SundayStats = {
  /** За всё время: выполненные пункты / всего отмеченных возможностей */
  ritualsDone: number
  ritualsTotal: number
  /** Серия полных воскресений подряд (до сегодня или последнего прошедшего вс) */
  streakWeeks: number
  /** % выполнения воскресных ритуалов за текущую 100-дневку */
  challengePct: number
  challengeDone: number
  challengeTotal: number
}

export function computeSundayStats(data: AppData, today = todayKey()): SundayStats {
  const challenge = data.settings.challenge || defaultChallenge(today)
  const challengeEnd = format(
    addDays(parseISO(challenge.startDate), Math.max(0, challenge.durationDays - 1)),
    'yyyy-MM-dd',
  )
  const rangeEnd = today < challengeEnd ? today : challengeEnd
  const challengeSundays = sundaysInRange(challenge.startDate, rangeEnd).filter((d) => d <= today)

  let challengeDone = 0
  let challengeTotal = 0
  for (const sun of challengeSundays) {
    const { done, total } = sundayRitualProgress(data, sun)
    challengeDone += done
    challengeTotal += total
  }

  // Все записи прогресса
  let ritualsDone = 0
  let ritualsTotal = 0
  for (const p of data.sundayProgress || []) {
    const { done, total } = sundayRitualProgress(data, p.date)
    // для исторических дней считаем по текущему списку enabled — ок для простоты
    ritualsDone += done
    ritualsTotal += total || done
  }
  // Если прогресса мало — опираемся на challenge window
  if (!ritualsTotal && challengeTotal) {
    ritualsDone = challengeDone
    ritualsTotal = challengeTotal
  }

  // Серия: идём назад от последнего воскресенья <= today
  let streakWeeks = 0
  let cursor = parseISO(today)
  if (getDay(cursor) !== 0) {
    // предыдущее воскресенье
    cursor = subDays(cursor, getDay(cursor) || 7)
  } else {
    // сегодня вс — если ещё не полностью выполнено, серия считается до прошлого вс
    if (!isSundayFullyDone(data, today)) {
      cursor = subDays(cursor, 7)
    }
  }
  for (let i = 0; i < 260; i++) {
    const key = format(cursor, 'yyyy-MM-dd')
    if (key < challenge.startDate && !(data.sundayProgress || []).some((p) => p.date === key)) break
    const items = enabledSundayRituals(data)
    if (!items.length) break
    if (!isSundayFullyDone(data, key)) break
    streakWeeks += 1
    cursor = subDays(cursor, 7)
  }

  const challengePct = challengeTotal ? Math.round((challengeDone / challengeTotal) * 100) : 0

  return {
    ritualsDone,
    ritualsTotal: ritualsTotal || 0,
    streakWeeks,
    challengePct,
    challengeDone,
    challengeTotal,
  }
}

export function upsertSundayProgress(
  list: DayRitualProgress[],
  date: string,
  completedIds: string[],
): DayRitualProgress[] {
  const idx = list.findIndex((p) => p.date === date)
  if (idx >= 0) {
    const next = [...list]
    next[idx] = { date, completedIds }
    return next
  }
  return [...list, { date, completedIds }]
}
