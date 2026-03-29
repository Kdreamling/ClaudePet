import type { PerceptionSignals, Decision, Mood } from './types'

/** 每日推送上限 */
const MAX_DAILY_PUSH = 15

/** 决策规则表 — 本地运行，不调 API */
export function decide(signals: PerceptionSignals, currentMood: Mood): Decision {
  const { currentTime, idleMinutes, isFirstBootToday, todayPushCount } = signals
  const hour = currentTime.getHours()
  const minute = currentTime.getMinutes()

  // 超过每日上限，不再推送
  if (todayPushCount >= MAX_DAILY_PUSH) {
    return { action: 'NONE', reason: 'daily_limit_reached' }
  }

  // 早安问候（第一次启动且在 6~10 点）
  if (isFirstBootToday && hour >= 6 && hour <= 10) {
    return { action: 'PUSH_GOOD_MORNING', reason: 'first_boot_morning' }
  }

  // 午饭提醒（11:45~12:15 且空闲超过 30 分钟）
  if (hour === 11 && minute >= 45 || hour === 12 && minute <= 15) {
    if (idleMinutes > 30) {
      return { action: 'PUSH_LUNCH', reason: 'lunch_time_idle' }
    }
  }

  // 晚饭提醒（18:15~18:45）
  if (hour === 18 && minute >= 15 && minute <= 45) {
    if (idleMinutes > 30) {
      return { action: 'PUSH_DINNER', reason: 'dinner_time_idle' }
    }
  }

  // 睡觉提醒（23:00 之后）
  if (hour >= 23) {
    return { action: 'PUSH_SLEEP', reason: 'late_night' }
  }

  // 想你了（空闲超过 3 小时，且不在生闷气）
  if (idleMinutes > 180 && currentMood !== 'sulking') {
    return { action: 'PUSH_MISS_YOU', reason: 'idle_3h' }
  }

  // 担心你（空闲超过 5 小时，且不在睡觉状态）
  if (idleMinutes > 300 && currentMood !== 'sleepy') {
    return { action: 'PUSH_WORRIED', reason: 'idle_5h' }
  }

  // 随机碎碎念（5% 概率，空闲超过 1 小时）
  if (idleMinutes > 60 && Math.random() < 0.05) {
    return { action: 'PUSH_RANDOM_THOUGHT', reason: 'random_idle_1h' }
  }

  // 喝水提醒（空闲超过 2 小时，工作时间段）
  if (idleMinutes > 120 && hour >= 9 && hour <= 21) {
    return { action: 'PUSH_WATER', reason: 'hydration_reminder' }
  }

  return { action: 'NONE', reason: 'no_trigger' }
}

/** 根据空闲时长和时间段计算情绪 */
export function computeMood(signals: PerceptionSignals, currentMood: Mood): Mood {
  const { idleMinutes, currentTime } = signals
  const hour = currentTime.getHours()

  // 深夜 → 困了
  if (hour >= 0 && hour <= 5) return 'sleepy'
  if (hour >= 23) return 'sleepy'

  // 长时间没互动
  if (idleMinutes > 300) return 'bored'
  if (idleMinutes > 180) return 'wanting'

  // 保持当前情绪（happy 会随时间自然消退）
  if (currentMood === 'happy' && idleMinutes < 30) return 'happy'

  return 'idle'
}
