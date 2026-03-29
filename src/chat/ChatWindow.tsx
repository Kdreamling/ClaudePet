import { useRef, useEffect } from 'react'
import { useChatStore } from '../stores/chatStore'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

/**
 * 对话窗口 — 微信聊天风格
 * 独立小窗口，从桌宠唤起
 */
export default function ChatWindow() {
  const { messages, isStreaming, currentText, isOpen, closeChat, sendMessage } = useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
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
          style={{
            borderBottom: '1px solid rgba(160, 120, 90, 0.1)',
          }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            和晨聊天
          </span>
          <button
            onClick={closeChat}
            className="w-6 h-6 flex items-center justify-center rounded-full text-xs hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text-light)' }}
          >
            x
          </button>
        </div>

        {/* 消息区域 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-light)' }}>
              点击发消息和我聊天吧~
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* 流式输出中 */}
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
            <div className="flex items-center gap-1 px-2 py-1">
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-accent)', animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-accent)', animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-accent)', animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* 输入框 */}
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  )
}
