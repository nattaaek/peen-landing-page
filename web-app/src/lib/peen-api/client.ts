import { env } from '../env'

export class PeenAPIError extends Error {
  readonly status: number
  readonly body: string | null

  constructor(status: number, message: string, body: string | null = null) {
    super(message)
    this.name = 'PeenAPIError'
    this.status = status
    this.body = body
  }
}

function correlationId(): string {
  return crypto.randomUUID()
}

function parseErrorMessage(data: unknown): string | null {
  if (data && typeof data === 'object' && 'error' in data) {
    const err = (data as { error?: unknown }).error
    if (typeof err === 'string') return err
    if (err && typeof err === 'object' && 'message' in err) {
      const msg = (err as { message?: unknown }).message
      if (typeof msg === 'string') return msg
    }
  }
  if (data && typeof data === 'object' && 'message' in data) {
    const msg = (data as { message?: unknown }).message
    if (typeof msg === 'string') return msg
  }
  return null
}

export async function apiFetch(
  path: string,
  init: RequestInit & { accessToken?: string | null } = {},
): Promise<Response> {
  const base = env.peenApiUrl()
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  headers.set('x-correlation-id', correlationId())
  if (init.accessToken) {
    headers.set('Authorization', `Bearer ${init.accessToken}`)
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const { accessToken: _t, ...rest } = init
  return fetch(url, { ...rest, headers })
}

export async function apiJson<T>(
  path: string,
  init: RequestInit & { accessToken?: string | null } = {},
): Promise<T> {
  const res = await apiFetch(path, init)
  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      data = text
    }
  }
  if (!res.ok) {
    const msg = parseErrorMessage(data) ?? `HTTP ${res.status}`
    throw new PeenAPIError(res.status, msg, typeof text === 'string' ? text : null)
  }
  return data as T
}
