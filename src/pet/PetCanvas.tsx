import { usePetStore } from '../stores/petStore'
import { useChatStore } from '../stores/chatStore'
import type { AnimationName } from '../brain/types'

const IS_TAURI = !!(window as any).__TAURI_INTERNALS__

/** 动画状态 → GIF 文件名映射 */
const ANIMATION_GIFS: Record<AnimationName, string> = {
  idle_stand:   'clawd-idle.gif',
  idle_sit:     'clawd-idle.gif',
  walk_left:    'clawd-sweeping.gif',
  walk_right:   'clawd-sweeping.gif',
  sleep:        'clawd-sleeping.gif',
  happy:        'clawd-happy.gif',
  bored:        'clawd-thinking.gif',
  sulking:      'clawd-error.gif',
  wave:         'clawd-notification.gif',
  knock:        'clawd-notification.gif',
  thinking:     'clawd-thinking.gif',
  typing:       'clawd-typing.gif',
  error:        'clawd-error.gif',
  notification: 'clawd-notification.gif',
  building:     'clawd-building.gif',
  conducting:   'clawd-conducting.gif',
  juggling:     'clawd-juggling.gif',
  sweeping:     'clawd-sweeping.gif',
  carrying:     'clawd-carrying.gif',
}

export default function PetCanvas() {
  const { animation, onPetClicked } = usePetStore()
  const openChat = useChatStore((s) => s.openChat)

  const gifFile = ANIMATION_GIFS[animation] || 'clawd-idle.gif'
  const gifSrc = `/sprites/${gifFile}`

  const handleClick = async () => {
    onPetClicked()
    if (IS_TAURI) {
      // Tauri 环境：打开独立聊天窗口
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('open_chat_window')
      } catch (e) {
        console.error('open chat window failed:', e)
      }
    } else {
      // 浏览器环境：overlay 模式
      openChat()
    }
  }

  return (
    <div
      className="relative cursor-pointer select-none"
      onClick={handleClick}
      style={{ width: 200, height: 200 }}
    >
      <img
        key={animation}
        src={gifSrc}
        alt="ClaudePet"
        draggable={false}
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: 160,
          height: 160,
          imageRendering: 'pixelated',
          objectFit: 'contain',
        }}
      />
    </div>
  )
}
