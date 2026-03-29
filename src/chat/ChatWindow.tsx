import { useRef, useEffect } from 'react'
import { useChatStore } from '../stores/chatStore'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

export default function ChatWindow() {
  const { messages, isStreaming, currentText, isOpen, closeChat, sendMessage } = useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, currentText])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeChat() }}
    >
      <div
        className="flex flex-col rounded-2xl overflow-hidden"
        style={{
          width: 380,
          height: 520,
          background: 'var(--color-chat-bg)',
          boxShadow: '0 8px 32px rgba(93, 64, 55, 0.18)',
          border: '1px solid rgba(160, 120, 90, 0.12)',
        }}
      >
        {/* 标题栏 */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(160, 120, 90, 0.1)' }}
        >
          <div className="flex items-center gap-2">
            <img
              src="/sprites/clawd-idle.gif"
              alt=""
              className="w-6 h-6"
              style={{ imageRendering: 'pixelated' }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              ClaudePet
            </span>
            {isStreaming && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{
                background: 'rgba(160, 120, 90, 0.1)',
                color: 'var(--color-text-light)',
              }}>
                typing...
              </span>
            )}
          </div>
          <button
            onClick={closeChat}
            className="w-7 h-7 flex items-center justify-center rounded-full text-xs transition-all hover:scale-110"
            style={{
              color: 'var(--color-text-light)',
              border: '1px solid rgba(160, 120, 90, 0.15)',
            }}
          >
            ×
          </button>
        </div>

        {/* 消息区域 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <img
                src="/sprites/clawd-happy.gif"
                alt=""
                className="w-16 h-16"
                style={{ imageRendering: 'pixelated' }}
              />
              <span className="text-sm" style={{ color: 'var(--color-text-light)' }}>
                点击下方发消息和我聊天吧~
              </span>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isStreaming && currentText && (
            <MessageBubble
              message={{
                id: 'streaming',
                role: 'assistant',
                content: currentText,
                createdAt: new Date().toISOString(),
              }}
            />
          )}

          {isStreaming && !currentText && (
            <div className="flex items-center gap-1.5 px-2 py-2">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--color-accent)', animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* 输入框 */}
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  )
}
