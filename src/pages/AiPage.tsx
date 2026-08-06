import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '../lib/store'
import { aiReply, generateInsights } from '../lib/analytics'
import { Page, Card, Button } from '../components/ui'

type Msg = { role: 'user' | 'ai'; text: string }

export function AiPage() {
  const data = useAppStore((s) => s.data)
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'ai',
      text: 'Я ваш спокойный помощник. Знаю привычки, цели, задачи и статистику. Спросите про план, прогресс или мотивацию.',
    },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const insights = generateInsights(data)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (text = input) => {
    const q = text.trim()
    if (!q) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'ai', text: aiReply(data, q) }])
  }

  return (
    <Page title="ИИ-помощник" subtitle="Анализ, планы, мотивация и мягкие выводы.">
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {['Составь план на день', 'Проанализируй прогресс', 'Мотивируй меня', 'Как мои цели?'].map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="shrink-0 rounded-full bg-white/80 px-3 py-1.5 text-xs text-ink-soft shadow-soft"
          >
            {q}
          </button>
        ))}
      </div>

      <Card className="mb-4 space-y-3 p-5" hover={false}>
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">Инсайты</p>
        {insights.slice(0, 3).map((i) => (
          <p key={i} className="text-sm leading-relaxed text-ink-soft">
            {i}
          </p>
        ))}
      </Card>

      <Card className="flex min-h-[420px] flex-col p-4" hover={false}>
        <div className="flex-1 space-y-3 overflow-y-auto pb-4">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[90%] rounded-3xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'ml-auto bg-ink text-cream'
                  : 'bg-cream text-ink-soft'
              }`}
            >
              {m.text}
            </motion.div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2 border-t border-sand/50 pt-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Напишите вопрос..."
            className="flex-1 rounded-2xl border border-sand/70 bg-cream-soft px-4 py-3 text-sm outline-none focus:border-gold/40"
          />
          <Button onClick={() => send()}>
            <Send size={16} />
          </Button>
        </div>
      </Card>
    </Page>
  )
}
