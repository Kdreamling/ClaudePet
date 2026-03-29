import type { PushAction, AnimationName, Mood } from './types'

/** 情绪 → 默认动画映射 */
export function moodToAnimation(mood: Mood): AnimationName {
  switch (mood) {
    case 'happy':   return 'happy'
    case 'idle':    return 'idle_stand'
    case 'bored':   return 'bored'
    case 'wanting': return 'knock'
    case 'sulking': return 'sulking'
    case 'sleepy':  return 'sleep'
  }
}

/** 推送动作 → 是否需要调 API 生成内容 */
export function needsApiCall(action: PushAction): boolean {
  // 所有推送都需要 API 生成自然语言内容
  return true
}

/** 推送动作 → 给 API 的提示类型 */
export function actionToPromptType(action: PushAction): string {
  const map: Record<PushAction, string> = {
    PUSH_LUNCH:          'lunch_remind',
    PUSH_DINNER:         'dinner_remind',
    PUSH_SLEEP:          'sleep_remind',
    PUSH_WATER:          'water_remind',
    PUSH_MISS_YOU:       'miss_you',
    PUSH_WORRIED:        'worried',
    PUSH_RANDOM_THOUGHT: 'random_thought',
    PUSH_GOOD_MORNING:   'good_morning',
    PUSH_NOTE:           'note',
  }
  return map[action]
}
