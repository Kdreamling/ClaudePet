import { usePetStore } from '../stores/petStore'
import { useChatStore } from '../stores/chatStore'
import type { AnimationName } from '../brain/types'

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
  // 加时间戳强制 GIF 从头播放（状态切换时）
  const gifSrc = `/sprites/${gifFile}`

  const handleClick = () => {
    onPetClicked()
    openChat()
  }

  return (
    <div
      className="relative cursor-pointer select-none"
      onClick={handleClick}
      style={{ width: 200, height: 200 }}
    >
      <img
        key={animation}  /* key 变化时强制重新挂载，GIF 从头播放 */
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
