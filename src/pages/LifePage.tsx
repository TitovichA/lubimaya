import { useAppStore } from '../lib/store'
import { allAreaScores } from '../lib/areas'
import { Page, Card, LinearProgress } from '../components/ui'
import { LifeAreaRings } from '../components/LifeAreaRings'

export function LifePage() {
  const data = useAppStore((s) => s.data)
  const setPage = useAppStore((s) => s.setPage)
  const scores = allAreaScores(data)

  return (
    <Page
      title="Колесо баланса"
      subtitle="Индекс по сферам: дом, тело, бизнес, саморазвитие и семья."
    >
      <Card className="mb-6 p-6 md:p-8" hover={false}>
        <LifeAreaRings scores={scores} onSelect={(pageId) => setPage(pageId)} />
      </Card>
      <div className="space-y-3">
        {scores.map((s) => (
          <Card key={s.id} className="p-4" onClick={() => setPage(s.pageId)}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>
                {s.emoji} {s.label}
              </span>
              <span style={{ color: s.color }}>{s.value}%</span>
            </div>
            <LinearProgress value={s.value} color={s.color} />
          </Card>
        ))}
      </div>
    </Page>
  )
}
