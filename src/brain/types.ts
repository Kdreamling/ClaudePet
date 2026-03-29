/** 宠物情绪状态 */
export type Mood = 'happy' | 'idle' | 'bored' | 'wanting' | 'sulking' | 'sleepy'

/** 宠物行为状态 */
export type Activity = 'standing' | 'walking' | 'sitting' | 'sleeping' | 'reading' | 'waving' | 'knocking'

/** 行为状态机状态 */
export type BehaviorState = 'IDLE' | 'WANTING' | 'CHATTING' | 'SULKING'

/** 动画名称（对应 GIF 文件） */
export type AnimationName =
  | 'idle_stand' | 'idle_sit'
  | 'walk_left' | 'walk_right'
  | 'sleep' | 'happy' | 'bored' | 'sulking'
  | 'wave' | 'knock'
  | 'thinking' | 'typing' | 'error' | 'notification'
  | 'building' | 'conducting' | 'juggling' | 'sweeping' | 'carrying'

/** 推送动作类型 */
export type PushAction =
  | 'PUSH_LUNCH' | 'PUSH_DINNER' | 'PUSH_SLEEP' | 'PUSH_WATER'
  | 'PUSH_MISS_YOU' | 'PUSH_WORRIED' | 'PUSH_RANDOM_THOUGHT'
  | 'PUSH_GOOD_MORNING' | 'PUSH_NOTE'

/** 感知信号 */
export interface PerceptionSignals {
  currentTime: Date
  idleMinutes: number          // 距上次互动的分钟数
  isWindowFocused: boolean     // 窗口是否在前台
  isCursorActive: boolean      // 光标是否活跃
  lastChatMood: string | null  // 上一次聊天的情绪基调
  isFirstBootToday: boolean    // 今天第一次启动
  todayPushCount: number       // 今天已推送次数
}

/** 决策结果 */
export interface Decision {
  action: PushAction | 'NONE'
  reason: string
}

/** 宠物状态快照（持久化） */
export interface PetState {
  mood: Mood
  activity: Activity
  behaviorState: BehaviorState
  positionX: number            // 屏幕相对位置 0-1
  lastInteractionAt: string    // ISO timestamp
  lastPushAt: string | null
  todayPushCount: number
}

/** 气泡消息 */
export interface BubbleMessage {
  id: string
  text: string
  duration: number             // 显示毫秒数
  createdAt: number
}

/** 便签 */
export interface PetNote {
  id: string
  content: string
  triggerReason: string | null
  isRead: boolean
  showAt: string | null
  createdAt: string
}

/** 聊天消息 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}
