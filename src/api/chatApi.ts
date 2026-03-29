import type { ChatMessage } from '../brain/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

function getToken(): string | null {
  return localStorage.getItem('token')
}

/** 流式对话（SSE） — 桌宠专用，走 ZenMux Opus 不开 thinking */
export async function* streamChat(
  sessionId: string,
  message: string,
  signal?: AbortSignal,
): AsyncGenerator<{ type: string; content: string }> {
  const token = getToken()
  const res = await fetch(`${API_BASE}/pet/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      session_id: sessionId,
      messages: [{ role: 'user', content: message }],
    }),
    signal,
  })

  if (!res.ok) throw new Error(`Chat failed: ${res.status}`)
  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return

      try {
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta
        if (delta?.content) {
          yield { type: 'text', content: delta.content }
        }
      } catch {
        // skip malformed chunks
      }
    }
  }
}

/** 获取桌宠对话历史 */
export async function fetchPetMessages(sessionId: string): Promise<ChatMessage[]> {
  const token = getToken()
  const res = await fetch(`${API_BASE}/pet/messages?session_id=${sessionId}&_t=${Date.now()}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) return []
  return res.json()
}
