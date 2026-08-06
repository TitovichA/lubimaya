import type { AppData, LifeAreaId } from '../types'
import { todayKey } from './seed'
import {
  areaMeta,
  isTeamEventImportantOn,
  formatTeamEventHeadline,
  describePeriodic,
  teamEventWhenLabel,
} from './areas'

export type SmartReminder = {
  id: string
  source: 'team'
  sourceId: string
  areaId: LifeAreaId
  areaLabel: string
  emoji: string
  color: string
  title: string
  detail?: string
  time?: string
  actionable: boolean
  done: boolean
}

function shortAreaLabel(id: LifeAreaId): string {
  const map: Record<LifeAreaId, string> = {
    home: 'Дом',
    body: 'Тело',
    business: 'Бизнес',
    growth: 'Саморазвитие',
    family: 'Семья',
  }
  return map[id]
}

/**
 * Напоминания на главной — только из «Календаря событий» каждой сферы.
 * Та же логика «Важно»: сегодня и за 3 дня до начала (разовые и повторы).
 * Разовые события после endDate удаляются через pruneExpiredTeamEvents.
 */
export function collectSmartReminders(data: AppData, date = todayKey()): SmartReminder[] {
  const items: SmartReminder[] = []

  for (const e of data.teamEvents || []) {
    if (e.recurrence?.type === 'daily') continue
    const status = isTeamEventImportantOn(e, date)
    if (!status.important) continue

    const areaId = e.areaId || 'business'
    const meta = areaMeta(areaId)
    const when = teamEventWhenLabel(status.daysUntilStart, status.active)

    items.push({
      id: `team-${e.id}`,
      source: 'team',
      sourceId: e.id,
      areaId,
      areaLabel: shortAreaLabel(areaId),
      emoji: meta.emoji,
      color: meta.color,
      title: formatTeamEventHeadline(e, status),
      detail: e.recurrence
        ? `${when} · ${describePeriodic(e.recurrence)}`
        : when,
      actionable: false,
      done: false,
    })
  }

  return items.sort((a, b) => {
    const aDays = data.teamEvents.find((e) => e.id === a.sourceId)
    const bDays = data.teamEvents.find((e) => e.id === b.sourceId)
    const aStatus = aDays ? isTeamEventImportantOn(aDays, date).daysUntilStart : 99
    const bStatus = bDays ? isTeamEventImportantOn(bDays, date).daysUntilStart : 99
    if (aStatus !== bStatus) return aStatus - bStatus
    return a.areaLabel.localeCompare(b.areaLabel, 'ru')
  })
}
