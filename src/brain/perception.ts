import type { PerceptionSignals } from './types'

/** 本地存储 key */
const LAST_INTERACTION_KEY = 'chenpet_last_interaction'
const LAST_BOOT_DATE_KEY = 'chenpet_last_boot_date'
const TODAY_PUSH_COUNT_KEY = 'chenpet_today_push_count'

/** 记录一次互动 */
export function recordInteraction() {
  localStorage.setItem(LAST_INTERACTION_KEY, new Date().toISOString())
}

/** 记录一次推送 */
export function recordPush() {
  const today = new Date().toDateString()
  const stored = localStorage.getItem(TODAY_PUSH_COUNT_KEY)
  const data = stored ? JSON.parse(stored) : { date: today, count: 0 }

  if (data.date !== today) {
    data.date = today
    data.count = 0
  }
  data.count++
  localStorage.setItem(TODAY_PUSH_COUNT_KEY, JSON.stringify(data))
}

/** 收集当前感知信号（本地运行，零 API 成本） */
export function collectSignals(): PerceptionSignals {
  const now = new Date()

  // 距上次互动的分钟数
  const lastStr = localStorage.getItem(LAST_INTERACTION_KEY)
  const lastInteraction = lastStr ? new Date(lastStr) : now
  const idleMinutes = Math.floor((now.getTime() - lastInteraction.getTime()) / 60000)

  // 今天是否第一次启动
  const today = now.toDateString()
  const lastBoot = localStorage.getItem(LAST_BOOT_DATE_KEY)
  const isFirstBootToday = lastBoot !== today
  if (isFirstBootToday) {
    localStorage.setItem(LAST_BOOT_DATE_KEY, today)
  }

  // 今天推送次数
  const pushStr = localStorage.getItem(TODAY_PUSH_COUNT_KEY)
  const pushData = pushStr ? JSON.parse(pushStr) : { date: today, count: 0 }
  const todayPushCount = pushData.date === today ? pushData.count : 0

  return {
    currentTime: now,
    idleMinutes,
    isWindowFocused: document.hasFocus(),
    isCursorActive: true, // TODO: 通过 Tauri API 获取
    lastChatMood: null,   // TODO: 从上一次对话获取
    isFirstBootToday,
    todayPushCount,
  }
}
