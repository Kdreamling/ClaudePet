import type { ChatMessage } from '../brain/types'

interface Props {
  message: ChatMessage
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed"
        style={{
          background: isUser ? 'var(--color-user-bubble)' : 'var(--color-ai-bubble)',
          color: 'var(--color-text)',
          boxShadow: isUser ? 'none' : '0 1px 4px rgba(93, 64, 55, 0.08)',
          border: isUser ? 'none' : '1px solid rgba(160, 120, 90, 0.08)',
        }}
      >
        {message.content}
      </div>
    </div>
  )
}
