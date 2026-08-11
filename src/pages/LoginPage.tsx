import { useState, type FormEvent } from 'react'
import { loginRequest } from '../lib/auth'
import { Button, Input } from '../components/ui'

export function LoginPage({ onSuccess }: { onSuccess: (login: string) => void }) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState<number | null>(null)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const locked = lockedUntil !== null && lockedUntil > Date.now()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (locked || loading) return
    setError('')
    setLoading(true)
    try {
      const result = await loginRequest(login.trim(), password)
      if (result.ok) {
        onSuccess(result.login)
        return
      }
      setError(result.message || 'Ошибка входа')
      if (typeof result.remainingAttempts === 'number') {
        setRemaining(result.remainingAttempts)
      }
      if (result.retryAfter) {
        setLockedUntil(Date.now() + result.retryAfter * 1000)
        setRemaining(0)
      }
    } catch {
      setError('Не удалось связаться с сервером авторизации.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-cream px-4 text-ink">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-sky/40 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-gold-light/30 blur-3xl" />
      </div>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-[2rem] border border-sand/60 bg-[var(--color-card)] p-8 shadow-[var(--shadow-card)]"
      >
        <p className="font-display text-3xl tracking-tight text-ink">Моя 100-дневка</p>
        <p className="mt-2 text-sm text-ink-muted">Вход по логину и паролю</p>

        <div className="mt-8 space-y-4">
          <Input
            label="Логин"
            autoComplete="username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            disabled={locked || loading}
          />
          <Input
            label="Пароль"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={locked || loading}
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-[#A65A5A]" role="alert">
            {error}
            {remaining !== null && remaining > 0 && (
              <span className="block text-ink-muted">Осталось попыток: {remaining}</span>
            )}
          </p>
        )}

        <Button type="submit" className="mt-6 w-full" disabled={locked || loading || !login || !password}>
          {loading ? 'Вход…' : locked ? 'Временно заблокировано' : 'Войти'}
        </Button>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-ink-muted">
          Пароль хранится только в `.env` на сервере. После нескольких неверных попыток вход
          блокируется.
        </p>
      </form>
    </div>
  )
}
