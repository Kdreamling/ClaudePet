import type { ChatMessage } from '../brain/types'

interface Props {
  message: ChatMessage
}

/** 格式化时间：只显示时:分 */
function formatTime(isoStr: string): string {
  try {
    const d = new Date(isoStr)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  } catch {
    return ''
  }
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const time = formatTime(message.createdAt)

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className="max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
        style={{
          background: isUser ? 'var(--color-user-bubble)' : 'var(--color-ai-bubble)',
          color: 'var(--color-text)',
          boxShadow: isUser ? 'none' : '0 1px 4px rgba(93, 64, 55, 0.08)',
          border: isUser ? 'none' : '1px solid rgba(160, 120, 90, 0.08)',
          borderBottomRightRadius: isUser ? '4px' : undefined,
          borderBottomLeftRadius: !isUser ? '4px' : undefined,
        }}
      >
        {message.content}
      </div>
      {time && (
        <span
          className="text-[10px] mt-0.5 px-1 opacity-40"
          style={{ color: 'var(--color-text-light)' }}
        >
          {time}
        </span>
      )}
    </div>
  )
}
