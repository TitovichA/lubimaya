import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, Connect } from 'vite'

type Attempt = { count: number; first: number; locked_until: number }

function loadEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {}
  const out: Record<string, string> = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    let k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    out[k] = v
  }
  return out
}

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function json(res: Connect.ServerResponse, code: number, payload: unknown) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

/** Локальный аналог server/api/auth.php — читает .env, не отдаёт секрет в клиент. */
export function localAuthPlugin(rootDir: string): Plugin {
  const sessions = new Map<string, { login: string; at: number }>()
  const attempts = new Map<string, Attempt>()

  return {
    name: 'local-auth-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/api/auth.php')) return next()

        const envRoot = loadEnvFile(path.join(rootDir, '.env'))
        const envServer = loadEnvFile(path.join(rootDir, 'server', '.env'))
        const fromExample = loadEnvFile(path.join(rootDir, 'server', '.env.example'))
        const cfg = { ...fromExample, ...envServer, ...envRoot }

        const appLogin = cfg.APP_LOGIN || ''
        const appPassword = cfg.APP_PASSWORD || ''
        const maxAttempts = Math.max(1, Number(cfg.AUTH_MAX_ATTEMPTS || 5))
        const lockoutSeconds = Math.max(60, Number(cfg.AUTH_LOCKOUT_SECONDS || 900))

        const cookie = req.headers.cookie || ''
        const sidMatch = /lubimaya_sid=([^;]+)/.exec(cookie)
        const sid = sidMatch?.[1]

        const u = new URL(url, 'http://localhost')
        let action = u.searchParams.get('action') || ''

        let body: Record<string, string> = {}
        if (req.method === 'POST') {
          const raw = await readBody(req)
          try {
            body = JSON.parse(raw || '{}')
          } catch {
            body = {}
          }
          if (!action && body.action) action = body.action
        }
        if (!action && req.method === 'GET') action = 'status'

        if (!appLogin || !appPassword) {
          return json(res, 503, {
            ok: false,
            error: 'auth_not_configured',
            message: 'Создайте .env с APP_LOGIN и APP_PASSWORD (см. server/.env.example).',
          })
        }

        const setSession = (id: string) => {
          res.setHeader(
            'Set-Cookie',
            `lubimaya_sid=${id}; Path=/; HttpOnly; SameSite=Lax`,
          )
        }
        const clearSession = () => {
          res.setHeader(
            'Set-Cookie',
            'lubimaya_sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
          )
        }

        if (action === 'status') {
          const s = sid ? sessions.get(sid) : undefined
          return json(res, 200, {
            ok: true,
            authenticated: Boolean(s),
            login: s?.login ?? null,
          })
        }

        if (action === 'logout') {
          if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method_not_allowed' })
          if (sid) sessions.delete(sid)
          clearSession()
          return json(res, 200, { ok: true, authenticated: false })
        }

        if (action === 'login') {
          if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method_not_allowed' })
          const ip = req.socket.remoteAddress || 'local'
          const now = Math.floor(Date.now() / 1000)
          let record = attempts.get(ip) || { count: 0, first: now, locked_until: 0 }

          if (record.locked_until > now) {
            return json(res, 429, {
              ok: false,
              error: 'locked',
              message: 'Слишком много попыток. Попробуйте позже.',
              retryAfter: record.locked_until - now,
              remainingAttempts: 0,
            })
          }
          if (record.locked_until && record.locked_until <= now) {
            record = { count: 0, first: now, locked_until: 0 }
          }

          const login = String(body.login || '').trim()
          const password = String(body.password || '')
          const ok = login === appLogin && password === appPassword

          if (!ok) {
            record.count += 1
            const remaining = Math.max(0, maxAttempts - record.count)
            if (record.count >= maxAttempts) {
              record.locked_until = now + lockoutSeconds
            }
            attempts.set(ip, record)
            if (record.locked_until > now) {
              return json(res, 429, {
                ok: false,
                error: 'locked',
                message: 'Слишком много попыток. Попробуйте позже.',
                retryAfter: record.locked_until - now,
                remainingAttempts: 0,
              })
            }
            return json(res, 401, {
              ok: false,
              error: 'invalid_credentials',
              message: 'Неверный логин или пароль.',
              remainingAttempts: remaining,
            })
          }

          attempts.delete(ip)
          const id = crypto.randomUUID()
          sessions.set(id, { login, at: now })
          setSession(id)
          return json(res, 200, { ok: true, authenticated: true, login })
        }

        return json(res, 400, { ok: false, error: 'unknown_action' })
      })
    },
  }
}
