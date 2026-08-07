import { useState } from 'react'
import { Check as CheckIcon } from 'lucide-react'
import { useAppStore } from '../lib/store'
import { LIFE_AREAS, areaMeta } from '../lib/areas'
import { Page, Card, Empty, LinearProgress } from '../components/ui'
import type { AreaPlanItem, LifeAreaId } from '../types'

function isPlanDone(plan: AreaPlanItem) {
  return plan.targetValue > 0 && plan.currentValue >= plan.targetValue
}

function PlanRow({ plan }: { plan: AreaPlanItem }) {
  const meta = areaMeta(plan.areaId)
  const done = isPlanDone(plan)
  const pct = plan.targetValue
    ? Math.min(100, Math.round((plan.currentValue / plan.targetValue) * 100))
    : 0

  return (
    <div className={`border-b border-sand/50 px-4 py-4 last:border-0 ${done ? 'bg-cream/30' : ''}`}>
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            done ? 'text-cream' : 'border border-sand/80 text-transparent'
          }`}
          style={done ? { background: meta.color } : undefined}
          aria-label={done ? 'Выполнено' : 'В работе'}
        >
          <CheckIcon size={14} strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p
              className={`min-w-0 text-sm leading-relaxed ${
                done ? 'text-ink-muted line-through' : 'text-ink'
              }`}
            >
              <span className="mr-1.5 no-underline">{meta.emoji}</span>
              {plan.title}
            </p>
            <span className="shrink-0 text-xs text-ink-muted">
              {plan.currentValue}/{plan.targetValue} {plan.unit}
            </span>
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider" style={{ color: meta.color }}>
            {meta.label}
            {done ? ' · выполнено' : ''}
          </p>
          <div className="mt-2">
            <LinearProgress value={pct} color={meta.color} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function TasksPage() {
  const data = useAppStore((s) => s.data)
  const setPage = useAppStore((s) => s.setPage)
  const [filter, setFilter] = useState<LifeAreaId | 'all'>('all')

  const plans = (data.areaPlans || [])
    .filter((p) => filter === 'all' || p.areaId === filter)
    .sort((a, b) => {
      const areaOrder =
        LIFE_AREAS.findIndex((x) => x.id === a.areaId) - LIFE_AREAS.findIndex((x) => x.id === b.areaId)
      if (areaOrder !== 0) return areaOrder
      return (a.order ?? 0) - (b.order ?? 0)
    })

  const active = plans.filter((p) => !isPlanDone(p))
  const done = plans.filter((p) => isPlanDone(p))

  return (
    <Page title="Задачи" subtitle="План 100-дневки из всех сфер — только просмотр.">
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-2xl px-3 py-1.5 text-xs ${
            filter === 'all' ? 'bg-ink text-cream' : 'bg-cream text-ink-muted'
          }`}
        >
          Все
        </button>
        {LIFE_AREAS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setFilter(a.id)}
            className={`rounded-2xl px-3 py-1.5 text-xs ${
              filter === a.id ? 'bg-white text-ink shadow-soft' : 'bg-cream text-ink-muted'
            }`}
          >
            {a.emoji} {a.label}
          </button>
        ))}
      </div>

      {plans.length === 0 ? (
        <Card className="p-6" hover={false}>
          <Empty title="План пока пуст" text="Пункты появляются в сферах жизни" />
          <button
            type="button"
            className="mt-4 text-sm text-gold-deep"
            onClick={() => setPage('area-home')}
          >
            К сферам →
          </button>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card className="overflow-hidden" hover={false}>
            {active.length === 0 && (
              <p className="px-4 py-4 text-sm text-ink-muted">Все пункты выполнены</p>
            )}
            {active.map((p) => (
              <PlanRow key={p.id} plan={p} />
            ))}
          </Card>

          {done.length > 0 && (
            <div>
              <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                Выполнено · {done.length}
              </p>
              <Card className="overflow-hidden" hover={false}>
                {done.map((p) => (
                  <PlanRow key={p.id} plan={p} />
                ))}
              </Card>
            </div>
          )}
        </div>
      )}
    </Page>
  )
}
