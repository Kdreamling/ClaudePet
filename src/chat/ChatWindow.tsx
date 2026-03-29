import { useRef, useEffect } from 'react'
import { useChatStore } from '../stores/chatStore'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

const IS_TAURI = !!(window as any).__TAURI_INTERNALS__
const IS_CHAT_MODE = new URLSearchParams(window.location.search).get('mode') === 'chat'

/** 关闭聊天：Tauri 聊天窗口直接关窗口 */
async function closeChatTauri() {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    await getCurrentWindow().close()
  } catch {}
}

export default function ChatWindow() {
  const { messages, isStreaming, currentText, isOpen, closeChat, sendMessage } = useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, currentText])

  if (!isOpen) return null

  const handleClose = () => {
    if (IS_TAURI && IS_CHAT_MODE) {
      closeChatTauri()
    } else {
      closeChat()
    }
  }

  return (
    <div
      className="fixed inset-0 flex flex-col z-50"
      style={{
        background: IS_CHAT_MODE ? 'var(--color-chat-bg)' : 'rgba(0,0,0,0.15)',
        backdropFilter: IS_CHAT_MODE ? 'none' : 'blur(4px)',
        borderRadius: IS_CHAT_MODE ? '12px' : '0',
      }}
      onClick={(e) => {
        if (!IS_CHAT_MODE && e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{
          ...(IS_CHAT_MODE ? {} : {
            width: 380,
            height: 520,
            margin: 'auto',
            borderRadius: '16px',
            background: 'var(--color-chat-bg)',
            boxShadow: '0 8px 32px rgba(93, 64, 55, 0.18)',
            border: '1px solid rgba(160, 120, 90, 0.12)',
          }),
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
            onClick={handleClose}
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
