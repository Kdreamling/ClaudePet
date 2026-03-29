const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

/** 从 localStorage 获取 JWT token（复用 Reverie 的鉴权） */
function getToken(): string | null {
  return localStorage.getItem('token')
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const url = `${API_BASE}${path}${method === 'GET' ? `${path.includes('?') ? '&' : '?'}_t=${Date.now()}` : ''}`

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(res.status, text || `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const client = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
