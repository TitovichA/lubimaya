import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { AppData, ChallengeSettings } from '../types'
import { todayKey } from './seed'
import { dayProgress, goalPercent } from './analytics'
import { allAreaScores } from './areas'

export function defaultChallenge(startDate = todayKey()): ChallengeSettings {
  return {
    title: 'Моя 100-дневка',
    startDate,
    durationDays: 100,
  }
}

export function challengeEndDate(challenge: ChallengeSettings): string {
  return format(addDays(parseISO(challenge.startDate), Math.max(1, challenge.durationDays) - 1), 'yyyy-MM-dd')
}

export function challengeDayNumber(challenge: ChallengeSettings, date = todayKey()): number {
  const diff = differenceInCalendarDays(parseISO(date), parseISO(challenge.startDate))
  return diff + 1
}

export function challengeRemaining(challenge: ChallengeSettings, date = todayKey()): number {
  const day = challengeDayNumber(challenge, date)
  return Math.max(0, challenge.durationDays - day)
}

export function isChallengeComplete(challenge: ChallengeSettings, date = todayKey()): boolean {
  return challengeDayNumber(challenge, date) > challenge.durationDays
}

export function isChallengeActive(challenge: ChallengeSettings, date = todayKey()): boolean {
  const day = challengeDayNumber(challenge, date)
  return day >= 1 && day <= challenge.durationDays
}

export function formatChallengeEndRu(challenge: ChallengeSettings): string {
  return format(parseISO(challengeEndDate(challenge)), 'd MMMM yyyy', { locale: ru })
}

export function remainingLabel(left: number): string {
  if (left <= 0) return 'Завершена'
  const n = left % 100
  const n1 = n % 10
  let word = 'дней'
  if (n > 10 && n < 20) word = 'дней'
  else if (n1 === 1) word = 'день'
  else if (n1 >= 2 && n1 <= 4) word = 'дня'
  return `До завершения осталось ${left} ${word}`
}

/** Средний прогресс дней от старта до сегодня + цели + планы сфер */
export function challengeOverallProgress(data: AppData, date = todayKey()): number {
  const challenge = data.settings.challenge
  if (!challenge?.startDate) return 0

  const start = parseISO(challenge.startDate)
  const today = parseISO(date)
  const dayNum = challengeDayNumber(challenge, date)
  if (dayNum < 1) return 0

  const daysToCount = Math.min(Math.max(dayNum, 1), challenge.durationDays)
  let sum = 0
  for (let i = 0; i < daysToCount; i++) {
    const key = format(addDays(start, i), 'yyyy-MM-dd')
    if (parseISO(key) > today && i >= dayNum) break
    sum += dayProgress(data, key)
  }
  const dailyAvg = daysToCount ? sum / daysToCount : 0

  const goals = data.goals
  const goalsAvg = goals.length
    ? goals.reduce((s, g) => s + goalPercent(g), 0) / goals.length
    : dailyAvg

  const plans = data.areaPlans || []
  const plansAvg = plans.length
    ? (plans.reduce(
        (s, p) => s + (p.targetValue ? Math.min(100, (p.currentValue / p.targetValue) * 100) : 0),
        0,
      ) /
        plans.length)
    : dailyAvg

  const areaScores = allAreaScores(data, date)
  const areaAvg = areaScores.reduce((s, a) => s + a.value, 0) / Math.max(1, areaScores.length)

  return Math.round(dailyAvg * 0.45 + goalsAvg * 0.2 + plansAvg * 0.15 + areaAvg * 0.2)
}
