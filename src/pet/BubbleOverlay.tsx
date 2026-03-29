import { usePetStore } from '../stores/petStore'
import { useChatStore } from '../stores/chatStore'

/**
 * 气泡层 — 角色头顶的小气泡
 * 点击气泡可以进入对话层
 */
export default function BubbleOverlay() {
  const bubble = usePetStore((s) => s.bubble)
  const openChat = useChatStore((s) => s.openChat)

  if (!bubble) return null

  return (
    <div
      className="absolute top-2 left-1/2 -translate-x-1/2 max-w-[180px] cursor-pointer animate-fade-in"
      onClick={openChat}
    >
      <div
        className="px-3 py-2 rounded-xl text-sm leading-snug"
        style={{
          background: 'var(--color-bubble)',
          color: 'var(--color-text)',
          boxShadow: '0 2px 8px rgba(93, 64, 55, 0.12)',
          border: '1px solid rgba(160, 120, 90, 0.15)',
        }}
      >
        {bubble.text}
      </div>
      {/* 小三角 */}
      <div
        className="w-3 h-3 mx-auto -mt-[2px] rotate-45"
        style={{ background: 'var(--color-bubble)' }}
      />
    </div>
  )
}
