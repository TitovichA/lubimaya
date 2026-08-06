import { eachDayOfInterval, format, subDays, getDay, parseISO } from 'date-fns'
import type { AppData, Habit, Goal } from '../types'
import { todayKey } from './seed'
import { isPeriodDay, isPeriodicDue } from './areas'

export function ritualProgress(completed: number, total: number) {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export function getRitualDone(data: AppData, type: 'morning' | 'evening', date = todayKey()) {
  const list = type === 'morning' ? data.morningProgress : data.eveningProgress
  return list.find((p) => p.date === date)?.completedIds ?? []
}

export function habitDoneToday(habit: Habit, date = todayKey()) {
  const v = habit.completions[date] ?? 0
  const target = habit.targetPerDay ?? 1
  return v >= target
}

export function habitStreak(habit: Habit, upTo = new Date()) {
  let streak = 0
  let d = upTo
  for (let i = 0; i < 400; i++) {
    const key = format(d, 'yyyy-MM-dd')
    const target = habit.targetPerDay ?? 1
    if ((habit.completions[key] ?? 0) >= target) {
      streak++
      d = subDays(d, 1)
    } else if (key === todayKey(upTo) && streak === 0) {
      d = subDays(d, 1)
    } else {
      break
    }
  }
  return streak
}

export function habitCompletionRate(habit: Habit, days = 30) {
  const end = new Date()
  const start = subDays(end, days - 1)
  const range = eachDayOfInterval({ start, end })
  const target = habit.targetPerDay ?? 1
  const done = range.filter((d) => (habit.completions[format(d, 'yyyy-MM-dd')] ?? 0) >= target).length
  return Math.round((done / range.length) * 100)
}

export function goalPercent(goal: Goal) {
  if (goal.targetValue <= 0) return 0
  return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
}

export function dayProgress(data: AppData, date = todayKey()) {
  const morningDone = getRitualDone(data, 'morning', date).length
  const eveningDone = getRitualDone(data, 'evening', date).length
  const morningTotal = data.morningRitual.length
  const eveningTotal = data.eveningRitual.length
  const habitsDone = data.habits.filter((h) => habitDoneToday(h, date)).length
  const habitsTotal = data.habits.length
  const tasks = data.tasks.filter((t) => t.date === date)
  const tasksDone = tasks.filter((t) => t.done).length
  const tasksTotal = tasks.length

  const period = isPeriodDay(data.settings.cycle, date)
  const areaHabits = (data.areaHabits || []).filter(
    (h) => !(period && h.softOnCycle && !h.completions[date]),
  )
  const areaHabitsDone = areaHabits.filter((h) => h.completions[date]).length
  const areaHabitsTotal = areaHabits.length

  const dueBiz = (data.businessEvents || []).filter((e) => isPeriodicDue(e.rule, parseISO(date)))
  const bizDone = dueBiz.filter((e) => e.completions[date]).length
  const bizTotal = dueBiz.length

  const parts = [
    morningTotal ? morningDone / morningTotal : null,
    eveningTotal ? eveningDone / eveningTotal : null,
    habitsTotal ? habitsDone / habitsTotal : null,
    tasksTotal ? tasksDone / tasksTotal : null,
    areaHabitsTotal ? areaHabitsDone / areaHabitsTotal : null,
    bizTotal ? bizDone / bizTotal : null,
  ].filter((v): v is number => v !== null)

  if (!parts.length) return 0
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100)
}

export function periodAverage(data: AppData, days: number) {
  const end = new Date()
  const start = subDays(end, days - 1)
  const range = eachDayOfInterval({ start, end })
  const values = range.map((d) => dayProgress(data, format(d, 'yyyy-MM-dd')))
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

export function activityHeatmap(data: AppData, days = 119) {
  const end = new Date()
  const start = subDays(end, days - 1)
  return eachDayOfInterval({ start, end }).map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    return { date: key, value: dayProgress(data, key) }
  })
}

export function bestHabitStreaks(data: AppData) {
  return [...data.habits]
    .map((h) => ({ habit: h, streak: habitStreak(h) }))
    .sort((a, b) => b.streak - a.streak)
}

export function generateInsights(data: AppData): string[] {
  const insights: string[] = []
  const heatmap = activityHeatmap(data, 56)
  const byWeekday = Array.from({ length: 7 }, () => [] as number[])
  heatmap.forEach((h) => {
    const wd = getDay(parseISO(h.date))
    byWeekday[wd].push(h.value)
  })
  const weekdayAvg = byWeekday.map((arr) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,
  )
  const names = ['воскресеньям', 'понедельникам', 'вторникам', 'средам', 'четвергам', 'пятницам', 'субботам']
  const worst = weekdayAvg.indexOf(Math.min(...weekdayAvg.filter((v) => v > 0 || true)))
  const best = weekdayAvg.indexOf(Math.max(...weekdayAvg))
  if (weekdayAvg[worst] < weekdayAvg[best] - 10) {
    insights.push(`По ${names[worst]} вы выполняете привычки слабее, чем по ${names[best]}.`)
  }

  const morningRates: number[] = []
  for (let i = 0; i < 30; i++) {
    const key = format(subDays(new Date(), i), 'yyyy-MM-dd')
    const done = getRitualDone(data, 'morning', key).length
    morningRates.push(data.morningRitual.length ? done / data.morningRitual.length : 0)
  }
  const recent = morningRates.slice(0, 15)
  const older = morningRates.slice(15)
  const recentAvg = recent.reduce((a, b) => a + b, 0) / (recent.length || 1)
  const olderAvg = older.reduce((a, b) => a + b, 0) / (older.length || 1)
  if (olderAvg > 0) {
    const delta = Math.round(((recentAvg - olderAvg) / olderAvg) * 100)
    if (delta > 5) insights.push(`В этом периоде утренние ритуалы выполняются на ${delta}% чаще.`)
    if (delta < -5) insights.push(`Утренние ритуалы стали выполняться на ${Math.abs(delta)}% реже — стоит смягчить список.`)
  }

  const top = bestHabitStreaks(data)[0]
  if (top && top.streak >= 3) {
    insights.push(`Лучшая серия сейчас — «${top.habit.title}»: ${top.streak} дн.`)
  }

  const lowHabits = data.habits
    .map((h) => ({ h, rate: habitCompletionRate(h, 14) }))
    .filter((x) => x.rate < 40)
    .slice(0, 2)
  lowHabits.forEach((x) => {
    insights.push(`«${x.h.title}» выполняется редко (${x.rate}%). Попробуйте уменьшить цель или привязать к ритуалу.`)
  })

  const sport = data.habits.find((h) => h.id === 'h-sport' || /тренир|спорт/i.test(h.title))
  if (sport) {
    insights.push('Лучшее время тренировок по вашим напоминаниям — утро около 8:00.')
  }

  insights.push('После 20:00 продуктивность обычно падает — вечерний ритуал лучше начинать раньше.')

  if (!insights.length) {
    insights.push('Продолжайте в том же духе — стабильность важнее идеальных дней.')
  }

  return insights.slice(0, 6)
}

export function searchAll(data: AppData, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const results: { type: string; id: string; title: string; subtitle?: string }[] = []

  data.habits.forEach((h) => {
    if (h.title.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q)) {
      results.push({ type: 'habit', id: h.id, title: h.title, subtitle: h.category })
    }
  })
  data.goals.forEach((g) => {
    if (g.title.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)) {
      results.push({ type: 'goal', id: g.id, title: g.title, subtitle: `${goalPercent(g)}%` })
    }
  })
  data.tasks.forEach((t) => {
    if (t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q)) {
      results.push({ type: 'task', id: t.id, title: t.title, subtitle: t.category })
    }
  })
  data.notes.forEach((n) => {
    if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
      results.push({ type: 'note', id: n.id, title: n.title, subtitle: n.tags.join(', ') })
    }
  })
  data.projects.forEach((p) => {
    if (p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) {
      results.push({ type: 'project', id: p.id, title: p.title, subtitle: p.sphere })
    }
  })
  data.morningRitual.forEach((r) => {
    if (r.title.toLowerCase().includes(q)) {
      results.push({ type: 'morning', id: r.id, title: r.title, subtitle: r.time })
    }
  })
  data.eveningRitual.forEach((r) => {
    if (r.title.toLowerCase().includes(q)) {
      results.push({ type: 'evening', id: r.id, title: r.title, subtitle: r.time })
    }
  })

  return results.slice(0, 40)
}

export function aiReply(data: AppData, message: string): string {
  const lower = message.toLowerCase()
  const progress = dayProgress(data)
  const week = periodAverage(data, 7)
  const insights = generateInsights(data)

  if (/план|расписан|свободн/.test(lower)) {
    const openHabits = data.habits.filter((h) => !habitDoneToday(h)).slice(0, 4)
    const openTasks = data.tasks.filter((t) => t.date === todayKey() && !t.done).slice(0, 4)
    return [
      'Предлагаю мягкое расписание на сегодня:',
      '',
      '• 08:00–09:00 — утренний ритуал',
      openHabits.length ? `• 09:30 — привычки: ${openHabits.map((h) => h.title).join(', ')}` : null,
      openTasks.length ? `• 11:00 — задачи: ${openTasks.map((t) => t.title).join(', ')}` : null,
      '• 18:00 — движение или тренировка',
      '• 21:00 — вечерний ритуал и сон',
      '',
      `Свободное окно для глубокой работы: 10:00–12:30 и 15:00–17:00.`,
    ]
      .filter(Boolean)
      .join('\n')
  }

  if (/прогресс|статисти|анализ|как я/.test(lower)) {
    return [
      `Сегодня выполнено ${progress}%. За неделю в среднем ${week}%.`,
      '',
      ...insights.map((i) => `• ${i}`),
      '',
      'Хотите, составлю план усиления слабых дней?',
    ].join('\n')
  }

  if (/мотивац|устал|не хочу|лень/.test(lower)) {
    return 'Сейчас достаточно одного маленького шага. Отметьте только первый пункт утреннего или вечернего ритуала — остальное подтянется. Вы уже ближе к цели, чем вчера.'
  }

  if (/цел|привычк/.test(lower)) {
    const goals = data.goals
      .map((g) => `• ${g.title}: ${g.currentValue}/${g.targetValue} (${goalPercent(g)}%)`)
      .join('\n')
    return `Ваши цели:\n${goals}\n\nПривычки связаны с целями автоматически: отметив тренировку или чтение, вы двигаете связанные цели вперёд.`
  }

  return [
    `Я вижу ваш день: прогресс ${progress}%.`,
    '',
    insights[0] ?? 'Держите ритм — спокойная регулярность сильнее рывков.',
    '',
    'Могу помочь с планом, анализом прогресса, расписанием или мотивацией — просто напишите.',
  ].join('\n')
}
