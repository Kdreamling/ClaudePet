import { useState, useRef } from 'react'

interface Props {
  onSend: (content: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="flex items-center gap-2 px-4 py-3"
      style={{ borderTop: '1px solid rgba(160, 120, 90, 0.1)' }}
    >
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="说点什么..."
        disabled={disabled}
        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
        style={{
          background: 'rgba(160, 120, 90, 0.06)',
          border: '1px solid rgba(160, 120, 90, 0.12)',
          color: 'var(--color-text)',
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="px-3 py-2 rounded-lg text-sm transition-opacity"
        style={{
          background: 'transparent',
          border: '1px solid var(--color-accent)',
          color: 'var(--color-accent)',
          opacity: disabled || !text.trim() ? 0.4 : 1,
        }}
      >
        发送
      </button>
    </div>
  )
}
