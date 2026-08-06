import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { useAppStore } from '../lib/store'
import {
  dayProgress,
  periodAverage,
  activityHeatmap,
  bestHabitStreaks,
  generateInsights,
} from '../lib/analytics'
import { todayKey } from '../lib/seed'
import { Page, Card, SectionLabel } from '../components/ui'

export function StatsPage() {
  const data = useAppStore((s) => s.data)
  const today = dayProgress(data)
  const week = periodAverage(data, 7)
  const month = periodAverage(data, 30)
  const year = periodAverage(data, 365)
  const heat = activityHeatmap(data, 119)
  const streaks = bestHabitStreaks(data).slice(0, 5)
  const insights = generateInsights(data)
  const areaHabitsDone = (data.areaHabits || []).filter((h) => h.completions[todayKey()]).length
  const areaHabitsTotal = (data.areaHabits || []).length
  const tasksDone = data.tasks.filter((t) => t.done).length

  const weekChart = useMemo(
    () =>
      activityHeatmap(data, 7).map((h) => ({
        day: format(parseISO(h.date), 'EE'),
        value: h.value,
      })),
    [data],
  )

  const monthChart = useMemo(
    () =>
      activityHeatmap(data, 30).map((h) => ({
        day: format(parseISO(h.date), 'd'),
        value: h.value,
      })),
    [data],
  )

  return (
    <Page title="Статистика" subtitle="Спокойный обзор продуктивности и ритма.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Сегодня', `${today}%`],
          ['Неделя', `${week}%`],
          ['Месяц', `${month}%`],
          ['Год', `${year}%`],
        ].map(([l, v]) => (
          <Card key={l} className="p-4" hover={false}>
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">{l}</p>
            <p className="mt-2 font-display text-3xl text-ink">{v}</p>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4" hover={false}>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">Привычки сфер</p>
          <p className="mt-2 font-display text-2xl">
            {areaHabitsDone}/{areaHabitsTotal}
          </p>
        </Card>
        <Card className="p-4" hover={false}>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">Задачи завершены</p>
          <p className="mt-2 font-display text-2xl">{tasksDone}</p>
        </Card>
        <Card className="p-4" hover={false}>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">Средний % дня</p>
          <p className="mt-2 font-display text-2xl">{week}%</p>
        </Card>
      </div>

      <SectionLabel>Неделя</SectionLabel>
      <Card className="mb-6 p-5" hover={false}>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekChart}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#7A746C' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="value" fill="#C4A574" radius={[8, 8, 8, 8]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <SectionLabel>Месяц</SectionLabel>
      <Card className="mb-6 p-5" hover={false}>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthChart}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#7A746C' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#A8C5D4" fill="rgba(168,197,212,0.25)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <SectionLabel>Тепловая карта активности</SectionLabel>
      <Card className="mb-6 p-5" hover={false}>
        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
          {heat.map((h) => {
            const intensity = h.value / 100
            return (
              <div
                key={h.date}
                title={`${h.date}: ${h.value}%`}
                className="h-3 w-3 rounded-sm"
                style={{
                  background:
                    h.date === todayKey()
                      ? '#C4A574'
                      : `rgba(196, 165, 116, ${0.12 + intensity * 0.85})`,
                }}
              />
            )
          })}
        </div>
        <p className="mt-3 text-xs text-ink-muted">Чем насыщеннее клетка — тем выше выполнение дня</p>
      </Card>

      <SectionLabel>Лучшие серии</SectionLabel>
      <Card className="mb-6 divide-y divide-sand/50 overflow-hidden" hover={false}>
        {streaks.map(({ habit, streak }) => (
          <div key={habit.id} className="flex items-center justify-between px-5 py-4 text-sm">
            <span>{habit.title}</span>
            <span className="text-gold-deep">{streak} дн.</span>
          </div>
        ))}
      </Card>

      <SectionLabel>Рекомендации ИИ</SectionLabel>
      <Card className="space-y-3 p-5" hover={false}>
        {insights.map((i) => (
          <p key={i} className="text-sm leading-relaxed text-ink-soft">
            {i}
          </p>
        ))}
      </Card>
    </Page>
  )
}
