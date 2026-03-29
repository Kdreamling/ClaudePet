import { create } from 'zustand'
import type { Mood, Activity, BehaviorState, BubbleMessage, AnimationName } from '../brain/types'
import { moodToAnimation } from '../brain/action'

interface PetStore {
  // 状态
  mood: Mood
  activity: Activity
  behaviorState: BehaviorState
  animation: AnimationName
  positionX: number                // 屏幕相对位置 0-1
  direction: 'left' | 'right'

  // 气泡
  bubble: BubbleMessage | null

  // 动作
  setMood: (mood: Mood) => void
  setAnimation: (anim: AnimationName) => void
  setActivity: (activity: Activity) => void
  setBehaviorState: (state: BehaviorState) => void
  setPositionX: (x: number) => void
  setDirection: (dir: 'left' | 'right') => void
  showBubble: (text: string, duration?: number) => void
  clearBubble: () => void

  // 互动
  onPetClicked: () => void
}

export const usePetStore = create<PetStore>((set, get) => ({
  mood: 'idle',
  activity: 'standing',
  behaviorState: 'IDLE',
  animation: 'idle_stand',
  positionX: 0.5,
  direction: 'right',
  bubble: null,

  setMood: (mood) => set({ mood, animation: moodToAnimation(mood) }),

  setAnimation: (anim) => set({ animation: anim }),

  setActivity: (activity) => set({ activity }),

  setBehaviorState: (state) => set({ behaviorState: state }),

  setPositionX: (x) => set({ positionX: Math.max(0, Math.min(1, x)) }),

  setDirection: (dir) => set({ direction: dir }),

  showBubble: (text, duration = 4000) => {
    const bubble: BubbleMessage = {
      id: crypto.randomUUID(),
      text,
      duration,
      createdAt: Date.now(),
    }
    set({ bubble })
    setTimeout(() => {
      // 只清除这条气泡（防止清掉后来的）
      if (get().bubble?.id === bubble.id) {
        set({ bubble: null })
      }
    }, duration)
  },

  clearBubble: () => set({ bubble: null }),

  onPetClicked: () => {
    const { behaviorState } = get()
    if (behaviorState === 'WANTING' || behaviorState === 'SULKING') {
      // 点击后进入聊天状态
      set({ behaviorState: 'CHATTING', mood: 'happy', animation: 'happy' })
    } else {
      // 普通点击 → 开心反应
      set({ mood: 'happy', animation: 'happy' })
      setTimeout(() => {
        if (get().mood === 'happy') {
          set({ mood: 'idle', animation: 'idle_stand' })
        }
      }, 5000)
    }
  },
}))
