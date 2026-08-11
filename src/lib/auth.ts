export type AuthStatus = {
  ok: boolean
  authenticated: boolean
  login?: string | null
}

export type LoginResult =
  | { ok: true; authenticated: true; login: string }
  | {
      ok: false
      error: string
      message: string
      remainingAttempts?: number
      retryAfter?: number
    }

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T
}

export async function fetchAuthStatus(): Promise<AuthStatus> {
  const res = await fetch('/api/auth.php?action=status', {
    credentials: 'include',
    cache: 'no-store',
  })
  return parseJson<AuthStatus>(res)
}

export async function loginRequest(login: string, password: string): Promise<LoginResult> {
  const res = await fetch('/api/auth.php?action=login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', login, password }),
  })
  return parseJson<LoginResult>(res)
}

export async function logoutRequest(): Promise<void> {
  await fetch('/api/auth.php?action=logout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'logout' }),
  })
}
